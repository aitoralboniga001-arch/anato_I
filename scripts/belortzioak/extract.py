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

def rect_dist(p, r):
    dx = max(r.x0 - p[0], 0, p[0] - r.x1)
    dy = max(r.y0 - p[1], 0, p[1] - r.y1)
    return math.hypot(dx, dy)

def is_black(c):
    return c is not None and max(c) < 0.15

def page_geometry(page):
    big = []
    for info in page.get_image_info(xrefs=True):
        r = fitz.Rect(info["bbox"])
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
        if not (is_black(fill) or (fill is None and is_black(stroke))): continue
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
        # the arrows also carry small raster shadows
        if fitz.Rect(info["bbox"]).get_area() / cp.rect.get_area() <= 0.03 and info["xref"]:
            cp.delete_image(info["xref"])
    cp.add_redact_annot(cp.rect, fill=False)
    cp.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE, graphics=fitz.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED, text=fitz.PDF_REDACT_TEXT_REMOVE)
    scale = MAX_SIDE / max(crop.width, crop.height)
    pix = cp.get_pixmap(matrix=fitz.Matrix(scale, scale), clip=crop)
    img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
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
    return Image.fromarray(arr), scale

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
        img, scale = clean_render(a.pdf, pg, crop)
        img.save(os.path.join(out_img, f"p{pg:02d}.webp"), quality=84, method=6)
        W, H = img.size
        fx = lambda p: [round((p[0] - crop.x0) / crop.width, 4), round((p[1] - crop.y0) / crop.height, 4)]
        moves = dict(REASSIGN.get(pg, []))
        items = {}
        for k, l in enumerate(labels):
            c = ((l["rect"].x0 + l["rect"].x1) / 2, (l["rect"].y0 + l["rect"].y1) / 2)
            e = items.setdefault(l["n"], {"n": l["n"], "label": fx(c), "targets": []})
        for ar in arrows:
            if ar["label"] < 0: continue
            n = labels[ar["label"]]["n"]
            if n in moves:
                items[moves[n]]["targets"].append(fx(ar["start"]))
            else:
                items[n]["targets"].append(fx(ar["target"]))
        for n, drops in DROP_TARGETS.get(pg, {}).items():
            items[n]["targets"] = [t for i, t in enumerate(items[n]["targets"]) if i not in drops]
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
