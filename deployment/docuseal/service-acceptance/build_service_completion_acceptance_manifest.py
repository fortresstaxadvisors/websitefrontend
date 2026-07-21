#!/usr/bin/env python3
"""Extract DocuSeal field geometry from the tagged acknowledgment PDF."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from tempfile import NamedTemporaryFile

TAG = re.compile(r"^\{\{(.+);role=([^;]+);type=([^}]+)\}\}$")
PREFILL = {
    "Client Name",
    "Client Company",
    "Invoice Number",
    "Completion Record ID",
    "Service or Milestone",
    "Delivery Date",
    "Delivery Method",
    "Delivered To",
    "Completed Deliverables",
}
OPTIONAL = {"Client Company", "Client Signer Title"}
OPTIONS = {
    "Client Response": [
        "I acknowledge receipt and review of the listed deliverables",
        "I am reporting an issue with the listed deliverables",
    ]
}
EXPECTED = PREFILL | {
    "Client Response",
    "Client Comments or Issue Description",
    "Client Rights Initials",
    "Client Printed Legal Name",
    "Client Signer Title",
    "Client Signature",
    "Client Signature Date",
}


def field_area(
    name: str,
    field_type: str,
    box: tuple[float, float, float, float],
    page: int,
) -> dict[str, float | int]:
    xmin, ymin, xmax, ymax = box
    tag_height = ymax - ymin
    if name in PREFILL:
        height = 52.0 if name == "Completed Deliverables" else 26.0
        if name == "Service or Milestone":
            height = 30.0
        return {
            "x": 152.0,
            "y": ymin - (height - tag_height) / 2,
            "w": 404.0,
            "h": height,
            "page": page,
        }
    if name == "Client Response":
        return {"x": 194.0, "y": ymin - 9.0, "w": 362.0, "h": 28.0, "page": page}
    if name == "Client Comments or Issue Description":
        return {"x": 194.0, "y": ymin - 34.0, "w": 362.0, "h": 76.0, "page": page}
    if field_type == "initials":
        return {"x": 194.0, "y": ymin - 7.0, "w": 115.0, "h": 22.0, "page": page}
    if name == "Client Printed Legal Name":
        return {"x": xmin - 3.0, "y": ymin - 8.0, "w": 150.0, "h": 22.0, "page": page}
    if name == "Client Signer Title":
        return {"x": xmin - 3.0, "y": ymin - 8.0, "w": 128.0, "h": 22.0, "page": page}
    if field_type == "signature":
        return {"x": xmin - 3.0, "y": ymin - 15.0, "w": 150.0, "h": 34.0, "page": page}
    if field_type == "date":
        return {"x": xmin - 3.0, "y": ymin - 8.0, "w": 118.0, "h": 22.0, "page": page}
    return {"x": xmin - 3.0, "y": ymin - 7.0, "w": max(90.0, xmax - xmin), "h": 22.0, "page": page}


def extract_fields(pdf: Path) -> list[dict]:
    with NamedTemporaryFile(suffix=".html") as temp:
        subprocess.run(["pdftotext", "-bbox", str(pdf), temp.name], check=True)
        root = ET.parse(temp.name).getroot()

    namespace = {"x": "http://www.w3.org/1999/xhtml"}
    fields: list[dict] = []
    for page_index, page in enumerate(root.findall(".//x:page", namespace)):
        width = float(page.attrib["width"])
        height = float(page.attrib["height"])
        words = page.findall("x:word", namespace)
        index = 0
        while index < len(words):
            text = words[index].text or ""
            if not text.startswith("{{"):
                index += 1
                continue
            parts = [text]
            selected = [words[index]]
            while not parts[-1].endswith("}}"):
                index += 1
                if index >= len(words):
                    raise RuntimeError("Unterminated DocuSeal field tag")
                parts.append(words[index].text or "")
                selected.append(words[index])
            match = TAG.match(" ".join(parts))
            if not match:
                raise RuntimeError(f"Invalid DocuSeal field tag: {' '.join(parts)}")
            name, role, field_type = match.groups()
            box = (
                min(float(word.attrib["xMin"]) for word in selected),
                min(float(word.attrib["yMin"]) for word in selected),
                max(float(word.attrib["xMax"]) for word in selected),
                max(float(word.attrib["yMax"]) for word in selected),
            )
            area = field_area(name, field_type, box, page_index)
            normalized = {
                "x": round(float(area["x"]) / width, 6),
                "y": round(float(area["y"]) / height, 6),
                "w": round(float(area["w"]) / width, 6),
                "h": round(float(area["h"]) / height, 6),
                "page": area["page"],
            }
            if min(normalized["x"], normalized["y"], normalized["w"], normalized["h"]) < 0:
                raise RuntimeError(f"Field area is outside the page: {name}")
            if normalized["x"] + normalized["w"] > 1 or normalized["y"] + normalized["h"] > 1:
                raise RuntimeError(f"Field area exceeds the page: {name}")
            field = {
                "name": name,
                "role": role,
                "type": field_type,
                "required": name not in OPTIONAL,
                "prefillable": name in PREFILL,
                "readonly": name in PREFILL,
                "areas": [normalized],
            }
            if name in OPTIONS:
                field["options"] = OPTIONS[name]
            fields.append(field)
            index += 1
    return fields


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("tagged_pdf", type=Path)
    parser.add_argument("output_json", type=Path)
    args = parser.parse_args()
    fields = extract_fields(args.tagged_pdf.resolve())
    names = [field["name"] for field in fields]
    duplicates = sorted({name for name in names if names.count(name) > 1})
    missing = sorted(EXPECTED.difference(names))
    unexpected = sorted(set(names).difference(EXPECTED))
    if duplicates or missing or unexpected:
        raise RuntimeError(
            f"Invalid field set; duplicates={duplicates}, missing={missing}, unexpected={unexpected}"
        )
    output = args.output_json.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps({"roles": ["Client"], "fields": fields}, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(fields)} fields to {output}")


if __name__ == "__main__":
    main()
