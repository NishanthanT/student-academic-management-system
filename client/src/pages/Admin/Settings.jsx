import React, { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";

const API_BASE = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, "")
    : `http://${window.location.hostname}:8000`;

const CSS = `
.auth-settings { padding: 20px; font-family: 'Sora', sans-serif; }
.settings-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 600px; }
.settings-title { font-size: 18px; font-weight: 800; color: #1e293b; margin-bottom: 6px; letter-spacing: -0.01em; }
.settings-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; font-weight: 500; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em; margin-left: 2px; }
.form-input { 
    width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0; border-radius: 12px; 
    font-size: 13px; transition: all 0.2s; font-weight: 500;
}
.form-input:focus { outline: none; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
.logo-preview { 
    width: 60px; height: 60px; border: 1.5px solid #e2e8f0; border-radius: 12px; 
    margin-top: 10px; display: flex; align-items: center; justify-content: center; overflow: hidden;
    background: #f8fafc;
}
.logo-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.btn-save {
    background: #6366f1; color: white; border: none; padding: 10px 24px; 
    border-radius: 12px; font-weight: 800; cursor: pointer; transition: all 0.2s;
    font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em;
}
.btn-save:hover { background: #4f46e5; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
.alert { padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; }
.alert-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
.alert-error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }

[data-theme="dark"] .alert-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border-color: rgba(16, 185, 129, 0.3); }
[data-theme="dark"] .alert-error { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

/* Slider Styles */
.slider-section { margin-top: 40px; padding-top: 30px; border-top: 2px solid #f1f5f9; }
.slider-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; position: relative; }
.slider-card-delete { position: absolute; top: 15px; right: 15px; color: #ef4444; cursor: pointer; padding: 5px; }
.slider-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
.toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding: 16px; background: #f1f5f9; border-radius: 10px; }
.toggle-label { font-weight: 700; color: #1e293b; font-size: 14px; }
.toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.slider-round { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
.slider-round:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider-round { background-color: #6366f1; }
input:checked + .slider-round:before { transform: translateX(20px); }
.btn-add { background: #f1f5f9; color: #475569; border: 2px dashed #cbd5e1; padding: 15px; border-radius: 12px; width: 100%; font-weight: 600; cursor: pointer; margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-add:hover { background: #e2e8f0; color: #1e293b; }

[data-theme="dark"] .settings-card { background: #1e293b; border-color: #334155; }
[data-theme="dark"] .settings-title { color: #f1f5f9; }
[data-theme="dark"] .settings-sub { color: #94a3b8; }
[data-theme="dark"] .form-label { color: #cbd5e1; }
[data-theme="dark"] .form-input { background: #0f172a; border-color: #334155; color: #f8fafc; }
[data-theme="dark"] .logo-preview { background: #0f172a; border-color: #334155; }
[data-theme="dark"] .slider-section { border-color: #334155; }
[data-theme="dark"] .slider-card { background: #0f172a; border-color: #334155; }
[data-theme="dark"] .toggle-row { background: #0f172a; border: 1px solid #334155; }
[data-theme="dark"] .toggle-label { color: #f1f5f9; }
[data-theme="dark"] .btn-add { background: #0f172a; border-color: #334155; color: #94a3b8; }
[data-theme="dark"] .btn-add:hover { background: #1e293b; color: #f1f5f9; }
`;

export default function AdminSettings() {
    const { fetchSettings: refreshGlobalSettings } = useSettings();
    const [settings, setSettings] = useState({ system_name: "UniExam", logo_url: "" });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/settings`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.ok) {
                setSettings({
                    system_name: data.data.system_name || "UniExam",
                    logo_url: data.data.logo_url || "",
                    use_temporary_slider_content: data.data.use_temporary_slider_content ?? true,
                    slider_items: data.data.slider_items || []
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSettings({ ...settings, logo_url: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ type: "", text: "" });
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/api/admin/settings`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.ok) {
                setMsg({ type: "success", text: "Settings updated successfully! Changes applied across all pages." });
                refreshGlobalSettings(); // 👈 Trigger global refresh
            } else {
                setMsg({ type: "error", text: data.message });
            }
        } catch (err) {
            setMsg({ type: "error", text: "Failed to update settings" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="auth-settings">Loading...</div>;

    return (
        <div className="auth-settings">
            <style>{CSS}</style>
            <div className="settings-card">
                <h2 className="settings-title">System Settings</h2>
                <p className="settings-sub">Customize the portal's identity according to your institution.</p>

                {msg.text && (
                    <div className={`alert alert-${msg.type}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">System Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={settings.system_name}
                            onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
                            placeholder="e.g. UniExam Portal"
                         id="settings-input-1"/>
                    </div>

                    <div className="form-group">
                        <label className="form-label">System Logo</label>
                        <input
                            type="file"
                            className="form-input"
                            accept="image/*"
                            onChange={handleFileChange}
                         id="settings-input-2"/>
                        <div className="logo-preview" style={{ width: "80px", height: "80px" }}>
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo Preview" />
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                            )}
                        </div>
                    </div>

                    {/* ── Auth Slider Section ── */}
                    <div className="slider-section">
                        <h3 className="settings-title" style={{ fontSize: '17px' }}>Auth Page Slider Customization</h3>
                        <p className="settings-sub" style={{ marginBottom: '16px' }}>Manage images and text for Login, Forgot Password, and Reset Password pages.</p>

                        <div className="toggle-row">
                            <span className="toggle-label">Use Temporary Slider Content</span>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={settings.use_temporary_slider_content}
                                    onChange={(e) => setSettings({ ...settings, use_temporary_slider_content: e.target.checked })}
                                 id="settings-input-3"/>
                                <span className="slider-round"></span>
                            </label>
                        </div>

                        {!settings.use_temporary_slider_content && (
                            <div className="slider-list">
                                {settings.slider_items.map((item, idx) => (
                                    <div key={idx} className="slider-card">
                                        <div className="slider-card-delete" onClick={() => {
                                            const newItems = [...settings.slider_items];
                                            newItems.splice(idx, 1);
                                            setSettings({ ...settings, slider_items: newItems });
                                        }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </div>

                                        <div className="slider-grid">
                                            <div className="form-group">
                                                <label className="form-label">Image</label>
                                                <input
                                                    type="file"
                                                    className="form-input"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => {
                                                                const newItems = [...settings.slider_items];
                                                                newItems[idx].image_url = reader.result;
                                                                setSettings({ ...settings, slider_items: newItems });
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                 id="settings-input-4"/>
                                                <div className="logo-preview" style={{ width: '100%', height: '100px' }}>
                                                    {item.image_url ? <img src={item.image_url} alt="Slide Preview" /> : "No Image"}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="form-group">
                                                    <label className="form-label">Badge (Small Text)</label>
                                                    <input
                                                        type="text" className="form-input"
                                                        value={item.badge}
                                                        onChange={(e) => {
                                                            const newItems = [...settings.slider_items];
                                                            newItems[idx].badge = e.target.value;
                                                            setSettings({ ...settings, slider_items: newItems });
                                                        }}
                                                        placeholder="e.g. Smart Assessment"
                                                     id="settings-input-5"/>
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Headline (Main Title)</label>
                                                    <input
                                                        type="text" className="form-input"
                                                        value={item.headline}
                                                        onChange={(e) => {
                                                            const newItems = [...settings.slider_items];
                                                            newItems[idx].headline = e.target.value;
                                                            setSettings({ ...settings, slider_items: newItems });
                                                        }}
                                                        placeholder="e.g. Future of EdTech"
                                                     id="settings-input-6"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label className="form-label">Subtext (Description)</label>
                                            <textarea
                                                className="form-input"
                                                style={{ height: '60px', resize: 'none' }}
                                                value={item.subtext}
                                                onChange={(e) => {
                                                    const newItems = [...settings.slider_items];
                                                    newItems[idx].subtext = e.target.value;
                                                    setSettings({ ...settings, slider_items: newItems });
                                                }}
                                                placeholder="Enter a brief description..."
                                             id="settings-textarea-1"/>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn-add" onClick={() => {
                                    setSettings({
                                        ...settings,
                                        slider_items: [
                                            ...settings.slider_items,
                                            { image_url: "", badge: "", headline: "", subtext: "" }
                                        ]
                                    });
                                }} id="settings-button-1">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                    Add New Slide
                                </button>
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-save" disabled={saving} style={{ marginTop: '20px' }} id="settings-button-2">
                        {saving ? "Saving..." : "Save Settings"}
                    </button>
                </form>
            </div>
        </div>
    );
}
