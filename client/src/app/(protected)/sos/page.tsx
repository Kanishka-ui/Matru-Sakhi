"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";

interface SOSAlert {
    id: string;
    severity: number;
    severity_name: string;
    severity_color: string;
    message: string;
    location_url: string | null;
    status: string;
    notified_contacts: { name: string; phone: string; sms_sent: boolean; voice_called: boolean }[];
    voice_call_made: boolean;
    created_at: string;
}

const SEVERITY_CONFIG = [
    {
        level: 1,
        name: "Need Help",
        icon: "\ud83d\udfe1",
        color: "#eab308",
        bg: "rgba(234,179,8,0.1)",
        border: "rgba(234,179,8,0.3)",
        description: "I feel unwell and need someone to check on me",
        instruction: "Tap once to send",
        triggerType: "tap",
    },
    {
        level: 2,
        name: "Urgent",
        icon: "\ud83d\udfe0",
        color: "#f97316",
        bg: "rgba(249,115,22,0.1)",
        border: "rgba(249,115,22,0.3)",
        description: "I need urgent help, please come quickly",
        instruction: "Press & hold for 3 seconds",
        triggerType: "hold-3s",
    },
    {
        level: 3,
        name: "Emergency",
        icon: "\ud83d\udd34",
        color: "#ef4444",
        bg: "rgba(239,68,68,0.15)",
        border: "rgba(239,68,68,0.4)",
        description: "Medical emergency \u2014 call ambulance & come now",
        instruction: "Press & hold for 5+ seconds or triple-tap",
        triggerType: "hold-5s-or-triple",
    },
];

export default function SOSPage() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(true);
    const [locationError, setLocationError] = useState("");
    const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
    const [history, setHistory] = useState<SOSAlert[]>([]);
    const [sending, setSending] = useState(false);
    const [sentAlert, setSentAlert] = useState<SOSAlert | null>(null);
    const [holdProgress, setHoldProgress] = useState(0);
    const [holdingSeverity, setHoldingSeverity] = useState<number | null>(null);
    // Manual location URL input
    const [locationUrl, setLocationUrl] = useState("");
    const [showUrlInput, setShowUrlInput] = useState(false);

    const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
    const holdStart = useRef<number>(0);
    const tapCount = useRef(0);
    const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggered = useRef(false);

    // Get GPS location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationLoading(false);
                },
                (err) => {
                    setLocationError("Could not get your location. You can paste a Google Maps URL below.");
                    setLocationLoading(false);
                    setShowUrlInput(true);
                    console.error("Geolocation error:", err);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setLocationError("Geolocation not supported. You can paste a Google Maps URL below.");
            setLocationLoading(false);
            setShowUrlInput(true);
        }
    }, []);

    // Apply location from URL
    const applyLocationUrl = () => {
        if (locationUrl.trim()) {
            // Store the URL to use directly in SMS
            setLocation({ lat: 0, lng: 0 }); // Dummy values, we'll use URL directly
            setLocationError("");
            setShowUrlInput(false);
        } else {
            alert("Please enter a valid Google Maps URL");
        }
    };

    // Fetch active alert and history
    const fetchData = useCallback(async () => {
        try {
            const [activeRes, historyRes] = await Promise.all([
                api.get("/api/sos/active"),
                api.get("/api/sos/history?limit=10"),
            ]);
            setActiveAlert(activeRes.data.active_alert || null);
            setHistory(historyRes.data.items || []);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── Geo-SOS Trigger ────────────────────────────────────
    const triggerSOS = async (severity: number) => {
        if (sending || triggered.current) return;
        triggered.current = true;
        setSending(true);

        try {
            // 1. Live Fetch Exact Latitude and Longitude upon triggering
            let liveLat: number | null = null;
            let liveLng: number | null = null;
            
            if (navigator.geolocation) {
                try {
                    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { 
                            enableHighAccuracy: true, 
                            timeout: 10000, 
                            maximumAge: 0
                        });
                    });
                    liveLat = pos.coords.latitude;
                    liveLng = pos.coords.longitude;
                    console.log("[SOS] GPS Location obtained:", liveLat, liveLng);
                    setLocation({ lat: liveLat, lng: liveLng });
                } catch (geoErr: any) {
                    console.error("[SOS] GPS Error:", geoErr);
                    // Show specific error message based on error code
                    if (geoErr.code === 1) {
                        alert("Location access denied. Please allow location access in your browser settings to send GPS with SOS.");
                    } else if (geoErr.code === 2) {
                        alert("Location unavailable. Please check your device GPS settings.");
                    } else if (geoErr.code === 3) {
                        alert("Location request timed out. Please try again.");
                    }
                }
            } else {
                alert("Geolocation is not supported by your browser.");
            }

            // Play alarm for Level 3
            if (severity === 3) {
                playAlarm();
            }

            // 2. Dispatch the HTTP Payload
            const payload: any = { severity };
            
            // Use custom location URL if available, otherwise use coordinates
            if (locationUrl) {
                payload.location_url = locationUrl;
                console.log("[SOS] Sending with custom location URL:", locationUrl);
            } else if (liveLat && liveLng) {
                payload.latitude = liveLat;
                payload.longitude = liveLng;
                console.log("[SOS] Sending with coordinates:", { latitude: liveLat, longitude: liveLng });
            }
            
            const res = await api.post("/api/sos/trigger", payload);
            setSentAlert(res.data);
            setActiveAlert(res.data);

            // For Level 3, also try to initiate a phone call via browser
            if (severity === 3 && res.data.notified_contacts?.length > 0) {
                const firstContact = res.data.notified_contacts[0];
                if (firstContact.phone) {
                    // Open phone dialer as fallback
                    setTimeout(() => {
                        window.open(`tel:${firstContact.phone}`, "_blank");
                    }, 2000);
                }
            }
        } catch (err: any) {
            alert(err?.response?.data?.detail || "SOS failed. Please call 108 directly.");
        } finally {
            setSending(false);
            setTimeout(() => { triggered.current = false; }, 3000);
        }
    };

    // ─── Hold Gesture Handler ───────────────────────────────
    const handleHoldStart = (severity: number) => {
        holdStart.current = Date.now();
        setHoldingSeverity(severity);
        triggered.current = false;

        holdTimer.current = setInterval(() => {
            const elapsed = (Date.now() - holdStart.current) / 1000;
            const requiredTime = severity === 3 ? 5 : 3;
            const progress = Math.min((elapsed / requiredTime) * 100, 100);
            setHoldProgress(progress);

            if (progress >= 100 && !triggered.current) {
                clearInterval(holdTimer.current!);
                setHoldProgress(0);
                setHoldingSeverity(null);
                // Vibrate if supported
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                triggerSOS(severity);
            }
        }, 50);
    };

    const handleHoldEnd = () => {
        if (holdTimer.current) {
            clearInterval(holdTimer.current);
            holdTimer.current = null;
        }
        setHoldProgress(0);
        setHoldingSeverity(null);
    };

    // ─── Triple-tap handler for Level 3 ─────────────────────
    const handleTripleTap = () => {
        tapCount.current++;
        if (tapTimer.current) clearTimeout(tapTimer.current);

        if (tapCount.current >= 3) {
            tapCount.current = 0;
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            triggerSOS(3);
            return;
        }

        tapTimer.current = setTimeout(() => {
            tapCount.current = 0;
        }, 600);
    };

    // ─── Level 1 tap handler ────────────────────────────────
    const handleLevel1Tap = () => {
        if (!confirm("Send a 'Need Help' alert to your emergency contacts with your GPS location?")) return;
        triggerSOS(1);
    };

    // ─── Resolve / Cancel ───────────────────────────────────
    const resolveAlert = async () => {
        if (!activeAlert) return;
        try {
            await api.post(`/api/sos/${activeAlert.id}/resolve`);
            setSentAlert(null);
            setActiveAlert(null);
            await fetchData();
        } catch {
            alert("Failed to resolve alert.");
        }
    };

    const cancelAlert = async () => {
        if (!activeAlert) return;
        if (!confirm("Cancel this alert? Your contacts will be notified it was a false alarm.")) return;
        try {
            await api.post(`/api/sos/${activeAlert.id}/cancel`);
            setSentAlert(null);
            setActiveAlert(null);
            await fetchData();
        } catch {
            alert("Failed to cancel alert.");
        }
    };

    // ─── Alarm Sound ────────────────────────────────────────
    const playAlarm = () => {
        try {
            const ctx = new AudioContext();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.type = "square";
            gain.gain.value = 0.3;

            // Siren effect
            const now = ctx.currentTime;
            for (let i = 0; i < 6; i++) {
                oscillator.frequency.setValueAtTime(800, now + i * 0.5);
                oscillator.frequency.setValueAtTime(1200, now + i * 0.5 + 0.25);
            }
            oscillator.start(now);
            oscillator.stop(now + 3);
        } catch {
            // Audio not supported
        }
    };

    // ─── Active Alert View ──────────────────────────────────
    if (sentAlert || activeAlert) {
        const alert = sentAlert || activeAlert;
        if (!alert) return null;
        const config = SEVERITY_CONFIG[alert.severity - 1];

        return (
            <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                <div
                    style={{
                        width: 120, height: 120, borderRadius: "50%",
                        background: config.bg, border: `3px solid ${config.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "3rem", marginBottom: "1.5rem",
                        boxShadow: `0 0 40px ${config.color}40`,
                        animation: "pulse 1.5s infinite",
                    }}
                >
                    {alert.severity === 3 ? "\ud83d\udea8" : config.icon}
                </div>

                <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", fontWeight: 700, marginBottom: "0.5rem", color: config.color }}>
                    {alert.severity === 3 ? "EMERGENCY ALERT SENT" : `${config.name} Alert Sent`}
                </h1>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "400px", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                    {alert.message}
                </p>

                {/* Contacts Notified */}
                <div className="glass-card" style={{ padding: "1.5rem", width: "100%", maxWidth: "440px", marginBottom: "1.5rem" }}>
                    <h3 style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                        {"\ud83d\udce2"} Contacts Notified
                    </h3>
                    {alert.notified_contacts.length === 0 ? (
                        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            No emergency contacts found. Please add contacts in your Profile.
                        </p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {alert.notified_contacts.map((c, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--bg-glass)", borderRadius: "8px" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>{c.name}</div>
                                        <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{c.phone}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <span style={{ fontSize: "0.75rem", color: c.sms_sent ? "var(--success)" : "var(--danger)" }}>
                                            {c.sms_sent ? "\u2705 SMS" : "\u274c SMS"}
                                        </span>
                                        {c.voice_called && (
                                            <span style={{ fontSize: "0.75rem", color: "var(--success)" }}>
                                                {"\ud83d\udcde"} Called
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Location */}
                {alert.location_url && (
                    <a
                        href={alert.location_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "6px",
                            color: "var(--primary)", fontSize: "0.88rem", marginBottom: "1.5rem",
                            textDecoration: "none",
                        }}
                    >
                        {"\ud83d\udccd"} View Shared Location on Map
                    </a>
                )}

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "1rem" }}>
                    <button className="btn btn-primary btn-lg" onClick={resolveAlert} style={{ background: "var(--success)" }}>
                        {"\u2705"} I&apos;m Safe Now
                    </button>
                    <button className="btn btn-secondary btn-lg" onClick={cancelAlert}>
                        Cancel Alert
                    </button>
                </div>

                {alert.severity === 3 && (
                    <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(239,68,68,0.1)", borderRadius: "10px", maxWidth: "440px" }}>
                        <p style={{ color: "var(--danger)", fontWeight: 600, fontSize: "0.88rem", marginBottom: "4px" }}>
                            {"\ud83d\ude91"} Need an ambulance?
                        </p>
                        <a href="tel:108" style={{ color: "white", fontSize: "1.2rem", fontWeight: 700, textDecoration: "none" }}>
                            Call 108 (Ambulance)
                        </a>
                    </div>
                )}
            </div>
        );
    }

    // ─── Main SOS View ──────────────────────────────────────
    return (
        <div>
            <div className="page-header" style={{ textAlign: "center" }}>
                <h1 className="page-title">{"\ud83c\udd98"} SOS Emergency Alert</h1>
                <p className="page-subtitle">
                    Send an alert to your emergency contacts with your GPS location
                </p>
            </div>

            {/* Location Status */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                {locationLoading ? (
                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {"\ud83d\udccd"} Getting your location...
                    </span>
                ) : location ? (
                    <span style={{ color: "var(--success)", fontSize: "0.85rem" }}>
                        {"\u2705"} GPS location ready
                    </span>
                ) : (
                    <span style={{ color: "var(--warning)", fontSize: "0.85rem" }}>
                        {"\u26a0\ufe0f"} {locationError}
                    </span>
                )}
            </div>

            {/* Manual Location URL Input */}
            {showUrlInput && (
                <div style={{ 
                    maxWidth: "500px", 
                    margin: "0 auto 1.5rem", 
                    padding: "1rem", 
                    background: "rgba(232,93,117,0.1)", 
                    borderRadius: "12px",
                    border: "1px solid rgba(232,93,117,0.3)"
                }}>
                    <p style={{ fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>
                        Paste Google Maps URL (Share location from Google Maps app):
                    </p>
                    <input
                        type="text"
                        placeholder="https://maps.google.com/?q=..."
                        value={locationUrl}
                        onChange={(e) => setLocationUrl(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "var(--input-bg)",
                            color: "var(--text-primary)",
                            fontSize: "0.85rem",
                            marginBottom: "0.75rem"
                        }}
                    />
                    <button
                        onClick={applyLocationUrl}
                        style={{
                            width: "100%",
                            padding: "0.5rem",
                            background: "linear-gradient(135deg, #e85d75, #c94b8a)",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "500"
                        }}
                    >
                        Use This Location URL
                    </button>
                    <p style={{ fontSize: "0.75rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                        Tip: Open Google Maps app → Tap your location → Share → Copy link
                    </p>
                </div>
            )}

            {/* Severity Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
                {SEVERITY_CONFIG.map((config) => (
                    <div
                        key={config.level}
                        className="glass-card"
                        style={{
                            padding: "1.5rem",
                            border: `2px solid ${holdingSeverity === config.level ? config.color : config.border}`,
                            position: "relative",
                            overflow: "hidden",
                            cursor: sending ? "wait" : "pointer",
                            transition: "all 0.3s ease",
                            userSelect: "none",
                            WebkitUserSelect: "none",
                        }}
                        onClick={() => {
                            if (config.level === 1) handleLevel1Tap();
                            if (config.level === 3) handleTripleTap();
                        }}
                        onMouseDown={() => {
                            if (config.level >= 2) handleHoldStart(config.level);
                        }}
                        onMouseUp={handleHoldEnd}
                        onMouseLeave={handleHoldEnd}
                        onTouchStart={() => {
                            if (config.level >= 2) handleHoldStart(config.level);
                        }}
                        onTouchEnd={handleHoldEnd}
                    >
                        {/* Hold progress bar */}
                        {holdingSeverity === config.level && holdProgress > 0 && (
                            <div style={{
                                position: "absolute", top: 0, left: 0, height: "4px",
                                width: `${holdProgress}%`,
                                background: config.color,
                                transition: "width 0.05s linear",
                                borderRadius: "2px",
                            }} />
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                            <div style={{
                                width: 56, height: 56, borderRadius: "50%",
                                background: config.bg, border: `2px solid ${config.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.8rem", flexShrink: 0,
                            }}>
                                {config.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <span style={{
                                        fontFamily: "var(--font-display)", fontWeight: 700,
                                        fontSize: "1.1rem", color: config.color,
                                    }}>
                                        Level {config.level}: {config.name}
                                    </span>
                                </div>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "6px", lineHeight: 1.4 }}>
                                    {config.description}
                                </p>
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    color: "var(--text-muted)", fontSize: "0.78rem",
                                }}>
                                    {config.level === 3 && <span>{"\ud83d\udcde"} Voice call</span>}
                                    {config.level === 3 && <span>{"\u2022"}</span>}
                                    <span>{"\ud83d\udce9"} SMS</span>
                                    <span>{"\u2022"}</span>
                                    <span>{"\ud83d\udccd"} GPS</span>
                                    <span>{"\u2022"}</span>
                                    <span style={{ fontStyle: "italic" }}>{config.instruction}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Dial */}
            <div className="glass-card" style={{ padding: "1.5rem", maxWidth: "500px", margin: "0 auto 2rem", textAlign: "center" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                    {"\ud83d\ude91"} Direct Emergency Numbers
                </h3>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    {[
                        { label: "Ambulance", number: "108", color: "#ef4444" },
                        { label: "Police", number: "100", color: "#3b82f6" },
                        { label: "Women Helpline", number: "181", color: "#8b5cf6" },
                    ].map((svc) => (
                        <a
                            key={svc.number}
                            href={`tel:${svc.number}`}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "10px 18px", borderRadius: "12px",
                                background: `${svc.color}15`, border: `1px solid ${svc.color}40`,
                                color: svc.color, textDecoration: "none",
                                fontWeight: 600, fontSize: "0.88rem",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {"\ud83d\udcde"} {svc.label} ({svc.number})
                        </a>
                    ))}
                </div>
            </div>

            {/* History */}
            {history.length > 0 && (
                <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
                        Past Alerts
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {history.map((h) => {
                            const cfg = SEVERITY_CONFIG[h.severity - 1];
                            return (
                                <div key={h.id} className="glass-card" style={{ padding: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{ fontSize: "1.2rem" }}>{cfg.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.88rem" }}>Level {h.severity}: {h.severity_name}</div>
                                            <div style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
                                                {new Date(h.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600,
                                        background: h.status === "resolved" ? "rgba(74,222,128,0.15)" : h.status === "cancelled" ? "rgba(156,163,175,0.15)" : `${cfg.color}15`,
                                        color: h.status === "resolved" ? "var(--success)" : h.status === "cancelled" ? "var(--text-muted)" : cfg.color,
                                        textTransform: "capitalize",
                                    }}>
                                        {h.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}
