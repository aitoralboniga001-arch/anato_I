# Original course notes

`python scripts/notes/extract.py` generates the six checked-in documents from the original PDFs in Downloads. `--source-dir PATH` selects another source folder. No PDF is modified or copied into the website.

`python scripts/notes/extract.py --check` is read-only. It checks the complete text against the PDF's independent plain-text extraction, ignoring whitespace and only the exact header/footer lines recorded in `content/notes-text/manifest.json`. It also checks generated formatting, stable IDs, and the manifest against the checked-in files. Spelling and factual errors in the originals are preserved.

IDs have a topic prefix (`w1/4.2/p3/s2`) so identical section numbers in different PDFs cannot collide. Ranges stay within one paragraph (`w1/4.2/p3/s1-s4`).

`python scripts/notes/suggest.py --week 1` prints lexical candidates within each stage's sections. Proposals never alter course data. `reviewed.json` records the manually selected alignment of all 306 beats; `node scripts/notes/apply.cjs scripts/notes/reviewed.json` applies only their `notes` fields. The reverse phrase index is built from those beat fields at runtime.

305 beats have anchors. The remaining beat is `1/habiratzea/4`: the original topic 1 PDF ends at section 4.5 and contains no ectopic-implantation section. Its panel states that the detail is absent. Explicit cross-section explanations are recorded in `NOTES_EXCEPTIONS`; no substitute prose is inserted.

`tests/notes.test.ts` checks IDs, complete beat coverage, section boundaries, reverse links, TOC routing, and pinned text lengths/SHA-256 hashes. After changing an extraction rule, review all six PDFs visually and re-review affected alignment before updating those pins.

Open `/astea/1?apunteak=1` or press N in the simulator. A−/A+ and the notes preference are remembered in the browser. Manual scrolling pauses follow; Jarraitu resumes it. Notes remain visible in focus/fullscreen mode. The existing information panel returns when notes mode is disabled.
