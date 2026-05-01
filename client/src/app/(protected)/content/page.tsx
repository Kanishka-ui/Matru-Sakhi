"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Dropdown from "@/components/Dropdown";

const CATEGORIES = [
    { value: "", label: "All", icon: "📚" },
    { value: "nutrition", label: "Nutrition", icon: "🥗" },
    { value: "exercise", label: "Exercise", icon: "🏃" },
    { value: "mental_health", label: "Mental Health", icon: "🧠" },
    { value: "garbhasanskar", label: "Garbhasanskar", icon: "🙏" },
    { value: "dos_and_donts", label: "Dos & Don'ts", icon: "✅" },
    { value: "vaccination", label: "Vaccination", icon: "💉" },
    { value: "body_changes", label: "Body Changes", icon: "🤰" },
    { value: "clothing", label: "Clothing Tips", icon: "👗" },
    { value: "baby_development", label: "Baby Development", icon: "👶" },
    { value: "prenatal_care", label: "Prenatal Care", icon: "🩺" },
    { value: "labor_delivery", label: "Labor & Delivery", icon: "🏥" },
    { value: "postpartum", label: "Postpartum", icon: "🤱" },
    { value: "breastfeeding", label: "Breastfeeding", icon: "🍼" },
    { value: "danger_signs", label: "Danger Signs", icon: "🚨" },
];

const CATEGORY_COLORS: Record<string, string> = {
    nutrition: "#4ade80",
    exercise: "#60a5fa",
    mental_health: "#a78bfa",
    garbhasanskar: "#f59e0b",
    dos_and_donts: "#34d399",
    vaccination: "#f472b6",
    body_changes: "#fb923c",
    clothing: "#e879f9",
    baby_development: "#38bdf8",
    prenatal_care: "#6ee7b7",
    labor_delivery: "#fbbf24",
    postpartum: "#fb7185",
    breastfeeding: "#a3e635",
    danger_signs: "#ef4444",
};

export default function ContentPage() {
    const [content, setContent] = useState<any[]>([]);
    const [recommended, setRecommended] = useState<any[]>([]);
    const [category, setCategory] = useState("");
    const [search, setSearch] = useState("");
    const [selectedContent, setSelectedContent] = useState<any>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContent();
    }, [category, page]);

    useEffect(() => {
        loadRecommended();
    }, []);

    const loadContent = async () => {
        setLoading(true);
        try {
            const params: any = { page, page_size: 12 };
            if (category) params.category = category;
            if (search) params.search = search;
            const res = await api.get("/api/content/", { params });
            setContent(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const loadRecommended = async () => {
        try {
            const res = await api.get("/api/content/recommended?limit=6");
            setRecommended(res.data || []);
        } catch { /* ignore */ }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadContent();
    };

    const openContent = async (id: string) => {
        try {
            const res = await api.get(`/api/content/${id}`);
            setSelectedContent(res.data);
        } catch { /* ignore */ }
    };

    const likeContent = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.post(`/api/content/${id}/like`);
            loadContent();
            loadRecommended();
        } catch { /* ignore */ }
    };

    const getCategoryColor = (cat: string) => CATEGORY_COLORS[cat] || "var(--primary)";
    const getCategoryIcon = (cat: string) => CATEGORIES.find(c => c.value === cat)?.icon || "📄";

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Resources 📚</h1>
                <p className="page-subtitle">
                    Personalized articles, tips, and guides curated for your pregnancy journey
                </p>
            </div>

            {/* Recommended For You */}
            {recommended.length > 0 && !category && !search && (
                <div style={{ marginBottom: "2rem" }}>
                    <h2 style={{
                        fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 700,
                        marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        ✨ Recommended For You
                    </h2>
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                        gap: "1rem",
                    }}>
                        {recommended.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => openContent(item.id)}
                                style={{
                                    padding: "1.2rem",
                                    background: "var(--bg-card, #1a1025)",
                                    border: `1px solid ${getCategoryColor(item.category)}30`,
                                    borderRadius: "14px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    borderLeft: `3px solid ${getCategoryColor(item.category)}`,
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${getCategoryColor(item.category)}15`;
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>{getCategoryIcon(item.category)}</span>
                                    <span style={{
                                        fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase",
                                        color: getCategoryColor(item.category), letterSpacing: "0.05em",
                                    }}>
                                        {item.category?.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: "0.92rem", marginBottom: "6px", lineHeight: 1.4 }}>
                                    {item.title}
                                </div>
                                <div style={{ color: "var(--text-muted)", fontSize: "0.8rem", lineHeight: 1.5 }}>
                                    {item.body?.substring(0, 100)}...
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search & Filter */}
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "250px" }}>
                    <input
                        className="form-input"
                        placeholder="Search articles..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>Search</button>
                </form>
                <Dropdown
                    align="right"
                    trigger={
                        <button className="btn btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            {category ? `${getCategoryIcon(category)} ${CATEGORIES.find(c => c.value === category)?.label}` : "📚 All Categories"}
                            <span style={{ fontSize: "0.7rem" }}>{"▾"}</span>
                        </button>
                    }
                    items={CATEGORIES.map((cat) => ({
                        label: `${cat.icon} ${cat.label}`,
                        icon: "",
                        onClick: () => { setCategory(cat.value); setPage(1); },
                    }))}
                />
            </div>

            {/* Category Scroll */}
            <div style={{
                display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem",
                paddingBottom: "0.5rem",
            }}>
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => { setCategory(cat.value); setPage(1); }}
                        style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: category === cat.value
                                ? `2px solid ${cat.value ? getCategoryColor(cat.value) : "var(--primary)"}`
                                : "1px solid var(--border)",
                            background: category === cat.value
                                ? `${cat.value ? getCategoryColor(cat.value) : "var(--primary)"}20`
                                : "var(--bg-glass)",
                            color: category === cat.value
                                ? (cat.value ? getCategoryColor(cat.value) : "var(--primary)")
                                : "var(--text-secondary)",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: category === cat.value ? 600 : 400,
                            transition: "all 0.2s ease",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            {loading ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                    <div className="spinner" style={{ margin: "0 auto", width: 32, height: 32, borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
                </div>
            ) : content.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📚</div>
                    <div className="empty-state-title">No content found</div>
                    <div className="empty-state-text">Try a different category or search term.</div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: "0.75rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        Showing {content.length} of {total} articles
                        {category && ` in ${CATEGORIES.find(c => c.value === category)?.label}`}
                    </div>
                    <div className="content-grid">
                        {content.map((item) => (
                            <div key={item.id} className="content-card" onClick={() => openContent(item.id)}
                                style={{ borderTop: `3px solid ${getCategoryColor(item.category)}` }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "1rem" }}>{getCategoryIcon(item.category)}</span>
                                    <span className="content-card-category" style={{ color: getCategoryColor(item.category) }}>
                                        {item.category?.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <div className="content-card-title">{item.title}</div>
                                <div className="content-card-body">{item.body?.substring(0, 130)}...</div>
                                <div className="content-card-footer">
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        {item.tags?.slice(0, 2).map((tag: string) => (
                                            <span key={tag} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                    <button
                                        onClick={(e) => likeContent(item.id, e)}
                                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "0.82rem" }}
                                    >
                                        ❤️ {item.likes || 0}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > 12 && (
                        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "2rem" }}>
                            <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                                ← Prev
                            </button>
                            <span style={{ display: "flex", alignItems: "center", color: "var(--text-muted)", fontSize: "0.88rem" }}>
                                Page {page} of {Math.ceil(total / 12)}
                            </span>
                            <button className="btn btn-secondary" onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)}>
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Content Detail Modal */}
            {selectedContent && (
                <div className="modal-overlay" onClick={() => setSelectedContent(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "1.2rem" }}>{getCategoryIcon(selectedContent.category)}</span>
                                    <span style={{
                                        padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600,
                                        background: `${getCategoryColor(selectedContent.category)}20`,
                                        color: getCategoryColor(selectedContent.category),
                                        textTransform: "uppercase",
                                    }}>
                                        {selectedContent.category?.replace(/_/g, " ")}
                                    </span>
                                </div>
                                <h2>{selectedContent.title}</h2>
                            </div>
                            <button className="modal-close" onClick={() => setSelectedContent(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="markdown-content" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                                {selectedContent.body}
                            </div>
                            {selectedContent.tags?.length > 0 && (
                                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {selectedContent.tags.map((tag: string) => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                                👁️ {selectedContent.views || 0} views • ❤️ {selectedContent.likes || 0} likes
                            </span>
                            <button className="btn btn-primary" onClick={() => { likeContent(selectedContent.id, { stopPropagation: () => { } } as any); }}>
                                ❤️ Like
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
