import React from 'react';
import { useSettings } from '../context/SettingsContext';

export default function Logo() {
    const { settings } = useSettings();
    const logo = settings?.logo_url;

    return (
        <div className="auth-logo">
            {logo ? (
                <div className="auth-logo-img-wrap">
                    <img src={logo} alt="Logo" className="auth-logo-img" />
                </div>
            ) : (
                <div className="auth-logo-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                </div>
            )}
            <div>
                <div className="auth-logo-name">{settings?.system_name || "UniExam"}</div>
                <div className="auth-logo-tag">Academic Portal</div>
            </div>
        </div>
    );
}
