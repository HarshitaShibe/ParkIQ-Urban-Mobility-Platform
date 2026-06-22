import { Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Hotspots from './pages/Hotspots';
import Anomalies from './pages/Anomalies';
import Enforcement from './pages/Enforcement';
import Report from './pages/Report';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hotspots" element={<Hotspots />} />
          <Route path="/anomalies" element={<Anomalies />} />
          <Route path="/enforcement" element={<Enforcement />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </main>
    </div>
  );
}
