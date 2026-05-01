import { create } from "zustand";
import api from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────

export interface UserProfile {
    pregnancy_week?: number | null;
    pregnancy_day?: number | null;
    pregnancy_display?: string | null;
    pregnancy_start_date?: string | null;
    trimester?: string | null;
    days_remaining?: number | null;
    total_days_pregnant?: number | null;
    due_date?: string | null;
    blood_group?: string | null;
    age?: number | null;
    height_cm?: number | null;
    pre_pregnancy_weight_kg?: number | null;
    emergency_contact?: string | null;
    emergency_contacts?: { name: string; phone: string; relation: string; }[] | null;
    emergency_contact_name?: string | null;
    emergency_contact_phone?: string | null;
    avatar_url?: string | null;
    preferred_language?: string;
    [key: string]: any; // Allow additional fields from backend
}

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    profile?: UserProfile;
    health_data?: {
        conditions: string[];
        allergies: string[];
        medications: string[];
        last_checkup?: string | null;
    };
    notifications?: {
        email_enabled: boolean;
        sms_enabled: boolean;
        push_enabled: boolean;
    };
    created_at?: string;
    last_login?: string | null;
}

export interface RegisterData {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone?: string;
    role?: string;
    age?: number;
    pregnancy_week?: number;
    due_date?: string;
    emergency_contacts?: { name: string; phone: string; relation: string; }[];
    blood_group?: string;
    emergency_contact?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    register: (data: RegisterData) => Promise<void>;
    login: (data: LoginData) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    clearError: () => void;
    updateProfile: (data: Partial<RegisterData>) => Promise<void>;
    changePassword: (currentPassword: string, newPassword: string, confirmNewPassword: string) => Promise<void>;
}

// ─── Store ─────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
    user: typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null,
    isAuthenticated: typeof window !== "undefined" ? !!localStorage.getItem("access_token") : false,
    isLoading: false,
    error: null,

    register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post("/api/auth/register", data);
            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            localStorage.setItem("user", JSON.stringify(user));

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || "Registration failed. Please try again.";
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    login: async (data: LoginData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post("/api/auth/login", data);
            const { access_token, refresh_token, user } = response.data;

            localStorage.setItem("access_token", access_token);
            localStorage.setItem("refresh_token", refresh_token);
            localStorage.setItem("user", JSON.stringify(user));

            set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || "Invalid email or password.";
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        set({ user: null, isAuthenticated: false, error: null });
    },

    fetchUser: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get("/api/auth/me");
            const user = response.data;
            localStorage.setItem("user", JSON.stringify(user));
            set({ user, isAuthenticated: true, isLoading: false });
        } catch {
            set({ user: null, isAuthenticated: false, isLoading: false });
        }
    },

    clearError: () => set({ error: null }),

    updateProfile: async (data: Partial<RegisterData>) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.put("/api/auth/profile", data);
            const user = response.data;
            localStorage.setItem("user", JSON.stringify(user));
            set({ user, isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || "Profile update failed.";
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },

    changePassword: async (currentPassword: string, newPassword: string, confirmNewPassword: string) => {
        set({ isLoading: true, error: null });
        try {
            await api.post("/api/auth/change-password", {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_new_password: confirmNewPassword,
            });
            set({ isLoading: false });
        } catch (error: any) {
            const message = error.response?.data?.detail || "Password change failed.";
            set({ error: message, isLoading: false });
            throw new Error(message);
        }
    },
}));
