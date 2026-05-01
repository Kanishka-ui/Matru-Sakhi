"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

// All symptoms in a unified list (categorization happens in backend)
const ALL_SYMPTOMS = [
    { id: "severe_headache", label: "severe headache", category: "danger" },
    { id: "blurred_vision", label: "blurred vision", category: "danger" },
    { id: "vaginal_bleeding", label: "vaginal bleeding", category: "danger" },
    { id: "high_fever", label: "high fever", category: "danger" },
    { id: "decreased_fetal_movement", label: "decreased fetal movement", category: "danger" },
    { id: "severe_abdominal_pain", label: "severe abdominal pain", category: "danger" },
    { id: "chest_pain", label: "chest pain", category: "danger" },
    { id: "difficulty_breathing", label: "difficulty breathing", category: "danger" },
    { id: "seizures", label: "seizures", category: "danger" },
    { id: "water_breaking", label: "water breaking", category: "danger" },
    { id: "swelling", label: "swelling in face/hands", category: "caution" },
    { id: "painful_urination", label: "painful urination", category: "caution" },
    { id: "persistent_vomiting", label: "persistent vomiting", category: "caution" },
    { id: "dizziness", label: "dizziness", category: "normal" },
    { id: "nausea", label: "nausea", category: "normal" },
    { id: "back_pain", label: "back pain", category: "normal" },
    { id: "swollen_feet", label: "swollen feet", category: "normal" },
    { id: "mild_headache", label: "mild headache", category: "normal" },
    { id: "fatigue", label: "fatigue", category: "normal" },
    { id: "heartburn", label: "heartburn", category: "normal" },
    { id: "constipation", label: "constipation", category: "normal" },
];

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [showDangerCheck, setShowDangerCheck] = useState(false);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [customSymptom, setCustomSymptom] = useState("");
    const [pregnancyWeek, setPregnancyWeek] = useState("");
    const [dangerResult, setDangerResult] = useState<any>(null);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            const res = await api.get("/api/alerts/?include_dismissed=false");
            setAlerts(res.data.alerts || []);
        } catch { /* ignore */ }
    };

    const markRead = async (ids: string[]) => {
        try {
            await api.post("/api/alerts/mark-read", { alert_ids: ids });
            loadAlerts();
        } catch { /* ignore */ }
    };

    const dismissAlert = async (id: string) => {
        try {
            await api.delete(`/api/alerts/${id}`);
            loadAlerts();
        } catch { /* ignore */ }
    };

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
        );
    };

    const handleAddCustom = () => {
        const trimmed = customSymptom.trim().toLowerCase();
        if (trimmed && !selectedSymptoms.includes(trimmed)) {
            setSelectedSymptoms((prev) => [...prev, trimmed]);
        }
        setCustomSymptom("");
    };

    const checkDangerSigns = async () => {
        if (selectedSymptoms.length === 0) return;
        setChecking(true);
        setDangerResult(null);
        try {
            const res = await api.post("/api/alerts/check-danger-signs", {
                symptoms: selectedSymptoms,
                pregnancy_week: pregnancyWeek ? parseInt(pregnancyWeek) : undefined,
            });
            setDangerResult(res.data);
            loadAlerts(); // Reload alerts in case new one was created
        } catch { /* ignore */ }
        finally { setChecking(false); }
    };

    const severityIcon: Record<string, string> = {
        critical: "🚨", high: "⚠️", medium: "⚡", low: "ℹ️", info: "💡",
    };

    const severityClass: Record<string, string> = {
        critical: "critical", high: "warning", medium: "warning", low: "info", info: "info",
    };

    const unreadCount = alerts.filter((a) => !a.is_read).length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Alerts & Notifications 🔔</h1>
                <p className="page-subtitle">
                    {unreadCount > 0
                        ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                        : "All caught up!"}
                </p>
            </div>

            {/* Filters & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowDangerCheck(!showDangerCheck)}
                    >
                        {showDangerCheck ? "Hide" : "🔍 Check"} Danger Signs
                    </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <Dropdown
                        trigger={
                            <button className="btn btn-secondary" style={{ fontSize: "0.82rem" }}>
                                {"📊"} Filter {"▾"}
                            </button>
                        }
                        items={[
                            { label: "All Alerts", icon: "📋", onClick: () => loadAlerts() },
                            { label: "", icon: "", onClick: () => {}, divider: true },
                            { label: "Critical Only", icon: "🚨", onClick: () => loadAlerts() },
                            { label: "Warnings Only", icon: "⚠️", onClick: () => loadAlerts() },
                            { label: "Info Only", icon: "💡", onClick: () => loadAlerts() },
                        ]}
                    />
                    {unreadCount > 0 && (
                        <button
                            className="btn btn-ghost"
                            style={{ fontSize: "0.82rem" }}
                            onClick={() => markRead(alerts.filter((a) => !a.is_read).map((a) => a.id))}
                        >
                            ✓ Mark all as read
                        </button>
                    )}
                </div>
            </div>

            {/* Danger Sign Checker */}
            {showDangerCheck && (
                <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        ⚠️ Symptom Danger Sign Checker
                    </h3>
                    <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                        Select any symptoms you are currently experiencing. We will check for potential danger signs.
                    </p>

                    {/* All Symptoms - Unified List */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        {ALL_SYMPTOMS.map((symptom) => (
                            <button
                                key={symptom.id}
                                onClick={() => toggleSymptom(symptom.label)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "var(--radius-full)",
                                    border: selectedSymptoms.includes(symptom.label) ? "2px solid var(--primary)" : "1px solid var(--border)",
                                    background: selectedSymptoms.includes(symptom.label) ? "rgba(232,93,117,0.15)" : "var(--bg-glass)",
                                    color: selectedSymptoms.includes(symptom.label) ? "var(--primary-light)" : "var(--text-secondary)",
                                    cursor: "pointer",
                                    fontSize: "0.82rem",
                                    transition: "all 0.2s",
                                }}
                            >
                                {selectedSymptoms.includes(symptom.label) ? "✓ " : ""}{symptom.label}
                            </button>
                        ))}
                        {/* Custom user-added symptoms */}
                        {selectedSymptoms.filter(s => !ALL_SYMPTOMS.some(cat => cat.label === s)).map((symptom) => (
                            <button
                                key={symptom}
                                onClick={() => toggleSymptom(symptom)}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "var(--radius-full)",
                                    border: "2px solid var(--primary)",
                                    background: "rgba(232,93,117,0.15)",
                                    color: "var(--primary-light)",
                                    cursor: "pointer",
                                    fontSize: "0.82rem",
                                    transition: "all 0.2s",
                                }}
                            >
                                ✓ {symptom}
                            </button>
                        ))}
                    </div>
                    
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", maxWidth: "400px" }}>
                        <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Type a specific symptom..."
                            value={customSymptom}
                            onChange={(e) => setCustomSymptom(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                        />
                        <button className="btn btn-secondary" onClick={handleAddCustom}>
                            + Add
                        </button>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "1rem" }}>
                        <div className="form-group" style={{ width: "200px" }}>
                            <label className="form-label">Pregnancy Week (optional)</label>
                            <input
                                className="form-input"
                                type="number"
                                min="1"
                                max="42"
                                placeholder="e.g. 28"
                                value={pregnancyWeek}
                                onChange={(e) => setPregnancyWeek(e.target.value)}
                            />
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={checkDangerSigns}
                            disabled={checking || selectedSymptoms.length === 0}
                        >
                            {checking ? "Checking..." : "Check Symptoms"}
                        </button>
                    </div>

                    {/* Danger Check Result */}
                    {dangerResult && (
                        <div className={`alert-banner ${dangerResult.severity === "critical" ? "critical" : dangerResult.severity === "warning" ? "warning" : "success"}`}>
                            <span className="alert-banner-icon">
                                {dangerResult.severity === "critical" ? "🚨" : dangerResult.severity === "warning" ? "⚠️" : "✅"}
                            </span>
                            <div className="alert-banner-content">
                                <div className="alert-banner-title">
                                    {dangerResult.severity === "critical" 
                                        ? "Danger Signs Detected - Seek Immediate Care!" 
                                        : dangerResult.severity === "warning"
                                        ? "Caution Signs - Consult Doctor Soon"
                                        : "No Danger Signs Detected"}
                                </div>
                                <div className="alert-banner-message">{dangerResult.message}</div>
                                
                                {dangerResult.recommendations?.length > 0 && (
                                    <div style={{ marginTop: "0.75rem" }}>
                                        <strong style={{ fontSize: "0.82rem" }}>Recommendations:</strong>
                                        <ul style={{ paddingLeft: "1.25rem", marginTop: "0.25rem", fontSize: "0.82rem" }}>
                                            {dangerResult.recommendations.map((rec: string, i: number) => (
                                                <li key={i} style={{ marginBottom: "2px" }}>{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {dangerResult.seek_immediate_care && (
                                    <div style={{ marginTop: "0.75rem", fontWeight: 700, fontSize: "0.9rem", color: "#ef4444" }}>
                                        🏥 Please seek immediate medical attention!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Alerts List */}
            {unreadCount > 0 && (
                <div style={{ marginBottom: "1rem", textAlign: "right" }}>
                    <button
                        className="btn btn-ghost"
                        style={{ fontSize: "0.82rem" }}
                        onClick={() => markRead(alerts.filter((a) => !a.is_read).map((a) => a.id))}
                    >
                        ✓ Mark all as read
                    </button>
                </div>
            )}

            {alerts.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔔</div>
                    <div className="empty-state-title">No notifications</div>
                    <div className="empty-state-text">
                        You&apos;re all caught up! Use the danger sign checker above to assess any symptoms.
                    </div>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`alert-banner ${severityClass[alert.severity] || "info"}`}
                            style={{
                                opacity: alert.is_read ? 0.7 : 1,
                                border: !alert.is_read ? "2px solid" : undefined,
                            }}
                        >
                            <span className="alert-banner-icon">
                                {severityIcon[alert.severity] || "ℹ️"}
                            </span>
                            <div className="alert-banner-content">
                                <div className="alert-banner-title">{alert.title}</div>
                                <div className="alert-banner-message">{alert.message}</div>
                                {alert.action_required && (
                                    <div style={{ marginTop: "0.5rem", fontWeight: 600, fontSize: "0.78rem" }}>
                                        Action: {alert.action_required}
                                    </div>
                                )}
                                <div style={{ marginTop: "0.25rem", fontSize: "0.72rem", opacity: 0.6 }}>
                                    {new Date(alert.created_at).toLocaleString()}
                                </div>
                            </div>
                            <Dropdown
                                trigger={
                                    <button style={{
                                        background: "none", border: "none", color: "var(--text-muted)",
                                        cursor: "pointer", fontSize: "1rem", padding: "4px 8px",
                                    }}>
                                        {"\u22ee"}
                                    </button>
                                }
                                items={[
                                    ...(!alert.is_read ? [{ label: "Mark as Read", icon: "\u2705", onClick: () => markRead([alert.id]) }] : []),
                                    { label: "Dismiss", icon: "\u274c", onClick: () => dismissAlert(alert.id), danger: true },
                                ]}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
