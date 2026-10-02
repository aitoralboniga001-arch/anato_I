"""Offline generator contract checks; these never call a provider."""
import base64
import importlib.util
import io
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
spec = importlib.util.spec_from_file_location("google_generator", Path(__file__).with_name("generate-google.py"))
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class GoogleGenerationContract(unittest.TestCase):
    @staticmethod
    def fragment(text):
        return {"hash": hashlib.sha256(text.encode("utf8")).hexdigest(), "text": text}

    def test_reads_only_named_key_from_ignored_env_without_expanding_shell(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".env.local").write_text('UNRELATED=unused\nGOOGLE_CLOUD_TTS_API_KEY="local-test-only"\n', encoding="utf-8")
            with patch.object(generator, "ROOT", root), patch.dict(generator.os.environ, {"GOOGLE_CLOUD_TTS_API_KEY": ""}):
                self.assertEqual(generator.read_key(), "local-test-only")
            with patch.object(generator, "ROOT", root), patch.dict(generator.os.environ, {"GOOGLE_CLOUD_TTS_API_KEY": "process-test-only"}):
                self.assertEqual(generator.read_key(), "process-test-only")

    def test_payload_preserves_exact_text_and_header_keeps_key_out_of_url(self):
        text = "15. eguna: enbrioblastoa."
        encoded = b"unit-contract-only-not-a-shipped-audio"
        response = io.BytesIO(json.dumps({"audioContent": base64.b64encode(encoded).decode()}).encode())
        with patch.object(generator.urllib.request, "urlopen", return_value=response) as request:
            budget = [100]
            self.assertEqual(generator.synthesize(text, "test-only-key", budget), encoded)
            self.assertEqual(budget[0], 100 - len(text))
            submitted = request.call_args.args[0]
            self.assertEqual(submitted.full_url, generator.ENDPOINT)
            self.assertNotIn("test-only-key", submitted.full_url)
            self.assertEqual(submitted.get_header("X-goog-api-key"), "test-only-key")
            payload = json.loads(submitted.data)
            self.assertEqual(payload["input"], {"text": text})
            self.assertEqual(payload["voice"], {"languageCode": "eu-ES", "name": "eu-ES-Standard-B"})
            self.assertEqual(payload["audioConfig"]["speakingRate"], 0.95)

    def test_budget_rejects_before_provider_call(self):
        with patch.object(generator.urllib.request, "urlopen") as request:
            with self.assertRaisesRegex(RuntimeError, "Character ceiling"):
                generator.synthesize("Source text", "test-only-key", [2])
            request.assert_not_called()

    def test_retries_count_towards_character_ceiling(self):
        error = generator.urllib.error.HTTPError(generator.ENDPOINT, 429, "quota", {}, None)
        with patch.object(generator.urllib.request, "urlopen", side_effect=error) as request, patch.object(generator.time, "sleep"):
            with self.assertRaisesRegex(RuntimeError, "Character ceiling"):
                generator.synthesize("123456", "test-only-key", [10])
            self.assertEqual(request.call_count, 1)

    def test_network_completion_is_not_blindly_repeated(self):
        with patch.object(generator.urllib.request, "urlopen", side_effect=generator.urllib.error.URLError("private provider detail")) as request:
            with self.assertRaisesRegex(RuntimeError, "network failure") as raised:
                generator.synthesize("Source text", "test-only-key", [100])
            self.assertNotIn("private provider detail", str(raised.exception))
            self.assertEqual(request.call_count, 1)

    def test_changed_input_cannot_reuse_old_literal_audio_but_unchanged_can(self):
        source = self.fragment("1-4 astera")
        plain = self.fragment("Enbrioia garatzen da.")
        prepared = generator.prepare_fragments([source, plain])
        with tempfile.TemporaryDirectory() as folder:
            cache = Path(folder)
            (cache / (source["hash"] + ".mp3")).write_bytes(b"old-literal")
            (cache / (plain["hash"] + ".mp3")).write_bytes(b"still-valid")
            plan = generator.generation_plan(prepared, cache)
            self.assertEqual(plan["cachedSpokenInputs"], 1)
            self.assertEqual(plan["uncachedClips"], 1)
            self.assertEqual(plan["uncachedCharacters"], len("lehenengo astetik laugarrenera"))
            self.assertEqual(prepared[0]["hash"], source["hash"])
            self.assertNotEqual(prepared[0]["spokenHash"], source["hash"])
            self.assertEqual(prepared[1]["spokenHash"], plain["hash"])
            self.assertTrue((cache / (source["hash"] + ".mp3")).exists())

    def test_normalized_equivalent_inputs_count_and_generate_only_once(self):
        prepared = generator.prepare_fragments([self.fragment("10. astean"), self.fragment("hamargarren astean")])
        self.assertEqual(prepared[0]["spokenHash"], prepared[1]["spokenHash"])
        with tempfile.TemporaryDirectory() as folder:
            plan = generator.generation_plan(prepared, Path(folder))
            self.assertEqual(plan["clips"], 2)
            self.assertEqual(plan["uniqueSpokenInputs"], 1)
            self.assertEqual(plan["uncachedCharacters"], len("hamargarren astean"))

    def test_actual_spoken_budget_and_provider_bytes_are_enforced_before_network(self):
        prepared = generator.prepare_fragments([self.fragment("1-4 astera")])[0]
        with patch.object(generator.urllib.request, "urlopen") as request:
            with self.assertRaisesRegex(RuntimeError, "Character ceiling"):
                generator.synthesize(prepared["spokenText"], "test-only-key", [len(prepared["text"])])
            with self.assertRaisesRegex(ValueError, "5000-byte"):
                generator.synthesize("ü" * 2501, "test-only-key", [10000])
            request.assert_not_called()

    def test_dry_run_never_reads_key_and_preserves_canonical_source(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".narration-tools").mkdir()
            source = self.fragment("1-4 astera")
            (root / ".narration-tools/catalog.json").write_text(json.dumps({"entries": [source]}), encoding="utf8")
            with patch.object(generator, "ROOT", root), patch.object(generator, "read_key") as key, patch.object(generator.urllib.request, "urlopen") as request, patch.object(sys, "argv", ["generate-google.py"]), patch("sys.stdout", new_callable=io.StringIO) as output:
                generator.main()
                plan = json.loads(output.getvalue())
                self.assertFalse(plan["keyChecked"])
                self.assertEqual(plan["uncachedCharacters"], len("lehenengo astetik laugarrenera"))
                key.assert_not_called()
                request.assert_not_called()
            preview = json.loads((root / ".narration-tools/google-spoken-inputs.json").read_text())
            self.assertEqual(preview["entries"][0]["hash"], source["hash"])
            self.assertEqual(preview["entries"][0]["text"], source["text"])
            self.assertFalse((root / "public/narration/manifest.json").exists())

    def test_sample_hash_selects_specific_range_and_never_publishes_assets(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".narration-tools").mkdir()
            first, target = self.fragment("Lehen zatia."), self.fragment("1-4 astera")
            (root / ".narration-tools/catalog.json").write_text(json.dumps({"entries": [first, target]}), encoding="utf8")
            with patch.object(generator, "ROOT", root), patch.object(generator, "read_key", return_value="unit-key"), patch.object(generator, "synthesize", return_value=b"unit-audio") as provider, patch.object(generator, "inspect_audio", return_value=1000), patch.object(generator.time, "sleep"), patch.object(sys, "argv", ["generate-google.py", "--generate", "--sample-hash", target["hash"]]), patch("sys.stdout", new_callable=io.StringIO):
                generator.main()
                self.assertEqual(provider.call_args.args[0], "lehenengo astetik laugarrenera")
            self.assertFalse((root / "public").exists())
            preview = json.loads((root / ".narration-tools/google-spoken-sample.json").read_text())
            self.assertEqual(preview["entries"][0]["hash"], target["hash"])

    def test_full_mock_generation_publishes_source_hash_and_spoken_provenance(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / ".narration-tools").mkdir()
            fragments = [self.fragment("10. astean"), self.fragment("hamargarren astean")]
            (root / ".narration-tools/catalog.json").write_text(json.dumps({"entries": fragments}), encoding="utf8")
            with patch.object(generator, "ROOT", root), patch.object(generator, "read_key", return_value="unit-key"), patch.object(generator, "synthesize", return_value=b"unit-audio") as provider, patch.object(generator, "inspect_audio", return_value=1000), patch.object(generator.time, "sleep"), patch.object(sys, "argv", ["generate-google.py", "--generate"]), patch("sys.stdout", new_callable=io.StringIO):
                generator.main()
                provider.assert_called_once()
            manifest = json.loads((root / "public/narration/manifest.json").read_text())
            self.assertEqual(set(manifest["entries"]), {fragment["hash"] for fragment in fragments})
            self.assertEqual(manifest["normalizationVersion"], generator.NORMALIZATION_VERSION)
            asset_digest = hashlib.sha256(b"unit-audio").hexdigest()
            for asset in manifest["entries"].values():
                self.assertEqual(asset["url"], f"/narration/audio/{asset_digest}.mp3")
                self.assertEqual(asset["spokenTextHash"], hashlib.sha256("hamargarren astean".encode()).hexdigest())


if __name__ == "__main__":
    unittest.main()
