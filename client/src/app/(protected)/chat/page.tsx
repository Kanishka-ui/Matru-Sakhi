"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface Message {
    role: "user" | "assistant";
    content: string;
    timestamp?: string;
}

interface Conversation {
    id: string;
    title: string;
    message_count: number;
    last_message_preview: string;
}

export default function ChatPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadConversations = async () => {
        try {
            const res = await api.get("/api/chat/conversations");
            setConversations(res.data);
        } catch {
            // ignore
        }
    };

    const loadConversation = async (convId: string) => {
        try {
            const res = await api.get(`/api/chat/conversations/${convId}`);
            setActiveConvId(convId);
            setMessages(res.data.messages || []);
        } catch {
            // ignore
        }
    };

    const startNewChat = () => {
        setActiveConvId(null);
        setMessages([]);
        setInput("");
    };

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const userMsg = input.trim();
        setInput("");
        setSending(true);

        // Optimistic add
        setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

        try {
            const res = await api.post("/api/chat/send", {
                message: userMsg,
                conversation_id: activeConvId,
            });

            if (!activeConvId) {
                setActiveConvId(res.data.conversation_id);
            }

            setMessages((prev) => [
                ...prev.filter((m) => !(m.role === "user" && m.content === userMsg && !m.timestamp)),
                { role: "user", content: res.data.user_message.content, timestamp: res.data.user_message.timestamp },
                { role: "assistant", content: res.data.assistant_message.content, timestamp: res.data.assistant_message.timestamp },
            ]);

            loadConversations();
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
            ]);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const deleteConversation = async (convId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.delete(`/api/chat/conversations/${convId}`);
            setConversations((prev) => prev.filter((c) => c.id !== convId));
            if (activeConvId === convId) startNewChat();
        } catch {
            // ignore
        }
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">AI Health Chat 🤖</h1>
                <p className="page-subtitle">
                    Ask me anything about maternal health, nutrition, baby care, and more
                </p>
            </div>

            <div className="chat-layout">
                {/* Conversations Sidebar */}
                <div className="chat-sidebar">
                    <div className="chat-sidebar-header">
                        <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Chats</span>
                        <button onClick={startNewChat} className="btn btn-primary" style={{ padding: "6px 14px", fontSize: "0.8rem" }}>
                            + New
                        </button>
                    </div>
                    <div className="chat-sidebar-list">
                        {conversations.length === 0 ? (
                            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                                No conversations yet
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <div
                                    key={conv.id}
                                    className={`chat-sidebar-item ${activeConvId === conv.id ? "active" : ""}`}
                                    onClick={() => loadConversation(conv.id)}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div className="chat-sidebar-item-title">{conv.title}</div>
                                        <button
                                            onClick={(e) => deleteConversation(conv.id, e)}
                                            style={{
                                                background: "none", border: "none", color: "var(--text-muted)",
                                                cursor: "pointer", fontSize: "0.75rem", opacity: 0.5, padding: "2px 4px",
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="chat-sidebar-item-preview">{conv.last_message_preview}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-container" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", padding: "1rem" }}>
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="empty-state">
                                <div className="empty-state-icon">🤱</div>
                                <div className="empty-state-title">Start a conversation</div>
                                <div className="empty-state-text">
                                    Ask me about pregnancy, nutrition, exercise, baby care, or any health concern. I&apos;m here to help!
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center", flexWrap: "wrap", marginTop: "0.5rem" }}>
                                    {(() => {
                                        const week = user?.profile?.pregnancy_week;
                                        let faqs = ["How can I manage stress?", "What are good pregnancy exercises?", "Any tips for better sleep?"];
                                        
                                        if (week) {
                                            if (week <= 6) faqs = ["Is cramping normal early on?", `What should I eat in week ${week}?`, "How to handle morning sickness?"];
                                            else if (week <= 9) faqs = ["How can I stop nausea?", "When is the first ultrasound?", "Are mood swings normal now?"];
                                            else if (week <= 13) faqs = ["When does the 2nd trimester start?", "Is my tiredness normal?", "What foods to avoid?"];
                                            else if (week <= 17) faqs = ["When will I feel baby kicks?", "How to sleep more comfortably?", "Can I travel during pregnancy?"];
                                            else if (week <= 21) faqs = ["What is the anatomy scan?", "How to handle back pain?", `Is baby's growth normal for week ${week}?`];
                                            else if (week <= 26) faqs = ["What is gestational diabetes?", "Tips for leg cramps at night?", "How to prepare the nursery?"];
                                            else if (week <= 31) faqs = ["How to count approximate kicks?", "Is Braxton Hicks dangerous?", "How to relieve heartburn?"];
                                            else if (week <= 36) faqs = ["What should I pack for the hospital?", "How to deal with pelvic pressure?", "Signs of preterm labor?"];
                                            else faqs = ["How to differentiate real and fake labor?", "What happens if water breaks?", "How can I naturally induce labor?"];
                                        }
                                        
                                        return faqs.map((q) => (
                                            <button
                                                key={q}
                                                className="btn btn-secondary"
                                                style={{ fontSize: "0.8rem", padding: "6px 14px" }}
                                                onClick={() => { setInput(q); }}
                                            >
                                                {q}
                                            </button>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role}`}>
                                <div className="chat-message-avatar">
                                    {msg.role === "user" ? "👤" : "🤖"}
                                </div>
                                <div className="chat-message-content">
                                    {msg.content.split("\n").map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            {i < msg.content.split("\n").length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {sending && (
                            <div className="chat-message assistant">
                                <div className="chat-message-avatar">🤖</div>
                                <div className="chat-message-content" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div className="spinner" style={{ width: 16, height: 16, borderColor: "var(--border)", borderTopColor: "var(--accent)" }} />
                                    Thinking...
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input
                            className="form-input"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={sending}
                            autoFocus
                        />
                        <button
                            className="btn btn-primary"
                            onClick={sendMessage}
                            disabled={sending || !input.trim()}
                        >
                            {sending ? "..." : "Send →"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
