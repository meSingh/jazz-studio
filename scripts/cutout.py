#!/usr/bin/env python3
"""
Cuts Jazz's character poses out of their magenta backgrounds.

Each pose is rendered on one flat magenta (#FF00FF), a colour that appears
nowhere on her: not in her skin, hair, shirt or the white of her t-shirt. That
makes the background a key rather than something to guess at, so this runs
locally with Pillow and nothing is sent anywhere.

    python3 scripts/cutout.py pose.jpg --name hello
    python3 scripts/cutout.py pose.jpg --name draw --icon    # also the app icons

Writes src/assets/jazz/<name>.webp, trimmed to the character, at most 900px.
With --icon it also composites the cut-out onto the navy tile her brother's
icon uses and writes the app icons into public/.

Requires Pillow:  pip install Pillow
"""
import argparse
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(HERE, 'src', 'assets', 'jazz')
PUBLIC = os.path.join(HERE, 'public')

NAVY = (15, 23, 42, 255)
GLOW = (37, 78, 190, 255)


def key(img):
    """Alpha from how magenta each pixel is, then the magenta taken back out of the edges."""
    rgb = img.convert('RGB')
    r, g, b = rgb.split()
    # Magenta is high red and blue with no green: min(R, B) - G. Near 245 for
    # the background, at or below zero for everything that is her.
    mag = ImageChops.subtract(ImageChops.darker(r, b), g)
    corner = [mag.getpixel(p) for p in ((4, 4), (rgb.width - 5, 4), (4, rgb.height - 5), (rgb.width - 5, rgb.height - 5))]
    bg_level = sorted(corner)[1]
    lo, hi = 24, max(120, bg_level - 12)
    alpha = mag.point(lambda v: 255 if v <= lo else 0 if v >= hi else round(255 * (hi - v) / (hi - lo)))

    # The background colour itself, sampled, so the despill removes exactly it.
    samples = [rgb.getpixel(p) for p in ((4, 4), (rgb.width - 5, 4), (4, rgb.height // 2), (rgb.width - 5, rgb.height // 2))]
    m = tuple(sum(s[i] for s in samples) / len(samples) for i in range(3))

    # get_flattened_data replaces getdata from Pillow 12.
    flat = (lambda im: im.get_flattened_data()) if hasattr(Image.Image, 'get_flattened_data') else (lambda im: im.getdata())
    out = []
    for (cr, cg, cb), a in zip(flat(rgb), flat(alpha)):
        if a == 0:
            out.append((0, 0, 0, 0))
            continue
        if a < 255:
            t = a / 255
            # C = t*F + (1-t)*M, so F = (C - (1-t)*M) / t
            cr, cg, cb = [min(255, max(0, round((c - (1 - t) * mc) / t))) for c, mc in zip((cr, cg, cb), m)]
        # The render bounces magenta light onto her hair as a purple rim. Red and
        # blue both above green is that spill; nothing of hers has it (skin and
        # cheeks have blue at or below green), so it comes out everywhere.
        spill = min(cr, cb) - cg
        if spill > 0:
            cr, cb = cr - spill, cb - spill
        out.append((cr, cg, cb, a))
    cut = Image.new('RGBA', rgb.size)
    cut.putdata(out)
    return cut


def trim(cut, pad=6):
    box = cut.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    if not box:
        sys.exit('Nothing left after cutting out the background. Is it really magenta?')
    l, t, r, b = box
    return cut.crop((max(0, l - pad), max(0, t - pad), min(cut.width, r + pad), min(cut.height, b + pad)))


def icon(cut, size=1024):
    """Her cut-out on the navy tile with a blue glow, like her brother's icon."""
    ss = 2
    w = size * ss
    tile = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    pad, radius = int(w * 0.04), int(w * 0.205)
    mask = Image.new('L', (w, w), 0)
    ImageDraw.Draw(mask).rounded_rectangle([pad, pad, w - pad, w - pad], radius=radius, fill=255)
    base = Image.new('RGBA', (w, w), NAVY)
    glow = Image.new('RGBA', (w, w), (0, 0, 0, 0))
    gr = int(w * 0.33)
    ImageDraw.Draw(glow).ellipse([w / 2 - gr, w * 0.42 - gr, w / 2 + gr, w * 0.42 + gr], fill=GLOW)
    base.alpha_composite(glow.filter(ImageFilter.GaussianBlur(w * 0.06)))

    # Her head fills the tile the way her brother's does; the rest runs off the bottom.
    scale = (w * 0.98) / cut.width
    fig = cut.resize((round(cut.width * scale), round(cut.height * scale)), Image.LANCZOS)
    base.alpha_composite(fig, ((w - fig.width) // 2, int(w * 0.07)))
    tile.paste(base, (0, 0), mask)
    return tile.resize((size, size), Image.LANCZOS)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('image')
    p.add_argument('--name', required=True)
    p.add_argument('--icon', action='store_true', help='also build the app icons from this pose')
    args = p.parse_args()

    cut = trim(key(Image.open(args.image)))
    os.makedirs(OUT, exist_ok=True)
    web = cut.copy()
    web.thumbnail((900, 900), Image.LANCZOS)
    dest = os.path.join(OUT, f'{args.name}.webp')
    web.save(dest, 'WEBP', quality=88, method=6)
    print(f'{dest}  {web.width}x{web.height}')

    if args.icon:
        os.makedirs(PUBLIC, exist_ok=True)
        big = icon(cut)
        for size, name in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png'), (64, 'favicon.png')):
            big.resize((size, size), Image.LANCZOS).save(os.path.join(PUBLIC, name))
        big.save(os.path.join(HERE, 'scripts', 'icon-1024.png'))
        print('app icons written to public/')


if __name__ == '__main__':
    main()
