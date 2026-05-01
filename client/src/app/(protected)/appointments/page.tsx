"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

const APPT_TYPES = [
    { value: "checkup", label: "🩺 Regular Checkup" },
    { value: "ultrasound", label: "📷 Ultrasound" },
    { value: "blood_test", label: "🩸 Blood Test" },
    { value: "vaccination", label: "💉 Vaccination" },
    { value: "specialist", label: "👨‍⚕️ Specialist" },
    { value: "other", label: "📋 Other" },
];

export default function AppointmentsPage() {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [filter, setFilter] = useState<string>("all");
    const [loading, setLoading] = useState(false);

    // Form
    const [form, setForm] = useState({
        title: "",
        appointment_type: "checkup",
        doctor_name: "",
        hospital_name: "",
        scheduled_date: "",
        scheduled_time: "",
        notes: "",
    });

    useEffect(() => {
        loadAppointments();
    }, [filter]);

    const loadAppointments = async () => {
        try {
            const params: any = {};
            if (filter === "upcoming") params.upcoming = true;
            else if (filter !== "all") params.status = filter;
            const res = await api.get("/api/appointments/", { params });
            setAppointments(res.data.appointments || []);
        } catch { /* ignore */ }
    };

    const openCreateModal = () => {
        setEditId(null);
        setForm({ title: "", appointment_type: "checkup", doctor_name: "", hospital_name: "", scheduled_date: "", scheduled_time: "", notes: "" });
        setShowModal(true);
    };

    const openEditModal = (appt: any) => {
        setEditId(appt.id);
        setForm({
            title: appt.title,
            appointment_type: appt.appointment_type,
            doctor_name: appt.provider_name || "",
            hospital_name: appt.location || "",
            scheduled_date: appt.date || "",
            scheduled_time: appt.time || "",
            notes: appt.notes || "",
        });
        setShowModal(true);
    };

    const submitAppointment = async () => {
        if (!form.title || !form.scheduled_date) return;
        
        // Validate date is not in the past
        const selectedDate = new Date(form.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        
        if (selectedDate < today) {
            alert("Cannot schedule appointments for past dates. Please select today or a future date.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        try {
            const scheduledDate = form.scheduled_time
                ? `${form.scheduled_date}T${form.scheduled_time}:00`
                : `${form.scheduled_date}T09:00:00`;

            const payload = {
                title: form.title,
                appointment_type: form.appointment_type,
                doctor_name: form.doctor_name || undefined,
                hospital_name: form.hospital_name || undefined,
                scheduled_date: scheduledDate,
                notes: form.notes || undefined,
            };

            if (editId) {
                await api.put(`/api/appointments/${editId}`, payload);
            } else {
                await api.post("/api/appointments/", payload);
            }

            setShowModal(false);
            loadAppointments();
        } catch (err) {
            alert("Failed to save appointment");
        } finally {
            setLoading(false);
        }
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Delete this appointment?")) return;
        try {
            await api.delete(`/api/appointments/${id}`);
            loadAppointments();
        } catch { /* ignore */ }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            await api.put(`/api/appointments/${id}`, { status: newStatus });
            loadAppointments();
        } catch { /* ignore */ }
    };

    const statusBadgeClass: Record<string, string> = {
        scheduled: "badge-info",
        completed: "badge-success",
        cancelled: "badge-critical",
        rescheduled: "badge-warning",
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Appointments 📅</h1>
                <p className="page-subtitle">Schedule and manage your medical appointments</p>
            </div>

            {/* Filter Tabs + Add Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div className="tabs" style={{ marginBottom: 0, borderBottom: "none" }}>
                    {[
                        { v: "all", l: "All" },
                        { v: "upcoming", l: "Upcoming" },
                        { v: "completed", l: "Completed" },
                        { v: "cancelled", l: "Cancelled" },
                    ].map((f) => (
                        <button
                            key={f.v}
                            className={`tab ${filter === f.v ? "active" : ""}`}
                            onClick={() => setFilter(f.v)}
                        >
                            {f.l}
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    + New Appointment
                </button>
            </div>

            {/* Appointments List */}
            <div className="list-card">
                {appointments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📅</div>
                        <div className="empty-state-title">No appointments</div>
                        <div className="empty-state-text">Schedule your first appointment to keep track of your prenatal care visits.</div>
                        <button className="btn btn-primary" onClick={openCreateModal}>Schedule Appointment</button>
                    </div>
                ) : (
                    appointments.map((appt) => {
                        return (
                            <div key={appt.id} className="list-item" style={{ cursor: "pointer" }} onClick={() => openEditModal(appt)}>
                                <div className="list-item-icon">
                                    {APPT_TYPES.find((t) => t.value === appt.appointment_type)?.label?.split(" ")[0] || "📋"}
                                </div>
                                <div className="list-item-content">
                                    <div className="list-item-title">{appt.title}</div>
                                    <div className="list-item-subtitle">
                                        {appt.date || "TBD"}
                                        {appt.time && ` at ${appt.time}`}
                                        {appt.provider_name && ` • Dr. ${appt.provider_name}`}
                                        {appt.location && ` • ${appt.location}`}
                                    </div>
                                </div>
                                <div className="list-item-meta" style={{ gap: "0.5rem" }}>
                                    <span className={`badge ${statusBadgeClass[appt.status] || "badge-info"}`}>
                                        {appt.status}
                                    </span>
                                    <Dropdown
                                        trigger={
                                            <button
                                                style={{
                                                    background: "var(--bg-glass)",
                                                    border: "1px solid var(--border)",
                                                    borderRadius: "8px",
                                                    color: "var(--text-muted)",
                                                    cursor: "pointer",
                                                    padding: "4px 8px",
                                                    fontSize: "1rem",
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {"\u22ee"}
                                            </button>
                                        }
                                        items={[
                                            { label: "Edit", icon: "\u270f\ufe0f", onClick: () => openEditModal(appt) },
                                            ...(appt.status === "scheduled"
                                                ? [
                                                    { label: "Mark Completed", icon: "\u2705", onClick: () => updateStatus(appt.id, "completed") },
                                                    { label: "Cancel", icon: "\u274c", onClick: () => updateStatus(appt.id, "cancelled") },
                                                    { label: "Reschedule", icon: "\ud83d\udcc5", onClick: () => { updateStatus(appt.id, "rescheduled"); openEditModal(appt); } },
                                                ]
                                                : appt.status === "completed"
                                                    ? [{ label: "Reopen", icon: "\ud83d\udd04", onClick: () => updateStatus(appt.id, "scheduled") }]
                                                    : [{ label: "Reschedule", icon: "\ud83d\udcc5", onClick: () => { updateStatus(appt.id, "scheduled"); openEditModal(appt); } }]
                                            ),
                                            { label: "", icon: "", onClick: () => {}, divider: true },
                                            { label: "Delete", icon: "\ud83d\uddd1\ufe0f", onClick: () => deleteAppointment(appt.id), danger: true },
                                        ]}
                                    />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editId ? "Edit Appointment" : "New Appointment"}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div className="form-group">
                                    <label className="form-label">Title *</label>
                                    <input className="form-input" placeholder="e.g. 20-week ultrasound" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select 
                                        className="form-select" 
                                        value={form.appointment_type} 
                                        onChange={(e) => setForm({ ...form, appointment_type: e.target.value })}
                                        style={{ backgroundColor: "var(--bg-glass)", color: "var(--text-primary)" }}
                                    >
                                        {APPT_TYPES.map((t) => (
                                            <option key={t.value} value={t.value} style={{ backgroundColor: "#1a1726", color: "#f5f3ff" }}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Date *</label>
                                        <input 
                                            className="form-input" 
                                            type="date" 
                                            min={new Date().toISOString().split('T')[0]} 
                                            value={form.scheduled_date} 
                                            onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                                            style={{ backgroundColor: "var(--bg-glass)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Time</label>
                                        <input 
                                            className="form-input" 
                                            type="time" 
                                            value={form.scheduled_time} 
                                            onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                                            style={{ backgroundColor: "var(--bg-glass)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div className="form-group">
                                        <label className="form-label">Doctor</label>
                                        <input className="form-input" placeholder="Doctor name" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Hospital/Clinic</label>
                                        <input className="form-input" placeholder="Hospital name" value={form.hospital_name} onChange={(e) => setForm({ ...form, hospital_name: e.target.value })} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea className="form-textarea" placeholder="Any notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ minHeight: "60px" }} />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={submitAppointment} disabled={loading || !form.title || !form.scheduled_date}>
                                {loading ? "Saving..." : editId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
