// react/src/pages/Consultor.jsx
import { useEffect, useState } from "react";
import api from "../lib/api"; // agora temos export default
import "./consultor.css";

export default function Consultor() {
  const [loading, setLoading] = useState(true);
  const [aniversarios, setAniversarios] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await api("/consultor/aniversarios");
        if (alive) setAniversarios(data);
      } catch (e) {
        console.error("Erro ao carregar aniversários:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="page container">
      <h1 className="page__title">Consultor</h1>

      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Aniversários de Pets (próximos 30 dias)</h2>
        </div>

        {loading && <div className="card__body">Carregando...</div>}

        {!loading && aniversarios.length === 0 && (
          <div className="card__body muted">Nenhum aniversário no período.</div>
        )}

        {!loading && aniversarios.length > 0 && (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Pet</th>
                  <th>Tutor</th>
                  <th>Nascimento</th>
                  <th>Próximo Aniversário</th>
                  <th>Em</th>
                </tr>
              </thead>
              <tbody>
                {aniversarios.map((row) => (
                  <tr key={row.id}>
                    <td>{row.pet_nome}</td>
                    <td>{row.cliente_nome}</td>
                    <td>{row.nascimento ? new Date(row.nascimento).toLocaleDateString() : "-"}</td>
                    <td>{new Date(row.proximo_aniversario).toLocaleDateString()}</td>
                    <td>{row.dias} dia(s)</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
