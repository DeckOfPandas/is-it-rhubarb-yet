"""Inflate every Flate stream in a PDF and write each to its own file.

usage: python3 -I tmp/pdf-streams.py <input.pdf> <outdir>

Writes <outdir>/obj-NNN.txt for each stream that inflates to text-like
content and <outdir>/obj-NNN.bin otherwise, plus <outdir>/index.txt listing
object number, length and the stream dictionary. Pure stdlib: Pillow and
PDF libraries are not installed in the image.
"""

import re
import sys
import zlib
from pathlib import Path


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: pdf-streams.py <input.pdf> <outdir>")
    src = Path(sys.argv[1]).read_bytes()
    outdir = Path(sys.argv[2])
    outdir.mkdir(parents=True, exist_ok=True)

    pattern = re.compile(
        rb"(\d+)\s+(\d+)\s+obj\s*(<<.*?>>)\s*stream\r?\n(.*?)\s*endstream",
        re.DOTALL,
    )
    lines = []
    for m in pattern.finditer(src):
        num = int(m.group(1))
        dictionary = m.group(3).decode("latin-1")
        raw = m.group(4)
        if b"FlateDecode" in m.group(3):
            try:
                data = zlib.decompress(raw)
            except zlib.error as e:
                lines.append(f"{num}\tERROR {e}\t{dictionary[:120]}")
                continue
        else:
            data = raw
        printable = sum(32 <= b < 127 or b in (9, 10, 13) for b in data[:2000])
        is_text = printable > 0.9 * min(len(data), 2000)
        ext = "txt" if is_text else "bin"
        (outdir / f"obj-{num:03d}.{ext}").write_bytes(data)
        lines.append(f"{num}\t{len(data)}\t{ext}\t{dictionary[:160]}")

    (outdir / "index.txt").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
