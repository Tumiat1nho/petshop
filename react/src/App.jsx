// react/src/App.jsx
import { Routes, Route } from "react-router-dom";
import Topbar from "./components/Topbar";
import Home from "./pages/Inicio";
import Caixa from "./pages/Caixa";
import Agenda from "./pages/Agenda";
import Consultor from "./pages/Consultor";

export default function App() {
  return (
    <>
      <Topbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/caixa" element={<Caixa />} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/consultor" element={<Consultor />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
