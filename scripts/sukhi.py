#!/usr/bin/env python3
"""
Sukhi's characters, from his model sheet.

    python3 scripts/sukhi.py ~/Downloads/sukhi-model-sheet.png

Crops seven shots from the sheet (six expressions and the one of him painting),
doubles them for the matte to work with, cuts each out with the macOS Vision
framework (scripts/matte.swift, compiled on first use: on the computer, nothing
uploaded), trims them and writes src/assets/sukhi/*.webp.

The sheet is not in the repository, like the photo Jazz's were drawn from.
Positions are in the coordinates of a 922-pixel-wide copy of the sheet and
scaled to the one given. After a new sheet, measure the faces again (cx, cy
and d in src/character.ts).
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'src', 'assets', 'sukhi')

COLS = [(28, 237), (247, 456), (466, 675), (685, 894)]
ROWS = [(488, 696), (731, 940), (976, 1184), (1220, 1428)]
# Which tile of the expression grid each one is: (row, column).
TILES = {'smiling': (0, 0), 'grin': (0, 1), 'laughing': (0, 2), 'silly': (1, 0), 'thinking': (2, 3), 'proud': (3, 2)}
# Him painting, at the foot of the sheet: below the "Rigging" label, down to the floor.
PAINTING = (680, 1707, 912, 2012)


def matte_tool():
    tool = os.path.join(tempfile.gettempdir(), 'studio-matte')
    if not os.path.exists(tool):
        subprocess.run(['swiftc', '-O', os.path.join(HERE, 'matte.swift'), '-o', tool], check=True)
    return tool


def main():
    sheet = Image.open(sys.argv[1]).convert('RGB')
    k = sheet.width / 922
    boxes = {name: (COLS[c][0] + 5, ROWS[r][0] + 5, COLS[c][1] - 5, ROWS[r][1] - 5) for name, (r, c) in TILES.items()}
    boxes['painting'] = PAINTING
    work = tempfile.mkdtemp()
    paths = []
    for name, box in boxes.items():
        crop = sheet.crop(tuple(round(v * k) for v in box))
        path = os.path.join(work, f'{name}.png')
        crop.resize((crop.width * 2, crop.height * 2), Image.LANCZOS).save(path)
        paths.append(path)
    subprocess.run([matte_tool(), *paths], check=True)
    os.makedirs(OUT, exist_ok=True)
    for name in boxes:
        cut = Image.open(os.path.join(work, f'{name}.cut.png')).convert('RGBA')
        cut = cut.crop(cut.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox())
        if max(cut.size) > 900:
            s = 900 / max(cut.size)
            cut = cut.resize((round(cut.width * s), round(cut.height * s)), Image.LANCZOS)
        cut.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=88, method=6)
        print(f'{name}: {cut.width} x {cut.height}')


if __name__ == '__main__':
    main()
