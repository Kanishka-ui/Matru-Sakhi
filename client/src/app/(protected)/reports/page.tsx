"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

interface KeyValue {
    name: string;
    value: string;
    unit: string;
    status: string;
    normal_range: string;
    explanation?: string;
    advice?: string;
}

interface RiskFlag {
    parameter: string;
    concern: string;
    action: string;
}

interface Report {
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    status: string;
    analysis: string | null;
    key_values: KeyValue[];
    insights: string[];
    risk_flags: RiskFlag[];
    diet_suggestions?: string[];
    next_steps?: string[];
    extracted_vitals?: Record<string, number | null>;
    created_at: string;
}

const STATUS_BADGES: Record<string, { color: string; label: string }> = {
    processing: { color: "var(--warning)", label: "Analyzing..." },
    analyzed: { color: "var(--success)", label: "Analyzed" },
    failed: { color: "var(--danger)", label: "Failed" },
};

// Valid ranges for pregnancy vitals (based on medical guidelines)
const VITAL_RANGES = {
    weight_kg: { min: 30, max: 200, label: "Weight (kg)", unit: "kg" },
    systolic_bp: { min: 70, max: 180, label: "Systolic BP", unit: "mmHg" },
    diastolic_bp: { min: 40, max: 120, label: "Diastolic BP", unit: "mmHg" },
    temperature_c: { min: 35, max: 42, label: "Temperature", unit: "°C" },
    heart_rate: { min: 40, max: 140, label: "Heart Rate", unit: "bpm" },
    blood_sugar: { min: 50, max: 300, label: "Blood Sugar", unit: "mg/dL" },
    hemoglobin: { min: 6, max: 18, label: "Hemoglobin", unit: "g/dL" },
};

type VitalKey = keyof typeof VITAL_RANGES;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr: string): string {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");

    // Vitals extracted from report
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [savingVitals, setSavingVitals] = useState(false);
    const [vitalsForm, setVitalsForm] = useState({
        weight_kg: "",
        systolic_bp: "",
        diastolic_bp: "",
        temperature_c: "",
        heart_rate: "",
        blood_sugar: "",
        hemoglobin: ""
    });
    const [vitalsErrors, setVitalsErrors] = useState<Record<VitalKey, string>>({
        weight_kg: "",
        systolic_bp: "",
        diastolic_bp: "",
        temperature_c: "",
        heart_rate: "",
        blood_sugar: "",
        hemoglobin: ""
    });

    const fetchReports = useCallback(async () => {
        try {
            const res = await api.get("/api/reports/");
            setReports(res.data.items || []);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const uploadFile = async (file: File) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowed.includes(file.type)) {
            setError("Please upload a PDF or image file (JPG, PNG, WebP).");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large. Maximum size is 10MB.");
            return;
        }

        setError("");
        setUploading(true);
        setUploadProgress("Uploading report...");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setUploadProgress("Analyzing your report with AI...");
            const res = await api.post("/api/reports/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                timeout: 60000,
            });
            setUploadProgress("Done!");
            setSelectedReport(res.data);
            await fetchReports();

            // Check if there are any non-null extracted vitals
            if (res.data.extracted_vitals) {
                const vitals = res.data.extracted_vitals;
                const hasVitals = Object.values(vitals).some(v => v !== null && v !== 0);
                if (hasVitals) {
                    setVitalsForm({
                        weight_kg: vitals.weight_kg ? vitals.weight_kg.toString() : "",
                        systolic_bp: vitals.systolic_bp ? vitals.systolic_bp.toString() : "",
                        diastolic_bp: vitals.diastolic_bp ? vitals.diastolic_bp.toString() : "",
                        temperature_c: vitals.temperature_c ? vitals.temperature_c.toString() : "",
                        heart_rate: vitals.heart_rate ? vitals.heart_rate.toString() : "",
                        blood_sugar: vitals.blood_sugar ? vitals.blood_sugar.toString() : "",
                        hemoglobin: vitals.hemoglobin ? vitals.hemoglobin.toString() : ""
                    });
                    setShowVitalsModal(true);
                }
            }
        } catch (err: any) {
            setError(err?.response?.data?.detail || "Upload failed. Please try again.");
        } finally {
            setUploading(false);
            setUploadProgress("");
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) uploadFile(file);
        e.target.value = "";
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file) uploadFile(file);
    };

    // Validate a single vital value
    const validateVital = (key: VitalKey, value: string): string => {
        if (!value || value.trim() === "") return ""; // Empty is allowed (optional field)
        const numValue = parseFloat(value);
        if (isNaN(numValue)) return "Please enter a valid number";
        const range = VITAL_RANGES[key];
        if (numValue < range.min) return `${range.label} must be at least ${range.min} ${range.unit}`;
        if (numValue > range.max) return `${range.label} must not exceed ${range.max} ${range.unit}`;
        return "";
    };

    // Validate all vitals and return true if valid
    const validateAllVitals = (): boolean => {
        const newErrors: Record<VitalKey, string> = {
            weight_kg: "",
            systolic_bp: "",
            diastolic_bp: "",
            temperature_c: "",
            heart_rate: "",
            blood_sugar: "",
            hemoglobin: ""
        };
        let isValid = true;

        (Object.keys(VITAL_RANGES) as VitalKey[]).forEach((key) => {
            const error = validateVital(key, vitalsForm[key]);
            if (error) {
                newErrors[key] = error;
                isValid = false;
            }
        });

        setVitalsErrors(newErrors);
        return isValid;
    };

    const handleSaveVitals = async () => {
        // Validate before saving
        if (!validateAllVitals()) {
            return; // Stop if validation fails
        }

        setSavingVitals(true);
        try {
            const dataToSave: Record<string, number> = {};
            if (vitalsForm.weight_kg) dataToSave.weight_kg = parseFloat(vitalsForm.weight_kg);
            if (vitalsForm.systolic_bp) dataToSave.systolic_bp = parseInt(vitalsForm.systolic_bp);
            if (vitalsForm.diastolic_bp) dataToSave.diastolic_bp = parseInt(vitalsForm.diastolic_bp);
            if (vitalsForm.temperature_c) dataToSave.temperature_c = parseFloat(vitalsForm.temperature_c);
            if (vitalsForm.heart_rate) dataToSave.heart_rate = parseInt(vitalsForm.heart_rate);
            if (vitalsForm.blood_sugar) dataToSave.blood_sugar = parseFloat(vitalsForm.blood_sugar);
            if (vitalsForm.hemoglobin) dataToSave.hemoglobin = parseFloat(vitalsForm.hemoglobin);

            if (Object.keys(dataToSave).length > 0) {
                await api.post("/api/health/log", {
                    record_type: "vitals",
                    data: dataToSave,
                    notes: "Imported automatically from uploaded medical report."
                });
                alert("Vitals successfully saved to your health logs!");
            }
            setShowVitalsModal(false);
            // Clear errors when closing
            setVitalsErrors({
                weight_kg: "",
                systolic_bp: "",
                diastolic_bp: "",
                temperature_c: "",
                heart_rate: "",
                blood_sugar: "",
                hemoglobin: ""
            });
        } catch (err) {
            alert("Failed to save vitals.");
        } finally {
            setSavingVitals(false);
        }
    };

    const viewReport = async (reportId: string) => {
        try {
            const res = await api.get(`/api/reports/${reportId}`);
            setSelectedReport(res.data);
        } catch {
            setError("Failed to load report details.");
        }
    };

    const deleteReport = async (reportId: string) => {
        if (!confirm("Delete this report?")) return;
        try {
            await api.delete(`/api/reports/${reportId}`);
            setReports((prev) => prev.filter((r) => r.id !== reportId));
            if (selectedReport?.id === reportId) setSelectedReport(null);
        } catch {
            setError("Failed to delete report.");
        }
    };

    const getStatusColor = (status: string) => {
        if (status === "normal") return "var(--success)";
        if (status === "high") return "var(--warning)";
        if (status === "low") return "var(--info, #60a5fa)";
        if (status === "critical") return "var(--danger)";
        return "var(--text-muted)";
    };

    // ─── Detail View ────────────────────────────────────────
    if (selectedReport) {
        const r = selectedReport;
        return (
            <div>
                <div className="page-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedReport(null)}
                            style={{ padding: "8px 16px" }}
                        >
                            {"\u2190"} Back
                        </button>
                        <div>
                            <h1 className="page-title" style={{ marginBottom: 0 }}>Report Analysis</h1>
                            <p className="page-subtitle" style={{ marginBottom: 0 }}>
                                {r.filename} {"\u2022"} {formatDate(r.created_at)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                {r.analysis && (
                    <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {"\ud83d\udccb"} Summary
                        </h3>
                        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                            {r.analysis}
                        </p>
                    </div>
                )}

                {/* Key Values with Explanations */}
                {r.key_values.length > 0 && (
                    <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {"\ud83e\uddea"} Medical Values Explained
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {r.key_values.map((kv, i) => (
                                <div key={i} style={{ 
                                    background: "var(--bg-glass)", 
                                    borderRadius: "12px",
                                    padding: "16px",
                                    borderLeft: `4px solid ${getStatusColor(kv.status)}`
                                }}>
                                    {/* Header Row */}
                                    <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between", 
                                        alignItems: "center",
                                        marginBottom: kv.explanation ? "12px" : "0"
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{kv.name}</span>
                                            <span style={{
                                                padding: "4px 12px",
                                                borderRadius: "20px",
                                                fontSize: "0.75rem",
                                                fontWeight: 600,
                                                background: `${getStatusColor(kv.status)}20`,
                                                color: getStatusColor(kv.status),
                                                textTransform: "capitalize",
                                            }}>
                                                {kv.status}
                                            </span>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <span style={{ fontWeight: 700, color: getStatusColor(kv.status), fontSize: "1.1rem" }}>
                                                {kv.value}
                                            </span>
                                            <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>{kv.unit}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Explanation */}
                                    {kv.explanation && (
                                        <div style={{ 
                                            color: "var(--text-secondary)", 
                                            fontSize: "0.9rem", 
                                            lineHeight: 1.6,
                                            marginBottom: "8px"
                                        }}>
                                            {kv.explanation}
                                        </div>
                                    )}
                                    
                                    {/* Value Context */}
                                    <div style={{ 
                                        display: "flex", 
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        fontSize: "0.85rem",
                                        color: "var(--text-muted)"
                                    }}>
                                        <span>Normal range: {kv.normal_range}</span>
                                        {kv.advice && kv.status !== "normal" && (
                                            <span style={{ 
                                                color: getStatusColor(kv.status),
                                                fontWeight: 500
                                            }}>
                                                💡 {kv.advice}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Risk Flags */}
                {r.risk_flags.length > 0 && (
                    <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem", border: "1px solid rgba(239,68,68,0.3)" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--danger)", display: "flex", alignItems: "center", gap: "8px" }}>
                            {"\u26a0\ufe0f"} Needs Attention
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {r.risk_flags.map((flag, i) => (
                                <div key={i} style={{
                                    padding: "14px",
                                    background: "rgba(239,68,68,0.08)",
                                    borderRadius: "10px",
                                    borderLeft: "3px solid var(--danger)",
                                }}>
                                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px" }}>{flag.parameter}</div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "6px" }}>{flag.concern}</div>
                                    <div style={{ color: "var(--primary)", fontSize: "0.82rem", fontWeight: 500 }}>
                                        {"\ud83d\udc49"} {flag.action}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Simple Insights */}
                {r.insights.length > 0 && (
                    <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                            {"\ud83d\udca1"} What This Means For You
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {r.insights.map((insight, i) => (
                                <div key={i} style={{
                                    padding: "14px",
                                    background: "var(--bg-glass)",
                                    borderRadius: "10px",
                                    borderLeft: "3px solid var(--primary)",
                                    color: "var(--text-secondary)",
                                    fontSize: "0.9rem",
                                    lineHeight: 1.6,
                                }}>
                                    {insight}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Diet Suggestions & Next Steps */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                    {(r.diet_suggestions?.length ?? 0) > 0 && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                {"\ud83c\udf4e"} Diet Tips
                            </h3>
                            <ul style={{ paddingLeft: "1.2rem", color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                                {r.diet_suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                    {(r.next_steps?.length ?? 0) > 0 && (
                        <div className="glass-card" style={{ padding: "1.5rem" }}>
                            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                                {"\u2705"} Next Steps
                            </h3>
                            <ul style={{ paddingLeft: "1.2rem", color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.7 }}>
                                {r.next_steps?.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    This analysis is AI-generated and meant for informational purposes only. Always consult your healthcare provider for medical decisions.
                </p>
            </div>
        );
    }

    // ─── List View ──────────────────────────────────────────
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{"\ud83d\udcc4"} Medical Reports</h1>
                <p className="page-subtitle">
                    Upload your medical reports and get easy-to-understand AI insights
                </p>
            </div>

            {/* Error */}
            {error && (
                <div className="alert-banner critical" style={{ marginBottom: "1rem" }}>
                    <span className="alert-banner-icon">{"\u274c"}</span>
                    <div className="alert-banner-content">
                        <div className="alert-banner-title">{error}</div>
                    </div>
                    <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}>{"\u2715"}</button>
                </div>
            )}

            {/* Upload Zone */}
            <div
                className="glass-card"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    padding: "2.5rem",
                    marginBottom: "2rem",
                    textAlign: "center",
                    border: `2px dashed ${dragActive ? "var(--primary)" : "var(--border)"}`,
                    background: dragActive ? "rgba(232,93,117,0.05)" : undefined,
                    transition: "all 0.3s ease",
                    cursor: uploading ? "wait" : "pointer",
                }}
                onClick={() => {
                    if (!uploading) document.getElementById("report-file-input")?.click();
                }}
            >
                <input
                    id="report-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileInput}
                    style={{ display: "none" }}
                />

                {uploading ? (
                    <div>
                        <div className="spinner" style={{ margin: "0 auto 1rem", width: 40, height: 40, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                        <p style={{ color: "var(--primary)", fontWeight: 600, fontSize: "1rem" }}>{uploadProgress}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                            This may take a moment while our AI analyzes your report...
                        </p>
                    </div>
                ) : (
                    <div>
                        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{"\ud83d\udcc2"}</div>
                        <p style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
                            Drop your report here or <span style={{ color: "var(--primary)" }}>click to upload</span>
                        </p>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            Supports PDF, JPG, PNG, WebP {"\u2022"} Max 10MB
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", marginTop: "1rem", flexWrap: "wrap" }}>
                            {["Blood Test", "Urine Test", "Ultrasound", "Thyroid", "Sugar Test"].map((t) => (
                                <span key={t} style={{
                                    padding: "4px 12px",
                                    background: "var(--bg-glass)",
                                    borderRadius: "20px",
                                    fontSize: "0.78rem",
                                    color: "var(--text-muted)",
                                    border: "1px solid var(--border)",
                                }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Reports List */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="spinner" style={{ margin: "0 auto", width: 40, height: 40, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                </div>
            ) : reports.length === 0 ? (
                <div className="glass-card" style={{ padding: "3rem", textAlign: "center" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.5 }}>{"\ud83d\udcc4"}</div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        No reports yet
                    </h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                        Upload your first medical report to get personalized AI insights
                    </p>
                </div>
            ) : (
                <div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
                        Your Reports ({reports.length})
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        {reports.map((report) => {
                            const badge = STATUS_BADGES[report.status] || STATUS_BADGES.processing;
                            return (
                                <div
                                    key={report.id}
                                    className="glass-card"
                                    style={{
                                        padding: "1.2rem 1.5rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        cursor: report.status === "analyzed" ? "pointer" : "default",
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={() => report.status === "analyzed" && viewReport(report.id)}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: 0 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: "12px",
                                            background: "var(--bg-glass)", display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            fontSize: "1.3rem", flexShrink: 0,
                                        }}>
                                            {report.file_type.includes("pdf") ? "\ud83d\udcc4" : "\ud83d\uddbc\ufe0f"}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {report.filename}
                                            </div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                                                <span>{formatFileSize(report.file_size)}</span>
                                                <span>{"\u2022"}</span>
                                                <span>{formatDate(report.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                                        {report.risk_flags.length > 0 && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--danger)", fontWeight: 600 }}>
                                                {"\u26a0"} {report.risk_flags.length} alert{report.risk_flags.length > 1 ? "s" : ""}
                                            </span>
                                        )}
                                        <span style={{
                                            padding: "4px 10px",
                                            borderRadius: "20px",
                                            fontSize: "0.72rem",
                                            fontWeight: 600,
                                            background: `${badge.color}15`,
                                            color: badge.color,
                                        }}>
                                            {badge.label}
                                        </span>
                                        <Dropdown
                                            trigger={
                                                <button
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        background: "var(--bg-glass)", border: "1px solid var(--border)",
                                                        borderRadius: "8px", color: "var(--text-muted)",
                                                        cursor: "pointer", padding: "4px 8px", fontSize: "1rem",
                                                    }}
                                                >
                                                    {"\u22ee"}
                                                </button>
                                            }
                                            items={[
                                                ...(report.status === "analyzed" ? [{ label: "View Analysis", icon: "\ud83d\udc41\ufe0f", onClick: () => viewReport(report.id) }] : []),
                                                { label: "", icon: "", onClick: () => {}, divider: true },
                                                { label: "Delete Report", icon: "\ud83d\uddd1\ufe0f", onClick: () => deleteReport(report.id), danger: true },
                                            ]}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {/* Extracted Vitals Review Modal */}
            {showVitalsModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "500px", padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>🩺 Review Extracted Vitals</h2>
                            <button className="btn btn-secondary" style={{ padding: "4px 8px" }} onClick={() => setShowVitalsModal(false)}>✕</button>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                            We found the following vitals in your report. Please review, edit if necessary, and confirm to save them directly to your health logs.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Weight (kg) <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(30-200)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.weight_kg ? "border-red-500" : ""}`} 
                                    type="number" 
                                    step="0.1" 
                                    min="30"
                                    max="200"
                                    value={vitalsForm.weight_kg} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, weight_kg: e.target.value});
                                        setVitalsErrors({...vitalsErrors, weight_kg: validateVital("weight_kg", e.target.value)});
                                    }} 
                                    placeholder="e.g. 65.5" 
                                    style={{ borderColor: vitalsErrors.weight_kg ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.weight_kg && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.weight_kg}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Temperature (°C) <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(35-42)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.temperature_c ? "border-red-500" : ""}`} 
                                    type="number" 
                                    step="0.1" 
                                    min="35"
                                    max="42"
                                    value={vitalsForm.temperature_c} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, temperature_c: e.target.value});
                                        setVitalsErrors({...vitalsErrors, temperature_c: validateVital("temperature_c", e.target.value)});
                                    }} 
                                    placeholder="e.g. 37.0" 
                                    style={{ borderColor: vitalsErrors.temperature_c ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.temperature_c && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.temperature_c}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Systolic BP <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(70-180)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.systolic_bp ? "border-red-500" : ""}`} 
                                    type="number" 
                                    min="70"
                                    max="180"
                                    value={vitalsForm.systolic_bp} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, systolic_bp: e.target.value});
                                        setVitalsErrors({...vitalsErrors, systolic_bp: validateVital("systolic_bp", e.target.value)});
                                    }} 
                                    placeholder="e.g. 120" 
                                    style={{ borderColor: vitalsErrors.systolic_bp ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.systolic_bp && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.systolic_bp}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Diastolic BP <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(40-120)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.diastolic_bp ? "border-red-500" : ""}`} 
                                    type="number" 
                                    min="40"
                                    max="120"
                                    value={vitalsForm.diastolic_bp} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, diastolic_bp: e.target.value});
                                        setVitalsErrors({...vitalsErrors, diastolic_bp: validateVital("diastolic_bp", e.target.value)});
                                    }} 
                                    placeholder="e.g. 80" 
                                    style={{ borderColor: vitalsErrors.diastolic_bp ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.diastolic_bp && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.diastolic_bp}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Heart Rate (bpm) <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(40-140)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.heart_rate ? "border-red-500" : ""}`} 
                                    type="number" 
                                    min="40"
                                    max="140"
                                    value={vitalsForm.heart_rate} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, heart_rate: e.target.value});
                                        setVitalsErrors({...vitalsErrors, heart_rate: validateVital("heart_rate", e.target.value)});
                                    }} 
                                    placeholder="e.g. 85" 
                                    style={{ borderColor: vitalsErrors.heart_rate ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.heart_rate && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.heart_rate}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Blood Sugar (mg/dL) <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(50-300)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.blood_sugar ? "border-red-500" : ""}`} 
                                    type="number" 
                                    step="0.1" 
                                    min="50"
                                    max="300"
                                    value={vitalsForm.blood_sugar} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, blood_sugar: e.target.value});
                                        setVitalsErrors({...vitalsErrors, blood_sugar: validateVital("blood_sugar", e.target.value)});
                                    }} 
                                    placeholder="e.g. 90" 
                                    style={{ borderColor: vitalsErrors.blood_sugar ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.blood_sugar && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.blood_sugar}</span>}
                            </div>
                            <div className="form-group">
                                <label className="form-label">Hemoglobin (g/dL) <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>(6-18)</span></label>
                                <input 
                                    className={`form-input ${vitalsErrors.hemoglobin ? "border-red-500" : ""}`} 
                                    type="number" 
                                    step="0.1" 
                                    min="6"
                                    max="18"
                                    value={vitalsForm.hemoglobin} 
                                    onChange={(e) => {
                                        setVitalsForm({...vitalsForm, hemoglobin: e.target.value});
                                        setVitalsErrors({...vitalsErrors, hemoglobin: validateVital("hemoglobin", e.target.value)});
                                    }} 
                                    placeholder="e.g. 12.5" 
                                    style={{ borderColor: vitalsErrors.hemoglobin ? "#ef4444" : undefined }}
                                />
                                {vitalsErrors.hemoglobin && <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>{vitalsErrors.hemoglobin}</span>}
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                            <button className="btn btn-secondary" onClick={() => setShowVitalsModal(false)}>Skip</button>
                            <button className="btn btn-primary" onClick={handleSaveVitals} disabled={savingVitals}>
                                {savingVitals ? "Saving..." : "Confirm & Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "2rem", fontStyle: "italic" }}>
                Your reports are private and securely stored. AI analysis is for informational purposes only.
            </p>
        </div>
    );
}
