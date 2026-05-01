import { useState, useCallback } from "react";

export function useGeolocation() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

    const requestLocation = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by your browser");
            return null;
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(coords);
                    resolve(coords);
                },
                (err) => {
                    console.warn("Geolocation error:", err.message);
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        });
    }, []);

    return { location, requestLocation };
}
