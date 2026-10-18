"""Write samples/sample-contract.pdf, a fictional contract for trying the local API.

Every person and company in it is made up. It is written to trigger the
contract flags: auto-renewal, upfront and Net 90 payment, conflicting
governing law, and missing clauses.

    pip install PyMuPDF
    python3 backend/scripts/make_sample_contract.py
"""

from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "samples" / "sample-contract.pdf"

PAGES = [
    [
        "CONSULTING AGREEMENT (FICTIONAL SAMPLE)",
        "",
        "Every name in this document is invented for testing SmartDoc Analyzer.",
        "",
        'This Consulting Agreement ("Agreement") is entered into as of the Effective Date',
        'by and between Lanternfish Test Studio LLC ("Consultant") and',
        'Bluefin Example Company ("Client"). The parties hereby agree as follows.',
        "",
        "1. Services. Consultant shall design and test the Client's sample dashboards.",
        "Avery Quill will lead the work for Consultant. Rowan Teller is the Client contact.",
        "",
        "2. Term. This Agreement begins on the Effective Date and shall automatically renew",
        "for successive one-year terms unless either party gives written notice of 10 days",
        "before the end of the then-current term.",
        "",
        "3. Fees. Client shall pay the full amount due upfront before work begins.",
        "Later invoices are payable Net 90 from the invoice date.",
    ],
    [
        "4. Confidentiality. Each party shall not disclose the other party's confidential",
        "information, except where disclosure is required by law.",
        "",
        "5. Governing Law. This Agreement is governed by the laws of the State of Oregon.",
        "The parties also agree this Agreement is governed by the laws of the State of Texas.",
        "",
        "IN WITNESS WHEREOF, the parties have executed this Agreement.",
        "",
        "Consultant: Avery Quill, Lanternfish Test Studio LLC",
        "Client: Rowan Teller, Bluefin Example Company",
    ],
]


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = fitz.open()
    for lines in PAGES:
        page = doc.new_page(width=612, height=792)
        y = 72
        for line in lines:
            if line:
                page.insert_text((72, y), line, fontsize=11, fontname="helv")
            y += 18
    doc.set_metadata({"title": "Fictional sample consulting agreement", "author": "SmartDoc Analyzer"})
    doc.save(OUT, garbage=4, deflate=True)
    print(f"Wrote {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
