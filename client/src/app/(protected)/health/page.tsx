"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

const RECORD_TYPES = [
    { value: "vitals", label: "🩺 Vitals", icon: "🩺" },
    { value: "symptom", label: "🤒 Symptoms", icon: "🤒" },
    { value: "mood", label: "😊 Mood", icon: "😊" },
    { value: "kick_count", label: "👣 Approx. Kick Count", icon: "👣" },
    { value: "diet", label: "🥗 Diet", icon: "🥗" },
    { value: "medication", label: "💊 Medication", icon: "💊" },
];

const MOODS = [
    { value: "happy", emoji: "😊" },
    { value: "calm", emoji: "😌" },
    { value: "energetic", emoji: "💪" },
    { value: "tired", emoji: "😴" },
    { value: "anxious", emoji: "😰" },
    { value: "stressed", emoji: "😣" },
    { value: "sad", emoji: "😢" },
];

export default function HealthPage() {
    const [activeTab, setActiveTab] = useState("log");
    const [recordType, setRecordType] = useState("vitals");
    const [records, setRecords] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Form states
    const [vitals, setVitals] = useState({ systolic_bp: "", diastolic_bp: "", weight_kg: "", heart_rate: "", hemoglobin: "", blood_sugar: "", temperature_c: "" });
    const [symptoms, setSymptoms] = useState({ symptoms: "", severity: "mild", duration: "" });
    const [mood, setMood] = useState({ mood: "calm", energy_level: "5", sleep_hours: "", notes: "" });
    const [kickCount, setKickCount] = useState({ count: "", duration_minutes: "" });
    const [notes, setNotes] = useState("");

    useEffect(() => {
        loadRecords();
        loadMilestones();
    }, []);

    const loadRecords = async () => {
        try {
            const res = await api.get("/api/health/records?page_size=50");
            setRecords(res.data.records || []);
        } catch { /* ignore */ }
    };

    const loadMilestones = async () => {
        try {
            const res = await api.get("/api/health/milestones");
            setMilestones(res.data || []);
        } catch { /* ignore */ }
    };

    const submitRecord = async () => {
        setLoading(true);
        try {
            let data: any = {};

            if (recordType === "vitals") {
                data = {};
                if (vitals.systolic_bp) data.systolic_bp = parseInt(vitals.systolic_bp);
                if (vitals.diastolic_bp) data.diastolic_bp = parseInt(vitals.diastolic_bp);
                if (vitals.weight_kg) data.weight_kg = parseFloat(vitals.weight_kg);
                if (vitals.heart_rate) data.heart_rate = parseInt(vitals.heart_rate);
                if (vitals.hemoglobin) data.hemoglobin = parseFloat(vitals.hemoglobin);
                if (vitals.blood_sugar) data.blood_sugar = parseFloat(vitals.blood_sugar);
                if (vitals.temperature_c) data.temperature_c = parseFloat(vitals.temperature_c);
            } else if (recordType === "symptom") {
                data = {
                    symptoms: symptoms.symptoms.split(",").map((s) => s.trim()).filter(Boolean),
                    severity: symptoms.severity,
                    duration: symptoms.duration || undefined,
                };
            } else if (recordType === "mood") {
                data = {
                    mood: mood.mood,
                    energy_level: parseInt(mood.energy_level),
                    sleep_hours: mood.sleep_hours ? parseFloat(mood.sleep_hours) : undefined,
                    notes: mood.notes || undefined,
                };
            } else if (recordType === "kick_count") {
                data = {
                    count: parseInt(kickCount.count),
                    duration_minutes: parseInt(kickCount.duration_minutes),
                };
            }

            await api.post("/api/health/records", {
                record_type: recordType,
                data,
                notes: notes || undefined,
            });

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            loadRecords();

            // Reset forms
            setVitals({ systolic_bp: "", diastolic_bp: "", weight_kg: "", heart_rate: "", hemoglobin: "", blood_sugar: "", temperature_c: "" });
            setSymptoms({ symptoms: "", severity: "mild", duration: "" });
            setMood({ mood: "calm", energy_level: "5", sleep_hours: "", notes: "" });
            setKickCount({ count: "", duration_minutes: "" });
            setNotes("");
        } catch (err: any) {
            alert(err?.response?.data?.detail || "Failed to save record");
        } finally {
            setLoading(false);
        }
    };

    const toggleMilestone = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/api/health/milestones/${id}`, { is_completed: !currentStatus });
            loadMilestones();
        } catch { /* ignore */ }
    };

    const deleteRecord = async (id: string) => {
        try {
            await api.delete(`/api/health/records/${id}`);
            loadRecords();
        } catch { /* ignore */ }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Health Tracking ❤️</h1>
                <p className="page-subtitle">Log vitals, symptoms, mood, and track your pregnancy milestones</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${activeTab === "log" ? "active" : ""}`} onClick={() => setActiveTab("log")}>
                    📝 Log Health Data
                </button>
                <button className={`tab ${activeTab === "records" ? "active" : ""}`} onClick={() => setActiveTab("records")}>
                    📋 Records ({records.length})
                </button>
                <button className={`tab ${activeTab === "milestones" ? "active" : ""}`} onClick={() => setActiveTab("milestones")}>
                    🎯 Milestones
                </button>
            </div>

            {showSuccess && (
                <div className="alert-banner success" style={{ marginBottom: "1rem" }}>
                    <span className="alert-banner-icon">✅</span>
                    <div className="alert-banner-content">
                        <div className="alert-banner-title">Record saved successfully!</div>
                    </div>
                </div>
            )}

            {/* Log Tab */}
            {activeTab === "log" && (
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                    {/* Record Type Selector */}
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                        {RECORD_TYPES.map((rt) => (
                            <button
                                key={rt.value}
                                onClick={() => setRecordType(rt.value)}
                                className={`btn ${recordType === rt.value ? "btn-primary" : "btn-secondary"}`}
                                style={{ fontSize: "0.82rem", padding: "8px 16px" }}
                            >
                                {rt.label}
                            </button>
                        ))}
                    </div>

                    {/* Vitals Form */}
                    {recordType === "vitals" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Systolic BP (mmHg)</label>
                                <input className="form-input" type="number" placeholder="120" value={vitals.systolic_bp} onChange={(e) => setVitals({ ...vitals, systolic_bp: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Diastolic BP (mmHg)</label>
                                <input className="form-input" type="number" placeholder="80" value={vitals.diastolic_bp} onChange={(e) => setVitals({ ...vitals, diastolic_bp: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weight (kg)</label>
                                <input className="form-input" type="number" step="0.1" placeholder="65.0" value={vitals.weight_kg} onChange={(e) => setVitals({ ...vitals, weight_kg: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Heart Rate (bpm)</label>
                                <input className="form-input" type="number" placeholder="75" value={vitals.heart_rate} onChange={(e) => setVitals({ ...vitals, heart_rate: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hemoglobin (g/dL)</label>
                                <input className="form-input" type="number" step="0.1" placeholder="12.0" value={vitals.hemoglobin} onChange={(e) => setVitals({ ...vitals, hemoglobin: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Sugar (mg/dL)</label>
                                <input className="form-input" type="number" placeholder="90" value={vitals.blood_sugar} onChange={(e) => setVitals({ ...vitals, blood_sugar: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {/* Symptoms Form */}
                    {recordType === "symptom" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Add a Common Symptom</label>
                                <select 
                                    className="form-select" 
                                    style={{ cursor: "pointer", background: "var(--bg-glass)", border: "1px solid var(--border)", color: "var(--text-primary)", marginBottom: "0.5rem" }}
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const current = symptoms.symptoms;
                                        const newVal = current ? `${current}, ${e.target.value}` : e.target.value;
                                        setSymptoms({ ...symptoms, symptoms: newVal });
                                        e.target.value = ""; // reset dropdown
                                    }}
                                >
                                    <option value="" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Select a symptom to add...</option>
                                    <option value="headache" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Headache</option>
                                    <option value="nausea" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Nausea</option>
                                    <option value="back pain" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Back Pain</option>
                                    <option value="fatigue" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Fatigue</option>
                                    <option value="cramping" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Cramping</option>
                                    <option value="swelling" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Swelling</option>
                                    <option value="dizziness" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Dizziness</option>
                                    <option value="heartburn" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Heartburn</option>
                                    <option value="fever" style={{ background: "var(--bg-secondary)", color: "var(--danger)" }}>Fever (Warning)</option>
                                    <option value="spotting" style={{ background: "var(--bg-secondary)", color: "var(--danger)" }}>Spotting (Warning)</option>
                                </select>
                                
                                <label className="form-label">Logged Symptoms (edit here)</label>
                                <input 
                                    className="form-input" 
                                    placeholder="e.g. slight headache, lower back pain..." 
                                    value={symptoms.symptoms} 
                                    onChange={(e) => setSymptoms({ ...symptoms, symptoms: e.target.value })} 
                                />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Severity</label>
                                    <select className="form-select" value={symptoms.severity} onChange={(e) => setSymptoms({ ...symptoms, severity: e.target.value })} style={{ cursor: "pointer", background: "var(--bg-glass)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                                        <option value="mild" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Mild</option>
                                        <option value="moderate" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Moderate</option>
                                        <option value="severe" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>Severe</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration</label>
                                    <input className="form-input" placeholder="e.g. 2 hours" value={symptoms.duration} onChange={(e) => setSymptoms({ ...symptoms, duration: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mood Form */}
                    {recordType === "mood" && (
                        <div>
                            <label className="form-label" style={{ marginBottom: "0.75rem", display: "block" }}>How are you feeling?</label>
                            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                                {MOODS.map((m) => (
                                    <button
                                        key={m.value}
                                        onClick={() => setMood({ ...mood, mood: m.value })}
                                        style={{
                                            padding: "10px 16px",
                                            borderRadius: "var(--radius-full)",
                                            border: mood.mood === m.value ? "2px solid var(--primary)" : "1px solid var(--border)",
                                            background: mood.mood === m.value ? "rgba(232,93,117,0.15)" : "var(--bg-glass)",
                                            cursor: "pointer",
                                            fontSize: "1.2rem",
                                            transition: "all 0.2s",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        {m.emoji}
                                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{m.value}</span>
                                    </button>
                                ))}
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Energy Level (1-10)</label>
                                    <input className="form-input" type="range" min="1" max="10" value={mood.energy_level} onChange={(e) => setMood({ ...mood, energy_level: e.target.value })} />
                                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Level: {mood.energy_level}/10</span>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sleep (hours)</label>
                                    <input className="form-input" type="number" step="0.5" placeholder="7" value={mood.sleep_hours} onChange={(e) => setMood({ ...mood, sleep_hours: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Kick Count Form */}
                    {recordType === "kick_count" && (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Approx. Number of Kicks</label>
                                <input className="form-input" type="number" min="0" placeholder="10" value={kickCount.count} onChange={(e) => setKickCount({ ...kickCount, count: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Duration (minutes)</label>
                                <input className="form-input" type="number" min="1" placeholder="30" value={kickCount.duration_minutes} onChange={(e) => setKickCount({ ...kickCount, duration_minutes: e.target.value })} />
                            </div>
                        </div>
                    )}

                    {/* Notes & Submit */}
                    <div className="form-group" style={{ marginTop: "1rem" }}>
                        <label className="form-label">Notes (optional)</label>
                        <textarea className="form-textarea" placeholder="Any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ minHeight: "60px" }} />
                    </div>

                    <button onClick={submitRecord} className="btn btn-primary btn-lg" style={{ marginTop: "1rem" }} disabled={loading}>
                        {loading ? <><div className="spinner" /> Saving...</> : "Save Record ✓"}
                    </button>
                </div>
            )}

            {/* Records Tab */}
            {activeTab === "records" && (
                <div className="list-card">
                    <div className="list-card-header">
                        <h3>Health Records</h3>
                    </div>
                    {records.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📋</div>
                            <div className="empty-state-title">No records yet</div>
                            <div className="empty-state-text">Start logging your health data to see it here.</div>
                        </div>
                    ) : (
                        records.map((r) => (
                            <div key={r.id} className="list-item">
                                <div className="list-item-icon">
                                    {RECORD_TYPES.find((t) => t.value === r.record_type)?.icon || "📝"}
                                </div>
                                <div className="list-item-content">
                                    <div className="list-item-title" style={{ textTransform: "capitalize" }}>
                                        {r.record_type.replace("_", " ")}
                                    </div>
                                    <div className="list-item-subtitle">
                                        {r.record_type === "vitals" && r.data.weight_kg && `Weight: ${r.data.weight_kg}kg`}
                                        {r.record_type === "vitals" && r.data.systolic_bp && ` • BP: ${r.data.systolic_bp}/${r.data.diastolic_bp}`}
                                        {r.record_type === "mood" && `${r.data.mood} • Energy: ${r.data.energy_level}/10`}
                                        {r.record_type === "kick_count" && `${r.data.count} approx. kicks in ${r.data.duration_minutes} min`}
                                        {r.record_type === "symptom" && (r.data.symptoms || []).join(", ")}
                                        {r.notes && ` — ${r.notes}`}
                                    </div>
                                </div>
                                <div className="list-item-meta">
                                    <span className="tag">{new Date(r.created_at).toLocaleDateString()}</span>
                                    <Dropdown
                                        trigger={
                                            <button style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem", padding: "2px 6px" }}>
                                                {"\u22ee"}
                                            </button>
                                        }
                                        items={[
                                            { label: "View Details", icon: "\ud83d\udc41\ufe0f", onClick: () => { /* could expand row */ } },
                                            { label: "", icon: "", onClick: () => {}, divider: true },
                                            { label: "Delete Record", icon: "\ud83d\uddd1\ufe0f", onClick: () => deleteRecord(r.id), danger: true },
                                        ]}
                                    />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
                <div className="timeline">
                    {milestones.map((m) => (
                        <div key={m.id} className={`timeline-item ${m.is_completed ? "completed" : ""}`}>
                            <div className="timeline-dot" />
                            <div className="timeline-content">
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div className="timeline-week">WEEK {m.week}</div>
                                    {m.is_completed && (
                                        <span 
                                            style={{ 
                                                fontSize: "0.72rem", 
                                                padding: "4px 12px",
                                                color: "var(--success)",
                                                fontWeight: 500
                                            }}
                                        >
                                            ✓ Completed
                                        </span>
                                    )}
                                </div>
                                <div className="timeline-title">{m.title}</div>
                                <div className="timeline-desc">{m.description}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
