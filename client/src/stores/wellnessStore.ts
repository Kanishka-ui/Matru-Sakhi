import { create } from "zustand";

interface WellnessState {
    currentMood: string;
    dailySymptoms: string[];
    aiWellnessTip: string;
    hasCompletedDailyCheckIn: boolean;

    setDailyStatus: (status: Partial<WellnessState>) => void;
    completeCheckIn: () => void;
}

export const useWellnessStore = create<WellnessState>((set) => ({
    currentMood: "Unknown",
    dailySymptoms: [],
    aiWellnessTip: "",
    hasCompletedDailyCheckIn: false,

    setDailyStatus: (status) =>
        set((state) => ({
            ...state,
            ...status,
        })),

    completeCheckIn: () =>
        set((state) => ({
            ...state,
            hasCompletedDailyCheckIn: true,
        })),
}));
