"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

export default function ProfilePage() {
    const { user, fetchUser } = useAuthStore();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm: "" });
    const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

    const [profile, setProfile] = useState({
        full_name: "",
        phone: "",
        pregnancy_week: "",
        blood_group: "",
        date_of_birth: "",
        height_cm: "",
        pre_pregnancy_weight_kg: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
    });

    const calculateAge = (dob: string): number | null => {
        if (!dob) return null;
        const birth = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age > 0 ? age : null;
    };

    useEffect(() => {
        if (user) {
            setProfile({
                full_name: user.full_name || "",
                phone: user.phone || "",
                pregnancy_week: user.profile?.pregnancy_week?.toString() || "",
                blood_group: user.profile?.blood_group || "",
                date_of_birth: user.profile?.date_of_birth || "",
                height_cm: user.profile?.height_cm?.toString() || "",
                pre_pregnancy_weight_kg: user.profile?.pre_pregnancy_weight_kg?.toString() || "",
                emergency_contact_name: user.profile?.emergency_contact_name || "",
                emergency_contact_phone: user.profile?.emergency_contact_phone || "",
            });
        }
    }, [user]);

    const saveProfile = async () => {
        setSaving(true);
        try {
            const payload: any = {
                full_name: profile.full_name,
                phone: profile.phone || undefined,
                profile: {
                    pregnancy_week: profile.pregnancy_week ? parseInt(profile.pregnancy_week) : undefined,
                    blood_group: profile.blood_group || undefined,
                    date_of_birth: profile.date_of_birth || undefined,
                    age: profile.date_of_birth ? calculateAge(profile.date_of_birth) ?? undefined : undefined,
                    height_cm: profile.height_cm ? parseFloat(profile.height_cm) : undefined,
                    pre_pregnancy_weight_kg: profile.pre_pregnancy_weight_kg ? parseFloat(profile.pre_pregnancy_weight_kg) : undefined,
                    emergency_contact_name: profile.emergency_contact_name || undefined,
                    emergency_contact_phone: profile.emergency_contact_phone || undefined,
                },
            };
            await api.put("/api/auth/profile", payload);
            await fetchUser();
            setEditing(false);
            setMessage({ type: "success", text: "Profile updated successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: "error", text: err?.response?.data?.detail || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        if (passwordForm.new_password !== passwordForm.confirm) {
            setMessage({ type: "error", text: "Passwords don't match" });
            return;
        }
        setSaving(true);
        try {
            await api.post("/api/auth/change-password", {
                current_password: passwordForm.current_password,
                new_password: passwordForm.new_password,
            });
            setShowPasswordForm(false);
            setPasswordForm({ current_password: "", new_password: "", confirm: "" });
            setMessage({ type: "success", text: "Password changed successfully!" });
            setTimeout(() => setMessage(null), 3000);
        } catch (err: any) {
            setMessage({ type: "error", text: err?.response?.data?.detail || "Failed to change password" });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Profile 👤</h1>
                <p className="page-subtitle">Manage your account and health information</p>
            </div>

            {message && (
                <div className={`alert-banner ${message.type === "success" ? "success" : "critical"}`} style={{ marginBottom: "1rem" }}>
                    <span className="alert-banner-icon">{message.type === "success" ? "✅" : "❌"}</span>
                    <div className="alert-banner-content">
                        <div className="alert-banner-title">{message.text}</div>
                    </div>
                </div>
            )}

            {/* Profile Card */}
            <div className="glass-card" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: "50%",
                            background: "var(--gradient-primary)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: "1.8rem", fontWeight: 700, color: "white",
                        }}>
                            {user.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", fontWeight: 700 }}>{user.full_name}</h2>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>{user.email}</p>
                            <span className="badge badge-info" style={{ marginTop: "4px" }}>{user.role}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {editing ? (
                            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                        ) : (
                            <Dropdown
                                trigger={
                                    <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        {"\u2699\ufe0f"} Actions <span style={{ fontSize: "0.7rem" }}>{"\u25be"}</span>
                                    </button>
                                }
                                items={[
                                    { label: "Edit Profile", icon: "\u270f\ufe0f", onClick: () => setEditing(true) },
                                    { label: "Change Password", icon: "\ud83d\udd12", onClick: () => setShowPasswordForm(true) },
                                    { label: "", icon: "", onClick: () => {}, divider: true },
                                    { label: "Verify Email", icon: "\u2709\ufe0f", onClick: () => { window.location.href = "/verify-email"; } },
                                ]}
                            />
                        )}
                    </div>
                </div>

                {/* Profile Fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                            className="form-input"
                            value={profile.full_name}
                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                            disabled={!editing}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Phone</label>
                        <input
                            className="form-input"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            disabled={!editing}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            Date of Birth
                            {profile.date_of_birth && calculateAge(profile.date_of_birth) && (
                                <span style={{
                                    marginLeft: "8px",
                                    fontSize: "0.8rem",
                                    color: "var(--primary)",
                                    fontWeight: 600,
                                }}>
                                    (Age: {calculateAge(profile.date_of_birth)} yrs)
                                </span>
                            )}
                        </label>
                        <input
                            className="form-input"
                            type="date"
                            max={new Date().toISOString().split("T")[0]}
                            min="1960-01-01"
                            value={profile.date_of_birth}
                            onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
                            disabled={!editing}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">
                            Pregnancy Week
                            {user?.profile?.pregnancy_display && !editing && (
                                <span style={{
                                    marginLeft: "8px",
                                    fontSize: "0.8rem",
                                    color: "var(--primary)",
                                    fontWeight: 600,
                                }}>
                                    (Now: {user.profile.pregnancy_display} • {user.profile.trimester} Trimester)
                                </span>
                            )}
                        </label>
                        <input
                            className="form-input"
                            type="number"
                            min="1"
                            max="42"
                            value={profile.pregnancy_week}
                            onChange={(e) => setProfile({ ...profile, pregnancy_week: e.target.value })}
                            disabled={!editing}
                            placeholder={editing ? "Enter your current pregnancy week" : ""}
                        />
                        {editing && (
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                                💡 Enter your current week — the system will auto-update it daily from this point.
                            </span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select
                            className="form-select"
                            value={profile.blood_group}
                            onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
                            disabled={!editing}
                        >
                            <option value="">Select</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                                <option key={bg} value={bg}>{bg}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Height (cm)</label>
                        <input
                            className="form-input"
                            type="number"
                            value={profile.height_cm}
                            onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
                            disabled={!editing}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Pre-pregnancy Weight (kg)</label>
                        <input
                            className="form-input"
                            type="number"
                            step="0.1"
                            value={profile.pre_pregnancy_weight_kg}
                            onChange={(e) => setProfile({ ...profile, pre_pregnancy_weight_kg: e.target.value })}
                            disabled={!editing}
                        />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div style={{ 
                    marginTop: "1.5rem", 
                    padding: "1rem", 
                    background: "rgba(239,68,68,0.1)", 
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid rgba(239,68,68,0.3)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, color: "#fca5a5", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            🚑 Emergency Contact
                        </h3>
                        {!editing && (
                            <button 
                                className="btn btn-secondary" 
                                style={{ fontSize: "0.8rem", padding: "4px 12px" }}
                                onClick={() => setEditing(true)}
                            >
                                ✏️ Edit
                            </button>
                        )}
                    </div>
                    
                    {editing ? (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                                <label className="form-label">Contact Name *</label>
                                <input
                                    className="form-input"
                                    value={profile.emergency_contact_name}
                                    onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                                    placeholder="e.g. Husband, Mother, Sister"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Contact Phone *</label>
                                <input
                                    className="form-input"
                                    type="tel"
                                    value={profile.emergency_contact_phone}
                                    onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                                    placeholder="e.g. +91 98765 43210"
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Contact Name</div>
                                <div style={{ fontSize: "1rem", fontWeight: 600, color: profile.emergency_contact_name ? "var(--text-primary)" : "var(--text-muted)" }}>
                                    {profile.emergency_contact_name || "Not set"}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Contact Phone</div>
                                <div style={{ fontSize: "1rem", fontWeight: 600, color: profile.emergency_contact_phone ? "var(--text-primary)" : "var(--text-muted)" }}>
                                    {profile.emergency_contact_phone ? (
                                        <a href={`tel:${profile.emergency_contact_phone}`} style={{ color: "#22c55e", textDecoration: "none" }}>
                                            📞 {profile.emergency_contact_phone}
                                        </a>
                                    ) : (
                                        "Not set"
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!profile.emergency_contact_name && !editing && (
                        <div style={{ 
                            marginTop: "0.75rem", 
                            padding: "0.5rem", 
                            background: "rgba(239,68,68,0.2)", 
                            borderRadius: "var(--radius)",
                            fontSize: "0.85rem",
                            color: "#fca5a5"
                        }}>
                            ⚠️ Please add an emergency contact. This will be used during SOS alerts.
                        </div>
                    )}
                </div>

                {editing && (
                    <button
                        className="btn btn-primary btn-lg"
                        style={{ marginTop: "1.5rem" }}
                        onClick={saveProfile}
                        disabled={saving}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                )}
            </div>

            {/* Security Section */}
            <div className="glass-card" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>
                    🔒 Security
                </h3>
                <button
                    className="btn btn-secondary"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                >
                    {showPasswordForm ? "Cancel" : "Change Password"}
                </button>

                {showPasswordForm && (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input className="form-input" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input className="form-input" type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input className="form-input" type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} />
                        </div>
                        <button className="btn btn-primary" onClick={changePassword} disabled={saving}>
                            {saving ? "Updating..." : "Update Password"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
