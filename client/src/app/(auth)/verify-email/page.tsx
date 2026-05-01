"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided.");
            return;
        }

        verifyEmail(token);
    }, [token]);

    const verifyEmail = async (t: string) => {
        try {
            const res = await api.get(`/api/auth/verify-email?token=${t}`);
            if (res.data.already_verified) {
                setStatus("already");
                setMessage("Your email is already verified.");
            } else {
                setStatus("success");
                setMessage(res.data.message || "Email verified successfully!");
            }
        } catch (err: any) {
            setStatus("error");
            setMessage(
                err?.response?.data?.detail || "Verification failed. The link may have expired."
            );
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-visual">
                <div className="auth-visual-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
                <div className="auth-visual-content">
                    <h2>Email Verification</h2>
                    <p>Securing your MatruSakhi account</p>
                </div>
            </div>

            <div className="auth-form-side">
                <div className="auth-form-container" style={{ textAlign: "center" }}>
                    <div className="auth-logo animate-in">
                        <div className="auth-logo-icon">
                            {status === "loading" && "..."}
                            {status === "success" && "\u2705"}
                            {status === "already" && "\u2705"}
                            {status === "error" && "\u274c"}
                        </div>
                        <span className="auth-logo-text">MatruSakhi</span>
                    </div>

                    {status === "loading" && (
                        <div className="animate-in animate-in-delay-1">
                            <h1 className="auth-title">Verifying your email...</h1>
                            <div
                                className="spinner"
                                style={{
                                    margin: "2rem auto",
                                    width: 40,
                                    height: 40,
                                    borderColor: "var(--border)",
                                    borderTopColor: "var(--primary)",
                                }}
                            />
                            <p className="auth-subtitle">Please wait a moment</p>
                        </div>
                    )}

                    {status === "success" && (
                        <div className="animate-in animate-in-delay-1">
                            <h1 className="auth-title" style={{ color: "var(--success)" }}>
                                Email Verified!
                            </h1>
                            <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
                                {message} Your account is now fully activated. You can enjoy
                                all features of MatruSakhi.
                            </p>
                            <button
                                className="btn btn-primary btn-lg btn-full"
                                onClick={() => router.push("/dashboard")}
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === "already" && (
                        <div className="animate-in animate-in-delay-1">
                            <h1 className="auth-title">Already Verified</h1>
                            <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
                                {message} You can continue using MatruSakhi.
                            </p>
                            <button
                                className="btn btn-primary btn-lg btn-full"
                                onClick={() => router.push("/dashboard")}
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    )}

                    {status === "error" && (
                        <div className="animate-in animate-in-delay-1">
                            <h1 className="auth-title" style={{ color: "var(--danger)" }}>
                                Verification Failed
                            </h1>
                            <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
                                {message}
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <Link href="/login" className="btn btn-primary btn-lg btn-full">
                                    Go to Login
                                </Link>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                    Need a new link? Login and request a new verification email.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="auth-container"><div className="spinner" style={{ margin: "auto" }}></div></div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}
