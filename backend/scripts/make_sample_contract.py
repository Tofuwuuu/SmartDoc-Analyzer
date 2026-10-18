"""Write samples/sample-contract.pdf from samples/sample-contract.txt.

The local API accepts PDFs and images, not .txt, so the text is laid out on
one PDF page, one line per line of the text file. Every person and company in
it is made up. It trips every rule in shared/contract-rules.json: automatic
renewal with a short notice window, full payment upfront, Net 90, conflicting
governing law, and missing standard clauses.

    pip install PyMuPDF
    python3 backend/scripts/make_sample_contract.py
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "samples" / "sample-contract.txt"
OUT = ROOT / "samples" / "sample-contract.pdf"


def main() -> None:
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    y = 60
    for line in lines:
        if line:
            page.insert_text((72, y), line, fontsize=10.5, fontname="helv")
        y += 17
    if y > 792:
        raise SystemExit("sample-contract.txt no longer fits on one page")
    doc.set_metadata({"title": "Sample contract for testing", "author": "SmartDoc Analyzer"})
    doc.save(OUT, garbage=4, deflate=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
