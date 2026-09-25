"""Generate the bundled sample PDF, a scan image, and compliance parity fixtures.

The fixture file is the Python compliance service's output for fixed sample
texts. The TypeScript port is tested against that file.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from app.services.compliance import is_likely_contract, scan_contract  # noqa: E402

FRONTEND = ROOT / "frontend"
SAMPLE_DIR = FRONTEND / "public" / "samples"
FIXTURE_PATH = FRONTEND / "src" / "analysis" / "compliance.expected.json"

PAGE_1 = [
    "SERVICE AGREEMENT",
    "",
    'This Service Agreement ("Agreement") is entered into as of the Effective Date',
    'by and between Northwind Labs LLC ("Provider") and Harbor and Co. ("Client").',
    "The parties hereby agree as follows.",
    "",
    "1. Services. Provider shall perform the software maintenance described in Exhibit A.",
    "Provider shall not subcontract the core services without prior written consent.",
    "",
    "2. Term. This Agreement begins on the Effective Date and shall automatically renew",
    "for successive one-year terms unless either party gives written notice of 14 days",
    "before the end of the then-current term.",
    "",
    "3. Fees. Client shall pay the full amount due upfront before work begins.",
    "Additional invoices are payable Net 90 from the invoice date.",
]

PAGE_2 = [
    "4. Confidentiality. Each party shall not disclose the other party's confidential",
    "information, except where disclosure is required by law.",
    "",
    "5. Termination. Either party may end this Agreement for a material breach that",
    "remains uncured for fourteen days after written notice.",
    "",
    "6. Governing Law. This Agreement is governed by the laws of the State of Delaware.",
    "The parties also agree this Agreement is governed by the laws of the State of California.",
    "",
    "IN WITNESS WHEREOF, the parties have executed this Agreement.",
    "",
    "Provider: Ada Lovelace, Northwind Labs LLC",
    "Client: Samir Patel, Harbor and Co.",
]

SCAN_LINES = [
    "SERVICE AGREEMENT",
    "",
    "This Service Agreement is made on the Effective Date.",
    "The parties hereby agree as follows.",
    "",
    "This agreement shall automatically renew.",
    "Cancel with written notice of 14 days.",
    "",
    "Client shall pay the full amount due upfront.",
    "Invoices are payable Net 90.",
    "",
    "Confidentiality. Each party shall not share confidential data.",
    "Termination. Either party may end this agreement.",
    "",
    "Governing Law. This agreement is governed by the laws of Delaware.",
    "This agreement is governed by the laws of California.",
    "",
    "Signed by Ada Lovelace of Northwind Labs.",
    "Signed by Samir Patel of Harbor Labs.",
]

NOT_A_CONTRACT = "Shopping list\nMilk\nEggs\nBread from the corner store\n"

AUTO_RENEW_NO_NOTICE = (
    "This Agreement is made as of the Effective Date. "
    "The parties hereby agree this agreement shall automatically renew each year.\n"
)

CLEAN_CONTRACT = """
This Service Agreement is entered into as of the Effective Date. The parties hereby agree.

Termination. Either party may end this agreement.
Limitation of liability. Provider limits its liability to fees paid.
Indemnification. Client shall indemnify Provider.
Confidentiality. Each party shall not disclose confidential information.
Governing law. This agreement is governed by the laws of Delaware.
Dispute resolution. Disputes go to arbitration.

Fees are payable Net 30.
""".strip()

UPFRONT_AND_LONG_NET = (
    "This Agreement is entered into on the Effective Date. The parties hereby agree.\n"
    "100% payment due in advance.\n"
    "Invoices are Net 61.\n"
)


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _content_stream(lines: list[str]) -> str:
    operations = ["BT", "/F1 11 Tf"]
    y = 740
    for line in lines:
        if line:
            operations.append(f"1 0 0 1 54 {y} Tm ({_escape_pdf_text(line)}) Tj")
        y -= 16
    operations.append("ET")
    return "\n".join(operations)


def _pdf_bytes(pages: list[list[str]]) -> bytes:
    contents = [_content_stream(page) for page in pages]
    # 1 catalog, 2 pages, 3 font, then page/content pairs.
    page_object_ids = [4 + (index * 2) for index in range(len(pages))]
    content_object_ids = [page_id + 1 for page_id in page_object_ids]
    kids = " ".join(f"{page_id} 0 R" for page_id in page_object_ids)

    objects: list[bytes] = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode("ascii"),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    for page_id, content_id, stream in zip(page_object_ids, content_object_ids, contents, strict=True):
        stream_bytes = stream.encode("latin-1")
        objects.append(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                f"/Contents {content_id} 0 R /Resources << /Font << /F1 3 0 R >> >> >>"
            ).encode("ascii")
        )
        objects.append(
            f"<< /Length {len(stream_bytes)} >>\nstream\n".encode("ascii")
            + stream_bytes
            + b"\nendstream"
        )
        del page_id

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, body in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(body)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(output)


def _write_scan(path: Path, lines: list[str]) -> None:
    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 42)
    title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 52)
    padding = 64
    line_gap = 18
    dummy = Image.new("RGB", (1, 1), "white")
    draw = ImageDraw.Draw(dummy)
    widths = []
    heights = []
    for index, line in enumerate(lines):
        chosen = title_font if index == 0 else font
        if line:
            box = draw.textbbox((0, 0), line, font=chosen)
            widths.append(box[2] - box[0])
            heights.append(box[3] - box[1] + line_gap)
        else:
            heights.append(28)
    width = max(widths) + padding * 2
    height = sum(heights) + padding * 2
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    y = padding
    for index, line in enumerate(lines):
        chosen = title_font if index == 0 else font
        if line:
            draw.text((padding, y), line, fill="black", font=chosen)
        y += heights[index]
    image.save(path, format="PNG")


def _case(name: str, text: str) -> dict:
    return {
        "name": name,
        "text": text,
        "is_contract": is_likely_contract(text),
        "flags": scan_contract(text),
    }


def main() -> None:
    SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    contract_text = "\n".join(PAGE_1 + [""] + PAGE_2)
    scan_text = "\n".join(SCAN_LINES)
    (SAMPLE_DIR / "service-agreement.pdf").write_bytes(_pdf_bytes([PAGE_1, PAGE_2]))
    _write_scan(SAMPLE_DIR / "sample-scan.png", SCAN_LINES)

    cases = [
        _case("sample_contract", contract_text),
        _case("sample_scan_source", scan_text),
        _case("not_a_contract", NOT_A_CONTRACT),
        _case("auto_renew_without_notice", AUTO_RENEW_NO_NOTICE),
        _case("clean_contract", CLEAN_CONTRACT),
        _case("upfront_and_net_61", UPFRONT_AND_LONG_NET),
    ]
    FIXTURE_PATH.write_text(json.dumps(cases, indent=2) + "\n", encoding="utf-8")
    for case in cases:
        titles = [flag["title"] for flag in case["flags"]]
        print(f"{case['name']}: contract={case['is_contract']} flags={len(titles)}")
        for title in titles:
            print(f"  - {title}")


if __name__ == "__main__":
    main()
