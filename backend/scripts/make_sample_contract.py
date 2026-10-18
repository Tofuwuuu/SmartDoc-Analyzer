"""Write samples/sample-contract.pdf, a fictional contract for trying the local API.

Every person and company in it is made up. It is written to trigger the
contract flags in shared/contract-rules.json: auto-renewal with a short
notice window, full payment upfront, Net 90, conflicting governing law, and
missing termination, limitation of liability, indemnification, and dispute
resolution clauses. The "unlimited" liability line has no rule of its own;
it shows up as the missing limitation of liability flag.

    pip install PyMuPDF
    python3 backend/scripts/make_sample_contract.py
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "samples" / "sample-contract.pdf"

LINES = [
    "Sample contract for testing. Not a real agreement.",
    "",
    "CONSULTING AGREEMENT",
    "",
    'This Consulting Agreement ("Agreement") is entered into as of the Effective Date by and',
    'between Pemberton Widgetworks LLC ("Consultant") and Quillfeather Test Bakery Inc. ("Client").',
    "The parties hereby agree as follows.",
    "",
    "1. Services. Consultant shall redesign the Client's sample order dashboard.",
    "Marigold Fennwick leads the work for Consultant. Tobias Quillfeather is the Client contact.",
    "",
    "2. Term. This Agreement begins on the Effective Date and shall automatically renew for",
    "successive one-year terms unless either party gives written notice of 10 days before the",
    "end of the then-current term.",
    "",
    "3. Fees. Client shall pay the full amount due upfront before work begins.",
    "Later invoices are payable Net 90 from the invoice date.",
    "",
    "4. Liability. Consultant's liability under this Agreement is unlimited.",
    "",
    "5. Confidentiality. Each party shall not disclose the other party's confidential",
    "information, except where disclosure is required by law.",
    "",
    "6. Governing Law. This Agreement is governed by the laws of the State of Oregon.",
    "The parties also agree this Agreement is governed by the laws of the State of Texas.",
    "",
    "IN WITNESS WHEREOF, the parties have executed this Agreement.",
    "",
    "Consultant: Marigold Fennwick, Pemberton Widgetworks LLC",
    "Client: Tobias Quillfeather, Quillfeather Test Bakery Inc.",
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    y = 72
    for line in LINES:
        if line:
            page.insert_text((72, y), line, fontsize=10.5, fontname="helv")
        y += 16
    doc.set_metadata({"title": "Fictional sample consulting agreement", "author": "SmartDoc Analyzer"})
    doc.save(OUT, garbage=4, deflate=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
