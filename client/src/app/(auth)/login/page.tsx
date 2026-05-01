"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";

export default function LoginPage() {
    const router = useRouter();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        clearError();
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login(formData);
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
                    <h2>Welcome Back to MatruSakhi</h2>
                    <p>
                        Your AI-powered maternal health companion. Track your pregnancy,
                        get personalized health insights, and connect with healthcare
                        providers — all in one place.
                    </p>
                    <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        {["🤰 Pregnancy Tracking", "🤖 AI Health Chat", "📊 Health Insights"].map((feature) => (
                            <span
                                key={feature}
                                style={{
                                    padding: "8px 16px",
                                    background: "rgba(255,255,255,0.06)",
                                    borderRadius: "var(--radius-full)",
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                {feature}
                            </span>
                        ))}
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

                    <h1 className="auth-title animate-in animate-in-delay-1">Sign In</h1>
                    <p className="auth-subtitle animate-in animate-in-delay-2">
                        Enter your credentials to access your account
                    </p>

                    {/* Error Alert */}
                    {error && (
                        <div className="auth-error animate-in">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="auth-form animate-in animate-in-delay-3">
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="form-input"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                autoComplete="email"
                                autoFocus
                            />
                        </div>

                        <div className="form-group">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className="form-label" htmlFor="password">
                                    Password
                                </label>
                                <Link
                                    href="/forgot-password"
                                    style={{ fontSize: "0.8rem", color: "var(--primary)", textDecoration: "none" }}
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    className="form-input"
                                    style={{ width: "100%", paddingRight: "48px" }}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    minLength={8}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        color: "var(--text-muted)",
                                        cursor: "pointer",
                                        fontSize: "1.1rem",
                                        padding: "4px",
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg btn-full"
                            disabled={isLoading}
                            id="login-submit-btn"
                        >
                            {isLoading ? (
                                <>
                                    <div className="spinner" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <p className="auth-footer animate-in animate-in-delay-4">
                        Don&apos;t have an account?{" "}
                        <Link href="/register">Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
