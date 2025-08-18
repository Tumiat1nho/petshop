// react/src/components/Icon.jsx
// Conjunto de ícones SVG simples (sem dependências externas).
// Use <Icon name="home" />, <Icon name="calendar" />, etc.

const S = { w: 22, h: 22, stroke: "currentColor", fill: "none", sw: 1.8, lc: "round", lj: "round" };

export default function Icon({ name, size = 22, className = "" }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", className };
  switch (name) {
    case "home":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 10v10h5v-6h4v6h5V10" />
        </svg>
      );
    case "cash":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M7 9h.01M17 15h.01" />
        </svg>
      );
    case "clients":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M16.2 14.2a4.8 4.8 0 0 1 4.3 4.8" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M8 3v3M16 3v3M3 10h18" />
        </svg>
      );
    case "queue":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M7 8h10M7 12h10M7 16h6" />
        </svg>
      );
    case "consult":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <circle cx="12" cy="7.5" r="3" />
          <path d="M4 20a8 8 0 0 1 16 0" />
          <path d="M9.5 13.5h5" />
        </svg>
      );
    case "delivery":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <path d="M3 7h10l4 4h4v6h-2" />
          <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
          <path d="M5 17h4M15 17h4" />
        </svg>
      );
    case "help":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.9.4-1.6 1.2-1.6 2.3" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "attend":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <circle cx="12" cy="7" r="3" />
          <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
          <rect x="3" y="10" width="3" height="6" rx="1" />
          <rect x="18" y="10" width="3" height="6" rx="1" />
        </svg>
      );
    case "gear":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.7-1l-.3-2.7H9.5l-.3 2.7a7 7 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0-.1 1c0 .3 0 .7.1 1l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.7 1l.3 2.7h4.2l.3-2.7a7 7 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z" />
        </svg>
      );
    case "filter":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <path d="M4 6h16M7 12h10M10 18h4" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common} stroke={S.stroke} fill="currentColor" strokeWidth={0}>
          <circle cx="12" cy="12" r="11" />
          <path d="M12 7v10M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "person":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <circle cx="12" cy="8" r="3" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "doc":
      return (
        <svg {...common} stroke={S.stroke} fill={S.fill} strokeWidth={S.sw} strokeLinecap={S.lc} strokeLinejoin={S.lj}>
          <rect x="5.5" y="3.5" width="12" height="17" rx="2" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h7" />
        </svg>
      );
    case "bulb":
      return (
        <svg {...common} stroke="#6aa84f" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 4a6 6 0 0 1 3.5 10.9L15 17h-6l-.5-2.1A6 6 0 0 1 12 4z" />
          <path d="M9 20h6" />
        </svg>
      );
    default:
      return null;
  }
}
