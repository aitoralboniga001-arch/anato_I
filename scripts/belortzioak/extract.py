"""Belortzioak: clean figures + arrow geometry from the course PDF ("Belortzioak zuzenduta.pdf").

The figures go to `public/belortzioak-irudiak/` (served as static files), and the geometry to
`content/belortzioak-geometry.json` — for every numbered label, where the number sat and the
point(s) its arrow touches, plus an outline of the structure under that point when the drawing
allows one to be traced.

usage: python -I scripts/belortzioak/extract.py <pdf> [--repo <repo root>] [--debug <dir>]
needs: PyMuPDF, Pillow, numpy, scipy, scikit-image
"""
import argparse, json, math, os, re, sys
import fitz
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi
from skimage import color, measure, filters

sys.stdout.reconfigure(encoding="utf-8")

PAGES = range(2, 24)  # skin anatomy … digestive system (inclusive)
MAX_SIDE = 1600

# Page-specific fixes, in PDF points (72/inch).
CROP = {7: (None, None, 380, None)}  # legend bullets sit inside the figure image on p.7
PAINT_OUT = {12: [(197, 468, 221, 492)]}  # a crossed-out answer box printed over the figure
# Label n's arrow really belongs to label m (the arrow joins two labels): use its far end.
REASSIGN = {21: [(2, 1)]}
DROP_TARGETS = {15: {3: [1]}}  # a plain bracket line between 2 and 3, not an arrow
# Arrows that end on the seam between two structures where carrying the tip on would pick the
# wrong one: their tip stays where it was printed.
KEEP_TIP = {12: {19}, 23: {3}}
# Corrections written by hand on the figures (the hand-written legend names live in
# content/belortzioak.ts). Points in PDF points, read off the page at 300–900 dpi:
#   add   — the number written again by hand elsewhere (x, y[, what was written])
#   set   — replace a number's targets;  label — move a number (its printed box crossed out)
#   new   — labels that exist only in handwriting; `id` keys them, `tag` is what was written
HAND = {
    4: {"set": {11: [(171.3, 324.8)]}},  # the ear canal: the middle of the dark slit, not its yellow rim
    6: {"new": [  # the heart, named by hand (no numbers)
        {"id": "a", "n": 101, "tag": "a", "label": (250.8, 188.8), "targets": [(240.0, 247.6)]},
        {"id": "b", "n": 102, "tag": "b", "label": (222.0, 274.0), "targets": [(250.8, 272.8)]},
        {"id": "c", "n": 103, "tag": "c", "label": (327.6, 275.2), "targets": [(271.2, 280.0)]},
        {"id": "d", "n": 104, "tag": "d", "label": (274.8, 366.4), "targets": [(241.2, 311.2)]},
    ]},
    9: {  # numbers written by hand on the heart section (the printed ones sit on the small heart)
        "add": {1: [(276.3, 309.7)], 2: [(308.7, 309.7)], 6: [(243.5, 269.2)], 7: [(287.6, 265.6)]},
        "label": {10: (269.6, 294.4)},  # box 10 crossed out in red, circled 10 written on the canal
        "set": {10: [(269.6, 294.4)]},
        "new": [{"id": "5", "n": 5, "tag": "5", "label": (231.8, 271.9)}],
    },
    11: {"add": {5: [(294.6, 452.8)]}},  # a circled 5 on the vein inside the embryo
    12: {
        "add": {1: [(161.0, 402.0, "1a")]},  # "1a" (the trunk) written on the vessel
        "set": {6: [(136.7, 359.7)]},  # the printed arrow stops in the gap short of the vessel
        "new": [
            {"id": "9.2", "n": 9.2, "tag": "9.2", "label": (64.6, 491.1), "targets": [(90.5, 446.5), (93.4, 482.5)]},
            # the heart, numbered in red (a list of its own under the figure)
            {"id": "r5", "n": 105, "tag": "5", "ink": "red", "label": (212.0, 429.3), "targets": [(157.4, 430.8)]},
            {"id": "r6", "n": 106, "tag": "6", "ink": "red", "label": (232.0, 428.0), "targets": [(157.4, 430.8)]},
            {"id": "r7", "n": 107, "tag": "7", "ink": "red", "label": (182.0, 438.0), "targets": [(151.4, 431.8), (156.0, 440.6)]},
            {"id": "r8", "n": 108, "tag": "8", "ink": "red", "label": (182.0, 453.0), "targets": [(165.0, 442.8)]},
            {"id": "r9", "n": 109, "tag": "9", "ink": "red", "label": (144.6, 449.6)},
            {"id": "r10a", "n": 110.1, "tag": "10a", "ink": "red", "label": (146.2, 412.4), "targets": [(140.2, 423.8), (148.2, 421.4)]},
            {"id": "r10b", "n": 110.2, "tag": "10b", "ink": "red", "label": (156.2, 462.4), "targets": [(157.4, 447.6), (167.4, 469.2)]},
        ],
    },
}

def rect_dist(p, r):
    dx = max(r.x0 - p[0], 0, p[0] - r.x1)
    dy = max(r.y0 - p[1], 0, p[1] - r.y1)
    return math.hypot(dx, dy)

def is_black(c):
    return c is not None and max(c) < 0.15

BLUE_PEN = {7}  # pages where the corrections drew extra arrows in blue (the colour is used elsewhere too)

def is_ink(c, pg):
    return is_black(c) or (pg in BLUE_PEN and c is not None and max(abs(a - b) for a, b in zip(c, (0.31, 0.506, 0.741))) < 0.03)

def is_overlay(r, page):
    """The hand-written corrections, saved as a transparent image over the whole page."""
    return (r & page.rect).get_area() / page.rect.get_area() > 0.9

def page_geometry(page):
    big = []
    for info in page.get_image_info(xrefs=True):
        r = fitz.Rect(info["bbox"])
        if is_overlay(r, page): continue
        if r.get_area() / page.rect.get_area() > 0.03:
            big.append(r & page.rect)
    area = fitz.Rect(big[0])
    for r in big[1:]: area |= r
    spans = []
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0: continue
        for l in b["lines"]:
            for s in l["spans"]:
                t = s["text"].strip()
                if t: spans.append((fitz.Rect(s["bbox"]), t, s["color"]))
    boxes, solid, strokes, heads = [], [], [], []
    for d in page.get_drawings():
        kinds = {it[0] for it in d["items"]}
        fill, stroke = d.get("fill"), d.get("color")
        if not (is_ink(fill, page.number + 1) or (fill is None and is_ink(stroke, page.number + 1))): continue
        r = fitz.Rect(d["rect"])
        if kinds == {"re"}:
            if r.width < 40 and r.height < 25: boxes.append(r)
            continue
        pts = []
        for it in d["items"]:
            if it[0] == "re":
                q = it[1]; pts += [(q.x0, q.y0), (q.x1, q.y1), (q.x0, q.y1), (q.x1, q.y0)]
            else:
                pts += [(p.x, p.y) for p in it[1:] if isinstance(p, fitz.Point)]
        if not pts: continue
        if fill is None:
            strokes.append(pts)
        elif len(d["items"]) <= 3:
            heads.append(pts)
        else:
            solid.append(pts)
    # a hand-drawn arrow = stroked polyline + separate filled head at one of its ends
    for h in heads:
        c = (sum(p[0] for p in h) / len(h), sum(p[1] for p in h) / len(h))
        best = min(((min(math.dist(c, s[0]), math.dist(c, s[-1])), i) for i, s in enumerate(strokes)), default=(1e9, -1))
        if best[0] < 10: strokes[best[1]] = strokes[best[1]] + h
    labels = []
    for r, t, c in spans:
        if not re.fullmatch(r"\d{1,2}", t): continue
        boxed = c != 0 or any(b.intersects(r) for b in boxes)
        # plain numbers also appear in the legend: only those over the figure count
        if not boxed and not (area + (-20, -20, 20, 20)).intersects(r): continue
        labels.append({"n": int(t), "rect": r, "boxed": boxed})
    arrows = []
    for pts in solid + strokes:
        best = (0, None, None)
        for i in range(len(pts)):
            for j in range(i + 1, len(pts)):
                dd = math.dist(pts[i], pts[j])
                if dd > best[0]: best = (dd, pts[i], pts[j])
        if best[0] < 10: continue
        p, q = best[1], best[2]
        dp = min(((rect_dist(p, l["rect"]), k) for k, l in enumerate(labels)), default=(1e9, -1))
        dq = min(((rect_dist(q, l["rect"]), k) for k, l in enumerate(labels)), default=(1e9, -1))
        # the end at the number is the label end; the other one touches the structure
        if dp[0] <= dq[0]: arrows.append({"label": dp[1], "target": q, "start": p})
        else: arrows.append({"label": dq[1], "target": p, "start": q})
    return area, labels, arrows

def clean_render(pdf, pg, crop):
    doc = fitz.open(pdf)
    cp = doc[pg - 1]
    for info in cp.get_image_info(xrefs=True):
        # the arrows also carry small raster shadows; the handwriting is drawn again by the app
        r = fitz.Rect(info["bbox"])
        if (r.get_area() / cp.rect.get_area() <= 0.03 or is_overlay(r, cp)) and info["xref"]:
            cp.delete_image(info["xref"])
    cp.add_redact_annot(cp.rect, fill=False)
    cp.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED, text=fitz.PDF_REDACT_TEXT_REMOVE)
    scale = MAX_SIDE / max(crop.width, crop.height)
    pix = cp.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=crop)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    origin = (pix.x, pix.y)  # the pixmap snaps the clip outwards to whole pixels
    doc.close()
    arr = np.asarray(img).copy()
    for (x0, y0, x1, y1) in PAINT_OUT.get(pg, []):
        a = [int((x0 - crop.x0) * scale), int((y0 - crop.y0) * scale), int((x1 - crop.x0) * scale), int((y1 - crop.y0) * scale)]
        # diffuse the surrounding pixels inwards so the patch carries on the background shading
        m = 3
        patch = arr[a[1] - m:a[3] + m, a[0] - m:a[2] + m].astype(float)
        hole = np.zeros(patch.shape[:2], bool); hole[m:-m, m:-m] = True
        patch[hole] = patch[~hole].mean(axis=0)
        for _ in range(400):
            avg = (np.roll(patch, 1, 0) + np.roll(patch, -1, 0) + np.roll(patch, 1, 1) + np.roll(patch, -1, 1)) / 4
            patch[hole] = avg[hole]
        arr[a[1] - m:a[3] + m, a[0] - m:a[2] + m] = patch.clip(0, 255).astype(np.uint8)
    return Image.fromarray(arr), scale, origin

# ---- arrow tips onto their structures -----------------------------------------------------------

def depth_map(img):
    """Per pixel: how far it lies from the nearest drawn outline or colour change (pixels), which
    patch between outlines it belongs to, whether it is bare paper, how deep inside a solid dark
    area it lies, and its (smoothed) colour."""
    rgb = np.asarray(img).astype(float) / 255
    lab = color.rgb2lab(filters.gaussian(rgb, sigma=1.5, channel_axis=2))
    g = np.sqrt(sum(filters.sobel(lab[..., c]) ** 2 for c in range(3)))
    edge = (g > 3.0) | (lab[..., 0] < 35)
    paper = (lab[..., 0] > 92) & (np.hypot(lab[..., 1], lab[..., 2]) < 6)
    dark = ndi.distance_transform_edt(lab[..., 0] < 35)
    return ndi.distance_transform_edt(~edge), ndi.label(~edge)[0], paper, dark, lab

def snap(fields, tip, u):
    """The printed arrows stop on a structure's edge, or a hair short of it: carry the tip on into
    the structure it points at (a little to either side allowed), to a point well inside it. A tip
    already inside a patch stays in that patch, a tip on a coloured structure (a thin vessel) stays on
    that colour, a tip inside a dark area stays put, and a tip on the drawing never moves onto bare paper."""
    depth, patch, paper, dark, lab = fields
    k = max(depth.shape) / 1600
    H, W = depth.shape
    ds, ls = np.arange(-8 * k, 18 * k), np.arange(-9 * k, 9 * k + 1)
    D, L = np.meshgrid(ds, ls)
    xs = tip[0] + u[0] * D - u[1] * L
    ys = tip[1] + u[1] * D + u[0] * L
    xi, yi = np.clip(np.rint(xs).astype(int), 0, W - 1), np.clip(np.rint(ys).astype(int), 0, H - 1)
    score = np.minimum(depth[yi, xi], 7 * k) - 0.25 * np.hypot(D, L)
    tx, ty = int(round(tip[0])), int(round(tip[1]))
    if dark[ty, tx] >= 3 * k: return tip
    # a tip on (or right at the outline of) a coloured structure means that structure, not the grey
    # tissue beside it, however much wider the grey is
    r = max(1, int(round(5 * k)))
    y0, x0 = max(0, ty - r), max(0, tx - r)
    near = lab[y0:ty + r + 1, x0:tx + r + 1]
    chroma = np.hypot(near[..., 1], near[..., 2])
    # the first coloured pixel straight ahead of the arrow names the structure; failing that, the
    # coloured pixel closest to the tip (two colours may be in reach)
    c = None
    for d in np.arange(0, 10 * k):
        for l in (0, -2 * k, 2 * k):
            x, y = int(round(tip[0] + u[0] * d - u[1] * l)), int(round(tip[1] + u[1] * d + u[0] * l))
            if 0 <= y < H and 0 <= x < W and math.hypot(*lab[y, x, 1:]) > 12:
                c = lab[y, x]
                break
        if c is not None: break
    if c is None and chroma.max() > 10:
        yy, xx = np.mgrid[y0:y0 + near.shape[0], x0:x0 + near.shape[1]]
        far = np.where(chroma > 10, np.hypot(yy - ty, xx - tx), np.inf)
        c = near[np.unravel_index(np.argmin(far), far.shape)]
    if c is not None:
        cand = lab[yi, xi]
        score[(np.linalg.norm(cand - c, axis=-1) > 15) | (np.hypot(cand[..., 1], cand[..., 2]) < 0.6 * math.hypot(c[1], c[2]))] = -1e9
    if depth[ty, tx] >= 2.5 * k: score[patch[yi, xi] != patch[ty, tx]] = -1e9
    if not paper[ty, tx]: score[paper[yi, xi]] = -1e9
    if score.max() < -1e8: return tip
    j = np.unravel_index(np.argmax(score), score.shape)
    return (float(xs[j]), float(ys[j]))

# ---- structure outlines -------------------------------------------------------------------------

def outline(lab, grad, pt, scale_px):
    """Region of similar colour around pt, bounded by the drawing's outlines; None when it leaks."""
    H, W = grad.shape
    x, y = int(round(pt[0] * W)), int(round(pt[1] * H))
    R = int(0.11 * max(W, H))
    win = 4
    ys, xs = np.mgrid[max(0, y - win):min(H, y + win + 1), max(0, x - win):min(W, x + win + 1)]
    k = np.argmin(grad[ys, xs])
    sy, sx = int(ys.flat[k]), int(xs.flat[k])
    y0, y1, x0, x1 = max(0, sy - R), min(H, sy + R), max(0, sx - R), min(W, sx + R)
    sub = lab[y0:y1, x0:x1]
    seed = lab[max(0, sy - 1):sy + 2, max(0, sx - 1):sx + 2].reshape(-1, 3).mean(axis=0)
    dist = np.linalg.norm(sub - seed, axis=2)
    yy, xx = np.mgrid[y0:y1, x0:x1]
    disk = (yy - sy) ** 2 + (xx - sx) ** 2 <= R * R
    best = None
    for tol in (7, 10, 13, 16):
        m = (dist < tol) & disk
        m = ndi.binary_opening(m, iterations=1)
        lab_m, _ = ndi.label(m)
        v = lab_m[sy - y0, sx - x0]
        if v == 0: continue
        reg = lab_m == v
        area = reg.sum()
        edge = ndi.binary_dilation(reg) & ~disk
        if area > 0.45 * disk.sum() or edge.sum() > 0: break  # leaked into the background
        best = reg
    if best is None or best.sum() < 40: return None
    best = ndi.binary_closing(best, iterations=2)
    best = ndi.binary_fill_holes(best)
    cs = measure.find_contours(np.pad(best, 1).astype(float), 0.5)
    if not cs: return None
    c = max(cs, key=len)
    c = measure.approximate_polygon(c, tolerance=1.2)
    if len(c) < 4: return None
    return [[round((p[1] - 1 + x0) / W, 4), round((p[0] - 1 + y0) / H, 4)] for p in c]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--repo", default=os.getcwd())
    ap.add_argument("--debug")
    a = ap.parse_args()
    out_img = os.path.join(a.repo, "public", "belortzioak-irudiak")
    os.makedirs(out_img, exist_ok=True)
    if a.debug: os.makedirs(a.debug, exist_ok=True)
    doc = fitz.open(a.pdf)
    plates = {}
    for pg in PAGES:
        page = doc[pg - 1]
        area, labels, arrows = page_geometry(page)
        crop = fitz.Rect(area)
        for l in labels: crop |= l["rect"]
        for ar in arrows: crop |= fitz.Rect(ar["target"], ar["target"])
        crop = (crop + (-6, -6, 6, 6)) & page.rect
        if pg in CROP:
            c = list(crop)
            for i, v in enumerate(CROP[pg]):
                if v is not None: c[i] = v
            crop = fitz.Rect(c)
        img, scale, (ox, oy) = clean_render(a.pdf, pg, crop)
        img.save(os.path.join(out_img, f"p{pg:02d}.webp"), quality=84, method=6)
        W, H = img.size
        px = lambda p: (p[0] * scale - ox, p[1] * scale - oy)
        frac = lambda q: [round(q[0] / W, 4), round(q[1] / H, 4)]
        fx = lambda p: frac(px(p))
        fields = depth_map(img)
        def tip(ar, far, near, n):
            t, s0 = px(ar[far]), px(ar[near])
            if n in KEEP_TIP.get(pg, ()): return frac(t)
            L = math.dist(t, s0)
            return frac(snap(fields, t, ((t[0] - s0[0]) / L, (t[1] - s0[1]) / L)))
        moves = dict(REASSIGN.get(pg, []))
        items = {}
        for k, l in enumerate(labels):
            c = ((l["rect"].x0 + l["rect"].x1) / 2, (l["rect"].y0 + l["rect"].y1) / 2)
            e = items.setdefault(l["n"], {"n": l["n"], "label": fx(c), "targets": []})
        for ar in arrows:
            if ar["label"] < 0: continue
            n = labels[ar["label"]]["n"]
            if n in moves:
                items[moves[n]]["targets"].append(tip(ar, "start", "target", moves[n]))
            else:
                items[n]["targets"].append(tip(ar, "target", "start", n))
        for n, drops in DROP_TARGETS.get(pg, {}).items():
            items[n]["targets"] = [t for i, t in enumerate(items[n]["targets"]) if i not in drops]
        h = HAND.get(pg, {})
        for n, pt in h.get("label", {}).items(): items[n]["label"] = fx(pt)
        # hand-written points were read off the page at high zoom, already on their structures
        for n, pts in h.get("set", {}).items(): items[n]["targets"] = [fx(p) for p in pts]
        # the number written again by hand: another place it names (a number printed on its
        # structure, with no arrow, keeps pointing there too); `marks` draw it there again
        for n, pts in h.get("add", {}).items():
            items[n]["targets"] = (items[n]["targets"] or [items[n]["label"]]) + [fx(p[:2]) for p in pts]
            items[n]["marks"] = [{"at": fx(p[:2]), **({"tag": p[2]} if len(p) > 2 else {})} for p in pts]
        for e in h.get("new", []):
            extra = {k: e[k] for k in ("tag", "ink") if k in e}
            if e["id"] != str(e["n"]) or "tag" not in e: extra["id"] = e["id"]
            items[e["id"]] = {"n": e["n"], **extra, "label": fx(e["label"]), "targets": [fx(p) for p in e.get("targets", [])]}
        # Spotlight size: traced outlines are too unreliable to draw (they leak along vessels and
        # shading), but their extent still tells a pit from a limb bud. Clamped, so a leak only
        # widens the light a little.
        small = img.copy(); small.thumbnail((800, 800))
        rgb = np.asarray(small).astype(float) / 255
        lab = color.rgb2lab(filters.gaussian(rgb, sigma=1, channel_axis=2))
        grad = filters.sobel(lab[..., 0])
        for e in items.values():
            # a number without an arrow sits on its structure (the box is gone from the clean figure)
            e["outlines"] = [outline(lab, grad, p, 1) for p in (e["targets"] or [e["label"]])]
            rs = []
            for o in e["outlines"]:
                if o:
                    xs, ys = [q[0] * W for q in o], [q[1] * H for q in o]
                    ext = max(max(xs) - min(xs), max(ys) - min(ys)) / max(W, H)
                    rs.append(round(min(0.09, max(0.035, ext * 0.6)), 3))
                else:
                    rs.append(0.05)
            e["r"] = rs
        plates[f"p{pg:02d}"] = {"page": pg, "size": [W, H], "items": [{k: v for k, v in e.items() if k != "outlines"} for e in sorted(items.values(), key=lambda e: e["n"])]}
        if a.debug:
            dbg = img.convert("RGBA"); ov = Image.new("RGBA", dbg.size); dr = ImageDraw.Draw(ov)
            for e in items.values():
                for o in e["outlines"]:
                    if o: dr.polygon([(p[0] * W, p[1] * H) for p in o], fill=(255, 0, 120, 90), outline=(255, 0, 120, 255))
                lx, ly = e["label"][0] * W, e["label"][1] * H
                for t in e["targets"]:
                    dr.line([lx, ly, t[0] * W, t[1] * H], fill=(0, 140, 255, 255), width=3)
                dr.rectangle([lx - 16, ly - 14, lx + 16, ly + 14], fill=(255, 255, 0, 255))
                dr.text((lx - 10, ly - 10), str(e["n"]), fill=(0, 0, 0, 255), font_size=22)
            Image.alpha_composite(dbg, ov).convert("RGB").resize((W // 2, H // 2)).save(os.path.join(a.debug, f"dbg{pg:02d}.png"))
        print(pg, (W, H), "items", len(items), "outlines", sum(1 for e in items.values() for o in e["outlines"] if o))
    geo = os.path.join(a.repo, "content", "belortzioak-geometry.json")
    with open(geo, "w", encoding="utf-8") as f:
        json.dump(plates, f, separators=(",", ":"))
    print("wrote", geo)

if __name__ == "__main__":
    main()
