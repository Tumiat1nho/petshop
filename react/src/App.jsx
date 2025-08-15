import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Clientes from "./Clientes";

function App() {
  return (
    <Router>
      <nav style={{ padding: "10px", background: "#eee" }}>
        <Link to="/clientes">Clientes</Link>
      </nav>
      <Routes>
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/" element={<h1>Bem-vindo ao sistema</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
