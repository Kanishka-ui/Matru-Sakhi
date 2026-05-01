"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const ROLES = [
    { value: "mother", label: "🤰 Mother / Expectant Mother" },
    { value: "asha", label: "👩‍⚕️ ASHA Worker" },
    { value: "anm", label: "🏥 ANM (Nurse Midwife)" },
    { value: "doctor", label: "👨‍⚕️ Doctor / Specialist" },
];

export default function RegisterPage() {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();
    const [step, setStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        phone: "",
        role: "mother",
        date_of_birth: "",
        pregnancy_week: "",
        due_date: "",
        blood_group: "",
        emergency_contact: "",
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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        clearError();
        setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }));
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (formData.full_name.length < 2) errors.full_name = "Name must be at least 2 characters";
        if (!formData.email.includes("@")) errors.email = "Please enter a valid email";
        if (formData.password.length < 8) errors.password = "Password must be at least 8 characters";
        if (formData.password !== formData.confirm_password) errors.confirm_password = "Passwords do not match";
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => setStep(1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (step === 1) {
            handleNext();
            return;
        }

        try {
            const submitData: any = {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                confirm_password: formData.confirm_password,
                role: formData.role,
            };

            if (formData.phone) submitData.phone = formData.phone;
            if (formData.date_of_birth) {
                submitData.date_of_birth = formData.date_of_birth;
                const computedAge = calculateAge(formData.date_of_birth);
                if (computedAge) submitData.age = computedAge;
            }
            if (formData.pregnancy_week) submitData.pregnancy_week = parseInt(formData.pregnancy_week);
            if (formData.due_date) submitData.due_date = formData.due_date;
            if (formData.blood_group) submitData.blood_group = formData.blood_group;
            if (formData.emergency_contact) submitData.emergency_contact = formData.emergency_contact;

            await register(submitData);
            router.push("/dashboard");
        } catch {
            // Error is set in the store
        }
    };

    return (
        <div className="auth-container">
            {/* Left Visual Panel */}
            <div className="auth-visual">
                <div className="auth-visual-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
                <div className="auth-visual-content">
                    <h2>Join MatruSakhi Today</h2>
                    <p>
                        Begin your journey towards a healthier pregnancy. Get AI-powered
                        health guidance, track milestones, and receive timely alerts —
                        designed for you and your baby&apos;s well-being.
                    </p>
                    <div style={{ marginTop: "2rem" }}>
                        {/* Step Indicators */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    background: step >= 1 ? "var(--gradient-primary)" : "var(--bg-glass)",
                                    color: step >= 1 ? "white" : "var(--text-muted)",
                                    border: step >= 1 ? "none" : "1px solid var(--border)",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                {step > 1 ? "✓" : "1"}
                            </div>
                            <div
                                style={{
                                    width: "60px",
                                    height: "3px",
                                    background: step >= 2 ? "var(--primary)" : "var(--border)",
                                    borderRadius: "2px",
                                    transition: "background 0.3s ease",
                                }}
                            />
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.9rem",
                                    fontWeight: 700,
                                    background: step >= 2 ? "var(--gradient-primary)" : "var(--bg-glass)",
                                    color: step >= 2 ? "white" : "var(--text-muted)",
                                    border: step >= 2 ? "none" : "1px solid var(--border)",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                2
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: "50px", marginTop: "8px" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Account</span>
                            <span style={{ fontSize: "0.8rem", color: step >= 2 ? "var(--text-secondary)" : "var(--text-muted)" }}>
                                Health Info
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="auth-form-side">
                <div className="auth-form-container">
                    {/* Logo */}
                    <div className="auth-logo animate-in">
                        <div className="auth-logo-icon">🤱</div>
                        <span className="auth-logo-text">MatruSakhi</span>
                    </div>

                    <h1 className="auth-title animate-in animate-in-delay-1">
                        {step === 1 ? "Create Account" : "Health Information"}
                    </h1>
                    <p className="auth-subtitle animate-in animate-in-delay-2">
                        {step === 1
                            ? "Enter your details to get started"
                            : "Help us personalize your experience (optional)"}
                    </p>

                    {error && (
                        <div className="auth-error animate-in">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form animate-in animate-in-delay-3">
                        {step === 1 ? (
                            <>
                                {/* Step 1: Account Info */}
                                <div className="form-group">
                                    <label className="form-label" htmlFor="full_name">Full Name *</label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g. Priya Sharma"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                        autoFocus
                                    />
                                    {fieldErrors.full_name && <span className="form-error">{fieldErrors.full_name}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="email">Email Address *</label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {fieldErrors.email && <span className="form-error">{fieldErrors.email}</span>}
                                </div>

                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="password">Password *</label>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                className="form-input"
                                                style={{ width: "100%", paddingRight: "42px" }}
                                                placeholder="Min 8 characters"
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                minLength={8}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                                                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1rem",
                                                }}
                                            >
                                                {showPassword ? "🙈" : "👁️"}
                                            </button>
                                        </div>
                                        {fieldErrors.password && <span className="form-error">{fieldErrors.password}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="confirm_password">Confirm Password *</label>
                                        <input
                                            id="confirm_password"
                                            name="confirm_password"
                                            type="password"
                                            className="form-input"
                                            placeholder="Repeat password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            required
                                        />
                                        {fieldErrors.confirm_password && (
                                            <span className="form-error">{fieldErrors.confirm_password}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="role">I am a... *</label>
                                    <select
                                        id="role"
                                        name="role"
                                        className="form-select"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        {ROLES.map((role) => (
                                            <option key={role.value} value={role.value}>
                                                {role.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button type="button" onClick={handleNext} className="btn btn-primary btn-lg btn-full">
                                    Continue →
                                </button>
                            </>
                        ) : (
                            <>
                                {/* Step 2: Health Info */}
                                <div className="auth-form-row">
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="phone">Phone Number</label>
                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            className="form-input"
                                            placeholder="+919876543210"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label" htmlFor="date_of_birth">
                                            Date of Birth
                                            {formData.date_of_birth && calculateAge(formData.date_of_birth) && (
                                                <span style={{
                                                    marginLeft: "8px",
                                                    fontSize: "0.8rem",
                                                    color: "var(--primary)",
                                                    fontWeight: 600,
                                                }}>
                                                    (Age: {calculateAge(formData.date_of_birth)} yrs)
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            id="date_of_birth"
                                            name="date_of_birth"
                                            type="date"
                                            className="form-input"
                                            max={new Date().toISOString().split("T")[0]}
                                            min="1960-01-01"
                                            value={formData.date_of_birth}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                {formData.role === "mother" && (
                                    <>
                                        <div className="auth-form-row">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="pregnancy_week">Pregnancy Week</label>
                                                <input
                                                    id="pregnancy_week"
                                                    name="pregnancy_week"
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="e.g. 20"
                                                    min="1"
                                                    max="42"
                                                    value={formData.pregnancy_week}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label" htmlFor="due_date">Expected Due Date</label>
                                                <input
                                                    id="due_date"
                                                    name="due_date"
                                                    type="date"
                                                    className="form-input"
                                                    value={formData.due_date}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="auth-form-row">
                                            <div className="form-group">
                                                <label className="form-label" htmlFor="blood_group">Blood Group</label>
                                                <select
                                                    id="blood_group"
                                                    name="blood_group"
                                                    className="form-select"
                                                    value={formData.blood_group}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select...</option>
                                                    {BLOOD_GROUPS.map((bg) => (
                                                        <option key={bg} value={bg}>
                                                            {bg}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label" htmlFor="emergency_contact">Emergency Contact</label>
                                                <input
                                                    id="emergency_contact"
                                                    name="emergency_contact"
                                                    type="tel"
                                                    className="form-input"
                                                    placeholder="+919876543210"
                                                    value={formData.emergency_contact}
                                                    onChange={handleChange}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: "flex", gap: "1rem" }}>
                                    <button type="button" onClick={handleBack} className="btn btn-secondary btn-lg" style={{ flex: "0 0 auto" }}>
                                        ← Back
                                    </button>
                                    <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={isLoading} id="register-submit-btn">
                                        {isLoading ? (
                                            <>
                                                <div className="spinner" />
                                                Creating account...
                                            </>
                                        ) : (
                                            "Create Account 🎉"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>

                    <p className="auth-footer animate-in animate-in-delay-4">
                        Already have an account?{" "}
                        <Link href="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
