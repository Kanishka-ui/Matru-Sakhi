"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";

interface PartnerDashboardContext {
    mother_name: string;
    baby: {
        current_week: number;
        days_remaining: number;
        size_comparison: string;
    };
    mother_status: {
        latest_mood: string;
        recent_symptoms: string[];
    };
    tips: string[];
}

export default function PartnerPortalPage() {
    const { user } = useAuthStore();
    const [dashboardData, setDashboardData] = useState<PartnerDashboardContext | null>(null);
    const [inviteLink, setInviteLink] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (user?.role === "partner") {
            fetchPartnerDashboard();
        }
    }, [user]);

    const fetchPartnerDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/partner/dashboard");
            setDashboardData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to load partner dashboard. Ensure your account is linked securely.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateLink = async () => {
        setLoading(true);
        setInviteLink("");
        setCopied(false);
        try {
            const res = await api.post("/api/partner/link/generate");
            setInviteLink(res.data.invite_url || "");
        } catch (err: any) {
            setError(err.response?.data?.detail || "Could not generate link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // ─── MOTHER VIEW: GENERATE INVITE ─────────────────────────────────────────
    if (user?.role === "mother") {
        return (
            <div className="pb-20">
                <div className="gradient-header mb-8">
                    <h1 className="page-title">Village of Support 🤝</h1>
                    <p className="page-subtitle">Invite your partner, husband, or caregiver to stay in the loop.</p>
                </div>

                <div className="glass-card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--accent)", marginBottom: "2rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Share Read-Only Context</h2>
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                        Generating a safe link will allow your partner to register. They will see simplified versions of your milestones, AI translations of your clinical reports, and receive gentle nudges if Sakhi notices you're exhausted!
                    </p>
                    
                    {!inviteLink ? (
                        <button 
                            className="btn-primary" 
                            onClick={handleGenerateLink} 
                            disabled={loading}
                            style={{ fontWeight: 600, width: "100%", padding: "1rem" }}
                        >
                            {loading ? "Generating secure token..." : "Generate Magic Link"}
                        </button>
                    ) : (
                        <div style={{ padding: "1rem", background: "rgba(124, 92, 252, 0.1)", borderRadius: "var(--radius-lg)", border: "1px solid var(--accent)" }}>
                            <p style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--accent-light)", marginBottom: "0.5rem" }}>Your Secure Invite Link:</p>
                            <input 
                                type="text" 
                                readOnly 
                                value={inviteLink} 
                                className="form-input"
                                style={{ width: "100%", padding: "0.8rem", marginBottom: "0.8rem", background: "var(--bg-tertiary)" }}
                            />
                            <button 
                                className="btn-primary"
                                onClick={copyToClipboard}
                                style={{ width: "100%", padding: "0.8rem", background: "var(--accent)", color: "#fff" }}
                            >
                                {copied ? "✓ Copied to Clipboard!" : "Copy Link"}
                            </button>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "center" }}>Send this link to your partner.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── PARTNER VIEW: READ-ONLY DASHBOARD ────────────────────────────────────
    return (
        <div className="pb-20">
            <div className="gradient-header mb-6" style={{ background: 'linear-gradient(135deg, #7c5cfc, #5B86E5)' }}>
                <h1 className="page-title">Partner Dashboard</h1>
                <p className="page-subtitle">Stay connected, gently. We translate the clinical data to help you support her.</p>
            </div>

            {loading && <div style={{ textAlign: "center", padding: "2rem", opacity: 0.7 }}>Loading context...</div>}

            {error && (
                <div style={{ background: "rgba(220,38,38,0.1)", color: "#ef4444", padding: "1rem", borderRadius: "var(--radius-lg)", border: "1px solid rgba(220,38,38,0.3)", marginBottom: "1.5rem" }}>
                    {error}
                </div>
            )}

            {dashboardData && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* The Joy Milestone */}
                    <div className="glass-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", boxShadow: "var(--shadow-md)" }}>
                        <span style={{ fontSize: "3rem", marginBottom: "0.8rem", animation: "bounce 3s infinite" }}>👶</span>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.2rem" }}>Week {dashboardData.baby.current_week}</h2>
                        <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                            Your baby is roughly the size of a <b style={{ color: "var(--text-primary)" }}>{dashboardData.baby.size_comparison}</b> today!
                        </p>
                        <div style={{ background: "rgba(134, 239, 172, 0.1)", color: "var(--mint)", padding: "0.5rem 1rem", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem" }}>
                            {dashboardData.baby.days_remaining} days until the due date!
                        </div>
                    </div>

                    {/* How She is Feeling */}
                    <div className="glass-card" style={{ padding: "1.5rem", borderLeft: `4px solid ${dashboardData.mother_status.latest_mood === 'tired' ? 'var(--primary)' : 'var(--mint)'}` }}>
                        <h3 style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.5rem" }}>How {dashboardData.mother_name} is doing</h3>
                        <p style={{ marginBottom: "0.5rem" }}>
                            <b>Mood:</b> <span style={{ textTransform: "capitalize", color: "var(--text-secondary)" }}>{dashboardData.mother_status.latest_mood}</span>
                        </p>
                        {dashboardData.mother_status.recent_symptoms.length > 0 && (
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                <b>Symptoms noted:</b> {dashboardData.mother_status.recent_symptoms.join(", ")}
                            </p>
                        )}
                    </div>

                    {/* Proactive Actionable Tips */}
                    <div>
                        <h3 style={{ fontWeight: "bold", fontSize: "1.1rem", marginBottom: "0.8rem", color: "var(--text-muted)", marginLeft: "0.5rem" }}>Sakhi's Actionable Tips</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                            {dashboardData.tips.map((tip, idx) => (
                                <div key={idx} className="glass" style={{ padding: "1rem", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "flex-start", gap: "0.8rem", background: "var(--bg-glass-hover)" }}>
                                    <span style={{ color: "var(--accent)", fontSize: "1.25rem", marginTop: "0.1rem" }}>💡</span>
                                    <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: 0 }}>{tip}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
