"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        className="spinner"
        style={{
          width: 48,
          height: 48,
          borderColor: "var(--border)",
          borderTopColor: "var(--primary)",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
        Loading MatruSakhi...
      </span>
    </div>
  );
}
