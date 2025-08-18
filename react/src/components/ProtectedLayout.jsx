// react/src/components/ProtectedLayout.jsx
import Protected from '/src/components/Protected.jsx';
import ErrorBoundary from '/src/components/ErrorBoundary.jsx';
import Header from '/src/components/Header.jsx';
import { Outlet } from 'react-router-dom';

export default function ProtectedLayout() {
  return (
    <Protected>
      <ErrorBoundary>
        <Header />
        {/* Tudo que é protegido aparece aqui */}
        <div style={{padding: 0}}>
          <Outlet />
        </div>
      </ErrorBoundary>
    </Protected>
  );
}
