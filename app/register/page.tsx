/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
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
.btn-x{background:#000;color:#fff}
.btn-x:hover{background:#111;transform:translateY(-1px)}
.btn-google{background:#fff;color:#3c4043;border:1px solid var(--line-2)}
.btn-google:hover{background:#f8f9fa;border-color:#dadce0;box-shadow:0 1px 2px rgba(0,0,0,.06)}
.btn-square{padding:12px 18px;border-radius:12px}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes slideIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.02em}
.pill-ticker{background:var(--chip);color:var(--teal)}
.pill-buy{background:color-mix(in oklch, var(--up) 18%, var(--bg));color:var(--up);border:1px solid color-mix(in oklch, var(--up) 30%, transparent)}
.pill-sell{background:color-mix(in oklch, var(--down) 18%, var(--bg));color:var(--down);border:1px solid color-mix(in oklch, var(--down) 30%, transparent)}
.input{width:100%;padding:12px 14px;background:var(--card);border:1px solid var(--line-2);border-radius:10px;font-size:14.5px;color:var(--ink);font-family:inherit;transition:border-color .15s ease, box-shadow .15s ease;outline:none}
.input:focus{border-color:var(--teal);box-shadow:0 0 0 3px color-mix(in oklch, var(--teal) 18%, transparent)}
`;

const PAGE_CSS = `
.reg-wrap{display:grid;grid-template-columns:1fr 1fr;min-height:100vh}
@media (max-width: 920px){ .reg-wrap{grid-template-columns:1fr} .reg-right{display:none} }
.reg-left{display:flex;flex-direction:column;padding:28px 48px 40px;position:relative}
.reg-top{display:flex;align-items:center;justify-content:space-between}
.reg-back{color:var(--muted);font-size:13px;display:inline-flex;align-items:center;gap:6px;transition:color .15s ease}
.reg-back:hover{color:var(--ink)}
.reg-center{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 0}
.reg-card{width:100%;max-width:420px;animation:fadeUp .5s cubic-bezier(.2,.7,.2,1)}
.reg-eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase}
.reg-title{font-size:40px;line-height:1.05;letter-spacing:-0.03em;font-weight:500;margin:10px 0 12px;text-wrap:balance}
.reg-title .serif{color:var(--teal)}
.reg-sub{color:var(--ink-2);font-size:15px;line-height:1.55;max-width:380px;text-wrap:pretty}
.auth-stack{margin-top:28px;display:flex;flex-direction:column;gap:10px}
.auth-btn{width:100%;padding:13px 16px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:12px;font-size:14.5px;font-weight:500;transition:all .15s ease;cursor:pointer;position:relative}
.auth-btn .ico{width:18px;height:18px;display:inline-grid;place-items:center}
.auth-btn.primary{background:#000;color:#fff;border:1px solid #000}
.auth-btn.primary:hover{background:#111;transform:translateY(-1px);box-shadow:0 8px 24px -12px rgba(0,0,0,0.4)}
.auth-btn.secondary{background:#fff;color:#3c4043;border:1px solid var(--line-2)}
.auth-btn.secondary:hover{background:#f8f9fa;border-color:#a8b2b7;box-shadow:0 2px 6px rgba(0,0,0,.05)}
.auth-btn:disabled{opacity:.65;cursor:not-allowed}
.auth-btn .spinner{width:16px;height:16px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .7s linear infinite}
.auth-divider{display:flex;align-items:center;gap:12px;margin:22px 0 16px;color:var(--muted);font-size:12px;font-family:'JetBrains Mono',monospace;letter-spacing:0.08em}
.auth-divider::before,.auth-divider::after{content:"";flex:1;height:1px;background:var(--line)}
.consent{display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:20px}
.consent input{margin-top:2px;accent-color:var(--teal);width:14px;height:14px;cursor:pointer}
.consent a{color:var(--teal);text-decoration:underline;text-underline-offset:3px}
.reg-alt{margin-top:28px;font-size:13.5px;color:var(--muted)}
.reg-alt a{color:var(--ink);font-weight:500;border-bottom:1px solid var(--line-2);padding-bottom:1px;margin-left:6px}
.reg-alt a:hover{border-color:var(--ink)}
.reg-footer{display:flex;justify-content:space-between;gap:16px;color:var(--muted);font-size:12px;font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;padding-top:24px;border-top:1px solid var(--line)}
.reg-footer .dots{display:inline-flex;align-items:center;gap:6px;color:var(--up)}
.reg-footer .dots::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--up);box-shadow:0 0 0 3px color-mix(in oklch, var(--up) 30%, transparent);animation:pulse 2s infinite}
.reg-right{background:
    radial-gradient(1200px 500px at 100% -10%, color-mix(in oklch, var(--teal) 35%, transparent), transparent 70%),
    radial-gradient(900px 400px at -20% 110%, color-mix(in oklch, var(--accent) 30%, transparent), transparent 70%),
    linear-gradient(160deg, var(--teal) 0%, var(--teal-2) 100%);
  color:#fff;padding:40px 48px;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.reg-right::before{content:"";position:absolute;inset:0;background-image:
    linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px);
  background-size:48px 48px;mask-image:radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 50% 30%, #000 30%, transparent 75%);opacity:.6}
.reg-right > *{position:relative}
.right-top{display:flex;align-items:center;gap:10px}
.right-top .mark{width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,.18);display:grid;place-items:center;font-family:'Instrument Serif';font-style:italic;font-size:22px;line-height:1;backdrop-filter:blur(6px)}
.right-top .t{font-weight:500}
.right-quote{font-size:42px;line-height:1.08;letter-spacing:-0.025em;font-weight:500;max-width:540px;text-wrap:balance}
.right-quote .serif{font-style:italic;opacity:.92}
.right-quote-sub{margin-top:20px;font-size:14.5px;opacity:.85;max-width:420px;line-height:1.55}
.live-terminal{background:rgba(0,0,0,.28);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:18px;padding:14px;box-shadow:0 30px 60px -30px rgba(0,0,0,.5)}
.lt-head{display:flex;align-items:center;gap:10px;padding:2px 6px 12px;border-bottom:1px solid rgba(255,255,255,.14)}
.lt-head .title{font-family:'JetBrains Mono',monospace;font-size:11.5px;color:rgba(255,255,255,.7)}
.lt-head .live{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11px;color:#7ef2c1;display:flex;align-items:center;gap:6px}
.lt-head .live .d{width:7px;height:7px;border-radius:50%;background:#7ef2c1;animation:pulse 1.5s infinite}
.lt-feed{display:flex;flex-direction:column;gap:8px;margin-top:12px;min-height:280px}
.sig{background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 12px 10px;animation:slideIn .5s cubic-bezier(.2,.7,.2,1)}
.sig-top{display:flex;align-items:center;gap:10px}
.sig-ava{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#fff,#c0e5d4);display:grid;place-items:center;color:#0d3d38;font-size:10.5px;font-weight:700;font-family:'JetBrains Mono',monospace;flex:0 0 auto}
.sig-h{font-size:13px;font-weight:500;color:#fff}
.sig-h .mm{color:rgba(255,255,255,.55);font-weight:400;margin-left:6px;font-size:11.5px;font-family:'JetBrains Mono',monospace}
.sig-t{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.55)}
.sig-b{font-size:13px;line-height:1.45;color:rgba(255,255,255,.88);margin-top:8px}
.sig-b b{color:#fff;font-weight:600}
.sig-f{display:flex;gap:6px;align-items:center;margin-top:10px;flex-wrap:wrap}
.tag{font-family:'JetBrains Mono',monospace;font-size:10.5px;padding:3px 8px;border-radius:999px;font-weight:500}
.tag-tk{background:rgba(255,255,255,.15);color:#fff}
.tag-buy{background:rgba(126,242,193,.2);color:#7ef2c1;border:1px solid rgba(126,242,193,.4)}
.tag-sell{background:rgba(255,143,143,.2);color:#ffb0b0;border:1px solid rgba(255,143,143,.4)}
.tag-score{background:#fff;color:var(--teal-2);margin-left:auto}
.right-footer{display:flex;gap:24px;align-items:center;font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,.65);letter-spacing:0.04em}
.right-footer .dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.4)}
`;

const XLogo = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const GLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.275-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A9 9 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/>
  </svg>
);

const FEED = [
  { i: 'HB', h: '@Mr_Derivatives', n: 'Heisenberg', t: 'just now', txt: <>Buying <b>$NVDA</b> 120C weekly. Unusual volume on the bid. Institutional flow is in.</>, tk: 'NVDA', v: 'BUY', s: '0.92' },
  { i: 'SB', h: '@StockSavvyShay', n: 'Shay Boloor', t: '12s', txt: <>Closing <b>$TSLA</b> swing +9%. Rejection at 200-day, negative gamma below 180.</>, tk: 'TSLA', v: 'SELL', s: '0.71' },
  { i: 'RM', h: '@retail_mourinho', n: 'Retail Mourinho', t: '41s', txt: <>Loading <b>$HIMS</b>. Volume 3.4× 20-day avg, short interest 22%, clean breakout.</>, tk: 'HIMS', v: 'BUY', s: '0.87' },
  { i: 'PC', h: '@PhotonCap', n: 'Photon Capital', t: '1m', txt: <>Earnings straddle on <b>$PLTR</b> implies 9%. Realized has been 14%. Buy the IV.</>, tk: 'PLTR', v: 'BUY', s: '0.81' },
];

function LivePreview() {
  const [feed, setFeed] = useState(FEED.slice(0, 3));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(n => {
        const next = (n + 1) % FEED.length;
        setFeed(v => [FEED[next], ...v].slice(0, 3));
        return next;
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="live-terminal">
      <div className="lt-head">
        <span className="title">xfintel://finx/live</span>
        <span className="live"><span className="d" />STREAMING</span>
      </div>
      <div className="lt-feed">
        {feed.map((s, i) => (
          <div key={`${s.h}-${idx}-${i}`} className="sig">
            <div className="sig-top">
              <div className="sig-ava">{s.i}</div>
              <div className="sig-h">{s.n}<span className="mm">{s.h}</span></div>
              <div className="sig-t">{s.t}</div>
            </div>
            <div className="sig-b">{s.txt}</div>
            <div className="sig-f">
              <span className="tag tag-tk">${s.tk}</span>
              <span className={`tag ${s.v === 'BUY' ? 'tag-buy' : 'tag-sell'}`}>{s.v === 'BUY' ? '▲' : '▼'} {s.v}</span>
              <span className="tag tag-score">score {s.s}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const flashConsent = () => {
    const el = document.querySelector('.consent') as HTMLElement | null;
    if (el) { el.style.color = 'var(--down)'; setTimeout(() => { el.style.color = ''; }, 1200); }
  };

  const go = (provider: string) => {
    if (!agree) { flashConsent(); return; }
    setLoading(provider);
    setTimeout(() => {
      try { localStorage.setItem('xfintel.authed', '1'); localStorage.setItem('xfintel.provider', provider); } catch (e) {}
      window.location.href = '/onboarding';
    }, 1400);
  };

  const signInWithX = async () => {
    if (!agree) { flashConsent(); return; }
    setLoading('x');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error(error);
      alert(`Error: ${error.message} | Status: ${error.status} | Code: ${JSON.stringify(error)}`);
      setLoading(null);
    }
  };

  const signInWithGoogle = async () => {
    if (!agree) { flashConsent(); return; }
    setLoading('google');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      console.error(error);
      setLoading(null);
    }
  };

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: APP_CSS + PAGE_CSS }} />

      <div className="reg-wrap">
        <div className="reg-left">
          <div className="reg-top">
            <a href="/landing" className="brand">
              <span className="brand-mark" />
              <span>XFintel<br /><span className="sub">X Financial Intelligence</span></span>
            </a>
            <a href="/landing" className="reg-back">← Back to home</a>
          </div>

          <div className="reg-center">
            <div className="reg-card">
              <div className="reg-eyebrow">§ Free access · beta</div>
              <h1 className="reg-title">Turn <span className="x-italic serif">X</span> into your <span className="serif">edge.</span></h1>
              <p className="reg-sub">Connect the account you already use to read FinX. We'll surface verified signals from the 50 tracked leaders in under a minute.</p>

              <div className="auth-stack">
                <button className="auth-btn primary" onClick={signInWithX} disabled={loading !== null}>
                  {loading === 'x' ? <span className="spinner" /> : <span className="ico"><XLogo /></span>}
                  {loading === 'x' ? 'Connecting to X…' : 'Continue with X'}
                </button>
                <button className="auth-btn secondary" onClick={signInWithGoogle} disabled={loading !== null}>
                  {loading === 'google' ? <span className="spinner" /> : <span className="ico"><GLogo /></span>}
                  {loading === 'google' ? 'Connecting to Google…' : 'Continue with Google'}
                </button>
              </div>

              <div className="auth-divider">WHY CONNECT X</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5, color: 'var(--ink-2)' }}>
                <li style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--teal)' }}>✓</span>We read your following list to surface overlapping FinX leaders</li>
                <li style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--teal)' }}>✓</span>Read-only access. We never post, DM, or like anything.</li>
                <li style={{ display: 'flex', gap: 10 }}><span style={{ color: 'var(--teal)' }}>✓</span>Revoke anytime in X settings → Connected apps</li>
              </ul>

              <label className="consent">
                <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />
                <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and understand XFintel does not provide investment advice.</span>
              </label>

              <div className="reg-alt">
                Already have an account?<a href="#" onClick={(e) => { e.preventDefault(); go('x'); }}>Sign in</a>
              </div>
            </div>
          </div>

          <div className="reg-footer">
            <span>© 2026 XFintel Labs</span>
            <span className="dots">BETA · SOC-2 IN PROGRESS</span>
          </div>
        </div>

        <div className="reg-right">
          <div className="right-top">
            <span className="mark">X</span>
            <span className="t">Live from FinX</span>
          </div>

          <div>
            <div className="right-quote">
              "My YTD was 2 digits before I started <span className="serif">listening.</span>"
            </div>
            <div className="right-quote-sub">
              — @Ren_aramb, one of 1.4M FinX users who turned X chatter into a track record. Every signal below is live, timestamped, and scored as it lands.
            </div>
          </div>

          <LivePreview />

          <div className="right-footer">
            <span>50 FinX LEADERS TRACKED</span>
            <span className="dot" />
            <span>~15 MIN SIGNAL LEAD-TIME</span>
            <span className="dot" />
            <span>3,812 VERIFIED CALLS</span>
          </div>
        </div>
      </div>
    </>
  );
}
