"use client";

import { useState } from "react";
import { useWellnessStore } from "@/stores/wellnessStore";

export function DailyCheckInChat() {
    const { hasCompletedDailyCheckIn, setDailyStatus, completeCheckIn } = useWellnessStore();
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);

    if (hasCompletedDailyCheckIn) return null;

    const handleSkip = () => {
        completeCheckIn();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        setLoading(true);
        try {
            const res = await api.post("/api/health/daily-log", { text: inputValue });
            
            setDailyStatus({
                currentMood: res.data.inferred_mood,
                dailySymptoms: res.data.extracted_symptoms,
                aiWellnessTip: res.data.advice,
            });

            setTimeout(() => {
                completeCheckIn();
            }, 800);
        } catch (error) {
            console.error(error);
            // Fallback gracefully
            completeCheckIn();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999,
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(10, 5, 20, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem"
        }}>
            <div className="glass-card" style={{
                maxWidth: "450px",
                width: "100%",
                padding: "2rem",
                borderRadius: "var(--radius-xl)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                animation: "zoomIn 0.4s ease-out",
                boxShadow: "var(--shadow-lg), var(--shadow-glow)"
            }}>
                {/* Visual Anchor */}
                <div style={{
                    width: "70px",
                    height: "70px",
                    background: "var(--gradient-primary)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2rem",
                    marginBottom: "1.5rem",
                    animation: "bounce 2s infinite"
                }}>
                    👋
                </div>

                <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center", fontFamily: "var(--font-display)" }}>
                    Good Morning!
                </h1>
                
                <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "0.95rem" }}>
                    Take a deep breath. How are you sleeping, and are there any new feelings today?
                </p>

                <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <textarea 
                        className="form-input"
                        rows={3}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="I'm feeling a bit exhausted, but happy..."
                        disabled={loading}
                        style={{ resize: "none", padding: "1rem", borderRadius: "var(--radius-md)" }}
                    />
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                        <button 
                            type="submit" 
                            disabled={loading || !inputValue.trim()} 
                            className="btn-primary"
                            style={{ padding: "0.8rem", fontWeight: 600, width: "100%", opacity: (loading || !inputValue.trim()) ? 0.6 : 1 }}
                        >
                            {loading ? "Sakhi is reading..." : "Share with Sakhi"}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={handleSkip}
                            disabled={loading}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                padding: "0.8rem",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "color 0.2s"
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = "var(--text-primary)"}
                            onMouseOut={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                        >
                            Skip Check-In for Now
                        </button>
                    </div>
                </form>
            </div>

            <style jsx>{`
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
            `}</style>
        </div>
    );
}
