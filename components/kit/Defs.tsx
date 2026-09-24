import { C } from '@/lib/sim/palette';

/**
 * Shared SVG patterns, gradients and filters. Rendered once per viewport.
 * Reference them as fill="url(#p-stroma)" etc.
 */
export function Defs() {
  return (
    <defs>
      {/* Endometrial stroma: pale tissue with scattered spindle-shaped stromal cells. */}
      <pattern id="p-stroma" width="46" height="38" patternUnits="userSpaceOnUse">
        <rect width="46" height="38" fill={C.stroma} />
        <ellipse cx="8" cy="9" rx="4" ry="1.8" fill={C.stromaDeep} transform="rotate(25 8 9)" />
        <ellipse cx="30" cy="6" rx="3.6" ry="1.6" fill={C.stromaDeep} transform="rotate(-30 30 6)" />
        <ellipse cx="20" cy="24" rx="4" ry="1.7" fill={C.stromaDeep} transform="rotate(60 20 24)" />
        <ellipse cx="40" cy="30" rx="3.4" ry="1.6" fill={C.stromaDeep} transform="rotate(10 40 30)" />
        <ellipse cx="6" cy="32" rx="3" ry="1.5" fill={C.stromaDeep} transform="rotate(-50 6 32)" />
      </pattern>
      {/* Oedematous stroma (decidual reaction): cells become polyhedral and fluid separates them. */}
      <pattern id="p-decidua" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#f3cdd5" />
        <path d="M4 6l7-2 6 5-2 7-8 1-4-6z" fill="#e7aebd" />
        <path d="M24 3l8 1 4 7-4 6-8-1-3-7z" fill="#e7aebd" />
        <path d="M12 22l7-1 5 6-3 7-7 1-4-6z" fill="#e7aebd" />
        <path d="M30 24l7 1 2 7-5 5-6-3-1-6z" fill="#e7aebd" />
        <circle cx="10" cy="10" r="1.5" fill="#b86b82" />
        <circle cx="29" cy="10" r="1.5" fill="#b86b82" />
        <circle cx="17" cy="28" r="1.5" fill="#b86b82" />
        <circle cx="34" cy="31" r="1.5" fill="#b86b82" />
      </pattern>
      {/* Syncytiotrophoblast: multinucleated mass, nuclei but no cell borders. */}
      <pattern id="p-syncytio" width="22" height="20" patternUnits="userSpaceOnUse">
        <rect width="22" height="20" fill={C.syncytio} />
        <ellipse cx="5" cy="5" rx="2.2" ry="1.7" fill={C.syncytioDeep} />
        <ellipse cx="16" cy="9" rx="2.2" ry="1.7" fill={C.syncytioDeep} />
        <ellipse cx="8" cy="15" rx="2.2" ry="1.7" fill={C.syncytioDeep} />
        <ellipse cx="19" cy="18" rx="1.8" ry="1.4" fill={C.syncytioDeep} />
      </pattern>
      {/* Extra-embryonic mesoderm: loose stellate mesenchyme. */}
      <pattern id="p-meso-extra" width="30" height="26" patternUnits="userSpaceOnUse">
        <rect width="30" height="26" fill="#f6b89e" fillOpacity="0.55" />
        <g stroke="#d9785a" strokeWidth="0.9" fill="#d9785a">
          <circle cx="7" cy="7" r="1.8" />
          <path d="M7 7l-5-3M7 7l4-5M7 7l5 3M7 7l-2 5" />
          <circle cx="22" cy="17" r="1.8" />
          <path d="M22 17l-5-2M22 17l3-5M22 17l5 2M22 17l-1 6" />
        </g>
      </pattern>
      {/* Intra-embryonic mesoderm: denser red mesenchyme. */}
      <pattern id="p-meso-intra" width="18" height="16" patternUnits="userSpaceOnUse">
        <rect width="18" height="16" fill={C.mesoIntra} />
        <g fill="#b62a33">
          <circle cx="4" cy="4" r="1.7" />
          <circle cx="13" cy="7" r="1.7" />
          <circle cx="7" cy="12" r="1.7" />
          <circle cx="16" cy="14" r="1.4" />
        </g>
      </pattern>
      {/* Maternal blood: plasma with red cells. */}
      <pattern id="p-blood" width="16" height="14" patternUnits="userSpaceOnUse">
        <rect width="16" height="14" fill={C.maternalBlood} />
        <ellipse cx="4" cy="4" rx="2.6" ry="1.9" fill="#a3122a" />
        <ellipse cx="12" cy="10" rx="2.6" ry="1.9" fill="#a3122a" />
      </pattern>
      {/* Smooth muscle of the myometrium. */}
      <pattern id="p-muscle" width="24" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="24" height="10" fill={C.myometrium} />
        <path d="M0 3h24M0 8h24" stroke="#a84b45" strokeWidth="1.3" />
        <ellipse cx="8" cy="3" rx="3" ry="0.9" fill="#7f3531" />
        <ellipse cx="19" cy="8" rx="3" ry="0.9" fill="#7f3531" />
      </pattern>
      {/* Fibrin plug. */}
      <pattern id="p-fibrin" width="12" height="12" patternUnits="userSpaceOnUse">
        <rect width="12" height="12" fill={C.fibrin} />
        <path d="M0 3l12 6M0 9l12-4M3 0l4 12" stroke="#c9c1ae" strokeWidth="0.8" />
      </pattern>
      {/* Cytoplasm speckle for large cells (oocyte, blastomeres). */}
      <pattern id="p-cyto-speckle" width="10" height="10" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="3" r="0.7" fill="rgba(150,70,80,0.35)" />
        <circle cx="7" cy="7" r="0.6" fill="rgba(150,70,80,0.3)" />
      </pattern>

      <radialGradient id="g-cell" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
        <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
      </radialGradient>
      <radialGradient id="g-cavity" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="g-shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
      </linearGradient>

      {/* Histology "slab": the specimen fades out at the edges so side gutters stay free for labels. */}
      <radialGradient id="g-slab-fade" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stopColor="#fff" />
        <stop offset="100%" stopColor="#000" />
      </radialGradient>
      <filter id="f-feather" x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <mask id="m-slab" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
        <rect x="205" y="18" width="590" height="604" rx="46" fill="#fff" filter="url(#f-feather)" />
      </mask>
      <mask id="m-slab-wide" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="640">
        <rect x="120" y="14" width="760" height="612" rx="46" fill="#fff" filter="url(#f-feather)" />
      </mask>

      <filter id="f-soft"x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="6" />
      </filter>
      <filter id="f-shadow" x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.45" />
      </filter>
    </defs>
  );
}
