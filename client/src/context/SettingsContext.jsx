import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export function useSettings() {
    return useContext(SettingsContext);
}

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({ 
        system_name: "UniExam", 
        logo_url: "",
        use_temporary_slider_content: true,
        slider_items: []
    });

    const fetchSettings = async () => {
        try {
            const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
            // Hit the generic /settings endpoint (which is made public in admin.routes)
            const res = await fetch(`${API_BASE}/api/admin/settings`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                if (data.ok && data.data) {
                    setSettings({
                        system_name: data.data.system_name || "UniExam",
                        logo_url: data.data.logo_url || "",
                        use_temporary_slider_content: data.data.use_temporary_slider_content ?? true,
                        slider_items: data.data.slider_items || []
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        }
    };

    useEffect(() => {
        // Update document title and favicon dynamically
        if (settings.system_name) {
            document.title = settings.system_name;
        }
        if (settings.logo_url) {
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = settings.logo_url;
        }
    }, [settings]);

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}
