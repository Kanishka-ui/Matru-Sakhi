"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

interface DropdownItem {
    label: string;
    icon?: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    divider?: boolean;
}

interface DropdownProps {
    trigger: ReactNode;
    items: DropdownItem[];
    align?: "left" | "right";
}

export default function Dropdown({ trigger, items, align = "right" }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
            <div
                onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                style={{ cursor: "pointer" }}
            >
                {trigger}
            </div>

            {open && (
                <div
                    style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        [align === "right" ? "right" : "left"]: 0,
                        minWidth: "180px",
                        background: "var(--bg-card, #1a1025)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        zIndex: 999,
                        overflow: "hidden",
                        animation: "dropdownFadeIn 0.15s ease",
                    }}
                >
                    {items.map((item, i) =>
                        item.divider ? (
                            <div key={i} style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                        ) : (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.disabled) {
                                        item.onClick();
                                        setOpen(false);
                                    }
                                }}
                                disabled={item.disabled}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    width: "100%",
                                    padding: "10px 14px",
                                    background: "none",
                                    border: "none",
                                    color: item.danger ? "var(--danger, #ef4444)" : "var(--text-secondary, #c4b5d0)",
                                    fontSize: "0.85rem",
                                    cursor: item.disabled ? "not-allowed" : "pointer",
                                    opacity: item.disabled ? 0.5 : 1,
                                    textAlign: "left",
                                    transition: "background 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    (e.target as HTMLElement).style.background = "var(--bg-glass, rgba(255,255,255,0.05))";
                                }}
                                onMouseLeave={(e) => {
                                    (e.target as HTMLElement).style.background = "none";
                                }}
                            >
                                {item.icon && <span style={{ fontSize: "1rem", width: "20px", textAlign: "center" }}>{item.icon}</span>}
                                <span>{item.label}</span>
                            </button>
                        )
                    )}
                </div>
            )}

            <style jsx>{`
                @keyframes dropdownFadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
