# Offline narration tooling

## Selected voice: Google Cloud Standard

`eu-ES-Standard-B` is generated once at speaking rate 0.95. Listening uses the
published static MP3s and never calls Google Cloud. The current complete source
catalog has 2,191 references, 1,311 distinct clips and 92,968 Unicode characters
(93,200 UTF-8 bytes).

Export, inspect the dry-run, then generate only with the user's offline Cloud
key. No Python package installation is necessary for Google generation.

Segments whose text changed since the recording have no clip; the app says them
with the browser voice (as the class does) until they are re-recorded. List them,
per week, into ignored `.narration-tools/missing.json` (no provider call):

```powershell
npx vitest run --config scripts/narration/vitest.config.ts missing-clips
```

```powershell
npx vitest run --config scripts/narration/vitest.config.ts
python -m unittest discover -s scripts/narration -p 'test_*.py'
python scripts/narration/generate-google.py
# Optional real sample; never published into the app:
python scripts/narration/generate-google.py --generate --sample
# Purposeful range sample: choose its exact canonical hash from the preview:
python scripts/narration/generate-google.py --sample-hash <canonical-sha256>
python scripts/narration/generate-google.py --generate --sample-hash <canonical-sha256>
# Complete batch, only when the sample and provider setup are accepted:
python scripts/narration/generate-google.py --generate
```

The separate `GOOGLE_CLOUD_TTS_API_KEY` goes in ignored `.env.local`, never in
the chat or browser. Enable the Text-to-Speech API and restrict the key to that
API. Cloud account setup/billing remains under the user's control. Do not use
the Gemini tutor key as a substitute. This key is never needed in Vercel for
audio playback, and the generator sends it only as an official API header.

The default ceiling is 120,000 newly requested **spoken-input** characters per
invocation, including conservative accounting for retries. `--max-characters`
can lower this ceiling. The full preflight checks every normalized input against
Google's 5,000 UTF-8 byte limit and refuses an oversized batch before any
credential read or provider call. Dry-run reports actual spoken characters,
changed clips, reused inputs and pending characters, without reading the key.
It reuses completed clips for identical spoken input/voice/settings, retries
only HTTP 429/5xx at most three times, and stops
on an unknown network completion. Provider quotas/free allowance are shared
with any other project usage; the script cannot independently guarantee the
account has no other consumption.

Cache/checkpoints remain in ignored `.narration-tools`. Each clip must decode
to real, non-silent audio, and the complete manifest is published only when all
clips validate. A partially completed batch never replaces the public catalog.

### Speech notation and source preservation

`normalize_basque.py` version `eu-spoken-1` expands dates, ordinal ranges,
cardinal quantities, decimal digits, percentages and measurement units only
in the text sent to the offline voice. For example, `1-4 astera` becomes
`lehenengo astetik laugarrenera`, while `4,5–5. egunak` keeps its fractional
value as `lau koma bost egunetik bost egunera`. Decimal leading zeroes remain
audible. Explicit identifier pronunciations preserve identity: DNA is spoken
`de ene a`, CO2 `ze o bi`, CO `ze o`, O2 `o bi`, and C4–C8 `ze lautik ze zortzira`.
Other scientific identifiers (FGF8, HLA-G, 3D) remain unchanged.
The 16 diagram-arrow phrases use individually reviewed replacements keyed by
their complete original SHA256; no generic arrow-to-transformation rule exists.
Unknown scientific relationships remain unchanged.

Ordinal spelling and percentage interval notation follow Euskaltzaindia
[rule 18](https://www.euskaltzaindia.eus/dok/arauak/Araua_0018.pdf) and
[rule 203](https://www.euskaltzaindia.eus/dok/arauak/Araua_0203.pdf), especially
the decimal, ordinal and percentage sections. This bounded implementation
preserves unfamiliar identifiers rather than guessing their meaning.

The original course strings and canonical SHA256 lookup keys never change.
The public manifest maps each original hash to the final MP3 byte hash and
records `normalizationVersion` and `spokenTextHash`. The cache filename now
hashes the **actual spoken input** in the same existing voice/settings directory:
unchanged text reuses old audio; changed pronunciation cannot reuse its literal
old clip. Old cache files are retained, and equivalent spoken inputs share a
single request. The version label is provenance, not a blanket cache invalidator.

Every dry-run writes `.narration-tools/google-spoken-inputs.json` with original
text, spoken text, both hashes and budget statistics for review, plus a compact
`google-spoken-changes.json` containing every changed entry. Samples use
`google-spoken-sample.json` and never overwrite the full preview or public
assets. These ignored local reports contain no credentials. Changing the spoken
rules requires reviewing that preview and listening to a purposeful sample
before resuming the complete authorized batch.

## Alternative sample tooling: Piper

The exporter imports the live six-topic registry and `getNarrationSegments`.
It preserves every sentence exactly and deduplicates by UTF-8 text SHA256.

```powershell
npx vitest run --config scripts/narration/vitest.config.ts
python -m venv .narration-tools/venv
.\.narration-tools\venv\Scripts\python.exe -m pip install piper-tts==1.8.0
```

Download `eu_ES-maider-medium.onnx` and its `.onnx.json` from the official
[Piper voice repository](https://huggingface.co/rhasspy/piper-voices/tree/c10ece1aade47bb51c153c893d14e5bf8e5b7117/eu/eu_ES/maider/medium)
into `.narration-tools/models`. The Python generator checks the pinned model
digest before synthesis. Use installed ffmpeg/ffprobe; no system install is
performed by these scripts.

```powershell
.\.narration-tools\venv\Scripts\python.exe scripts/narration/generate-piper.py --sample
# Only after choosing the voice and checking the sample:
.\.narration-tools\venv\Scripts\python.exe scripts/narration/generate-piper.py
```

The ignored cache allows interrupted runs to resume. Every clip is decoded and
checked for real, non-silent audio. MP3 filenames hash the final encoded bytes,
so a different voice or pace produces a different immutable asset URL. The
manifest maps canonical text hashes to those asset URLs and publishes only
after all clips pass. Sample mode never writes a public asset or manifest.

Piper's synthesis software is GPL-3.0; it is isolated offline tooling and is
not bundled in the web application. The official Maider model card identifies
its source dataset as CC BY 4.0. Itzune created that dataset from the Maider
synthetic voice. The source model card and dataset attribution must accompany
any selected Maider audio release:

- [Official model card](https://huggingface.co/rhasspy/piper-voices/blob/c10ece1aade47bb51c153c893d14e5bf8e5b7117/eu/eu_ES/maider/medium/MODEL_CARD)
- [Itzune Maider dataset](https://huggingface.co/datasets/itzune/maider-dataset)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

No API key, billing account, app dependency or runtime speech generation is
needed to play a completed static audio catalog.
