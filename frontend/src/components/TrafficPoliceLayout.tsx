import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Crosshair,
  FileClock,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Menu,
  Shield,
  Siren,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard },
  { label: "Alerts", to: "/alerts", icon: Siren },
  { label: "Tracking", to: "/tracking", icon: MapPinned },
  { label: "Junctions", to: "/junctions", icon: Crosshair },
  { label: "History", to: "/history", icon: FileClock },
  { label: "Notifications", to: "/notifications", icon: Bell },
  { label: "Profile", to: "/profile", icon: CircleUserRound },
];

type Props = {
  children: React.ReactNode;
  profileName?: string;
  station?: string;
};

export function TrafficPoliceLayout({ children, profileName = "Constable Raju Kumar", station = "Central Police Station" }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-shield"><Shield size={22} fill="currentColor" /></div>
          <div>
            <strong>SERTOS</strong>
            <span>Traffic Operations</span>
          </div>
          <button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              <Icon size={16} strokeWidth={2.2} />
              <span>{label}</span>
              {label === "Alerts" && <span className="nav-count">1</span>}
            </NavLink>
          ))}
        </nav>
        <NavLink to="/login" className="nav-item logout"><LogOut size={16} /><span>Logout</span></NavLink>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="topbar-context">
            <span className="eyebrow">Traffic Police Officer</span>
            <strong>Emergency Response Coordination</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-pill"><span className="live-dot" /> Online</span>
            <div className="topbar-officer">
              <div className="avatar avatar-small">RK</div>
              <div><strong>{profileName}</strong><span>{station}</span></div>
            </div>
          </div>
        </header>
        <div className="content-area">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-title"><h2>{title}</h2>{action}</div>;
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="empty-state"><Clock3 size={22} /><strong>{title}</strong><span>{message}</span></div>;
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function StatusBadge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "blue" | "red" | "amber" | "gray" }) {
  return <span className={`status-badge ${tone}`}>{children}</span>;
}

export function ArrowLink({ children }: { children: React.ReactNode }) {
  return <span className="arrow-link">{children}<ChevronRight size={14} /></span>;
}
