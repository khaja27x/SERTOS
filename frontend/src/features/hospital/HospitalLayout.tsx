
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    HeartPulse,
    LayoutDashboard,
    Bell,
    BedDouble,
    Ambulance,
    History,
    ChartColumnIncreasing,
    Building2,
    Settings,
    LogOut,
    Menu,
    X,
    Search,
    ChevronDown,
    CircleUserRound,
} from "lucide-react";

import "./hospital.css";

interface HospitalLayoutProps {
    children: React.ReactNode;
}

const navigation = [
    {
        name: "Hospital Dashboard",
        path: "/hospital",
        icon: LayoutDashboard,
    },
    {
        name: "Emergency Alerts",
        path: "/hospital/alerts",
        icon: Bell,
    },
    {
        name: "Bed Management",
        path: "/hospital/beds",
        icon: BedDouble,
    },
    {
        name: "Ambulance Tracking",
        path: "/hospital/tracking",
        icon: Ambulance,
    },
    {
        name: "Emergency History",
        path: "/hospital/history",
        icon: History,
    },
    {
        name: "Reports",
        path: "/hospital/reports",
        icon: ChartColumnIncreasing,
    },
    {
        name: "Hospital Profile",
        path: "/hospital/profile",
        icon: Building2,
    },

    {
        name: "Settings",
        path: "/hospital/settings",
        icon: Settings,
    },
];

export default function HospitalLayout({
    children,
}: HospitalLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="hospital-app">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <button
                    className="hospital-overlay"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`hospital-sidebar ${sidebarOpen ? "hospital-sidebar-open" : ""
                    }`}
            >
                <div className="hospital-brand">
                    <div className="hospital-brand-icon">
                        <HeartPulse size={32} />
                    </div>

                    <div>
                        <h1>SERTOS</h1>
                        <p>Smart Emergency Response</p>
                        <p>Through Optimal Selection</p>
                    </div>

                    <button
                        className="hospital-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close navigation"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="hospital-nav-section">
                    <p className="hospital-nav-label">HOSPITAL MANAGEMENT</p>

                    <nav className="hospital-navigation">
                        {navigation.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/hospital"}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `hospital-nav-link ${isActive ? "active" : ""
                                        }`
                                    }
                                >
                                    <Icon size={20} strokeWidth={2} />
                                    <span>{item.name}</span>

                                    {item.name === "Emergency Alerts" && (
                                        <span className="hospital-alert-count">2</span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>
                </div>

                {/* Hospital information */}
                <div className="hospital-sidebar-bottom">
                    <div className="hospital-info-card">
                        <div className="hospital-info-image">
                            <Building2 size={38} />
                        </div>

                        <h3>City Care Hospital</h3>
                        <p>Hospital ID: HSP-001</p>

                        <span className="hospital-online">
                            <span />
                            Hospital Online
                        </span>
                    </div>

                    <button className="hospital-logout">
                        <LogOut size={19} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="hospital-main">

                {/* Top navigation */}
                <header className="hospital-topbar">

                    <button
                        className="hospital-menu-button"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Open navigation"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="hospital-search">
                        <Search size={19} />
                        <input
                            type="text"
                            placeholder="Search patients, ambulances, alerts..."
                        />
                    </div>

                    <div className="hospital-topbar-right">
                        <span className="hospital-status">
                            <span />
                            Hospital Online
                        </span>

                        <button className="hospital-notification-button">
                            <Bell size={21} />
                            <span>2</span>
                        </button>

                        <button className="hospital-user">
                            <div className="hospital-avatar">
                                <CircleUserRound size={22} />
                            </div>

                            <div className="hospital-user-details">
                                <strong>Hospital Administrator</strong>
                                <small>City Care Hospital</small>
                            </div>

                            <ChevronDown size={17} />
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <div className="hospital-content">
                    {children}
                </div>

            </main>
        </div>
    );
}
