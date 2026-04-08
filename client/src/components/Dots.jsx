import React from 'react';

export default function Dots({ seed = 1 }) {
    const orbs = [
        { w: 260, h: 260, top: "-60px", left: "-60px", color: "rgba(99,102,241,0.08)", blur: 55 },
        { w: 200, h: 200, top: "65%", left: "70%", color: "rgba(168,85,247,0.07)", blur: 45 },
        { w: 160, h: 160, top: "38%", left: "-30px", color: "rgba(6,182,212,0.06)", blur: 38 },
        { w: 140, h: 140, top: "-20px", left: "55%", color: "rgba(99,102,241,0.06)", blur: 30 },
    ];

    return (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} aria-hidden="true">
            {orbs.map((o, i) => (
                <div key={i} className={`auth-orb orb-${i + 1}`} style={{
                    position: "absolute",
                    width: o.w, height: o.h,
                    top: o.top, left: o.left,
                    borderRadius: "50%",
                    background: o.color,
                    filter: `blur(${o.blur}px)`,
                    animation: `orbFloat${(i % 2) + 1} ${12 + i * 2}s ease-in-out infinite`,
                }} />
            ))}
        </div>
    );
}
