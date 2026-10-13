import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GamePage } from './pages/GamePage';
import { AdminPage } from './pages/AdminPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* 1. Main Game Route */}
        <Route path="/" element={<GamePage />} />

        {/* 2. Admin Portal Route */}
        <Route path="/admin" element={<AdminPage />} />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
