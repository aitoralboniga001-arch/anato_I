"""Generate the static catalog offline; credentials never reach the web app."""
import argparse
import array
import base64
import hashlib
import json
import math
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from normalize_basque import NORMALIZATION_VERSION, normalize_spoken_text, validate_spoken_input

ROOT = Path(__file__).resolve().parents[2]
VOICE = "eu-ES-Standard-B"
REVISION = f"{VOICE}:MP3:rate=0.95:pitch=0"
ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"


def read_key():
    value = os.environ.get("GOOGLE_CLOUD_TTS_API_KEY", "").strip()
    if value:
        return value
    env = ROOT / ".env.local"
    if env.exists():
        for line in env.read_text(encoding="utf-8-sig").splitlines():
            key, separator, value = line.partition("=")
            if separator and key.strip() == "GOOGLE_CLOUD_TTS_API_KEY":
                value = value.strip()
                if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                    return value[1:-1].strip()
                return value.split(" #", 1)[0].strip()
    return ""


def inspect_audio(path):
    info = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration,size",
        "-of", "json", str(path)], text=True))["format"]
    duration = round(float(info["duration"]) * 1000)
    pcm = subprocess.check_output([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
        "-f", "s16le", "-ac", "1", "-"])
    samples = array.array("h", pcm)
    rms = math.sqrt(sum(value * value for value in samples) / len(samples)) if samples else 0
    if duration < 100 or int(info["size"]) < 100 or rms < 20:
        raise ValueError("An audio clip is empty, truncated or silent")
    return duration


def synthesize(text, api_key, budget):
    validate_spoken_input(text)
    payload = json.dumps({
        "input": {"text": text},
        "voice": {"languageCode": "eu-ES", "name": VOICE},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": 0.95, "pitch": 0},
    }, ensure_ascii=False).encode("utf-8")
    for attempt in range(4):
        if budget[0] < len(text):
            raise RuntimeError("Character ceiling reached including retries; completed clips are preserved")
        budget[0] -= len(text)
        request = urllib.request.Request(ENDPOINT, data=payload, headers={
            "Content-Type": "application/json", "X-Goog-Api-Key": api_key,
        }, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read(4_000_001)
            if len(raw) > 4_000_000:
                raise ValueError("Provider audio response exceeds the bounded size")
            content = json.loads(raw).get("audioContent")
            if not isinstance(content, str):
                raise ValueError("Provider response did not include audio")
            return base64.b64decode(content, validate=True)
        except urllib.error.HTTPError as error:
            # Never log URLs/headers/provider body: only the sanitized status.
            status = error.code
            error.close()
            if status not in (429, 500, 502, 503, 504) or attempt == 3:
                raise RuntimeError(f"Google Cloud TTS returned HTTP {status}; completed clips are preserved") from None
            time.sleep(2 ** (attempt + 1))
        except urllib.error.URLError:
            # Unknown completion: stop rather than blindly repeating a billable request.
            raise RuntimeError("Speech request network failure; completed clips are preserved") from None


def atomic_json(path, data):
    temporary = path.with_suffix(".pending.json")
    temporary.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(path)


def prepare_fragments(fragments):
    prepared = []
    for fragment in fragments:
        source = fragment["text"]
        if hashlib.sha256(source.encode("utf-8")).hexdigest() != fragment["hash"]:
            raise ValueError("Canonical text hash does not match exported text")
        spoken = normalize_spoken_text(source)
        size = validate_spoken_input(spoken)
        prepared.append({
            "hash": fragment["hash"], "text": source, "spokenText": spoken,
            "spokenHash": hashlib.sha256(spoken.encode("utf-8")).hexdigest(),
            "spokenBytes": size,
        })
    return prepared


def generation_plan(fragments, cache):
    # Several canonical spellings can now have the same spoken input. They
    # share one provider request and cache file, but retain every source hash.
    unique = {fragment["spokenHash"]: fragment for fragment in fragments}
    pending = [fragment for digest, fragment in unique.items() if not (cache / f"{digest}.mp3").exists()]
    return {
        "clips": len(fragments), "uniqueSpokenInputs": len(unique),
        "sourceCharacters": sum(len(fragment["text"]) for fragment in fragments),
        "characters": sum(len(fragment["spokenText"]) for fragment in unique.values()),
        "utf8Bytes": sum(fragment["spokenBytes"] for fragment in unique.values()),
        "changedClips": sum(fragment["spokenText"] != fragment["text"] for fragment in fragments),
        "uncachedClips": len(pending),
        "uncachedCharacters": sum(len(fragment["spokenText"]) for fragment in pending),
        "cachedSpokenInputs": len(unique) - len(pending),
        "maxInputUtf8Bytes": max((fragment["spokenBytes"] for fragment in fragments), default=0),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--generate", action="store_true", help="Make provider requests; without this flag, dry-run only")
    parser.add_argument("--max-characters", type=int, default=120000, help="Hard ceiling for uncached characters in this run")
    parser.add_argument("--sample", action="store_true", help="Generate only the first canonical fragment, without public assets")
    parser.add_argument("--sample-hash", help="Select one exact canonical SHA256 for a purposeful unpublished sample")
    args = parser.parse_args()
    catalog = json.loads((ROOT / ".narration-tools/catalog.json").read_text(encoding="utf-8"))
    sample = args.sample or args.sample_hash is not None
    if args.sample_hash is not None:
        fragments = [fragment for fragment in catalog["entries"] if fragment["hash"] == args.sample_hash]
        if len(fragments) != 1:
            raise ValueError("Sample hash must select exactly one canonical catalog entry; no request was sent")
    else:
        fragments = catalog["entries"][:1] if sample else catalog["entries"]
    fragments = prepare_fragments(fragments)
    settings_hash = hashlib.sha256(REVISION.encode()).hexdigest()[:16]
    cache = ROOT / f".narration-tools/cache/google-cloud-standard-{settings_hash}"
    cache.mkdir(parents=True, exist_ok=True)
    plan = generation_plan(fragments, cache)
    print(json.dumps({
        "provider": "google-cloud-standard", "voice": VOICE,
        "normalizationVersion": NORMALIZATION_VERSION, **plan,
        "maxCharacters": args.max_characters, "keyChecked": False,
    }), flush=True)
    if plan["uncachedCharacters"] > args.max_characters or args.max_characters < 1:
        raise ValueError("Generation exceeds the configured character ceiling; no request was sent")
    # Local review/provenance only. Never contains credentials or replaces the
    # public manifest, and a sample cannot overwrite the full preview.
    atomic_json(ROOT / ".narration-tools" / ("google-spoken-sample.json" if sample else "google-spoken-inputs.json"), {
        "normalizationVersion": NORMALIZATION_VERSION, "voiceRevision": REVISION,
        "stats": plan, "entries": fragments,
    })
    if not sample:
        atomic_json(ROOT / ".narration-tools/google-spoken-changes.json", {
            "normalizationVersion": NORMALIZATION_VERSION, "stats": plan,
            "changedEntries": [fragment for fragment in fragments if fragment["text"] != fragment["spokenText"]],
        })
    if not args.generate:
        return
    api_key = read_key()
    if plan["uncachedClips"] and not api_key:
        raise RuntimeError("Missing GOOGLE_CLOUD_TTS_API_KEY in ignored .env.local or process environment")
    public = ROOT / "public/narration/audio"
    entries = {}
    budget = [args.max_characters]
    for index, fragment in enumerate(fragments):
        mp3 = cache / f"{fragment['spokenHash']}.mp3"
        if not mp3.exists():
            encoded = synthesize(fragment["spokenText"], api_key, budget)
            temporary = cache / f"{fragment['spokenHash']}.pending.mp3"
            temporary.write_bytes(encoded)
            inspect_audio(temporary)
            temporary.replace(mp3)
            time.sleep(0.15)  # At most 400 new requests/minute, below the general 1000/minute quota.
        duration = inspect_audio(mp3)
        encoded = mp3.read_bytes()
        asset_hash = hashlib.sha256(encoded).hexdigest()
        if not sample:
            public.mkdir(parents=True, exist_ok=True)
            (public / f"{asset_hash}.mp3").write_bytes(encoded)
        entries[fragment["hash"]] = {
            "url": f"/narration/audio/{asset_hash}.mp3", "durationMs": duration, "bytes": len(encoded),
            "spokenTextHash": fragment["spokenHash"],
        }
        print(f"Validated {index + 1}/{len(fragments)} clips", flush=True)
    if sample:
        print(f"Validated local sample: {mp3}")
        return
    atomic_json(ROOT / "public/narration/manifest.json", {
        "version": 1, "provider": "google-cloud-standard", "voice": VOICE,
        "modelRevision": REVISION, "generatedAt": datetime.now(timezone.utc).isoformat(),
        "normalizationVersion": NORMALIZATION_VERSION,
        "entries": entries,
    })
    print(f"Published complete catalog: {len(entries)} clips / {sum(entry['bytes'] for entry in entries.values())} bytes")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError) as error:
        raise SystemExit(str(error)) from None
