"use client";
import { useWellnessStore } from "@/stores/wellnessStore";

export function WellnessCard() {
    const { currentMood, dailySymptoms, aiWellnessTip } = useWellnessStore();

    if (!currentMood || currentMood === "Unknown") return null;

    return (
        <div className="bg-[#1a1025] rounded-2xl shadow-sm p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-bold mb-2">Today's Outlook: <span className="capitalize">{currentMood}</span></h3>
            
            {dailySymptoms.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                    {dailySymptoms.map(sym => (
                        <span key={sym} className="px-3 py-1 text-red-600 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(220, 38, 38, 0.1)" }}>
                            {sym}
                        </span>
                    ))}
                </div>
            )}
            
            <div className="p-4 rounded-xl mt-4" style={{ backgroundColor: "rgba(168, 85, 247, 0.1)" }}>
                <p className="font-medium inline-flex items-center gap-2" style={{ color: "var(--accent)" }}>
                    <span className="text-xl">✨</span> 
                    Sakhi's Advice: {aiWellnessTip}
                </p>
            </div>
        </div>
    );
}
