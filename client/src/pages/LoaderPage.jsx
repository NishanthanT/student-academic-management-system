import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useSettings } from "../context/SettingsContext";

/* ─── Loading stages ─── */
const STAGES = [
    { label: "Initialising secure environment", pct: 0 },
    { label: "Establishing encrypted connection", pct: 18 },
    { label: "Loading user configurations", pct: 36 },
    { label: "Verifying academic records", pct: 54 },
    { label: "Preparing examination portal", pct: 72 },
    { label: "Calibrating interface components", pct: 88 },
    { label: "All systems ready", pct: 100 },
];

/* ─── Static particle data ─── */
const PARTICLES = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    cx: ((i * 137.508) % 100).toFixed(2),
    cy: ((i * 97.31 + 11) % 100).toFixed(2),
    r: (0.12 + (i % 4) * 0.07).toFixed(3),
    op: (0.15 + (i % 6) * 0.09).toFixed(2),
    dur: (3 + (i % 5) * 1.2).toFixed(1),
    del: ((i % 8) * 0.4).toFixed(1),
}));

const CONNECTORS = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    x1: ((i * 53) % 100).toFixed(1),
    y1: ((i * 79 + 23) % 100).toFixed(1),
    x2: (((i + 3) * 61) % 100).toFixed(1),
    y2: (((i + 2) * 83 + 41) % 100).toFixed(1),
    op: (0.03 + (i % 4) * 0.015).toFixed(3),
}));

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Figtree:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');

:root {
  --l-bg1: #f8fafc; --l-bg2: #ffffff; --l-bg3: #f1f5f9;
  --l-txt: #0f172a; --l-acc: #2563eb; --l-mut: rgba(15, 23, 42, 0.4);
  --l-orb: rgba(37, 99, 235, 0.1); --l-bor: rgba(15, 23, 42, 0.08);
  --l-gl: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%);
}

.dark {
  --l-bg1: #0d1f3e; --l-bg2: #060e1c; --l-bg3: #030a14;
  --l-txt: #ffffff; --l-acc: #c9a96e; --l-mut: rgba(255, 255, 255, 0.38);
  --l-orb: rgba(201, 169, 110, 0.1); --l-bor: rgba(255, 255, 255, 0.08);
  --l-gl: radial-gradient(circle, rgba(201,169,110,0.22) 0%, transparent 65%);
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body,#root{height:100%;background:var(--l-bg2);font-family:'Figtree',sans-serif;transition: background 0.5s ease;}

/* ── ROOT ── */
.lr{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;z-index:9999;background:radial-gradient(ellipse at 32% 42%, var(--l-bg1) 0%, var(--l-bg2) 52%, var(--l-bg3) 100%);transition:opacity .9s cubic-bezier(.4,0,.2,1),transform .9s cubic-bezier(.4,0,.2,1)}
.lr.out{opacity:0;transform:scale(1.07);pointer-events:none}

/* ── PARTICLE SVG ── */
.pf{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
@keyframes pfloat{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-9px) scale(1.5)}}

/* ── AURORA ── */
.au{position:absolute;border-radius:50%;pointer-events:none}
.au1{width:680px;height:680px;top:50%;left:50%;transform:translate(-50%,-62%);background:radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%);filter:blur(60px);animation:aur 8s ease-in-out infinite alternate}
.dark .au1{background:radial-gradient(circle,rgba(14,105,200,0.13) 0%,rgba(30,52,97,0.08) 40%,transparent 70%)}
.au2{width:480px;height:480px;top:50%;left:50%;transform:translate(-28%,-42%);background:radial-gradient(circle,rgba(37,99,235,0.05) 0%,transparent 65%);filter:blur(70px);animation:aur 11s ease-in-out 2s infinite alternate-reverse}
.dark .au2{background:radial-gradient(circle,rgba(201,169,110,.08) 0%,rgba(184,137,74,.04) 35%,transparent 65%)}
@keyframes aur{0%{transform:translate(-50%,-62%) scale(1)}100%{transform:translate(-44%,-56%) scale(1.14)}}
.gr{position:absolute;inset:0;opacity:.045;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}

/* ── ORBITS ── */
.ow{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none}
.orb{position:absolute;border-radius:50%}
.o1{width:500px;height:500px;border:1px solid var(--l-orb);animation:ospin 28s linear infinite}
.o2{width:700px;height:700px;border:1px solid var(--l-bor);animation:ospin 44s linear infinite reverse}
.o3{width:900px;height:900px;border:1px solid var(--l-bor);opacity:0.5;animation:ospin 60s linear infinite}
@keyframes ospin{to{transform:rotate(360deg)}}
.od{position:absolute;border-radius:50%}
.od1{width:7px;height:7px;background:var(--l-acc);top:-3.5px;left:50%;transform:translateX(-50%);box-shadow:0 0 12px 4px var(--l-acc)}
.od2{width:5px;height:5px;background:#4ea8de;top:50%;right:-2.5px;transform:translateY(-50%);box-shadow:0 0 9px 3px rgba(78,168,222,.7)}
.od3{width:4px;height:4px;background:var(--l-acc);opacity:0.6;bottom:-2px;left:28%}
@media(max-width:600px){.o1{width:320px;height:320px}.o2{width:480px;height:480px}.o3{width:640px;height:640px}}

/* ── EMBLEM ── */
.ew{position:relative;width:200px;height:200px;display:flex;align-items:center;justify-content:center;margin-bottom:28px;animation:eenter .9s cubic-bezier(.34,1.56,.64,1) both}
@keyframes eenter{from{opacity:0;transform:scale(.45) rotate(-25deg)}to{opacity:1;transform:scale(1) rotate(0deg)}}
.egl{position:absolute;inset:-32px;border-radius:50%;background:var(--l-gl);animation:epulse 3s ease-in-out infinite}
.egl.burst{animation:eburst .6s ease-out forwards}
@keyframes epulse{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.16)}}
@keyframes eburst{0%{opacity:1;transform:scale(1)}50%{opacity:1;transform:scale(2.6)}100%{opacity:0;transform:scale(3.2)}}
.emb{position:relative;z-index:2;width:100px;height:100px;display:flex;align-items:center;justify-content:center}
.er{position:absolute;border-radius:50%;border:1.5px solid}
.er1{inset:-8px;border-color:rgba(var(--l-acc),.28);animation:rslow 12s linear infinite}
.er2{inset:-2px;border-color:rgba(var(--l-acc),.14);border-style:dashed;animation:rslow 8s linear infinite reverse}
.dark .er1 { border-color: rgba(201,169,110,.28); }
.dark .er2 { border-color: rgba(201,169,110,.14); }
@keyframes rslow{to{transform:rotate(360deg)}}
.ec{width:100px;height:100px;border-radius:22px;background:linear-gradient(135deg, var(--l-acc) 0%, #ffffff 40%, var(--l-acc) 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(255,255,255,.15) inset,0 20px 60px rgba(var(--l-acc),.5),0 4px 14px rgba(0,0,0,.5);animation:breathe 3s ease-in-out infinite}
.dark .ec { background:linear-gradient(135deg,#c9a96e 0%,#f0d898 40%,#b8894a 100%); box-shadow:0 0 0 1px rgba(255,255,255,.15) inset,0 20px 60px rgba(201,169,110,.5),0 4px 14px rgba(0,0,0,.5); }
@keyframes breathe{0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.15) inset,0 20px 60px rgba(var(--l-acc),.5),0 4px 14px rgba(0,0,0,.5)}50%{box-shadow:0 0 0 1px rgba(255,255,255,.22) inset,0 24px 80px rgba(var(--l-acc),.72),0 4px 20px rgba(0,0,0,.5)}}
.ec svg{width:56px;height:56px}
.pr{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}
.tr{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}

/* ── BRAND ── */
.bb{text-align:center;margin-bottom:14px;animation:bup .7s cubic-bezier(.4,0,.2,1) .3s both}
@keyframes bup{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.bn{font-family:'Cormorant Garamond',serif;font-size:clamp(30px,5vw,52px);font-weight:300;letter-spacing:.28em;color:var(--l-txt);line-height:1;margin-bottom:10px;display:flex;justify-content:center}
.bc{display:inline-block;animation:cdrop .5s cubic-bezier(.34,1.56,.64,1) both}
@keyframes cdrop{from{opacity:0;transform:translateY(-18px) scale(.8)}to{opacity:1;transform:translateY(0) scale(1)}}
.btg{font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--l-acc);font-weight:500;animation:bup .5s ease .8s both}

/* ── PCT ── */
.pp{display:flex;align-items:baseline;gap:2px;margin-bottom:18px;animation:bup .5s ease .5s both}
.pn{font-family:'Share Tech Mono',monospace;font-size:clamp(46px,7vw,72px);color:var(--l-txt);line-height:1;text-shadow:0 0 40px var(--l-orb)}
.ps{font-family:'Share Tech Mono',monospace;font-size:clamp(18px,3vw,28px);color:var(--l-acc)}

/* ── STAGE ── */
.sa{display:flex;flex-direction:column;align-items:center;gap:15px;margin-bottom:36px;animation:bup .5s ease .6s both}
.sl{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--l-mut);text-align:center;min-height:17px;animation:slin .3s ease both}
@keyframes slin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.sds{display:flex;gap:8px;align-items:center}
.sd{width:5px;height:5px;border-radius:50%;background:var(--l-bor);transition:background .4s,transform .35s,box-shadow .35s}
.sd.act{background:rgba(var(--l-acc),.5)}
.dark .sd.act { background:rgba(201,169,110,.5); }
.sd.cur{background:var(--l-acc);transform:scale(1.6);box-shadow:0 0 9px var(--l-acc)}

/* ── BOTTOM STRIP ── */
.ps-wrap{position:fixed;bottom:0;left:0;right:0;padding:0 44px 30px;animation:bup .5s ease .7s both}
@media(max-width:600px){.ps-wrap{padding:0 22px 20px}}
.ps-track{height:2px;background:var(--l-bor);border-radius:2px;overflow:hidden;margin-bottom:10px}
.ps-fill{height:100%;border-radius:2px;background:var(--l-acc);transition:width .1s linear;position:relative;overflow:hidden}
.ps-sheen{position:absolute;top:0;bottom:0;width:70px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);animation:sheen 1.5s linear infinite}
@keyframes sheen{0%{transform:translateX(-70px)}100%{transform:translateX(calc(100vw + 70px))}}
.ps-lbls{display:flex;justify-content:space-between;font-family:'Share Tech Mono',monospace;font-size:9.5px;color:var(--l-mut);letter-spacing:.1em;text-transform:uppercase}

/* ── CORNERS ── */
.cn{position:fixed;width:26px;height:26px;pointer-events:none;animation:bup .5s ease .9s both}
.cn::before,.cn::after{content:'';position:absolute;background:var(--l-acc);opacity:.45}
.cn::before{width:100%;height:1px}
.cn::after{width:1px;height:100%}
.ctl{top:26px;left:26px}.ctl::before{top:0;left:0}.ctl::after{top:0;left:0}
.ctr{top:26px;right:26px}.ctr::before{top:0;right:0}.ctr::after{top:0;right:0}
.cbl{bottom:26px;left:26px}.cbl::before{bottom:0;left:0;top:auto}.cbl::after{bottom:0;left:0;top:auto}
.cbr{bottom:26px;right:26px}.cbr::before{bottom:0;right:0;top:auto}.cbr::after{bottom:0;right:0;top:auto}

/* ── SCAN LINE ── */
.scan{position:fixed;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 0%,rgba(var(--l-acc),.15) 25%,rgba(var(--l-acc),.45) 50%,rgba(var(--l-acc),.15) 75%,transparent 100%);animation:sc 5s linear infinite;pointer-events:none}
.dark .scan { background:linear-gradient(90deg,transparent 0%,rgba(201,169,110,.15) 25%,rgba(201,169,110,.45) 50%,rgba(201,169,110,.15) 75%,transparent 100%); }
@keyframes sc{0%{top:-1px;opacity:0}5%{opacity:1}95%{opacity:1}100%{top:100vh;opacity:0}}

/* ── VERSION ── */
.vt{position:fixed;bottom:26px;right:42px;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.14em;color:var(--l-mut);text-transform:uppercase;pointer-events:none;animation:bup .5s ease 1s both}
@media(max-width:600px){.vt{display:none}}

/* ── SIGNAL BARS (extra flourish) ── */
.sbars{position:fixed;top:28px;right:26px;display:flex;align-items:flex-end;gap:3px;pointer-events:none;animation:bup .5s ease 1s both}
.sbar{width:4px;border-radius:1px 1px 0 0;background:var(--l-acc)}
.sbar-1{height:5px;opacity:.35}
.sbar-2{height:9px;opacity:.5}
.sbar-3{height:13px;opacity:.7}
.sbar-4{height:17px;opacity:.9}
@media(max-width:600px){.sbars{right:18px;top:18px}}

/* ── HEX GRID (subtle bg) ── */
.hg{position:absolute;inset:0;opacity:.025;pointer-events:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpolygon points='28,2 54,16 54,46 28,60 2,46 2,16' fill='none' stroke='%23c9a96e' stroke-width='0.6'/%3E%3Cpolygon points='28,62 54,76 54,106 28,120 2,106 2,76' fill='none' stroke='%23c9a96e' stroke-width='0.6'/%3E%3C/svg%3E");background-size:56px 100px}
.dark .hg { opacity: 0.025; stroke: #c9a96e; }

/* ── APP SHELL ── */
.as{min-height:100vh;background:radial-gradient(ellipse at 30% 40%, var(--l-bg1) 0%, var(--l-bg2) 60%, var(--l-bg3) 100%);display:flex;align-items:center;justify-content:center;padding:32px;animation:asen .8s cubic-bezier(.4,0,.2,1) both}
@keyframes asen{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}
.asc{text-align:center;max-width:540px}
.asbdg{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:20px;background:var(--l-orb);border:1px solid var(--l-bor);font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--l-acc);margin-bottom:24px;animation:bup .5s ease .1s both}
.asbdg::before{content:'';width:6px;height:6px;border-radius:50%;background:var(--l-acc);box-shadow:0 0 7px var(--l-acc);animation:pdot 2s ease-in-out infinite}
@keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(.65)}}
.ast{font-family:'Cormorant Garamond',serif;font-size:clamp(34px,5vw,56px);font-weight:300;letter-spacing:.04em;color:var(--l-txt);margin-bottom:16px;line-height:1.1;animation:bup .5s ease .2s both}
.ast em{font-style:italic;color:var(--l-acc)}
.asst{font-size:15px;color:var(--l-mut);line-height:1.7;margin-bottom:40px;animation:bup .5s ease .3s both}
.asstats{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-bottom:44px;animation:bup .5s ease .4s both}
.stc{padding:18px 22px;border-radius:12px;background:var(--l-bor);border:1px solid var(--l-bor);min-width:130px;transition:background .2s,border-color .2s,transform .2s}
.stc:hover{background:var(--l-orb);border-color:var(--l-acc);transform:translateY(-2px)}
.stv{font-family:'Share Tech Mono',monospace;font-size:20px;color:var(--l-acc);margin-bottom:5px}
.stl{font-size:11px;color:var(--l-mut);letter-spacing:.1em;text-transform:uppercase}
.rpb{display:inline-flex;align-items:center;gap:9px;padding:14px 30px;background:var(--l-bg1);border:1.5px solid var(--l-bor);border-radius:8px;font-family:'Figtree',sans-serif;font-size:14px;font-weight:600;color:var(--l-acc);cursor:pointer;letter-spacing:.04em;box-shadow:0 4px 20px var(--l-orb);transition:transform .2s,box-shadow .2s,border-color .2s;animation:bup .5s ease .5s both}
.rpb:hover{transform:translateY(-3px);box-shadow:0 8px 32px var(--l-orb);border-color:var(--l-acc)}
.rpb svg{width:16px;height:16px}
`;

const delay = ms => new Promise(r => setTimeout(r, ms));

export default function LoaderWrapper({ children }) {
    const { isDark } = useTheme();
    const { settings } = useSettings();
    const [phase, setPhase] = useState("loading");
    const [progress, setProgress] = useState(0);
    const [stageIdx, setStageIdx] = useState(0);

    useEffect(() => {
        if (phase !== "loading") return;
        const total = 4400;
        const start = Date.now();
        let raf;
        const tick = () => {
            const elapsed = Date.now() - start;
            const raw = Math.min(elapsed / total, 1);
            const eased = 1 - Math.pow(1 - raw, 2.6);
            const pct = Math.round(eased * 100);
            setProgress(pct);
            for (let i = STAGES.length - 1; i >= 0; i--) {
                if (pct >= STAGES[i].pct) { setStageIdx(i); break; }
            }
            if (raw < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                setProgress(100);
                setStageIdx(STAGES.length - 1);
                setTimeout(() => setPhase("exiting"), 900);
                setTimeout(() => setPhase("done"), 1900);
            }
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [phase]);

    return (
        <div className={isDark ? "dark" : ""}>
            <style>{CSS}</style>
            {phase !== "done" && (
                <Loader 
                  isDark={isDark} 
                  progress={progress} 
                  stageIdx={stageIdx} 
                  exiting={phase === "exiting"} 
                  settings={settings}
                />
            )}
            {phase === "done" && children}
        </div>
    );
}

function Loader({ isDark, progress, stageIdx, exiting, settings }) {
    const stage = STAGES[stageIdx];
    const pct = progress;
    const R = 88;
    const circ = 2 * Math.PI * R;
    const offset = circ * (1 - pct / 100);
    const systemName = (settings?.system_name || "UNIEXAM").toUpperCase();

    return (
        <div className={`lr${exiting ? " out" : ""}`}>

            {/* Hex grid bg */}
            <div className="hg" />

            {/* Particle constellation */}
            <svg className="pf" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="ggl" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={isDark ? "#b8894a" : "#3b82f6"} />
                        <stop offset="50%" stopColor={isDark ? "#f0d898" : "#60a5fa"} />
                        <stop offset="100%" stopColor={isDark ? "#c9a96e" : "#2563eb"} />
                    </linearGradient>
                </defs>
                {CONNECTORS.map(c => (
                    <line key={c.id} x1={`${c.x1}%`} y1={`${c.y1}%`} x2={`${c.x2}%`} y2={`${c.y2}%`}
                        stroke={isDark ? "#c9a96e" : "#3b82f6"} strokeWidth="0.04" opacity={c.op} />
                ))}
                {PARTICLES.map(p => (
                    <circle key={p.id} cx={`${p.cx}%`} cy={`${p.cy}%`} r={p.r}
                        fill={isDark ? "#c9a96e" : "#3b82f6"} opacity={p.op}
                        style={{ animation: `pfloat ${p.dur}s ease-in-out ${p.del}s infinite alternate` }}
                    />
                ))}
            </svg>

            {/* Atmosphere */}
            <div className="au au1" /><div className="au au2" />
            <div className="gr" />

            {/* Orbital rings */}
            <div className="ow">
                <div className="orb o1"><div className="od od1" /></div>
                <div className="orb o2"><div className="od od2" /></div>
                <div className="orb o3"><div className="od od3" /></div>
            </div>

            {/* Central emblem + arc progress */}
            <div className="ew">
                <div className={`egl${pct >= 100 ? " burst" : ""}`} />

                {/* Tick marks */}
                <svg className="tr" viewBox="0 0 200 200">
                    {Array.from({ length: 40 }, (_, i) => {
                        const a = (i / 40) * 2 * Math.PI - Math.PI / 2;
                        const r1 = 93, r2 = i % 4 === 0 ? 99 : 96;
                        const x1 = 100 + r1 * Math.cos(a), y1 = 100 + r1 * Math.sin(a);
                        const x2 = 100 + r2 * Math.cos(a), y2 = 100 + r2 * Math.sin(a);
                        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                            stroke={isDark ? "rgba(201,169,110,0.22)" : "rgba(37,99,235,0.22)"} strokeWidth={i % 4 === 0 ? "1.3" : "0.7"} />;
                    })}
                </svg>

                {/* Arc progress */}
                <svg className="pr" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r={R} fill="none"
                        stroke={isDark ? "rgba(201,169,110,0.1)" : "rgba(37,99,235,0.1)"} strokeWidth="1.5" />
                    <circle cx="100" cy="100" r={R} fill="none"
                        stroke="url(#ggl2)" strokeWidth="2.2" strokeLinecap="round"
                        strokeDasharray={circ} strokeDashoffset={offset}
                        transform="rotate(-90 100 100)"
                        style={{ transition: "stroke-dashoffset 0.1s linear" }}
                    />
                    <defs>
                        <linearGradient id="ggl2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor={isDark ? "#b8894a" : "#3b82f6"} />
                            <stop offset="50%" stopColor={isDark ? "#f0d898" : "#60a5fa"} />
                            <stop offset="100%" stopColor={isDark ? "#c9a96e" : "#2563eb"} />
                        </linearGradient>
                    </defs>
                </svg>

                {/* Emblem core */}
                <div className="emb">
                    <div className="er er1" /><div className="er er2" />
                    <div className="ec">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} className="w-14 h-14 object-contain animate-in zoom-in duration-500" alt="Core Logo" />
                        ) : (
                            <svg viewBox="0 0 48 48" fill="none">
                                <path d="M44 20v12M4 20l20-10 20 10-20 10z"
                                    stroke={isDark ? "#0a1628" : "#ffffff"} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 24v10c6 6 18 6 24 0V24"
                                    stroke={isDark ? "#0a1628" : "#ffffff"} strokeWidth="2.6" strokeLinecap="round" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>

            {/* Brand */}
            <div className="bb">
                <div className="bn">
                    {systemName.split("").map((ch, i) => (
                        <span key={i} className="bc" style={{ animationDelay: `${i * 0.065}s` }}>{ch}</span>
                    ))}
                </div>
                <div className="btg">{settings?.tagline || "Academic Excellence Portal"}</div>
            </div>

            {/* Percentage */}
            <div className="pp">
                <span className="pn">{String(pct).padStart(3, "0")}</span>
                <span className="ps">%</span>
            </div>

            {/* Stage label + dots */}
            <div className="sa">
                <div className="sl" key={stageIdx}>{stage?.label}</div>
                <div className="sds">
                    {STAGES.map((_, i) => (
                        <div key={i} className={`sd${i <= stageIdx ? " act" : ""}${i === stageIdx ? " cur" : ""}`} />
                    ))}
                </div>
            </div>

            {/* Bottom progress bar */}
            <div className="ps-wrap">
                <div className="ps-track">
                    <div className="ps-fill" style={{ width: `${pct}%`, background: isDark ? "linear-gradient(90deg,#b8894a,#f0d898,#c9a96e)" : "linear-gradient(90deg,#3b82f6,#60a5fa,#2563eb)" }}>
                        <div className="ps-sheen" />
                    </div>
                </div>
                <div className="ps-lbls">
                    <span>Booting {settings?.system_name || "UniExam"} Portal</span>
                    <span>{pct} / 100</span>
                </div>
            </div>

            {/* Corner frames */}
            <div className="cn ctl" /><div className="cn ctr" />
            <div className="cn cbl" /><div className="cn cbr" />

            {/* Animated scan line */}
            <div className="scan" />

            {/* Signal bars */}
            <div className="sbars">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`sbar sbar-${n}`}
                        style={{ opacity: pct >= n * 22 ? undefined : 0.1 }}
                    />
                ))}
            </div>

            {/* Version */}
            <div className="vt">UniExam v2.4.1 · Encrypted · Secure</div>
        </div>
    );
}

function AppShell({ onReplay }) {
    return (
        <div className="as">
            <div className="asc">
                <div className="asbdg">Portal Ready</div>
                <h1 className="ast">Welcome to <em>UniExam</em></h1>
                <p className="asst">Your academic portal has loaded successfully.<br />All systems are operational and secure.</p>
                <div className="asstats">
                    {[
                        { v: "100%", l: "Systems Online" },
                        { v: "256-bit", l: "Encryption Active" },
                        { v: "< 2ms", l: "Response Time" },
                        { v: "7 / 7", l: "Checks Passed" },
                    ].map(s => (
                        <div className="stc" key={s.l}>
                            <div className="stv">{s.v}</div>
                            <div className="stl">{s.l}</div>
                        </div>
                    ))}
                </div>
                <button className="rpb" onClick={onReplay} id="loaderpage-button-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" />
                    </svg>
                    Replay Loader
                </button>
            </div>
        </div>
    );
}