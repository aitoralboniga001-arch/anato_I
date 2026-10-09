// Dev-only probes for /dev/frames: run in the browser console (or via automation) after the frames render.
// __probe: visible drawing that no named part owns (hovering it would show nothing).
// __arrows: label leaders whose tip does not land on the structure they name.
(() => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const frames = () =>
    [...document.querySelectorAll('figure')].map((fig) => ({
      fig,
      svg: fig.querySelector('svg'),
      head: fig.closest('section').querySelector('h2').textContent.split('(')[0].trim(),
      tag: fig.querySelector('figcaption').textContent.split(' ')[0],
    }));
  // Pin one frame to the viewport so elementFromPoint can see all of it.
  const pinned = async (fig, fn) => {
    const old = fig.getAttribute('style');
    fig.style.cssText += ';position:fixed;left:0;top:0;width:1000px;z-index:99999';
    await sleep(5);
    try {
      return fn();
    } finally {
      fig.setAttribute('style', old || '');
    }
  };

  window.__probe = async (step = 12, minN = 2) => {
    const res = {};
    for (const { fig, svg, head, tag } of frames()) {
      await pinned(fig, () => {
        const ctm = svg.getScreenCTM();
        for (let x = step / 2; x < 1000; x += step)
          for (let y = step / 2; y < 640; y += step) {
            const p = new DOMPoint(x, y).matrixTransform(ctm);
            const el = document.elementFromPoint(p.x, p.y);
            if (!el || !svg.contains(el) || el === svg) continue;
            if (el.closest('[data-part]') || el.closest('text,[data-label],[class*="note"]')) continue;
            const cs = getComputedStyle(el);
            if (el.tagName === 'rect' && +el.getAttribute('width') >= 900) continue;
            if (/glow|vignette/.test(cs.fill)) continue;
            const sig = `${el.tagName} fill=${cs.fill.replace(/url\(".*#/, '#').replace(/"\)/, '')} st=${cs.stroke === 'none' ? '-' : cs.stroke}`;
            const k = head + ' || ' + sig;
            const r = (res[k] = res[k] || { n: 0, frames: new Set(), at: null });
            r.n++;
            r.frames.add(tag);
            if (!r.at) r.at = [x, y];
          }
      });
    }
    return Object.entries(res)
      .filter(([, v]) => v.n >= minN)
      .sort((a, b) => b[1].n - a[1].n)
      .map(([k, v]) => `${k} | n=${v.n} fr=${[...v.frames].slice(0, 5).join(',')} at=${v.at}`);
  };

  window.__arrows = async () => {
    const st = document.createElement('style');
    st.textContent = '[data-label]{pointer-events:none!important}';
    document.head.appendChild(st);
    const res = [];
    for (const { fig, svg, head, tag } of frames()) {
      await pinned(fig, () => {
        const ctm = svg.getScreenCTM();
        for (const dot of svg.querySelectorAll('[data-label] circle.label-dot')) {
          const g = dot.closest('[data-label]');
          if (+(g.getAttribute('opacity') ?? 1) < 0.3) continue;
          const id = g.getAttribute('data-label');
          const x = +dot.getAttribute('cx');
          const y = +dot.getAttribute('cy');
          const at = (dx, dy) => {
            const p = new DOMPoint(x + dx, y + dy).matrixTransform(ctm);
            const el = document.elementFromPoint(p.x, p.y);
            const pt = el && svg.contains(el) ? el.closest('[data-part]') : null;
            return pt ? { id: pt.getAttribute('data-part'), gr: (pt.getAttribute('data-groups') || '').split(' ') } : null;
          };
          const parts = (window.__partsOf && window.__partsOf(id)) || [];
          const ok = (h) => h && (h.id === id || h.gr.includes(id) || parts.includes(h.id));
          const c = at(0, 0);
          if (ok(c)) continue;
          let near = false;
          for (const [dx, dy] of [[4, 0], [-4, 0], [0, 4], [0, -4], [7, 0], [-7, 0], [0, 7], [0, -7]])
            if (ok(at(dx, dy))) {
              near = true;
              break;
            }
          // Nearest point that is solidly inside the named structure (its neighbours 3 px away are too).
          let fix = null;
          for (let r = 2; r <= 90 && !fix; r += 2)
            for (let a = 0; a < 360; a += Math.max(6, 360 / (r * 1.5))) {
              const dx = Math.round(r * Math.cos((a * Math.PI) / 180));
              const dy = Math.round(r * Math.sin((a * Math.PI) / 180));
              if (ok(at(dx, dy)) && ok(at(dx + 3, dy)) && ok(at(dx - 3, dy)) && ok(at(dx, dy + 3)) && ok(at(dx, dy - 3))) {
                fix = [dx, dy];
                break;
              }
            }
          res.push(`${head} | ${id} → ${c ? c.id : '(nada)'}${near ? ' [cerca]' : ''} @${Math.round(x)},${Math.round(y)} fix=${fix ? fix.join(',') : 'NONE'} #${tag}`);
        }
      });
    }
    st.remove();
    // One line per distinct miss, with the steps it shows in.
    const by = new Map();
    for (const r of res) {
      const [k, tag] = r.split(' #');
      by.set(k, [...(by.get(k) || []), tag]);
    }
    return [...by].map(([k, tags]) => `${k} (${tags.join(',')})`);
  };
})();
