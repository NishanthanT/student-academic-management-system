import React from 'react';

/* ─── Hardcoded Temporary Slider Content ─── */
const TEMP_SLIDES = [
    {
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&q=90",
        badge: "Digital Learning",
        headline: "Learn Without Limits",
        sub: "Access your courses, assessments, and results from any device — anytime, anywhere.",
    },
    {
        image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1600&q=90",
        badge: "Smart Assessment",
        headline: "Intelligent Exam Management",
        sub: "AI-powered tools that streamline exam creation, delivery, and automated grading at scale.",
    },
    {
        image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1600&q=90",
        badge: "Secure Platform",
        headline: "Built for Modern Education",
        sub: "End-to-end encrypted, real-time monitored — every examination protected with enterprise-grade security.",
    },
    {
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=1600&q=90",
        badge: "Future of EdTech",
        headline: "Technology Meets Academia",
        sub: "Empowering universities with cutting-edge digital infrastructure for the next generation of learners.",
    },
    {
        image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=1600&q=90",
        badge: "Student Success",
        headline: "Your Academic Journey, Digitised",
        sub: "Track your progress, view results instantly, and stay ahead with a fully connected academic portal.",
    },
];

const SLIDE_DUR = 6; // seconds per slide

export default function AuthSlider({ settings }) {
    const useTemp = settings?.use_temporary_slider_content ?? true;
    const customItems = settings?.slider_items || [];

    // Decide which slides to show
    const slides = (useTemp || customItems.length === 0) ? TEMP_SLIDES : customItems;
    const SLIDE_COUNT = slides.length;
    const TOTAL_DUR = SLIDE_COUNT * SLIDE_DUR;

    return (
        <div className="slider-panel" style={{ '--sp-total': `${TOTAL_DUR}s` }}>
            {/* Top progress bar */}
            <div className="sp-progress" style={{ animationDuration: `${SLIDE_DUR}s` }} />

            {/* ── Background image slides ── */}
            {slides.map((s, i) => (
                <div
                    key={i}
                    className="sp-slide"
                    style={{
                        backgroundImage: `url('${s.image || s.image_url}')`,
                        animationDelay: `${i * SLIDE_DUR}s`,
                        animationDuration: `${TOTAL_DUR}s`
                    }}
                />
            ))}

            {/* ── Top-left UniExam brand watermark ── */}
            <div className="sp-brand">
                {settings?.logo_url ? (
                    <div className="sp-brand-icon" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                        <img src={settings.logo_url} alt="Logo" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                    </div>
                ) : (
                    <div className="sp-brand-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                    </div>
                )}
                <div className="sp-brand-text">
                    <div className="sp-brand-name">{settings?.system_name || "UniExam"}</div>
                    <div className="sp-brand-tag">Academic Portal</div>
                </div>
            </div>

            {/* ── Decorative floating tech chips ── */}
            <div className="sp-chip sp-chip-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                Live Results
            </div>
            <div className="sp-chip sp-chip-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                Secure
            </div>
            <div className="sp-chip sp-chip-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Real-time
            </div>

            {/* ── Text content per slide ── */}
            {slides.map((s, i) => (
                <div
                    key={i}
                    className="sp-text"
                    style={{
                        animationDelay: `${i * SLIDE_DUR}s`,
                        animationDuration: `${TOTAL_DUR}s`
                    }}
                >
                    <div className="sp-badge">
                        <span className="sp-live-dot" />
                        {s.badge}
                    </div>
                    <h2 className="sp-headline">{s.headline}</h2>
                    <p className="sp-sub">{s.sub || s.subtext}</p>
                </div>
            ))}

            {/* ── Slide counter 01 / 05 ── */}
            <div className="sp-counter">
                {slides.map((_, i) => (
                    <span
                        key={i}
                        className="sp-counter-num"
                        style={{
                            animationDelay: `${i * SLIDE_DUR}s`,
                            animationDuration: `${TOTAL_DUR}s`
                        }}
                    >
                        <strong>{String(i + 1).padStart(2, "0")}</strong>
                        <em>/{String(SLIDE_COUNT).padStart(2, "0")}</em>
                    </span>
                ))}
            </div>

            {/* ── Dot indicators ── */}
            <div className="sp-dots">
                {slides.map((_, i) => (
                    <div
                        key={i}
                        className="sp-dot-item"
                        style={{
                            animationDelay: `${i * SLIDE_DUR}s`,
                            '--sp-total': `${TOTAL_DUR}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
