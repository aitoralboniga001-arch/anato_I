"""Offline canonical speech generation. Never runs as part of the web application.

Requires isolated piper-tts 1.8.0 and ffmpeg/ffprobe on PATH. Export the canonical
catalog first using export-catalog.test.ts. Downloads/models stay outside public.
Only publishes the complete manifest after all clips have passed validation.
"""
import argparse
import hashlib
import json
import subprocess
import wave
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = Path(__file__).resolve().parents[2]
MODEL_REVISION = "c10ece1aade47bb51c153c893d14e5bf8e5b7117"
MODEL_DIGEST = "a36ac807ad130dc192b74d738e39552f9be704f069c405dbf4abd358b014a39a"


def inspect_audio(path):
    info = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration,size",
        "-of", "json", str(path)], text=True))["format"]
    duration_ms = round(float(info["duration"]) * 1000)
    if duration_ms < 100 or int(info["size"]) < 100:
        raise ValueError(f"Empty or truncated speech: {path}")
    pcm = subprocess.check_output([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
        "-f", "s16le", "-ac", "1", "-"])
    samples = np.frombuffer(pcm, dtype=np.int16).astype(np.float64)
    if not len(samples) or np.sqrt(np.mean(samples * samples)) < 20:
        raise ValueError(f"Silent speech: {path}")
    return duration_ms


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", action="store_true", help="Generate one canonical clip in the ignored tools folder only")
    args = parser.parse_args()
    tools = ROOT / ".narration-tools"
    model = tools / "models/eu_ES-maider-medium.onnx"
    if hashlib.sha256(model.read_bytes()).hexdigest() != MODEL_DIGEST:
        raise ValueError("The voice model does not match the pinned official model digest")
    catalog = json.loads((tools / "catalog.json").read_text(encoding="utf-8"))
    fragments = catalog["entries"][:1] if args.sample else catalog["entries"]
    cache = tools / "cache/piper-1.8.0-maider-1.12"
    cache.mkdir(parents=True, exist_ok=True)
    voice = PiperVoice.load(model)
    config = SynthesisConfig(length_scale=1.12)
    manifest_entries = {}
    public = ROOT / "public/narration/audio"
    if not args.sample:
        public.mkdir(parents=True, exist_ok=True)
    for index, fragment in enumerate(fragments):
        text_hash = hashlib.sha256(fragment["text"].encode("utf-8")).hexdigest()
        if text_hash != fragment["hash"]:
            raise ValueError("Canonical text hash does not match exported text")
        mp3 = cache / f"{text_hash}.mp3"
        if not mp3.exists():
            wav = cache / f"{text_hash}.wav"
            with wave.open(str(wav), "wb") as output:
                voice.synthesize_wav(fragment["text"], output, config)
            pending = cache / f"{text_hash}.pending.mp3"
            subprocess.run([
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav),
                "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", str(pending)], check=True)
            inspect_audio(pending)
            pending.replace(mp3)
            wav.unlink()
        duration_ms = inspect_audio(mp3)
        encoded = mp3.read_bytes()
        asset_hash = hashlib.sha256(encoded).hexdigest()
        if not args.sample:
            (public / f"{asset_hash}.mp3").write_bytes(encoded)
        manifest_entries[text_hash] = {
            "url": f"/narration/audio/{asset_hash}.mp3",
            "durationMs": duration_ms, "bytes": len(encoded),
        }
        print(f"{index + 1}/{len(fragments)} {text_hash} {duration_ms}ms", flush=True)
    if args.sample:
        print(f"Validated sample: {mp3}")
        return
    manifest = {
        "version": 1, "provider": "piper", "voice": "eu_ES-maider-medium",
        "modelRevision": MODEL_REVISION, "modelSha256": MODEL_DIGEST,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "entries": manifest_entries,
    }
    pending_manifest = ROOT / "public/narration/manifest.pending.json"
    pending_manifest.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    pending_manifest.replace(ROOT / "public/narration/manifest.json")
    print(f"Published {len(fragments)} clips, {sum(x['bytes'] for x in manifest_entries.values())} bytes")


if __name__ == "__main__":
    main()
