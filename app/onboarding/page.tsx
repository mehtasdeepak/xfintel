/* eslint-disable */
"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";

const APP_CSS = `
:root{
  --bg: oklch(0.985 0.004 95);
  --bg-2: oklch(0.965 0.006 95);
  --bg-3: oklch(0.945 0.008 95);
  --ink: oklch(0.18 0.015 180);
  --ink-2: oklch(0.32 0.012 180);
  --muted: oklch(0.52 0.01 180);
  --line: oklch(0.90 0.008 170);
  --line-2: oklch(0.85 0.01 170);
  --teal: oklch(0.38 0.065 175);
  --teal-2: oklch(0.30 0.07 175);
  --teal-soft: oklch(0.96 0.02 170);
  --accent: oklch(0.56 0.12 160);
  --chip: oklch(0.96 0.015 165);
  --card: #ffffff;
  --up: oklch(0.58 0.13 160);
  --down: oklch(0.58 0.14 28);
  --warn: oklch(0.80 0.14 78);
  --radius: 12px;
  --radius-lg: 20px;
  --shadow-sm: 0 1px 0 0 oklch(0.90 0.01 170 / 0.6), 0 1px 2px oklch(0.20 0.02 180 / 0.04);
  --shadow-md: 0 1px 0 0 oklch(0.92 0.01 170 / 0.8), 0 10px 28px -18px oklch(0.30 0.05 175 / 0.25);
  --shadow-lg: 0 30px 60px -30px oklch(0.30 0.06 175 / 0.35), 0 2px 6px oklch(0.20 0.02 180 / 0.05);
}
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);font-family:'Geist',ui-sans-serif,system-ui,-apple-system,sans-serif;font-feature-settings:"ss01","ss02","cv11";-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
body{min-height:100vh}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-feature-settings:"zero","ss01"}
.serif{font-family:'Instrument Serif',ui-serif,Georgia,serif;font-style:italic;font-weight:400}
.x-italic{font-family:'Instrument Serif';font-style:italic;font-weight:400}
::selection{background:var(--accent);color:#0a0a0a}
.brand{display:inline-flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-0.01em;font-size:16px;color:var(--ink)}
.brand-mark{width:28px;height:28px;border-radius:8px;background:var(--teal);display:grid;place-items:center;color:var(--bg);font-weight:700;font-size:14px}
.brand-mark::before{content:"X";font-family:'Instrument Serif';font-style:italic;font-size:20px;line-height:1;transform:translateY(-1px)}
.brand .sub{display:block;color:var(--muted);font-weight:400;font-size:11.5px;margin-top:1px;letter-spacing:0.02em}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 18px;border-radius:999px;font-size:14.5px;font-weight:500;line-height:1;transition:transform .15s ease, background .2s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease;white-space:nowrap;cursor:pointer}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn-primary{background:var(--teal);color:var(--bg);box-shadow:inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 6px 18px -10px var(--teal)}
.btn-primary:hover:not(:disabled){background:var(--teal-2);transform:translateY(-1px)}
.btn-ghost{background:var(--card);color:var(--ink);border:1px solid var(--line-2)}
.btn-ghost:hover{background:var(--bg-2);border-color:var(--ink-2)}
.btn-sm{padding:9px 14px;font-size:13px}
.btn-block{width:100%}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.02em}
.pill-ticker{background:var(--chip);color:var(--teal)}
.pill-buy{background:color-mix(in oklch, var(--up) 18%, var(--bg));color:var(--up);border:1px solid color-mix(in oklch, var(--up) 30%, transparent)}
.pill-sell{background:color-mix(in oklch, var(--down) 18%, var(--bg));color:var(--down);border:1px solid color-mix(in oklch, var(--down) 30%, transparent)}
`;

const PAGE_CSS = `
.ob-shell{min-height:100vh;display:flex;flex-direction:column}
.ob-top{display:flex;align-items:center;justify-content:space-between;padding:22px 40px;border-bottom:1px solid var(--line);background:var(--bg)}
.ob-steps{display:flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:0.08em}
.ob-steps .cur{color:var(--teal);font-weight:500}
.ob-steps .bar{width:60px;height:3px;border-radius:2px;background:var(--line);overflow:hidden;position:relative}
.ob-steps .bar i{position:absolute;inset:0;background:var(--teal);transform-origin:left;transform:scaleX(0.5);transition:transform .4s ease}
.ob-main{flex:1;max-width:1180px;width:100%;margin:0 auto;padding:48px 40px 120px;animation:fadeUp .5s cubic-bezier(.2,.7,.2,1)}
.ob-head{text-align:center;max-width:720px;margin:0 auto 44px}
.ob-kicker{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase}
.ob-title{font-size:clamp(32px, 4vw, 44px);line-height:1.05;letter-spacing:-0.028em;font-weight:500;margin:12px 0 12px;text-wrap:balance}
.ob-title .serif{color:var(--teal)}
.ob-sub{color:var(--ink-2);font-size:16px;line-height:1.55;text-wrap:pretty;margin:0 auto;max-width:560px}
.ob-filter{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.ob-chip{padding:7px 14px;border:1px solid var(--line-2);border-radius:999px;font-size:13px;background:var(--card);color:var(--ink-2);cursor:pointer;transition:all .15s ease}
.ob-chip:hover{border-color:var(--ink-2);color:var(--ink)}
.ob-chip.on{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.leaders{display:grid;grid-template-columns:repeat(3, 1fr);gap:16px}
@media (max-width: 900px){ .leaders{grid-template-columns:repeat(2,1fr)} }
@media (max-width: 600px){ .leaders{grid-template-columns:1fr} }
.leader{background:var(--card);border:1.5px solid var(--line);border-radius:16px;padding:18px;cursor:pointer;transition:all .2s ease;position:relative;display:flex;flex-direction:column;gap:14px;text-align:left}
.leader:hover{border-color:var(--teal);transform:translateY(-2px);box-shadow:var(--shadow-md)}
.leader.on{border-color:var(--teal);background:var(--teal-soft);box-shadow:0 0 0 3px color-mix(in oklch, var(--teal) 15%, transparent)}
.leader .check{position:absolute;top:14px;right:14px;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--line-2);background:var(--card);display:grid;place-items:center;transition:all .15s ease;color:transparent}
.leader.on .check{background:var(--teal);border-color:var(--teal);color:#fff}
.l-top{display:flex;gap:12px;align-items:center}
.l-ava{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;font-size:14px;flex:0 0 auto;background:linear-gradient(135deg, var(--teal), var(--accent));font-family:'JetBrains Mono',monospace;letter-spacing:-0.02em}
.l-ava.c1{background:linear-gradient(135deg,#fbbf24,#d97706)}
.l-ava.c2{background:linear-gradient(135deg,#60a5fa,#2563eb)}
.l-ava.c3{background:linear-gradient(135deg,#34d399,#059669)}
.l-ava.c4{background:linear-gradient(135deg,#f472b6,#be185d)}
.l-ava.c5{background:linear-gradient(135deg,#a78bfa,#6d28d9)}
.l-ava.c6{background:linear-gradient(135deg,#fb923c,#c2410c)}
.l-name{font-weight:600;font-size:14.5px;line-height:1.2;display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.l-handle{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);margin-top:3px}
.l-verified{width:14px;height:14px;display:inline-block;color:var(--teal);flex:0 0 auto}
.l-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.l-stat{padding:8px 10px;background:var(--bg-2);border-radius:8px}
.l-stat .k{font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:0.06em;text-transform:uppercase}
.l-stat .v{font-size:14px;font-weight:600;color:var(--ink);font-feature-settings:"tnum";margin-top:2px}
.l-stat .v.up{color:var(--up)}
.l-stat .v.down{color:var(--down)}
.l-tags{display:flex;gap:6px;flex-wrap:wrap}
.ob-bar{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--line);border-radius:999px;box-shadow:var(--shadow-lg);padding:8px 8px 8px 22px;display:flex;align-items:center;gap:16px;z-index:10;min-width:420px;animation:fadeUp .4s cubic-bezier(.2,.7,.2,1)}
.ob-bar .prog{display:flex;align-items:center;gap:10px;font-size:14px}
.ob-bar .dots{display:flex;gap:5px}
.ob-bar .dots i{width:9px;height:9px;border-radius:50%;background:var(--line-2);transition:all .2s ease}
.ob-bar .dots i.on{background:var(--teal);transform:scale(1.15)}
.ob-bar .count{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--muted)}
.ob-bar .count b{color:var(--ink);font-weight:600}
.ob-skip{color:var(--muted);font-size:13px;margin-right:6px}
.ob-skip:hover{color:var(--ink)}
.loading-overlay{position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:22px;z-index:100;animation:fadeUp .3s ease}
.loading-overlay .ring{width:48px;height:48px;border:3px solid var(--line);border-top-color:var(--teal);border-radius:50%;animation:spin .9s linear infinite}
.loading-overlay .msg{font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--ink-2);letter-spacing:0.08em}
.loading-overlay .steps{display:flex;flex-direction:column;gap:8px;margin-top:14px;min-width:280px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)}
.loading-overlay .steps .done{color:var(--up)}
.loading-overlay .steps .done::before{content:"✓ "}
.loading-overlay .steps .curr{color:var(--ink)}
.loading-overlay .steps .curr::before{content:"▸ "}
.loading-overlay .steps .wait::before{content:"  "}
`;

const V = () => (
  <svg className="l-verified" viewBox="0 0 22 22" fill="currentColor">
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44-.541-.354-1.17-.551-1.817-.569-.646.018-1.276.215-1.817.57-.541.354-.972.853-1.245 1.44-.608-.223-1.264-.27-1.898-.14-.633.131-1.217.437-1.686.882-.445.47-.751 1.053-.882 1.687-.13.633-.083 1.29.14 1.897-.586.274-1.084.705-1.438 1.246-.354.541-.552 1.17-.57 1.816.018.647.216 1.276.57 1.817.354.54.852.972 1.438 1.245-.223.608-.27 1.264-.14 1.898.131.634.437 1.218.882 1.687.47.445 1.053.751 1.686.882.634.13 1.29.083 1.898-.14.273.586.704 1.084 1.245 1.439.541.354 1.17.551 1.817.569.647-.018 1.276-.215 1.817-.57.541-.354.972-.852 1.245-1.438.608.223 1.264.27 1.898.14.633-.131 1.217-.437 1.686-.882.445-.47.751-1.053.882-1.687.13-.634.083-1.29-.14-1.898.586-.273 1.084-.704 1.438-1.245.354-.541.552-1.17.57-1.817zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
  </svg>
);

const Check = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const LEADERS = [
  { id: 'heisenberg', n: 'Heisenberg', h: '@Mr_Derivatives', c: 'c1', tags: ['Derivatives', 'Options'], calls: '4.2K', win: '68%', ret: '+142%', dir: 'up', pop: true },
  { id: 'shay', n: 'Shay Boloor', h: '@StockSavvyShay', c: 'c2', tags: ['Growth', 'AI'], calls: '2.8K', win: '71%', ret: '+98%', dir: 'up', pop: true },
  { id: 'mourinho', n: 'Retail Mourinho', h: '@retail_mourinho', c: 'c3', tags: ['Swing', 'Retail'], calls: '1.9K', win: '64%', ret: '+86%', dir: 'up' },
  { id: 'photon', n: 'Photon Capital', h: '@PhotonCap', c: 'c4', tags: ['Macro', 'Quant'], calls: '3.1K', win: '59%', ret: '+112%', dir: 'up' },
  { id: 'gublo', n: 'Gublo 🇨🇦', h: '@Gubloinvestor', c: 'c5', tags: ['Value', 'Small-cap'], calls: '1.2K', win: '74%', ret: '+214%', dir: 'up' },
  { id: 'ronnie', n: 'RonnieV', h: '@TheRonnieVShow', c: 'c6', tags: ['Momentum', 'Daytrade'], calls: '2.4K', win: '62%', ret: '+58%', dir: 'up' },
  { id: 'serenity', n: 'Serenity', h: '@aleabitoreddit', c: 'c1', tags: ['Thesis', 'Small-cap'], calls: '980', win: '81%', ret: '+260%', dir: 'up', pop: true },
  { id: 'cole', n: "Cole's Trades", h: '@ColesTrades', c: 'c2', tags: ['Swing', 'Education'], calls: '1.5K', win: '66%', ret: '+74%', dir: 'up' },
  { id: 'pepe', n: 'Pepe Invests', h: '@pepemoonboy', c: 'c3', tags: ['Momentum', 'Meme'], calls: '2.1K', win: '57%', ret: '+41%', dir: 'up' },
  { id: 'mavens', n: 'LLM Maven', h: '@GeeFingBeeMan', c: 'c4', tags: ['AI', 'Thesis'], calls: '640', win: '69%', ret: '+88%', dir: 'up' },
  { id: 'macro_owl', n: 'Macro Owl', h: '@macro_owl', c: 'c5', tags: ['Macro', 'Rates'], calls: '3.4K', win: '63%', ret: '+46%', dir: 'up' },
  { id: 'vol', n: 'Vol Shaman', h: '@vol_shaman', c: 'c6', tags: ['Vol arb', 'Derivatives'], calls: '1.1K', win: '72%', ret: '+124%', dir: 'up' },
];

const FILTERS = ['All', 'Derivatives', 'Growth', 'Macro', 'Value', 'Momentum', 'Swing', 'AI'];

export default function OnboardingPage() {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const filtered = useMemo(() => {
    if (filter === 'All') return LEADERS;
    return LEADERS.filter(l => l.tags.includes(filter));
  }, [filter]);

  const toggle = (id: string) => {
    setPicked(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const count = picked.size;
  const canProceed = count >= 3;
  const target = 5;

  const go = () => {
    if (!canProceed) return;
    setSubmitting(true);
    let i = 0;
    const tick = setInterval(() => {
      i++;
      if (i >= 4) {
        clearInterval(tick);
        try { localStorage.setItem('xfintel.onboarded', '1'); localStorage.setItem('xfintel.picked', JSON.stringify([...picked])); } catch (e) {}
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) {
            supabase.from('user_profiles').upsert({ user_id: data.user.id }).then(() => {
              window.location.href = '/feed';
            });
          } else {
            window.location.href = '/feed';
          }
        });
      } else {
        setStep(i);
      }
    }, 650);
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: APP_CSS + PAGE_CSS }} />

      <div className="ob-shell">
        <div className="ob-top">
          <a href="/landing" className="brand">
            <span className="brand-mark" />
            <span>XFintel<br /><span className="sub">X Financial Intelligence</span></span>
          </a>
          <div className="ob-steps">
            <span>STEP 01 / 02</span>
            <span className="bar"><i style={{ transform: `scaleX(${canProceed ? 0.9 : 0.5})` }} /></span>
            <span className="cur">Pick leaders</span>
          </div>
          <a href="/feed" className="ob-skip" style={{ fontSize: 13 }}>Skip for now →</a>
        </div>

        <div className="ob-main">
          <div className="ob-head">
            <div className="ob-kicker">§ Onboarding</div>
            <h1 className="ob-title">Follow <span className="serif">5 FinX leaders</span> to start.</h1>
            <p className="ob-sub">Your feed personalizes to what these leaders post — their BUYs, SELLs, theses, and deleted tweets. You can edit the list anytime.</p>
          </div>

          <div className="ob-filter">
            {FILTERS.map(f => (
              <button key={f} className={`ob-chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>

          <div className="leaders">
            {filtered.map(l => {
              const on = picked.has(l.id);
              return (
                <button key={l.id} className={`leader ${on ? 'on' : ''}`} onClick={() => toggle(l.id)} aria-pressed={on}>
                  <div className="check"><Check /></div>
                  <div className="l-top">
                    <div className={`l-ava ${l.c}`}>{l.n.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}</div>
                    <div>
                      <div className="l-name">{l.n} <V /></div>
                      <div className="l-handle">{l.h}</div>
                    </div>
                  </div>
                  <div className="l-stats">
                    <div className="l-stat"><div className="k">Calls</div><div className="v">{l.calls}</div></div>
                    <div className="l-stat"><div className="k">Win rate</div><div className="v up">{l.win}</div></div>
                    <div className="l-stat"><div className="k">90d return</div><div className="v up">{l.ret}</div></div>
                  </div>
                  <div className="l-tags">
                    {l.tags.map((t: string) => <span key={t} className="pill pill-ticker">{t}</span>)}
                    {l.pop && <span className="pill" style={{ background: 'color-mix(in oklch, var(--warn) 25%, transparent)', color: 'oklch(0.40 0.14 78)' }}>★ Popular</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="ob-bar">
          <div className="prog">
            <div className="dots">
              {[...Array(target)].map((_, i) => <i key={i} className={i < count ? 'on' : ''} />)}
            </div>
            <span className="count">
              {count < target
                ? <><b>{count}</b> of {target} selected</>
                : <><b>{count}</b> selected · you're set</>}
            </span>
          </div>
          <button className="btn btn-primary" disabled={!canProceed} onClick={go} style={{ marginLeft: 'auto' }}>
            {canProceed ? <>Continue to dashboard <span aria-hidden>→</span></> : `Pick ${3 - count} more`}
          </button>
        </div>

        {submitting && (
          <div className="loading-overlay">
            <div className="ring" />
            <div className="msg">Personalizing your feed…</div>
            <div className="steps">
              {['Saving your 5 FinX leaders', 'Pulling last 90 days of signals', 'Scoring backtests against market close', 'Building your personalized feed'].map((s, i) => (
                <div key={i} className={i < step ? 'done' : i === step ? 'curr' : 'wait'}>{s}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
