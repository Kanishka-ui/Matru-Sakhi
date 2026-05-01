"use client";

import { useState } from "react";

export function OcrUploadFlow() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loadingStage, setLoadingStage] = useState<number>(0);
    const [summary, setSummary] = useState<string | null>(null);

    const stages = [
        "📄 Scanning document securely...",
        "🔍 Reading medical parameters...",
        "✨ Sakhi is writing your simple summary..."
    ];

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setUploading(true);
        setLoadingStage(0);
        
        // Progressive UI timers independent of actual API speed to ensure perceived empathy
        const t1 = setTimeout(() => setLoadingStage(1), 2500);
        const t2 = setTimeout(() => setLoadingStage(2), 5500);

        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await api.post("/api/reports/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Extract the GenAI summary field specifically
            setSummary(res.data.analysis || "Report processed successfully.");
        } catch (err) {
            console.error(err);
            setSummary("Sorry, Sakhi couldn't process this document right now.");
        } finally {
            clearTimeout(t1);
            clearTimeout(t2);
            setUploading(false);
        }
    };

    return (
        <div className="glass-card p-6 shadow-xl border-t-4" style={{ borderColor: 'var(--primary)', borderRadius: '16px' }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>Upload Clinical Report</h2>
            
            {!uploading && !summary && (
                <form onSubmit={handleUpload} className="flex flex-col gap-4">
                    <p className="text-sm text-text-muted mb-2">Upload your medical report and Sakhi will translate it to simple English.</p>
                    <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="form-input p-3 block w-full text-sm border-gray-300"
                    />
                    <button type="submit" disabled={!file} className="btn-primary w-full py-3" style={{ fontWeight: 600 }}>
                        Translate using Sakhi AI
                    </button>
                </form>
            )}

            {uploading && (
                <div className="flex flex-col items-center justify-center p-8 min-h-[250px]">
                    <div className="breathing-circle"></div>
                    <p className="mt-8 mb-2 font-bold text-lg" style={{ color: 'var(--accent)' }}>
                        {stages[loadingStage]}
                    </p>
                    <p className="text-sm text-center italic text-text-muted">
                        "Let's take a deep breath together while I read this."
                    </p>
                </div>
            )}

            {summary && (
                <div className="animate-in fade-in zoom-in duration-500 bg-green-50 p-6 rounded-xl border border-green-200">
                    <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">✨</span> Sakhi's Summary
                    </h3>
                    <ul className="space-y-3 mb-6">
                        {summary.split('\n').map((line, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-green-900 font-medium">
                                <span className="text-green-500 mt-1">✓</span>
                                {line.replace(/^\d+\.\s*/, '')}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => {setSummary(null); setFile(null);}} className="btn-outline w-full py-2">
                        Upload Another Report
                    </button>
                </div>
            )}

            <style jsx>{`
                .breathing-circle {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: var(--primary);
                    box-shadow: 0 0 20px var(--primary);
                    animation: breathe 4s infinite ease-in-out;
                }
                @keyframes breathe {
                    0% { transform: scale(1); opacity: 0.6; }
                    50% { transform: scale(1.6); opacity: 1; box-shadow: 0 0 40px var(--primary); }
                    100% { transform: scale(1); opacity: 0.6; }
                }
            `}</style>
        </div>
    );
}
