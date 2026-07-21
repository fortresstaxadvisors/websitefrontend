#!/usr/bin/env python3
"""Build the Fortress Sandbox service-completion acknowledgment PDF."""

from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "service-completion-acceptance-sandbox-draft.md"
DEFAULT_OUTPUT = HERE / "service-completion-acceptance-sandbox.pdf"

PAPER = colors.HexColor("#F3EEE4")
SURFACE = colors.HexColor("#FBF8F1")
SLATE = colors.HexColor("#11181F")
INK = colors.HexColor("#161D24")
MUTED = colors.HexColor("#54606B")
BRASS = colors.HexColor("#9A7A43")
BRASS_DARK = colors.HexColor("#6E5226")
LINE = colors.HexColor("#D6CEC0")
WARNING = colors.HexColor("#8E2F28")


def register_fonts() -> None:
    regular = Path("/System/Library/Fonts/Supplemental/Georgia.ttf")
    bold = Path("/System/Library/Fonts/Supplemental/Georgia Bold.ttf")
    if regular.exists() and bold.exists():
        pdfmetrics.registerFont(TTFont("FortressSerif", str(regular)))
        pdfmetrics.registerFont(TTFont("FortressSerifBold", str(bold)))
    else:
        pdfmetrics.registerFontFamily(
            "FortressSerif", normal="Times-Roman", bold="Times-Bold"
        )


def clean_inline(value: str) -> str:
    value = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", value)
    value = re.sub(r"`([^`]+)`", r"\1", value)
    value = re.sub(r"\[([^]]+)\]\([^)]+\)", r"\1", value)
    return value


def source_sections() -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current: str | None = None
    for raw in SOURCE.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if line.startswith("## Internal counsel"):
            break
        if line.startswith("### "):
            current = line[4:]
            sections[current] = []
        elif current and line and line != "---" and not line.startswith(">"):
            sections[current].append(line)
    required = {
        "1. Purpose and completion record",
        "2. What an acknowledgment means",
        "3. Payment and preserved rights",
        "4. Client response and electronic signature",
    }
    missing = required.difference(sections)
    if missing:
        raise RuntimeError(f"Draft is missing sections: {', '.join(sorted(missing))}")
    return sections


def styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "title": ParagraphStyle(
            "Title",
            parent=base["Normal"],
            fontName="FortressSerifBold",
            fontSize=21,
            leading=24,
            textColor=SLATE,
            alignment=TA_CENTER,
            spaceAfter=5,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=BRASS_DARK,
            alignment=TA_CENTER,
            spaceAfter=12,
        ),
        "warning": ParagraphStyle(
            "Warning",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8.5,
            leading=12,
            textColor=WARNING,
            alignment=TA_CENTER,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Normal"],
            fontName="FortressSerifBold",
            fontSize=14,
            leading=17,
            textColor=SLATE,
            spaceBefore=8,
            spaceAfter=5,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.8,
            leading=12.2,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=MUTED,
        ),
        "field_label": ParagraphStyle(
            "FieldLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.2,
            leading=9,
            textColor=MUTED,
        ),
        "field": ParagraphStyle(
            "Field",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=10,
            textColor=INK,
        ),
        "signature": ParagraphStyle(
            "Signature",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=INK,
        ),
    }


def page_chrome(canvas, doc) -> None:
    width, height = LETTER
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, width, height, stroke=0, fill=1)
    canvas.setFillColor(SLATE)
    canvas.rect(0, height - 0.56 * inch, width, 0.56 * inch, stroke=0, fill=1)
    canvas.setFont("Helvetica-Bold", 9)
    canvas.setFillColor(PAPER)
    canvas.drawString(0.65 * inch, height - 0.35 * inch, "FORTRESS TAX ADVISORS")
    canvas.setFont("Helvetica", 7.4)
    canvas.setFillColor(colors.HexColor("#C6A06A"))
    canvas.drawRightString(
        width - 0.65 * inch,
        height - 0.35 * inch,
        "SANDBOX - COUNSEL REVIEW REQUIRED",
    )
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(0.65 * inch, 0.55 * inch, width - 0.65 * inch, 0.55 * inch)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.4)
    canvas.drawString(0.65 * inch, 0.35 * inch, "Not approved for client use")
    canvas.drawRightString(width - 0.65 * inch, 0.35 * inch, f"Page {doc.page} of 2")
    canvas.restoreState()


def field_tag(name: str, field_type: str, include_tags: bool) -> str:
    if not include_tags:
        return ""
    tag = html.escape(f"{{{{{name};role=Client;type={field_type}}}}}")
    return f'<font size="4" color="#54606B">{tag}</font>'


def warning_box(s: dict[str, ParagraphStyle]) -> Table:
    text = (
        "SANDBOX TESTING ONLY - NOT FOR PRODUCTION OR CLIENT USE. "
        "This workflow fixture has not been reviewed or approved by legal counsel."
    )
    table = Table([[Paragraph(text, s["warning"])]], colWidths=[6.48 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8E5E2")),
                ("BOX", (0, 0), (-1, -1), 0.8, WARNING),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def record_table(s: dict[str, ParagraphStyle], include_tags: bool) -> Table:
    rows = [
        ("CLIENT NAME", "Client Name", "text", 0.30),
        ("CLIENT COMPANY", "Client Company", "text", 0.30),
        ("INVOICE NUMBER", "Invoice Number", "text", 0.30),
        ("COMPLETION RECORD", "Completion Record ID", "text", 0.30),
        ("SERVICE OR MILESTONE", "Service or Milestone", "text", 0.42),
        ("DELIVERY DATE", "Delivery Date", "text", 0.30),
        ("DELIVERY METHOD", "Delivery Method", "text", 0.30),
        ("DELIVERED TO", "Delivered To", "text", 0.30),
        ("LISTED DELIVERABLES", "Completed Deliverables", "text", 0.84),
    ]
    data = [
        [
            Paragraph(label, s["field_label"]),
            Paragraph(field_tag(name, field_type, include_tags), s["field"]),
        ]
        for label, name, field_type, _ in rows
    ]
    table = Table(
        data,
        colWidths=[1.45 * inch, 5.03 * inch],
        rowHeights=[height * inch for *_, height in rows],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EBE4D6")),
                ("BACKGROUND", (1, 0), (1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def response_table(s: dict[str, ParagraphStyle], include_tags: bool) -> Table:
    data = [
        [
            Paragraph("CLIENT RESPONSE (CHOOSE ONE)", s["field_label"]),
            Paragraph(field_tag("Client Response", "select", include_tags), s["field"]),
        ],
        [
            Paragraph("COMMENTS OR ISSUE DESCRIPTION", s["field_label"]),
            Paragraph(
                field_tag("Client Comments or Issue Description", "text", include_tags),
                s["field"],
            ),
        ],
        [
            Paragraph("PAYMENT AND RIGHTS INITIALS", s["field_label"]),
            Paragraph(field_tag("Client Rights Initials", "initials", include_tags), s["field"]),
        ],
    ]
    table = Table(
        data,
        colWidths=[1.75 * inch, 4.73 * inch],
        rowHeights=[0.46 * inch, 0.92 * inch, 0.38 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EBE4D6")),
                ("BACKGROUND", (1, 0), (1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.7, BRASS),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def signature_table(s: dict[str, ParagraphStyle], include_tags: bool) -> Table:
    data = [
        [
            Paragraph("PRINTED LEGAL NAME", s["field_label"]),
            Paragraph(field_tag("Client Printed Legal Name", "text", include_tags), s["signature"]),
            Paragraph("TITLE / CAPACITY (OPTIONAL)", s["field_label"]),
            Paragraph(field_tag("Client Signer Title", "text", include_tags), s["signature"]),
        ],
        [
            Paragraph("ELECTRONIC SIGNATURE", s["field_label"]),
            Paragraph(field_tag("Client Signature", "signature", include_tags), s["signature"]),
            Paragraph("SIGNATURE DATE", s["field_label"]),
            Paragraph(field_tag("Client Signature Date", "date", include_tags), s["signature"]),
        ],
    ]
    table = Table(
        data,
        colWidths=[1.15 * inch, 2.15 * inch, 1.18 * inch, 2.0 * inch],
        rowHeights=[0.46 * inch, 0.56 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def paragraphs(lines: list[str], style: ParagraphStyle) -> list[Paragraph]:
    return [Paragraph(clean_inline(line), style) for line in lines]


def story(include_tags: bool):
    s = styles()
    sections = source_sections()
    content = [
        Spacer(1, 10),
        Paragraph("Fortress Tax Advisors", s["title"]),
        Paragraph("Service Completion Acknowledgment", s["subtitle"]),
        warning_box(s),
        Spacer(1, 10),
        Paragraph("1. Completion record", s["h1"]),
        *paragraphs(sections["1. Purpose and completion record"][:1], s["body"]),
        record_table(s, include_tags),
        Spacer(1, 5),
        Paragraph("Record handling", s["h1"]),
        *paragraphs(sections["1. Purpose and completion record"][1:], s["body"]),
        PageBreak(),
        Spacer(1, 10),
        Paragraph("Client review and response", s["title"]),
        warning_box(s),
        Spacer(1, 8),
        Paragraph("2. What this acknowledgment means", s["h1"]),
        *paragraphs(sections["2. What an acknowledgment means"], s["body"]),
        Paragraph("3. Payment and preserved rights", s["h1"]),
        *paragraphs(sections["3. Payment and preserved rights"], s["body"]),
        Paragraph("4. Your response", s["h1"]),
        *paragraphs(sections["4. Client response and electronic signature"][:1], s["body"]),
        response_table(s, include_tags),
        Spacer(1, 4),
        *paragraphs(sections["4. Client response and electronic signature"][1:], s["body"]),
        signature_table(s, include_tags),
    ]
    return content


def build(output: Path, include_tags: bool) -> Path:
    register_fonts()
    output.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(output),
        pagesize=LETTER,
        leftMargin=0.65 * inch,
        rightMargin=0.65 * inch,
        topMargin=0.76 * inch,
        bottomMargin=0.72 * inch,
        title="Fortress Service Completion Acknowledgment - Sandbox",
        author="Fortress Tax Advisors",
        subject="Sandbox workflow testing only; counsel review required",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="Fortress", frames=[frame], onPage=page_chrome)])
    doc.build(story(include_tags))
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--include-tags", action="store_true")
    args = parser.parse_args()
    print(build(args.output.resolve(), args.include_tags))


if __name__ == "__main__":
    main()
