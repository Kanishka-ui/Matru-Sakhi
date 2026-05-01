"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useWellnessStore } from "@/stores/wellnessStore";
import { DailyCheckInChat } from "@/components/features/DailyCheckInChat";
import { WellnessCard } from "@/components/features/WellnessCard";
import api from "@/lib/api";

interface HealthSummary {
    current_week: number | null;
    current_day: number | null;
    pregnancy_display: string | null;
    trimester: string | null;
    days_remaining: number | string | null;
    latest_vitals: Record<string, any> | null;
    latest_mood: string | null;
    kick_count_today: number;
    upcoming_milestones: any[];
    recent_symptoms: string[];
    latest_ai_risk: { level: string; confidence: number; advice: string } | null;
    total_records: number;
}

export default function DashboardPage() {
    const { user, updateProfile, fetchUser } = useAuthStore();
    const { hasCompletedDailyCheckIn } = useWellnessStore();
    const [summary, setSummary] = useState<HealthSummary | null>(null);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showContactModal, setShowContactModal] = useState(false);
    const [savingContact, setSavingContact] = useState(false);
    const [contactForm, setContactForm] = useState({ name: "", phone: "", relation: "" });

    const handleAddContact = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contactForm.name || !contactForm.phone || !contactForm.relation) {
            alert("Please fill all fields");
            return;
        }
        setSavingContact(true);
        try {
            const currentContacts = user?.profile?.emergency_contacts || [];
            await updateProfile({
                emergency_contacts: [...currentContacts, contactForm]
            });
            await fetchUser();
            setShowContactModal(false);
            setContactForm({ name: "", phone: "", relation: "" });
        } catch (error) {
            alert("Failed to add contact.");
        } finally {
            setSavingContact(false);
        }
    };

    const handleRemoveContact = async (index: number) => {
        if (!confirm("Remove this emergency contact?")) return;
        try {
            const currentContacts = user?.profile?.emergency_contacts || [];
            const newContacts = currentContacts.filter((_, i) => i !== index);
            await updateProfile({ emergency_contacts: newContacts });
            await fetchUser();
        } catch (error) {
            alert("Failed to remove contact.");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, alertsRes] = await Promise.all([
                    api.get("/api/health/summary"),
                    api.get("/api/alerts/"),
                ]);
                setSummary(summaryRes.data);
                setAlerts(alertsRes.data.alerts?.slice(0, 3) || []);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Use computed fields from backend (dynamic) or user profile fallback
    const weekNumber = summary?.current_week ?? user?.profile?.pregnancy_week ?? 0;
    const dayNumber = summary?.current_day ?? user?.profile?.pregnancy_day ?? 0;
    const pregnancyDisplay = summary?.pregnancy_display ?? user?.profile?.pregnancy_display ?? null;
    const trimester = summary?.trimester ?? user?.profile?.trimester ?? (weekNumber <= 12 ? "1st" : weekNumber <= 27 ? "2nd" : "3rd");
    const daysLeft = summary?.days_remaining ?? user?.profile?.days_remaining ?? null;
    const progressPercent = weekNumber ? Math.min(100, Math.round(((weekNumber * 7 + dayNumber) / 280) * 100)) : 0;

    const moodEmoji: Record<string, string> = {
        happy: "😊", calm: "😌", anxious: "😰", sad: "😢",
        stressed: "😣", tired: "😴", energetic: "💪",
    };

    return (
        <>
            <DailyCheckInChat />
            <div className={`pb-20 transition-all duration-1000 ${hasCompletedDailyCheckIn ? 'blur-none opacity-100' : 'blur-sm opacity-50 pointer-events-none'}`}>
                {/* Header Section */}
                <div className="gradient-header" style={{ marginBottom: "2rem" }}>
                <h1 className="page-title">
                    Welcome back, {user?.full_name.split(" ")[0]}! 👋
                </h1>
                <p className="page-subtitle">
                    {pregnancyDisplay
                        ? `${pregnancyDisplay} pregnant • ${trimester} Trimester${daysLeft !== null ? ` • ${daysLeft} days to go` : ""}`
                        : "Your maternal health dashboard"}
                </p>
            </div>

            {/* Pregnancy Progress Bar */}
            {weekNumber > 0 && (
                <div className="glass-card animate-in" style={{ padding: "1.25rem 1.5rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            🤰 Pregnancy Progress
                        </span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--primary)" }}>
                            {progressPercent}% complete
                        </span>
                    </div>
                    <div style={{
                        height: "10px",
                        background: "var(--bg-glass)",
                        borderRadius: "5px",
                        overflow: "hidden",
                        border: "1px solid var(--border)",
                    }}>
                        <div style={{
                            height: "100%",
                            width: `${progressPercent}%`,
                            background: "linear-gradient(90deg, var(--primary), #c94b8a, #a855f7)",
                            borderRadius: "5px",
                            transition: "width 1s ease-in-out",
                        }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <span>Week 1</span>
                        <span>Week 13</span>
                        <span>Week 28</span>
                        <span>Week 40</span>
                    </div>
                </div>
            )}

            {/* Removed Geo SOS Slider */}

            {/* Quick Actions (Empty hook left here for future usage) */}

            {/* Critical Alerts */}
            {alerts.filter((a) => a.severity === "critical").map((alert) => (
                <div key={alert.id} className="alert-banner critical animate-in">
                    <span className="alert-banner-icon">🚨</span>
                    <div className="alert-banner-content">
                        <div className="alert-banner-title">{alert.title}</div>
                        <div className="alert-banner-message">{alert.message}</div>
                    </div>
                </div>
            ))}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <WellnessCard />
            </div>

            <div className="stats-grid animate-in animate-in-delay-1">
                <div className="stat-card">
                    <div className="stat-card-icon">🩺</div>
                    <div className="stat-card-value">{summary?.latest_vitals?.blood_pressure || "120/80"}</div>
                    <div className="stat-card-label">Last BP Reading</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon">🤰</div>
                    <div className="stat-card-value" style={{ fontSize: weekNumber ? "1.4rem" : undefined }}>
                        {weekNumber ? `W${weekNumber} · D${dayNumber}` : "—"}
                    </div>
                    <div className="stat-card-label">
                        {trimester ? `${trimester} Trimester` : "Pregnancy Week"}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon">📅</div>
                    <div className="stat-card-value" style={{ fontSize: typeof daysLeft === 'string' ? "1rem" : undefined }}>
                        {daysLeft !== null ? daysLeft : "—"}
                    </div>
                    <div className="stat-card-label">
                        {typeof daysLeft === 'string' ? "Delivery Status" : "Days Remaining"}
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon">👣</div>
                    <div className="stat-card-value">{summary?.kick_count_today ?? 0}</div>
                    <div className="stat-card-label">Approx. Kicks Today</div>
                </div>

                <div className="stat-card">
                    <div className="stat-card-icon">
                        {summary?.latest_mood
                            ? moodEmoji[summary.latest_mood] || "😊"
                            : "🫥"}
                    </div>
                    <div className="stat-card-value" style={{ fontSize: "1.2rem" }}>
                        {summary?.latest_mood
                            ? summary.latest_mood.charAt(0).toUpperCase() + summary.latest_mood.slice(1)
                            : "Not logged"}
                    </div>
                    <div className="stat-card-label">Current Mood</div>
                </div>
            </div>

            {/* Emergency Contacts Priority Card */}
            <div className="glass-card animate-in animate-in-delay-1" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid var(--danger)", background: "rgba(239, 68, 68, 0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700, color: "var(--danger)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        🚨 Emergency Contacts
                    </h3>
                    <button className="btn btn-primary" onClick={() => setShowContactModal(true)} style={{ fontSize: "0.8rem", padding: "6px 14px", background: "var(--danger)", border: "none" }}>
                        + Add Contact
                    </button>
                </div>
                
                {(!user?.profile?.emergency_contacts || user.profile.emergency_contacts.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "1rem" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                            No emergency contacts added yet. <strong style={{color: "var(--danger)"}}>Please add at least one contact.</strong>
                        </p>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
                        {user.profile.emergency_contacts.map((contact, index) => (
                            <div key={index} style={{ background: "var(--bg-primary)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{contact.name}</div>
                                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>{contact.relation} • {contact.phone}</div>
                                </div>
                                <button onClick={() => handleRemoveContact(index)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: "1.2rem", padding: "4px" }}>
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* AI Risk Assessment Card */}
            <div className="glass-card animate-in animate-in-delay-1" style={{ padding: "1.5rem", marginBottom: "1.5rem", borderLeft: `4px solid ${summary?.latest_ai_risk?.level === 'High' ? 'var(--danger)' : summary?.latest_ai_risk?.level === 'Moderate' ? '#eab308' : 'var(--primary)'}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                        🩺 AI Health Assessment
                    </h3>
                    {summary?.latest_ai_risk && (
                        <div style={{ 
                            fontSize: "0.8rem", 
                            fontWeight: 600, 
                            padding: "4px 10px", 
                            borderRadius: "1rem",
                            background: summary.latest_ai_risk.level === 'High' ? 'rgba(239, 68, 68, 0.1)' : summary.latest_ai_risk.level === 'Moderate' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(var(--primary-rgb), 0.1)',
                            color: summary.latest_ai_risk.level === 'High' ? 'var(--danger)' : summary.latest_ai_risk.level === 'Moderate' ? '#eab308' : 'var(--primary)'
                        }}>
                            {summary.latest_ai_risk.level} Risk ({(summary.latest_ai_risk.confidence * 100).toFixed(0)}%)
                        </div>
                    )}
                </div>
                
                {summary?.latest_ai_risk ? (
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: "0 0 0.5rem 0", lineHeight: 1.5 }}>
                            {summary.latest_ai_risk.advice}
                        </p>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            Based on your recent logged symptoms: {summary.recent_symptoms?.join(", ") || "None"}
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: "0.5rem 0" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", margin: 0 }}>
                            No recent symptoms logged for AI assessment. Log your daily symptoms to get personalized advice.
                        </p>
                    </div>
                )}
            </div>

            {/* Main Content Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                {/* Quick Actions */}
                <div className="glass-card animate-in animate-in-delay-2" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        ⚡ Quick Actions
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        {[
                            { href: "/chat", icon: "🤖", label: "Ask AI" },
                            { href: "/health", icon: "📝", label: "Log Vitals" },
                            { href: "/appointments", icon: "📅", label: "Appointments" },
                            { href: "/content", icon: "📚", label: "Resources" },
                        ].map((action) => (
                            <Link
                                key={action.href}
                                href={action.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "10px 14px",
                                    background: "var(--bg-glass)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-md)",
                                    textDecoration: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "0.88rem",
                                    fontWeight: 500,
                                    transition: "all 0.2s",
                                }}
                            >
                                <span style={{ fontSize: "1.2rem" }}>{action.icon}</span>
                                {action.label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Latest Vitals */}
                <div className="glass-card animate-in animate-in-delay-2" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        💓 Latest Vitals
                    </h3>
                    {summary?.latest_vitals ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                            {summary.latest_vitals.systolic_bp && (
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Blood Pressure</div>
                                    <div style={{ fontWeight: 600 }}>
                                        {summary.latest_vitals.systolic_bp}/{summary.latest_vitals.diastolic_bp} mmHg
                                    </div>
                                </div>
                            )}
                            {summary.latest_vitals.weight_kg && (
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Weight</div>
                                    <div style={{ fontWeight: 600 }}>{summary.latest_vitals.weight_kg} kg</div>
                                </div>
                            )}
                            {summary.latest_vitals.heart_rate && (
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Heart Rate</div>
                                    <div style={{ fontWeight: 600 }}>{summary.latest_vitals.heart_rate} bpm</div>
                                </div>
                            )}
                            {summary.latest_vitals.hemoglobin && (
                                <div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Hemoglobin</div>
                                    <div style={{ fontWeight: 600 }}>{summary.latest_vitals.hemoglobin} g/dL</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                            No vitals logged yet.{" "}
                            <Link href="/health" style={{ color: "var(--primary)" }}>
                                Log your first vitals →
                            </Link>
                        </p>
                    )}
                </div>

                {/* Upcoming Milestones */}
                <div className="glass-card animate-in animate-in-delay-3" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        🎯 Upcoming Milestones
                    </h3>
                    {summary?.upcoming_milestones && summary.upcoming_milestones.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {summary.upcoming_milestones.map((m: any) => (
                                <div key={m.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                    <span className="badge badge-info" style={{ flexShrink: 0 }}>Week {m.week}</span>
                                    <div>
                                        <div style={{ fontSize: "0.88rem", fontWeight: 500 }}>{m.title}</div>
                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{m.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                            <Link href="/health" style={{ color: "var(--primary)" }}>
                                View all milestones →
                            </Link>
                        </p>
                    )}
                </div>

                {/* Recent Alerts */}
                <div className="glass-card animate-in animate-in-delay-3" style={{ padding: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        🔔 Recent Notifications
                    </h3>
                    {alerts.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    style={{
                                        display: "flex",
                                        gap: "10px",
                                        alignItems: "center",
                                        padding: "8px 12px",
                                        background: "var(--bg-glass)",
                                        borderRadius: "var(--radius-sm)",
                                        fontSize: "0.85rem",
                                    }}
                                >
                                    <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {alert.title}
                                    </span>
                                </div>
                            ))}
                            <Link href="/alerts" style={{ color: "var(--primary)", fontSize: "0.82rem", textDecoration: "none" }}>
                                View all →
                            </Link>
                        </div>
                    ) : (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
                            No new notifications 🎉
                        </p>
                    )}
                </div>
            </div>

            {loading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                </div>
            )}

            {/* Emergency Contact Modal */}
            {showContactModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "400px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Add Emergency Contact</h2>
                            <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowContactModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddContact} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Full Name</label>
                                <input className="form-input" required value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} placeholder="e.g. Rahul Sharma" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Relationship</label>
                                <input className="form-input" required value={contactForm.relation} onChange={(e) => setContactForm({...contactForm, relation: e.target.value})} placeholder="e.g. Husband, Mother" />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Phone Number</label>
                                <input className="form-input" required type="tel" value={contactForm.phone} onChange={(e) => setContactForm({...contactForm, phone: e.target.value})} placeholder="+91 9876543210" />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }} disabled={savingContact}>
                                {savingContact ? "Saving..." : "Save Contact"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
