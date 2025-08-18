// react/src/components/Topbar.jsx
import { NavLink } from "react-router-dom";
import "./topbar.css";

const IconHome = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" stroke="currentColor" strokeWidth="1.6" fill="none"/>
  </svg>
);

const IconCash = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" fill="none"/>
  </svg>
);

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
);

const IconBot = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="8" width="16" height="10" rx="4" stroke="currentColor" strokeWidth="1.6"/>
    <circle cx="10" cy="13" r="1.2" fill="currentColor"/>
    <circle cx="14" cy="13" r="1.2" fill="currentColor"/>
    <path d="M12 5v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);

export default function Topbar() {
  return (
    <header className="topbar">
      <nav className="topbar__nav">
        <NavLink to="/" end className="topbar__link">
          <IconHome />
          <span>Início</span>
        </NavLink>

        <NavLink to="/caixa" className="topbar__link">
          <IconCash />
          <span>Caixa</span>
        </NavLink>

        <NavLink to="/agenda" className="topbar__link">
          <IconCalendar />
          <span>Agenda</span>
        </NavLink>

        <NavLink to="/consultor" className="topbar__link">
          <IconBot />
          <span>Consultor</span>
        </NavLink>
      </nav>
    </header>
  );
}
