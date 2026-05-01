"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

const NAV_ITEMS = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/chat", icon: "🤖", label: "AI Chat" },
    { href: "/health", icon: "❤️", label: "Health" },
    { href: "/appointments", icon: "📅", label: "Appointments" },
    { href: "/reports", icon: "📄", label: "Reports" },
    { href: "/content", icon: "📚", label: "Resources" },
    { href: "/alerts", icon: "🔔", label: "Alerts" },
    { href: "/sos", icon: "🆘", label: "SOS" },
    { href: "/partner/dashboard", icon: "👥", label: "Partner Portal" },
    { href: "/profile", icon: "👤", label: "Profile" },
];

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, logout, fetchUser } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState("");

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login");
            return;
        }
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    if (!isAuthenticated || !user) {
        return (
            <div className="app-loading">
                <div className="spinner" style={{ width: 48, height: 48, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                <span style={{ color: "var(--text-muted)", marginTop: "1rem" }}>Loading MatruSakhi...</span>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    const handleResendVerification = async () => {
        setResending(true);
        setResendMsg("");
        try {
            const res = await api.post("/api/auth/resend-verification", { email: user.email });
            setResendMsg(res.data.message || "Verification email sent!");
        } catch {
            setResendMsg("Failed to send. Try again later.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="app-layout">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
                <div className="sidebar-header">
                    <div className="auth-logo" style={{ marginBottom: 0 }}>
                        <div className="auth-logo-icon">{"\ud83e\udd31"}</div>
                        <span className="auth-logo-text">MatruSakhi</span>
                    </div>
                    <button
                        className="sidebar-close-btn"
                        onClick={() => setSidebarOpen(false)}
                    >
                        {"\u2715"}
                    </button>
                </div>

                {/* Pregnancy Progress Badge */}
                {user?.profile?.pregnancy_display && (
                    <div style={{
                        margin: "0 0.75rem 0.25rem",
                        padding: "0.6rem 0.8rem",
                        background: "var(--bg-glass)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border)",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>🤰 Pregnancy</span>
                            <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--primary)" }}>
                                {user.profile.trimester} Tri
                            </span>
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                            {user.profile.pregnancy_display}
                        </div>
                        <div style={{
                            height: "4px",
                            background: "var(--bg-glass)",
                            borderRadius: "2px",
                            overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%",
                                width: `${Math.min(100, Math.round(((user.profile.pregnancy_week || 0) * 7 + (user.profile.pregnancy_day || 0)) / 280 * 100))}%`,
                                background: "linear-gradient(90deg, var(--primary), #a855f7)",
                                borderRadius: "2px",
                            }} />
                        </div>
                    </div>
                )}

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sidebar-nav-icon">{item.icon}</span>
                                <span className="sidebar-nav-label">{item.label}</span>
                                {isActive && <span className="sidebar-active-indicator" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <Dropdown
                        align="left"
                        trigger={
                            <div className="sidebar-user" style={{ cursor: "pointer" }}>
                                <div className="sidebar-user-avatar">
                                    {user.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="sidebar-user-info">
                                    <span className="sidebar-user-name">{user.full_name.split(" ")[0]}</span>
                                    <span className="sidebar-user-role">{user.role}</span>
                                </div>
                                <span style={{ marginLeft: "auto", fontSize: "0.7rem", color: "var(--text-muted)" }}>{"\u25B2"}</span>
                            </div>
                        }
                        items={[
                            { label: "My Profile", icon: "\ud83d\udc64", onClick: () => router.push("/profile") },
                            { label: "SOS Settings", icon: "\ud83c\udd98", onClick: () => router.push("/sos") },
                            { label: "Upload Report", icon: "\ud83d\udcc4", onClick: () => router.push("/reports") },
                            { label: "", icon: "", onClick: () => {}, divider: true },
                            { label: "Sign Out", icon: "\ud83d\udeaa", onClick: handleLogout, danger: true },
                        ]}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <div className="app-main">
                {/* Top Bar (mobile) */}
                <header className="top-bar">
                    <button
                        className="hamburger-btn"
                        onClick={() => setSidebarOpen(true)}
                    >
                        {"\u2630"}
                    </button>
                    <span className="top-bar-title">
                        {NAV_ITEMS.find((i) => i.href === pathname)?.label || "MatruSakhi"}
                    </span>
                    <div className="top-bar-right">
                        <Link href="/alerts" className="top-bar-icon-btn" title="Alerts">{"\ud83d\udd14"}</Link>
                        <Dropdown
                            align="right"
                            trigger={
                                <div className="top-bar-icon-btn" style={{ cursor: "pointer" }}>
                                    {"\u22ee"}
                                </div>
                            }
                            items={[
                                { label: "My Profile", icon: "\ud83d\udc64", onClick: () => router.push("/profile") },
                                { label: "Upload Report", icon: "\ud83d\udcc4", onClick: () => router.push("/reports") },
                                { label: "SOS Emergency", icon: "\ud83c\udd98", onClick: () => router.push("/sos") },
                                { label: "", icon: "", onClick: () => {}, divider: true },
                                { label: "Sign Out", icon: "\ud83d\udeaa", onClick: handleLogout, danger: true },
                            ]}
                        />
                    </div>
                </header>

                {/* Email Verification Banner */}
                {!user.is_verified && (
                    <div
                        className="verification-banner"
                        style={{
                            background: "linear-gradient(135deg, rgba(232,93,117,0.15), rgba(201,75,138,0.1))",
                            border: "1px solid rgba(232,93,117,0.3)",
                            borderRadius: "12px",
                            padding: "14px 20px",
                            margin: "16px 24px 0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "10px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "1.3rem" }}>{"\u2709\ufe0f"}</span>
                            <div>
                                <span style={{ color: "var(--primary-light)", fontWeight: 600, fontSize: "0.9rem" }}>
                                    Verify your email
                                </span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginLeft: "8px" }}>
                                    Check your inbox for a verification link to activate all features.
                                </span>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {resendMsg && (
                                <span style={{ fontSize: "0.78rem", color: "var(--success)" }}>{resendMsg}</span>
                            )}
                            <button
                                onClick={handleResendVerification}
                                disabled={resending}
                                className="btn btn-primary"
                                style={{ fontSize: "0.78rem", padding: "6px 14px" }}
                            >
                                {resending ? "Sending..." : "Resend Email"}
                            </button>
                        </div>
                    </div>
                )}

                <main className="app-content">{children}</main>

                {/* Floating SOS Button */}
                {pathname !== "/sos" && (
                    <Link
                        href="/sos"
                        style={{
                            position: "fixed",
                            bottom: "24px",
                            right: "24px",
                            width: "60px",
                            height: "60px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #ef4444, #dc2626)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            textDecoration: "none",
                            boxShadow: "0 4px 20px rgba(239,68,68,0.5)",
                            zIndex: 1000,
                            animation: "sosPulse 2s ease-in-out infinite",
                            letterSpacing: "0.5px",
                        }}
                        title="SOS Emergency Alert"
                    >
                        SOS
                    </Link>
                )}
            </div>
        </div>
    );
}

/* SOS button animation injected via global style */
const sosStyle = typeof document !== "undefined" ? (() => {
    const style = document.createElement("style");
    style.textContent = `
        @keyframes sosPulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,0.5); transform: scale(1); }
            50% { box-shadow: 0 4px 30px rgba(239,68,68,0.8); transform: scale(1.05); }
        }
    `;
    if (!document.getElementById("sos-pulse-style")) {
        style.id = "sos-pulse-style";
        document.head.appendChild(style);
    }
    return null;
})() : null;

