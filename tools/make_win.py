import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

SPECS = {  # name: cols, rows, keyed (dark box background baked in)
    'bat': (5, 5, True),
    'candles': (5, 4, True),
    'pumpkin': (6, 4, False),
    'skull': (6, 4, False),
}
OUT = 256          # output frame size (square)
CANVAS = 448       # static symbol canvas
FEATHER = 8        # px edge feather in the source frame


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def bbox(alpha, thr=128):
    ys, xs = np.where(alpha > thr)
    return xs.min(), ys.min(), xs.max(), ys.max()


def key_frame(rgba):
    """Remove a dark baked background: keep bright parts, fill solid interior."""
    rgb = rgba[..., :3].astype(float)
    L = rgb.max(2)
    soft = smooth(L, 40, 95)
    solid = L > 62
    solid = ndi.binary_closing(solid, iterations=4)
    solid = ndi.binary_fill_holes(solid)
    solid = ndi.binary_opening(solid, iterations=2)
    # keep the largest blobs only (drop stray glow specks)
    lab, n = ndi.label(solid)
    if n:
        sizes = ndi.sum(solid, lab, range(1, n + 1))
        keep = np.isin(lab, 1 + np.where(sizes > 0.02 * sizes.max())[0])
    else:
        keep = solid
    keepf = ndi.gaussian_filter(keep.astype(float), 1.5)
    a = np.maximum(soft, keepf)
    return np.clip(a * rgba[..., 3] / 255.0, 0, 1)


def edge_ramp(h, w, f):
    y = np.minimum(np.arange(h), np.arange(h)[::-1])
    x = np.minimum(np.arange(w), np.arange(w)[::-1])
    return np.outer(smooth(y, 0, f), smooth(x, 0, f))


def process(name):
    cols, rows, keyed = SPECS[name]
    sheet = np.array(Image.open(f'/home/claude/anim/src/{name}.png').convert('RGBA'))
    H, W = sheet.shape[:2]
    frames = []
    for r in range(rows):
        for c in range(cols):
            x0, x1 = round(c * W / cols), round((c + 1) * W / cols)
            y0, y1 = round(r * H / rows), round((r + 1) * H / rows)
            fr = sheet[y0:y1, x0:x1].copy()
            if keyed:
                a = key_frame(fr)
            else:
                a = fr[..., 3] / 255.0
            a = a * edge_ramp(*a.shape, FEATHER)
            fr[..., 3] = np.round(a * 255).astype(np.uint8)
            frames.append(fr)
    # all frames share one size (crop to min)
    h = min(f.shape[0] for f in frames); w = min(f.shape[1] for f in frames)
    frames = [f[:h, :w] for f in frames]
    # alignment: frame 1 content box -> static symbol content box
    st = np.array(Image.open(f'/home/claude/img/sym_{name}.webp').convert('RGBA'))
    sx0, sy0, sx1, sy1 = bbox(st[..., 3])
    fx0, fy0, fx1, fy1 = bbox(frames[0][..., 3])
    s = ((sx1 - sx0) / (fx1 - fx0) + (sy1 - sy0) / (fy1 - fy0)) / 2
    cxs, cys = (sx0 + sx1) / 2, (sy0 + sy1) / 2
    cxf, cyf = (fx0 + fx1) / 2, (fy0 + fy1) / 2
    k = OUT / CANVAS
    strip = Image.new('RGBA', (OUT * len(frames), OUT), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        im = Image.fromarray(fr)
        # premultiply to avoid dark fringes when resampling
        sc = s * k
        nw, nh = max(1, round(w * sc)), max(1, round(h * sc))
        im = im.convert('RGBa').resize((nw, nh), Image.LANCZOS).convert('RGBA')
        ox = round(cxs * k - cxf * sc)
        oy = round(cys * k - cyf * sc)
        tile = Image.new('RGBA', (OUT, OUT), (0, 0, 0, 0))
        tile.alpha_composite(im, (0, 0)) if False else tile.paste(im, (ox, oy), im)
        strip.paste(tile, (i * OUT, 0))
    strip.save(f'/home/claude/img/sym_{name}_win.webp', quality=88, method=6)
    print(name, len(frames), 'frames, scale', round(s, 3), 'static box', (sx0, sy0, sx1, sy1), 'f1 box', (fx0, fy0, fx1, fy1))
    return strip, len(frames)


if __name__ == '__main__':
    names = sys.argv[1:] or list(SPECS)
    sheets = []
    for n in names:
        strip, nf = process(n)
        # contact sheet over the reel cell colour, static symbol first
        st = Image.open(f'/home/claude/img/sym_{n}.webp').convert('RGBA').resize((OUT, OUT))
        cols = 7
        rows = (nf + 1 + cols - 1) // cols
        cs = Image.new('RGBA', (cols * OUT, rows * OUT), (32, 20, 70, 255))
        cs.alpha_composite(st, (0, 0))
        for i in range(nf):
            j = i + 1
            cs.alpha_composite(strip.crop((i * OUT, 0, (i + 1) * OUT, OUT)), ((j % cols) * OUT, (j // cols) * OUT))
        cs.convert('RGB').resize((cols * OUT // 2, rows * OUT // 2)).save(f'/home/claude/anim/contact_{n}.png')
