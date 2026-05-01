"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";

export function GeoSosSlider() {
    const [sliderValue, setSliderValue] = useState(0);
    const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
    const { location, requestLocation } = useGeolocation();

    useEffect(() => {
        // Pre-fetch location permission silently when component mounts
        requestLocation();
    }, [requestLocation]);

    const handleRelease = async () => {
        if (sliderValue > 95) {
            triggerSOS();
        } else {
            setSliderValue(0); // Snap back if not fully slid
        }
    };

    const triggerSOS = async () => {
        setStatus("sending");
        try {
            // Force an immediate live read upon trigger if possible
            const liveLoc = await requestLocation();
            await api.post("/api/sos/trigger", {
                latitude: liveLoc?.lat || location?.lat || 0,
                longitude: liveLoc?.lng || location?.lng || 0
            });
            setStatus("sent");
            setTimeout(() => {
                setSliderValue(0);
                setStatus("idle");
            }, 3000);
        } catch (err) {
            console.error("SOS Trigger Failed", err);
            setStatus("idle");
            setSliderValue(0);
            alert("Failed to trigger SOS. Call emergency services directly.");
        }
    };

    if (status === "sent") {
        return (
            <div className="bg-[#2d1b1b] text-red-400 font-bold p-4 rounded-2xl w-full text-center border-2 border-red-500 animate-pulse">
                🚨 SOS Geo-Alert Dispatched Successfully! Help is notified.
            </div>
        );
    }

    return (
        <div className="relative bg-[#1a1025] border border-[rgba(232,93,117,0.2)] rounded-full h-16 w-full max-w-sm mx-auto shadow-sm overflow-hidden flex items-center">
            <div className="absolute inset-x-0 text-center text-gray-400 font-semibold pointer-events-none z-0 tracking-wide text-sm">
                {status === "sending" ? "Dispatching..." : "Slide right to trigger SOS"}
            </div>
            
            {/* The sliding track filler */}
            <div 
                className="absolute left-0 top-0 bottom-0 bg-[rgba(232,93,117,0.15)] z-0"
                style={{ width: `${sliderValue}%` }}
            />

            <input 
                type="range" 
                min="0" 
                max="100" 
                value={sliderValue} 
                disabled={status === "sending"}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                onMouseUp={handleRelease}
                onTouchEnd={handleRelease}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />
            
            <div 
                className={`h-12 w-12 rounded-full absolute bg-gradient-to-br from-red-500 to-red-600 shadow-md flex items-center justify-center transition-transform pointer-events-none z-10`}
                style={{ 
                    left: `calc(${sliderValue}% - ${sliderValue > 0 ? (sliderValue / 100) * 48 : 0}px)`, 
                    marginLeft: "8px" 
                }}
            >
                <span className="text-white text-xl">🚨</span>
            </div>
        </div>
    );
}
