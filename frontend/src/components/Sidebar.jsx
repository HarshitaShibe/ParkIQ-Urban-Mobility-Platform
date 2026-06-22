import { NavLink } from 'react-router-dom';
import { AlertTriangle, LayoutDashboard, MapPin, Shield, Video } from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hotspots', label: 'Hotspots', icon: MapPin },
  { to: '/anomalies', label: 'Anomalies', icon: AlertTriangle },
  { to: '/enforcement', label: 'Enforcement', icon: Shield },
  { to: '/report', label: 'Report', icon: Video },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo"><span>🚦</span> ParkIQ</div>
      <nav className="nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="nav-link">
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="system-status"><span className="dot" /> ONLINE</div>
    </aside>
  );
}
