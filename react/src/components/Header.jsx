import { NavLink } from "react-router-dom";
import "./header.css";

export default function Header() {
  return (
    <>
      <header className="topnav">
        <nav className="topnav__inner">
          <NavLink to="/" end className="topnav__item">
            <span className="topnav__icon" aria-hidden>🏠</span>
            <span className="topnav__label">Início</span>
          </NavLink>

          <NavLink to="/caixa" className="topnav__item">
            <span className="topnav__icon" aria-hidden>💳</span>
            <span className="topnav__label">Caixa</span>
          </NavLink>

          <NavLink to="/clientes" className="topnav__item">
            <span className="topnav__icon" aria-hidden>👥</span>
            <span className="topnav__label">Clientes</span>
          </NavLink>

          <NavLink to="/agenda" className="topnav__item">
            <span className="topnav__icon" aria-hidden>📅</span>
            <span className="topnav__label">Agenda</span>
          </NavLink>
        </nav>
      </header>

      {/* Espaço do header fixo para não sobrepor o conteúdo */}
      <div className="topnav__spacer" />
    </>
  );
}
