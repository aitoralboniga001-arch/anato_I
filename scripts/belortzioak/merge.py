"""
Figures that are the same drawing (coloured or labelled for another system) are aligned onto one
base figure, so the merged view can show every name of every copy on one picture.

For each group: SIFT features + RANSAC give an affine transform from
each copy's pixels to the base's; it is stored as a 2×3 matrix on fractions of the figures
(x_base = a·x + b·y + c, y_base = d·x + e·y + f), so content/belortzioak.ts needs no image sizes.

  python -I scripts/belortzioak/merge.py   (from the repo root; needs opencv-python-headless)
Writes content/belortzioak-merge.json.
"""
import json, os, sys
import cv2
import numpy as np

sys.stdout.reconfigure(encoding="utf-8")
# Base first: the copy with the widest frame, so the others' points land inside it.
GROUPS = {
    "f-sagitala": ["p06", "p08", "p19"],
    "f-1": ["p07", "p18"],
    "f-2": ["p09", "p10", "p11", "p15", "p20"],
    "f-3": ["p12", "p13", "p14", "p16", "p21", "p22"],
    "f-birika": ["p23", "p17"],
}
SIDE = 1400


def feats(repo, pid, sift):
    im = cv2.imread(os.path.join(repo, "public", "belortzioak-irudiak", f"{pid}.webp"), cv2.IMREAD_GRAYSCALE)
    h, w = im.shape
    s = SIDE / max(h, w)
    kp, d = sift.detectAndCompute(cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), None)
    # keypoints back to fractions of the figure
    pts = np.float32([[k.pt[0] / s / w, k.pt[1] / s / h] for k in kp])
    return pts, d, (w, h)


def similarity(a, b):
    """Copy a → base b on pixels (a full affine: some copies were redrawn slightly skewed), then as fractions."""
    (pa, da, (wa, ha)), (pb, db, (wb, hb)) = a, b
    m = [x for x, y in cv2.BFMatcher().knnMatch(da, db, k=2) if x.distance < 0.75 * y.distance]
    src = np.float32([[pa[x.queryIdx][0] * wa, pa[x.queryIdx][1] * ha] for x in m])
    dst = np.float32([[pb[x.trainIdx][0] * wb, pb[x.trainIdx][1] * hb] for x in m])
    M, inl = cv2.estimateAffine2D(src, dst, ransacReprojThreshold=3, maxIters=20000, confidence=0.999)
    inl = inl.ravel().astype(bool)
    err = np.linalg.norm((src[inl] @ M[:, :2].T + M[:, 2]) - dst[inl], axis=1)
    # pixels → fractions: x_b/wb = (M00·wa·xa + M01·ha·ya + M02)/wb
    F = [[M[0, 0] * wa / wb, M[0, 1] * ha / wb, M[0, 2] / wb], [M[1, 0] * wa / hb, M[1, 1] * ha / hb, M[1, 2] / hb]]
    return [[round(v, 6) for v in r] for r in F], int(inl.sum()), float(np.median(err))


def main():
    repo = os.getcwd()
    sift = cv2.SIFT_create(8000)
    out = {}
    for gid, ids in GROUPS.items():
        f = {pid: feats(repo, pid, sift) for pid in ids}
        base = ids[0]
        members = {base: [[1, 0, 0], [0, 1, 0]]}
        for pid in ids[1:]:
            M, n, e = similarity(f[pid], f[base])
            print(gid, pid, "→", base, "inliers", n, "median px", round(e, 2))
            members[pid] = M
        out[gid] = {"base": base, "members": members}
    with open(os.path.join(repo, "content", "belortzioak-merge.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"))


main()
