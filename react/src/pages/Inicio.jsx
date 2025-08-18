import React from "react";

/** Botão de ícone circular (usa qualquer emoji/SVG/ícone dentro) */
function IconBtn({ children, title, onClick }) {
  return (
    <button className="icon-btn" title={title} onClick={onClick} type="button">
      {children}
    </button>
  );
}

/** Card genérico: agora aceita className (para os spans) e style */
function Card({ title, actions, children, ghost = false, className = "", style }) {
  return (
    <section className={`card ${ghost ? "card--ghost" : ""} ${className}`} style={style}>
      {!ghost && (
        <header className="card__header">
          <h3 className="card__title">{title}</h3>
          <div className="card__actions">{actions}</div>
        </header>
      )}
      {!ghost && <div className="card__body">{children}</div>}
    </section>
  );
}

export default function Inicio() {
  return (
    <main className="dashboard">
      {/* Grade 12 col – controlamos o tamanho de cada card com c-span/r-span */}
      <div className="cards-grid">

        {/* AGENDA – mais largo e mais alto */}
        <Card
          className="c-span-4 r-span-2"
          title="Agenda"
          actions={
            <>
              <IconBtn title="Calendário">📅</IconBtn>
              <IconBtn title="Configurações">⚙️</IconBtn>
              <IconBtn title="Pesquisar">🔍</IconBtn>
              <IconBtn title="Novo">➕</IconBtn>
            </>
          }
        >
          <div style={{ marginBottom: 6, fontSize: 12, color: "#64748b" }}>
            agenda detalhada
          </div>
          <div>💡 Crie um agendamento clicando no botão <strong>(+)</strong></div>
        </Card>

        {/* FILA BANHO & TOSA – tamanho médio */}
        <Card
          className="c-span-4 r-span-1"
          title="Fila Banho & Tosa"
          actions={
            <>
              <IconBtn title="Atribuir atendente">👤</IconBtn>
              <IconBtn title="Adicionar à fila">➕</IconBtn>
            </>
          }
        >
          Nenhum pet na fila
        </Card>

        {/* COMANDAS EM ABERTO – largo e alto para lista de comandos */}
        <Card
          className="c-span-4 r-span-2"
          title="Comandas em Aberto"
          actions={<IconBtn title="Ver Comandas">🧾</IconBtn>}
        >
          Nenhuma movimentação
        </Card>

        {/* PLANOS DE BANHO – pequeno */}
        <Card className="c-span-4 r-span-1" title="Planos de Banho & Tosa">
          <a className="link" href="#">exibir</a>
        </Card>

        {/* Cards fantasma (opcional) para compor a grade simétrica */}
        <Card className="c-span-4 r-span-1" ghost />
        <Card className="c-span-4 r-span-1" ghost />

      </div>
    </main>
  );
}
