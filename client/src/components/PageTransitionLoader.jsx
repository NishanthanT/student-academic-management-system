import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "../context/SettingsContext";
import { useTheme } from "../context/ThemeContext";

const STAGES = [
  { label: "Initialising secure environment", pct: 0 },
  { label: "Establishing encrypted connection", pct: 18 },
  { label: "Loading user configurations", pct: 36 },
  { label: "Verifying academic records", pct: 54 },
  { label: "Preparing examination portal", pct: 72 },
  { label: "Calibrating interface components", pct: 88 },
  { label: "All systems ready", pct: 100 },
];

const getPageMeta = (path) => {
  if (path === "/admin") return { name: "System Overview", portal: "Admin Portal" };
  if (path.includes("/admin/create-user")) return { name: "User Configuration", portal: "Admin Portal" };
  if (path.includes("/admin/view-users")) return { name: "User Directory", portal: "Admin Portal" };
  if (path.includes("/admin/create-subject")) return { name: "Curriculum Management", portal: "Admin Portal" };
  if (path.includes("/admin/assign-staff")) return { name: "Faculty Delegation", portal: "Admin Portal" };
  if (path.includes("/admin/exam-management")) return { name: "Examination Protocols", portal: "Admin Portal" };
  if (path.includes("/admin/settings")) return { name: "System Configuration", portal: "Admin Hub" };
  if (path === "/staff") return { name: "Faculty Dashboard", portal: "Staff Portal" };
  if (path.includes("/staff/my-subjects")) return { name: "Subject Portfolio", portal: "Staff Portal" };
  if (path.includes("/staff/exams")) return { name: "Assessment Management", portal: "Staff Portal" };
  if (path.includes("/staff/allow-students")) return { name: "Student Eligibility", portal: "Staff Portal" };
  if (path.includes("/staff/results")) return { name: "Result Publishing", portal: "Staff Portal" };
  if (path.includes("/staff/analysis")) return { name: "Performance Analytics", portal: "Staff Portal" };
  if (path.includes("/staff/feedback")) return { name: "Feedback Portal", portal: "Staff Portal" };
  if (path.includes("/staff/ApprovedExamNotice")) return { name: "Approved Exam Notices", portal: "Staff Portal" };
  if (path === "/student") return { name: "Academic Dashboard", portal: "Student Portal" };
  if (path.includes("/student/exam-notice")) return { name: "Official Notices", portal: "Student Portal" };
  if (path.includes("/student/attempt")) return { name: "Live Examination", portal: "Student Portal" };
  if (path.includes("/student/results")) return { name: "Academic Transcripts", portal: "Student Portal" };
  if (path.includes("/student/feedback")) return { name: "Help & Feedback", portal: "Student Portal" };
  return { name: "Loading Module", portal: "University Portal" };
};

// Tick marks SVG (drawn once)
function TickRing({ color, opacity = "0.3" }) {
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * 2 * Math.PI - Math.PI / 2;
    const major = i % 9 === 0;
    const r1 = 46, r2 = major ? 50 : 48;
    return {
      x1: (54 + r1 * Math.cos(a)).toFixed(1),
      y1: (54 + r1 * Math.sin(a)).toFixed(1),
      x2: (54 + r2 * Math.cos(a)).toFixed(1),
      y2: (54 + r2 * Math.sin(a)).toFixed(1),
      major,
    };
  });
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 108 108" style={{ top: "-6px", left: "-6px", width: "calc(100% + 12px)", height: "calc(100% + 12px)" }}>
      {ticks.map((t, i) => (
        <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
          stroke={color} strokeWidth={t.major ? "1.2" : "0.6"}
          opacity={t.major ? "0.4" : "0.2"} />
      ))}
    </svg>
  );
}

export default function PageTransitionLoader({ children }) {
  const location = useLocation();
  const { settings } = useSettings();
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [meta, setMeta] = useState(getPageMeta("/"));
  const rafRef = useRef(null);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  const isStudent = location.pathname.startsWith("/student");
  const isAdmin = location.pathname.startsWith("/admin");

  // Color tokens
  const color = isDark ? "#85B7EB" : "#185FA5";
  const colorLight = isDark ? "#378ADD" : "#B5D4F4";
  const bgCore = isDark ? "#0e1e35" : "#ffffff";
  const bgLoader = isDark ? "#07101f" : "#f5f6f8";
  const borderCore = isDark ? "#1e3050" : "#c8d4e8";
  const borderRing = isDark ? "#1a2840" : "#dde1ea";
  const textMuted = isDark ? "#2e4a6e" : "#94a3b8";
  const textPortal = isDark ? "#4a6a9a" : "#6b7fa3";
  const bgBadge = isDark ? "#0e1e35" : "#E6F1FB";
  const borderBadge = isDark ? "#1e3050" : "#B5D4F4";

  useEffect(() => {
    const newMeta = getPageMeta(location.pathname);
    setMeta(newMeta);
    setProgress(0);
    setStageIdx(0);
    setLoading(true);

    const DURATION = 1000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const raw = Math.min(elapsed / DURATION, 1);
      const eased = 1 - Math.pow(1 - raw, 2.4);
      const pct = Math.round(eased * 100);
      setProgress(pct);
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (pct >= STAGES[i].pct) { setStageIdx(i); break; }
      }
      if (raw < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        timerRef.current = setTimeout(() => setLoading(false), 120);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  // Lock scroll on parent when loading
  useEffect(() => {
    if (loading && containerRef.current?.parentElement) {
      const parent = containerRef.current.parentElement;
      const originalOverflow = parent.style.overflow;
      parent.style.overflow = "hidden";
      return () => {
        parent.style.overflow = originalOverflow;
      };
    }
  }, [loading]);

  const sessions = isStudent
    ? ["Encrypted", "Timed Session", "Verified"]
    : isAdmin
      ? ["Encrypted", "Admin Access", "Audit Log"]
      : ["Encrypted", "Staff Access", "Verified"];

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col flex-1">
      {loading && (
        <div
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: bgLoader }}
        >
          {/* Corner accents */}
          {[
            "top-[32px] left-[32px]",
            "top-[32px] right-[32px] scale-x-[-1]",
            "bottom-[32px] left-[32px] scale-y-[-1]",
            "bottom-[32px] right-[32px] scale-[-1]",
          ].map((pos, i) => (
            <div key={i} className={`absolute w-[18px] h-[18px] ${pos}`}>
              <div className="absolute top-0 left-0 w-full h-px" style={{ background: borderCore }} />
              <div className="absolute top-0 left-0 w-px h-full" style={{ background: borderCore }} />
            </div>
          ))}

          {/* Mode badge */}
          <div
            className="absolute top-[32px] left-1/2 -translate-x-1/2 text-[9px] tracking-[0.14em] uppercase font-medium px-4 py-1.5 rounded-full"
            style={{ background: bgBadge, color, border: `0.5px solid ${borderBadge}` }}
          >
            {meta.portal}
          </div>

          {/* Seal zone */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${borderRing}` }} />
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: "1.5px solid transparent",
                borderTopColor: color,
                borderRightColor: colorLight,
                animationDuration: "1.4s",
              }}
            />
            <TickRing color={color} />
            <div
              className="relative z-10 w-[68px] h-[68px] rounded-full flex items-center justify-center"
              style={{ background: bgCore, border: `0.5px solid ${borderCore}` }}
            >
              {settings?.logo_url ? (
                <img src={settings.logo_url} className="w-12 h-12 object-contain" alt="Logo" />
              ) : (
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
                  <path d="M15 3L28 9v7c0 7-5.5 13-13 15C7.5 29 2 23 2 16V9L15 3z"
                    stroke={color} strokeWidth="1.3" fill={bgBadge} />
                  <path d="M10 15l3.5 3.5L20 11"
                    stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>

          {/* Portal indicator */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-[5px] h-[5px] rounded-full" style={{ background: color }} />
            <span className="text-[10px] tracking-[0.16em] uppercase font-medium" style={{ color: textPortal }}>
              {meta.portal}
            </span>
          </div>

          {/* Brand section */}
          <div className="mb-4 text-center">
            <h2 className="text-[24px] font-black tracking-[0.2em] uppercase mb-1" style={{ color, fontFamily: "'Cormorant Garamond', serif" }}>
              {settings?.system_name || "UNIEXAM"}
            </h2>
            <p className="text-[9px] tracking-[0.3em] uppercase font-bold opacity-60" style={{ color }}>
              {settings?.tagline || "Academic Excellence Portal"}
            </p>
          </div>

          {/* Module name */}
          <p className="text-[14px] font-semibold tracking-wide text-center px-8 mb-7 leading-snug uppercase pt-2 border-t"
            style={{ color, borderColor: borderCore }}>
            {meta.name}
          </p>

          {/* Stage label */}
          <p className="text-[10.5px] tracking-[0.1em] uppercase text-center mb-3.5"
            style={{ color: textMuted }}>
            {STAGES[stageIdx].label}
          </p>

          {/* Progress bar */}
          <div className="w-36 h-[1.5px] rounded-full overflow-hidden mb-2"
            style={{ background: borderRing }}>
            <div
              className="h-full rounded-full transition-all duration-150 ease-linear"
              style={{ width: `${progress}%`, background: color }}
            />
          </div>

          {/* Percentage */}
          <p className="text-[11px] tracking-[0.12em] font-mono" style={{ color: textMuted }}>
            {String(progress).padStart(3, "0")}%
          </p>

          {/* Bottom session tags */}
          <div className="absolute bottom-[32px] left-0 right-0 flex justify-center gap-4">
            {sessions.map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-[9px] tracking-[0.1em] uppercase"
                style={{ color: textMuted }}>
                <div className="w-1.5 h-1.5 rounded-[1px]" style={{ background: borderCore }} />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page content */}
      <div className={`flex-1 flex flex-col w-full h-full transition-all duration-500 ${loading ? "opacity-0 scale-[0.99] grayscale-[0.5]" : "opacity-100 scale-100 grayscale-0"
        }`}>
        {children}
      </div>
    </div>
  );
}