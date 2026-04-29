/* eslint-disable */
"use client";
import { useState, useEffect, useRef, useMemo } from "react";

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  :root{
    --bg: oklch(0.985 0.004 95);--bg-2: oklch(0.965 0.006 95);
    --ink: oklch(0.18 0.015 180);--ink-2: oklch(0.32 0.012 180);
    --muted: oklch(0.52 0.01 180);--line: oklch(0.90 0.008 170);--line-2: oklch(0.85 0.01 170);
    --teal: oklch(0.38 0.065 175);--teal-2: oklch(0.30 0.07 175);
    --accent: oklch(0.56 0.12 160);--accent-2: oklch(0.48 0.13 160);
    --chip: oklch(0.96 0.015 165);--card: #ffffff;--radius: 14px;--radius-lg: 22px;
    --shadow-sm: 0 1px 0 0 oklch(0.90 0.01 170 / 0.6), 0 1px 2px oklch(0.20 0.02 180 / 0.04);
    --shadow-md: 0 1px 0 0 oklch(0.92 0.01 170 / 0.8), 0 10px 28px -18px oklch(0.30 0.05 175 / 0.25);
    --shadow-lg: 0 30px 60px -30px oklch(0.30 0.06 175 / 0.35), 0 2px 6px oklch(0.20 0.02 180 / 0.05);
    --up: oklch(0.58 0.13 160);--down: oklch(0.58 0.14 28);--warn: oklch(0.80 0.14 78);
  }
  html[data-theme="dark"]{
    --bg: oklch(0.16 0.012 175);--bg-2: oklch(0.20 0.014 175);
    --ink: oklch(0.96 0.005 95);--ink-2: oklch(0.82 0.01 170);--muted: oklch(0.62 0.012 170);
    --line: oklch(0.26 0.014 175);--line-2: oklch(0.32 0.016 175);
    --teal: oklch(0.78 0.11 165);--teal-2: oklch(0.70 0.12 165);
    --accent: oklch(0.72 0.16 155);--accent-2: oklch(0.80 0.16 155);--chip: oklch(0.22 0.02 170);
    --card: oklch(0.19 0.014 175);
    --shadow-sm: 0 1px 0 0 oklch(0.30 0.02 175 / 0.5);
    --shadow-md: 0 1px 0 0 oklch(0.30 0.02 175 / 0.4), 0 12px 30px -18px oklch(0 0 0 / 0.5);
    --shadow-lg: 0 30px 60px -30px oklch(0 0 0 / 0.7);
  }
  html[data-palette="bold"]{
    --bg: oklch(0.985 0.004 95);--bg-2: oklch(0.96 0.008 95);--ink: oklch(0.15 0.02 180);
    --teal: oklch(0.28 0.075 170);--teal-2: oklch(0.22 0.08 170);
    --accent: oklch(0.78 0.20 130);--accent-2: oklch(0.70 0.20 130);--chip: oklch(0.95 0.04 130);
    --up: oklch(0.72 0.18 140);--down: oklch(0.62 0.18 30);
  }
  html[data-palette="bold"][data-theme="dark"]{
    --bg: oklch(0.14 0.015 170);--bg-2: oklch(0.18 0.018 170);
    --ink: oklch(0.98 0.01 110);--teal: oklch(0.86 0.14 150);--teal-2: oklch(0.78 0.16 145);
    --accent: oklch(0.88 0.22 130);--accent-2: oklch(0.80 0.22 130);--chip: oklch(0.22 0.04 150);
    --card: oklch(0.17 0.018 170);--line: oklch(0.26 0.02 170);
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--ink);
    font-family:'Geist',ui-sans-serif,system-ui,-apple-system,sans-serif;
    font-feature-settings:"ss01","ss02","cv11";-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}
  body{min-height:100vh;overflow-x:hidden;}
  ::selection{background:var(--accent);color:#0a0a0a}
  a{color:inherit;text-decoration:none}
  button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}
  .mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-feature-settings:"zero","ss01"}
  .serif{font-family:'Instrument Serif',ui-serif,Georgia,serif;font-style:italic;font-weight:400}
  .wrap{max-width:1240px;margin:0 auto;padding:0 28px}
  .wrap-narrow{max-width:980px;margin:0 auto;padding:0 28px}
  .reveal{opacity:0;transform:translateY(18px);transition:opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)}
  .reveal.in{opacity:1;transform:none}
  .nav{position:sticky;top:0;z-index:50;backdrop-filter:saturate(1.2) blur(12px);-webkit-backdrop-filter:saturate(1.2) blur(12px);background:color-mix(in oklch, var(--bg) 75%, transparent);border-bottom:1px solid transparent;transition:border-color .2s ease, background .2s ease}
  .nav.scrolled{border-bottom-color:var(--line)}
  .nav-inner{display:flex;align-items:center;justify-content:space-between;height:64px}
  .brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-0.01em}
  .brand-mark{width:26px;height:26px;border-radius:8px;background:var(--teal);display:grid;place-items:center;color:var(--bg);font-weight:700;font-size:14px}
  .brand-mark::before{content:"X";font-family:'Instrument Serif';font-style:italic;font-size:18px;line-height:1;transform:translateY(-1px)}
  .nav-links{display:flex;align-items:center;gap:28px;font-size:14px;color:var(--ink-2)}
  .nav-links a{position:relative;padding:6px 0}
  .nav-links a::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--ink);transform:scaleX(0);transform-origin:left;transition:transform .25s ease}
  .nav-links a:hover::after{transform:scaleX(1)}
  .nav-cta{display:flex;gap:10px;align-items:center}
  @media (max-width: 820px){ .nav-links{display:none} }
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 18px;border-radius:999px;font-size:14.5px;font-weight:500;line-height:1;transition:transform .15s ease, background .2s ease, color .2s ease, box-shadow .2s ease, border-color .2s ease;white-space:nowrap}
  .btn-primary{background:var(--teal);color:var(--bg);box-shadow:inset 0 0 0 1px oklch(0 0 0 / 0.06), 0 6px 18px -10px var(--teal)}
  .btn-primary:hover{background:var(--teal-2);transform:translateY(-1px)}
  .btn-ghost{background:transparent;color:var(--ink);border:1px solid var(--line-2)}
  .btn-ghost:hover{background:var(--bg-2);border-color:var(--ink-2)}
  .btn-sm{padding:9px 14px;font-size:13px}
  .hero{padding:72px 0 40px;position:relative;overflow:hidden}
  .eyebrow{display:inline-flex;align-items:center;gap:10px;padding:6px 12px 6px 8px;border:1px solid var(--line-2);border-radius:999px;font-size:12.5px;color:var(--ink-2);background:var(--bg);letter-spacing:0.01em}
  .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--up);box-shadow:0 0 0 3px color-mix(in oklch, var(--up) 30%, transparent);animation:pulse 2s infinite}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  h1.hero-title{font-size:clamp(44px, 7vw, 92px);line-height:0.98;letter-spacing:-0.035em;font-weight:500;margin:22px 0 0;color:var(--ink);text-wrap:balance}
  h1.hero-title .accent{color:var(--teal)}
  h1.hero-title .serif{color:var(--teal);letter-spacing:-0.015em}
  .hero-sub{margin-top:22px;max-width:620px;font-size:18px;line-height:1.55;color:var(--ink-2);text-wrap:pretty}
  .hero-cta{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap;align-items:center}
  .hero-meta{margin-top:22px;display:flex;gap:26px;color:var(--muted);font-size:13px;align-items:center;flex-wrap:wrap}
  .hero-meta .pip{width:4px;height:4px;border-radius:50%;background:var(--line-2)}
  .hero-grid{display:grid;grid-template-columns:1.15fr 1fr;gap:56px;align-items:center;margin-top:28px}
  @media (max-width: 980px){ .hero-grid{grid-template-columns:1fr;gap:36px} }
  .terminal{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);overflow:hidden;position:relative}
  .terminal-head{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);background:linear-gradient(to bottom, var(--bg-2), transparent)}
  .terminal-head .lights{display:flex;gap:6px}
  .terminal-head .lights span{width:10px;height:10px;border-radius:50%;background:var(--line-2)}
  .terminal-head .title{font-size:12px;color:var(--muted);font-family:'JetBrains Mono',monospace}
  .terminal-head .status{margin-left:auto;display:flex;align-items:center;gap:6px;font-size:11.5px;color:var(--up);font-family:'JetBrains Mono',monospace}
  .terminal-head .status .live{width:7px;height:7px;border-radius:50%;background:var(--up);animation:pulse 1.5s infinite}
  .grid-bg{position:absolute;inset:0;pointer-events:none;opacity:.55;background-image:linear-gradient(var(--line) 1px, transparent 1px),linear-gradient(90deg, var(--line) 1px, transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse at 50% 0%, #000 30%, transparent 75%);-webkit-mask-image:radial-gradient(ellipse at 50% 0%, #000 30%, transparent 75%);}
  .section{padding:100px 0;position:relative}
  .section h2{font-size:clamp(30px, 4vw, 52px);line-height:1.04;letter-spacing:-0.028em;font-weight:500;margin:0;text-wrap:balance}
  .section h2 .accent{color:var(--teal)}
  .section h2 .serif{color:var(--teal)}
  .section-kicker{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px}
  .section-lead{color:var(--ink-2);max-width:640px;font-size:17px;line-height:1.55;margin-top:16px;text-wrap:pretty}
  .section-head{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;margin-bottom:44px;flex-wrap:wrap}
  .perf{display:grid;grid-template-columns:1fr 1.1fr;gap:32px;align-items:stretch}
  @media (max-width: 980px){ .perf{grid-template-columns:1fr} }
  .perf-left .stats-list{margin-top:28px;display:flex;flex-direction:column;gap:10px}
  .stat-row{display:flex;align-items:center;gap:16px;padding:16px 18px;border:1px solid var(--line);border-radius:14px;background:var(--card);transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease}
  .stat-row:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:var(--shadow-md)}
  .stat-row .ico{width:36px;height:36px;border-radius:10px;background:var(--chip);display:grid;place-items:center;flex:0 0 auto;color:var(--teal)}
  .stat-row .copy{flex:1;min-width:0}
  .stat-row .t{font-weight:500;font-size:15px;color:var(--ink)}
  .stat-row .d{font-size:13px;color:var(--muted);margin-top:2px}
  .stat-row .v{font-family:'JetBrains Mono',monospace;font-size:14px;color:var(--ink);font-weight:500}
  .demo-card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-lg);box-shadow:var(--shadow-lg);overflow:hidden;position:relative;display:flex;flex-direction:column}
  .demo-header{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--line)}
  .demo-header .t{font-weight:500;font-size:14px}
  .demo-header .live{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--up);display:flex;align-items:center;gap:6px}
  .demo-header .live .d{width:7px;height:7px;border-radius:50%;background:var(--up);animation:pulse 1.5s infinite}
  .demo-body{padding:14px;display:flex;flex-direction:column;gap:10px;flex:1}
  .signal-card{border:1px solid var(--line);border-radius:14px;padding:14px 14px 12px;background:var(--bg);display:flex;flex-direction:column;gap:10px;transition:all .3s ease;position:relative}
  .signal-card.new{animation:slideIn .5s cubic-bezier(.2,.7,.2,1)}
  @keyframes slideIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
  .signal-top{display:flex;align-items:center;gap:10px}
  .avatar{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg, var(--teal), var(--accent));display:grid;place-items:center;color:var(--bg);font-size:11px;font-weight:600;font-family:'JetBrains Mono',monospace;flex:0 0 auto}
  .handle{font-size:13.5px;font-weight:500;color:var(--ink)}
  .handle .muted{color:var(--muted);font-weight:400;margin-left:6px}
  .ts{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted)}
  .signal-text{font-size:13.5px;line-height:1.5;color:var(--ink-2)}
  .signal-text strong{color:var(--ink);font-weight:500}
  .signal-foot{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .pill{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.02em}
  .pill-ticker{background:var(--chip);color:var(--teal)}
  .pill-buy{background:color-mix(in oklch, var(--up) 18%, var(--bg));color:var(--up);border:1px solid color-mix(in oklch, var(--up) 30%, transparent)}
  .pill-sell{background:color-mix(in oklch, var(--down) 18%, var(--bg));color:var(--down);border:1px solid color-mix(in oklch, var(--down) 30%, transparent)}
  .pill-hold{background:color-mix(in oklch, var(--muted) 18%, var(--bg));color:var(--ink-2);border:1px solid var(--line-2)}
  .pill-score{margin-left:auto;background:var(--teal);color:var(--bg)}
  .feed-grid{display:grid;grid-template-columns:1.4fr 1fr;gap:18px;margin-top:18px}
  @media (max-width: 980px){ .feed-grid{grid-template-columns:1fr} }
  .panel{background:var(--card);border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;position:relative}
  .panel-head{display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line)}
  .panel-head .t{font-weight:500;font-size:14.5px}
  .panel-head .sub{margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:var(--muted);display:flex;gap:6px;align-items:center}
  .feed-row{display:grid;grid-template-columns:70px 1fr 90px 110px;gap:14px;align-items:center;padding:14px 20px;border-bottom:1px solid var(--line);transition:background .15s ease}
  .feed-row:last-child{border-bottom:none}
  .feed-row:hover{background:var(--bg-2)}
  .feed-row .time{font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted)}
  .feed-row .who{display:flex;flex-direction:column;gap:2px;min-width:0}
  .feed-row .who .h{font-size:13.5px;font-weight:500;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .feed-row .who .c{font-size:11.5px;color:var(--muted);font-family:'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .feed-row .tkr{font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--ink-2);font-weight:500}
  .tstock{display:grid;grid-template-columns:1fr auto;gap:8px 18px;padding:14px 20px;border-bottom:1px solid var(--line)}
  .tstock:last-of-type{border-bottom:none}
  .tstock .l{display:flex;align-items:center;gap:12px}
  .tstock .t{font-family:'JetBrains Mono',monospace;font-weight:600;font-size:14px;color:var(--ink)}
  .tstock .name{font-size:12.5px;color:var(--muted)}
  .tstock .prices{display:flex;gap:14px;align-items:center;font-family:'JetBrains Mono',monospace;font-size:13px}
  .tstock .up{color:var(--up)}
  .tstock .down{color:var(--down)}
  .spark{width:60px;height:22px;display:block}
  .aum{padding:22px 24px;background:linear-gradient(135deg, var(--teal), var(--teal-2));color:var(--bg);border-radius:18px;margin:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:18px;overflow:hidden;position:relative}
  .aum .lab{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:.8}
  .aum .v{font-size:36px;font-weight:500;letter-spacing:-0.02em;margin-top:4px;font-feature-settings:"tnum"}
  .aum .pct{font-family:'JetBrains Mono',monospace;font-size:13px;opacity:.9}
  .aum svg{position:absolute;right:0;bottom:0;opacity:.25;width:60%}
  .why{padding:120px 0}
  .why-head{text-align:center;max-width:860px;margin:0 auto 60px}
  .why-head h2{font-size:clamp(34px, 4.5vw, 56px)}
  .why-head p{margin-top:18px}
  .tweet-gallery{display:grid;grid-template-columns:repeat(2, 1fr);gap:22px;margin-top:20px;align-items:start}
  @media (max-width: 820px){ .tweet-gallery{grid-template-columns:1fr} }
  .tweet{background:#000;color:#e7e9ea;border:1px solid #2f3336;border-radius:16px;padding:16px 18px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.35;transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease}
  .tweet:hover{transform:translateY(-3px);border-color:#536471;box-shadow:0 20px 40px -20px rgba(0,0,0,.45)}
  .tweet-head{display:flex;gap:10px;align-items:flex-start}
  .tw-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#4a5568,#1a202c);flex:0 0 auto;display:grid;place-items:center;color:#e7e9ea;font-weight:700;font-size:15px;overflow:hidden;position:relative}
  .tw-avatar.av-cole{background:linear-gradient(135deg,#2c5282,#1a365d)}
  .tw-avatar.av-pepe{background:#4a7c3a;color:#c8e6b5}
  .tw-avatar.av-ren{background:linear-gradient(135deg,#f6e05e,#d69e2e);color:#2d3748}
  .tw-avatar.av-llm{background:linear-gradient(135deg,#38b2ac,#2c7a7b)}
  .tw-meta{flex:1;min-width:0;display:flex;flex-direction:column}
  .tw-line1{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
  .tw-name{font-weight:700;color:#e7e9ea;font-size:15px}
  .tw-verified{width:16px;height:16px;display:inline-block;flex:0 0 auto;margin-left:2px}
  .tw-handle,.tw-sep,.tw-date{color:#71767b;font-size:15px;font-weight:400}
  .tw-more{margin-left:auto;color:#71767b;font-size:18px;line-height:1;padding:2px 6px;cursor:default}
  .tw-replyto{color:#71767b;font-size:14px;margin-top:2px}
  .tw-replyto a{color:#1d9bf0}
  .tw-body{margin-top:10px;color:#e7e9ea;font-size:15px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}
  .tw-body b{font-weight:700;color:#e7e9ea}
  .tw-broker{padding:14px 16px;border:1px solid #2f3336;border-radius:14px;margin-top:12px;background:#0a0a0a}
  .tw-broker-head{display:flex;align-items:center;gap:10px;color:#e7e9ea;font-size:15px;font-weight:600}
  .tw-broker-logo{color:#e11d1d;font-weight:900;font-size:18px;line-height:1}
  .tw-broker-val{margin-top:12px;font-size:13px;color:#71767b}
  .tw-broker-val span{color:#e7e9ea;font-weight:600;padding-right:8px;border-right:1px solid #2f3336;margin-right:8px}
  .tw-broker-pct{font-size:42px;font-weight:600;color:#00ba7c;letter-spacing:-0.02em;margin-top:8px;font-feature-settings:"tnum"}
  .tw-broker-tr{color:#71767b;font-size:14px;margin-top:2px}
  .tw-actions{display:flex;justify-content:space-between;margin-top:14px;color:#71767b;font-size:13px;max-width:460px}
  .tw-action{display:inline-flex;align-items:center;gap:6px}
  .tw-action svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2}
  .trio{display:grid;grid-template-columns:repeat(3, 1fr);gap:24px;margin-top:68px}
  @media (max-width: 820px){ .trio{grid-template-columns:1fr} }
  .feat{padding:28px 26px;border:1px solid var(--line);border-radius:18px;background:var(--card);transition:all .25s ease}
  .feat:hover{border-color:var(--teal);transform:translateY(-3px)}
  .feat .ico{width:40px;height:40px;border-radius:10px;background:var(--chip);color:var(--teal);display:grid;place-items:center;margin-bottom:18px}
  .feat .t{font-size:18px;font-weight:500;margin-bottom:8px;letter-spacing:-0.01em}
  .feat .d{color:var(--ink-2);font-size:14.5px;line-height:1.55}
  .final-cta{margin:100px auto 0;max-width:1240px;padding:0 28px}
  .final-cta-inner{background:linear-gradient(135deg, var(--teal), var(--teal-2));color:var(--bg);border-radius:28px;padding:72px 48px 60px;position:relative;overflow:hidden;text-align:center}
  .final-cta-inner::before{content:"";position:absolute;inset:0;background:radial-gradient(1000px 400px at 50% -50%, color-mix(in oklch, var(--accent) 50%, transparent), transparent);pointer-events:none}
  .final-cta h2{font-size:clamp(34px, 5vw, 60px);letter-spacing:-0.03em;font-weight:500;line-height:1.02;margin:0;position:relative}
  .final-cta h2 .serif{font-style:italic}
  .final-cta p{margin-top:20px;font-size:16px;opacity:.86;position:relative;max-width:560px;margin-left:auto;margin-right:auto}
  .waitlist{margin-top:32px;display:flex;gap:10px;max-width:520px;margin-left:auto;margin-right:auto;position:relative;padding:6px;background:color-mix(in oklch, var(--bg) 16%, transparent);border:1px solid color-mix(in oklch, var(--bg) 22%, transparent);border-radius:999px;backdrop-filter:blur(4px)}
  .waitlist input{flex:1;padding:12px 18px;border:none;outline:none;background:transparent;color:var(--bg);font-size:14.5px;font-family:inherit}
  .waitlist input::placeholder{color:color-mix(in oklch, var(--bg) 60%, transparent)}
  .waitlist button{padding:12px 20px;border-radius:999px;background:var(--bg);color:var(--ink);font-weight:500;font-size:14px;transition:transform .15s ease}
  .waitlist button:hover{transform:scale(1.02)}
  .waitlist .ok{color:var(--bg);padding:12px 20px;font-family:'JetBrains Mono',monospace;font-size:13px}
  .final-ctas{margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap;position:relative}
  .btn-lg{padding:15px 26px;font-size:15px}
  .btn-ghost-light{background:color-mix(in oklch, var(--bg) 14%, transparent);color:var(--bg);border:1px solid color-mix(in oklch, var(--bg) 26%, transparent);backdrop-filter:blur(6px)}
  .btn-ghost-light:hover{background:color-mix(in oklch, var(--bg) 22%, transparent);border-color:color-mix(in oklch, var(--bg) 40%, transparent)}
  .final-meta{margin-top:22px;font-family:'JetBrains Mono',monospace;font-size:12px;opacity:.75;letter-spacing:0.04em;position:relative}
  footer{padding:56px 0 40px;border-top:1px solid var(--line);margin-top:80px}
  .foot{display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;font-size:13px;color:var(--muted)}
  .foot-links{display:flex;gap:22px}
  .ticker-strip{border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--bg-2);overflow:hidden;position:relative;padding:14px 0}
  .ticker-strip::before,.ticker-strip::after{content:"";position:absolute;top:0;bottom:0;width:120px;z-index:2;pointer-events:none}
  .ticker-strip::before{left:0;background:linear-gradient(to right, var(--bg-2), transparent)}
  .ticker-strip::after{right:0;background:linear-gradient(to left, var(--bg-2), transparent)}
  .ticker-track{display:flex;gap:48px;width:max-content;animation:scroll 60s linear infinite;will-change:transform}
  @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
  .tick{display:inline-flex;align-items:center;gap:10px;font-family:'JetBrains Mono',monospace;font-size:13px;color:var(--ink-2)}
  .tick .sym{font-weight:600;color:var(--ink)}
  .tick .up{color:var(--up)}
  .tick .down{color:var(--down)}
  .tweaks{position:fixed;right:20px;bottom:20px;z-index:99;background:var(--card);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow-lg);padding:16px;display:none;flex-direction:column;gap:14px;min-width:220px}
  .tweaks.on{display:flex}
  .tweaks h4{margin:0 0 4px;font-size:11.5px;font-family:'JetBrains Mono',monospace;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase}
  .tweaks .row{display:flex;gap:6px}
  .tweaks .chip{flex:1;padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:transparent;font-size:12.5px;color:var(--ink);cursor:pointer;transition:all .15s ease}
  .tweaks .chip:hover{border-color:var(--ink-2)}
  .tweaks .chip.active{background:var(--teal);border-color:var(--teal);color:var(--bg)}
  .x-italic{font-family:'Instrument Serif';font-style:italic;font-weight:400;padding-right:0.04em}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────

const I: any = {
  arrow: (p: any) => <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>,
  spark: (p: any) => <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>,
  shield: (p: any) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/><path d="M9 12l2 2 4-4"/></svg>,
  eye: (p: any) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  flag: (p: any) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4h13l-2 4 2 4H4"/></svg>,
  check: (p: any) => <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>,
  bolt: (p: any) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/></svg>,
  graph: (p: any) => <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-7"/></svg>,
};

const Brand = () => (
  <a href="/landing" className="brand">
    <span className="brand-mark" aria-hidden="true" />
    <span style={{fontSize:16,letterSpacing:'-0.02em'}}><span className="x-italic serif">X</span>Fintel</span>
  </a>
);

function Nav({ onTheme, theme }: { onTheme: () => void; theme: string }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 12);
    h(); window.addEventListener('scroll', h, {passive:true});
    return () => window.removeEventListener('scroll', h);
  }, []);
  return (
    <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="wrap nav-inner">
        <Brand />
        <div className="nav-links">
          <a href="#how">How it works</a>
          <a href="#finx-leaders">FinX Leaders</a>
          <a href="#feed">Live feed</a>
        </div>
        <div className="nav-cta">
          <button className="btn btn-ghost btn-sm" onClick={onTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <a href="/register" className="btn btn-ghost btn-sm">Sign in</a>
          <a href="/register" className="btn btn-primary btn-sm">Get access <I.arrow /></a>
        </div>
      </div>
    </nav>
  );
}

const TICK_ITEMS: [string, number][] = [
  ['NVDA',+2.4],['AAPL',+0.8],['TSLA',-1.2],['MSFT',+1.1],['META',+3.2],['AMZN',+0.4],
  ['PLTR',+5.7],['AMD',-2.1],['COIN',+4.3],['SHOP',+1.8],['SOFI',-0.9],['HIMS',+7.2],
  ['CRWD',+2.0],['NET',+1.5],['SMCI',-3.8],['ARM',+2.9],['MSTR',+6.1],['GOOGL',+1.2],
];
function Ticker() {
  return (
    <div className="ticker-strip" aria-hidden="true">
      <div className="ticker-track">
        {[...TICK_ITEMS,...TICK_ITEMS].map(([s,p],i) => (
          <span className="tick" key={i}>
            <span className="sym">{s}</span>
            <span className={p>=0?'up':'down'}>{p>=0?'+':''}{p.toFixed(2)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const HERO_FEED = [
  { handle:'@mega_chartist', initials:'MC', time:'just now', text:'Buying the dip on NVDA. Institutional flow into $120 strikes is unusual.', ticker:'NVDA', verdict:'BUY', score:'0.92' },
  { handle:'@quant_mouse', initials:'QM', time:'12s', text:'HIMS breakout confirmed. Volume 3.4× 20-day avg, short interest 22%.', ticker:'HIMS', verdict:'BUY', score:'0.87' },
  { handle:'@delta_daniel', initials:'DD', time:'41s', text:'Taking profit on TSLA swing. Rejection at the 200-day + negative gamma.', ticker:'TSLA', verdict:'SELL', score:'0.71' },
  { handle:'@macro_owl', initials:'MO', time:'1m', text:'PLTR earnings set-up is clean. Implied 9% move looks mispriced vs. realized.', ticker:'PLTR', verdict:'BUY', score:'0.81' },
];

function highlight(text: string, ticker: string) {
  const re = new RegExp(`(${ticker}|\\$${ticker})`,'g');
  const parts = text.split(re);
  return parts.map((p,i) => re.test(p) ? <strong key={i}>{p}</strong> : <span key={i}>{p}</span>);
}

function HeroTerminal() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(HERO_FEED.slice(0,3));
  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => {
        const next = (i+1) % HERO_FEED.length;
        setVisible(v => [HERO_FEED[next], ...v].slice(0,3));
        return next;
      });
    }, 3200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="terminal reveal in" id="demo">
      <div className="terminal-head">
        <div className="lights"><span/><span/><span/></div>
        <span className="title">xfintel://finx-leaders/live</span>
        <span className="status"><span className="live"/>STREAMING</span>
      </div>
      <div className="demo-body" style={{minHeight:420}}>
        {visible.map((s,i) => (
          <div className={`signal-card ${i===0?'new':''}`} key={`${s.handle}-${idx}-${i}`}>
            <div className="signal-top">
              <div className="avatar">{s.initials}</div>
              <div className="handle">{s.handle}<span className="muted">· FinX leader #{(12+i).toString().padStart(3,'0')}</span></div>
              <div className="ts">{s.time}</div>
            </div>
            <div className="signal-text">{highlight(s.text, s.ticker)}</div>
            <div className="signal-foot">
              <span className="pill pill-ticker">${s.ticker}</span>
              <span className={`pill ${s.verdict==='BUY'?'pill-buy':s.verdict==='SELL'?'pill-sell':'pill-hold'}`}>
                {s.verdict==='BUY'?'▲':s.verdict==='SELL'?'▼':'◆'} {s.verdict}
              </span>
              <span className="pill pill-score">score {s.score}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="grid-bg" />
      <div className="wrap hero-grid">
        <div className="reveal in">
          <span className="eyebrow"><span className="dot"/>Live · tracking 50 FinX leaders</span>
          <h1 className="hero-title">
            Turn <span className="x-italic serif">X</span> noise into <br/>
            <span className="serif">actionable alpha.</span>
          </h1>
          <p className="hero-sub">
            Real-time accountability for the 50 most trusted FinX leaders. We score every post, track every call, and surface the signals the market hasn&apos;t priced in yet.
          </p>
          <div className="hero-cta">
            <a href="/register" className="btn btn-primary">Get free access <I.arrow /></a>
            <a href="#demo" className="btn btn-ghost">See a live signal <I.spark /></a>
          </div>
          <div className="hero-meta">
            <span><strong style={{color:'var(--ink)'}}>50</strong> FinX leaders tracked</span>
            <span className="pip"/>
            <span>Signal lead-time <strong style={{color:'var(--ink)'}} className="mono">~15 min</strong></span>
            <span className="pip"/>
            <span>No credit card</span>
          </div>
        </div>
        <HeroTerminal />
      </div>
    </section>
  );
}

function StatRow({t,d,v,ico}: {t:string,d:string,v:string,ico:React.ReactNode}) {
  return (
    <div className="stat-row reveal">
      <div className="ico">{ico}</div>
      <div className="copy">
        <div className="t">{t}</div>
        <div className="d">{d}</div>
      </div>
      <div className="v">{v}</div>
    </div>
  );
}

const CURATORS = [
  { h:'@mega_chartist', score:94.2, calls:812, hit:72, delta:'+260.38%' },
  { h:'@quant_mouse',   score:91.6, calls:640, hit:68, delta:'+184.12%' },
  { h:'@delta_daniel',  score:88.3, calls:921, hit:63, delta:'+146.70%' },
  { h:'@macro_owl',     score:85.1, calls:418, hit:66, delta:'+122.04%' },
];

function PerfCard() {
  return (
    <div className="demo-card reveal">
      <div className="demo-header">
        <div className="avatar" style={{background:'var(--teal)'}}>▣</div>
        <div className="t">FinX leaderboard <span style={{color:'var(--muted)',fontWeight:400,marginLeft:6}}>· 90d return</span></div>
        <span className="live"><span className="d"/>updating</span>
      </div>
      <div style={{padding:'6px 0'}}>
        {CURATORS.map((c,i) => (
          <div key={c.h} style={{display:'grid',gridTemplateColumns:'28px 1fr auto',gap:14,alignItems:'center',padding:'12px 20px',borderBottom:i<CURATORS.length-1?'1px solid var(--line)':'none'}}>
            <div className="mono" style={{fontSize:12,color:'var(--muted)'}}>{String(i+1).padStart(2,'0')}</div>
            <div style={{display:'flex',flexDirection:'column',gap:2}}>
              <div style={{fontSize:14,fontWeight:500}}>{c.h}</div>
              <div className="mono" style={{fontSize:11.5,color:'var(--muted)'}}>{c.calls} calls · {c.hit}% win rate · score {c.score}</div>
            </div>
            <div className="mono" style={{fontSize:14,color:'var(--up)',fontWeight:600,fontFeatureSettings:'"tnum"'}}>{c.delta}</div>
          </div>
        ))}
      </div>
      <div className="aum" style={{margin:16,marginTop:12}}>
        <div>
          <div className="lab">Top FinX leader · YTD</div>
          <div className="v">+260.38%</div>
          <div className="pct">verified return · 50-leader pool</div>
        </div>
        <svg viewBox="0 0 200 60" preserveAspectRatio="none">
          <path d="M0 45 C 20 40, 30 30, 50 28 C 70 26, 80 34, 100 30 C 120 26, 135 12, 160 10 C 180 8, 192 16, 200 14 L 200 60 L 0 60 Z" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}

function Performance() {
  return (
    <section className="section" id="finx-leaders">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="section-kicker">§ 01 — Evidence, not vibes</span>
            <h2>Proven FinX leader <span className="serif">performance.</span></h2>
          </div>
          <p className="section-lead">
            We hand-picked 50 of the most-followed FinX leaders on X. Every call is timestamped, graded against market close, and ranked — so you&apos;re trading on a verified moat, not blind trust.
          </p>
        </div>
        <div className="perf">
          <div className="perf-left">
            <div className="stats-list">
              <StatRow t="Verified track record" d="Every call timestamped, scored against market close" v="3,812 calls" ico={<I.check/>} />
              <StatRow t="FinX leader board" d="50 hand-picked leaders, ranked by 90-day risk-adjusted return" v="50 tracked" ico={<I.eye/>} />
              <StatRow t="Signal moat" d="Median lead-time from post to mainstream pickup" v="~15 min" ico={<I.bolt/>} />
              <StatRow t="Bot & pump detection" d="We flag coordinated posting and paid promos" v="active" ico={<I.shield/>} />
            </div>
          </div>
          <PerfCard />
        </div>
      </div>
    </section>
  );
}

const FEED_DATA = [
  { t:'11:02', h:'@mega_chartist', c:'Institutional Quant', tkr:'NVDA 120C', verdict:'BUY' },
  { t:'10:58', h:'@quant_mouse',  c:'Systematic', tkr:'HIMS', verdict:'BUY' },
  { t:'10:51', h:'@delta_daniel', c:'Options desk alum', tkr:'TSLA', verdict:'SELL' },
  { t:'10:44', h:'@macro_owl',    c:'Macro · rates', tkr:'PLTR', verdict:'BUY' },
  { t:'10:31', h:'@greeks_again', c:'Derivatives', tkr:'SPY 515P', verdict:'HOLD' },
  { t:'10:22', h:'@vol_shaman',   c:'Vol arb', tkr:'VIX', verdict:'BUY' },
];
const TRENDING = [
  { sym:'NVDA', name:'Nvidia', px:'872.14', ch:'+2.4%', dir:'up', spark:[10,12,11,13,14,16,15,17,19,22] },
  { sym:'HIMS', name:'Hims & Hers', px:'28.92', ch:'+7.2%', dir:'up', spark:[10,10,11,10,12,13,15,16,18,20] },
  { sym:'TSLA', name:'Tesla', px:'176.03', ch:'-1.2%', dir:'down', spark:[18,17,18,16,15,14,13,14,12,11] },
  { sym:'PLTR', name:'Palantir', px:'24.41', ch:'+5.7%', dir:'up', spark:[10,11,10,12,14,13,15,17,19,20] },
  { sym:'MSTR', name:'MicroStrategy', px:'1,412', ch:'-5.7%', dir:'down', spark:[22,21,22,20,19,18,17,16,15,14] },
];

function Spark({d, dir}: {d:number[],dir:string}) {
  const max = Math.max(...d), min = Math.min(...d);
  const pts = d.map((v,i) => `${(i/(d.length-1))*60},${22 - ((v-min)/(max-min||1))*20}`).join(' ');
  return <svg className="spark" viewBox="0 0 60 22" preserveAspectRatio="none"><polyline fill="none" stroke={dir==='up'?'var(--up)':'var(--down)'} strokeWidth="1.5" strokeLinecap="round" points={pts}/></svg>;
}

function FeedAndTrending() {
  return (
    <section className="section" id="feed" style={{paddingTop:0}}>
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="section-kicker">§ 02 — The stream</span>
            <h2>Every signal, <span className="serif">scored in real time.</span></h2>
          </div>
          <p className="section-lead">
            Our parser reads every post from the 50 tracked FinX leaders, extracts tickers and intent, and grades the signal against live market data.
          </p>
        </div>
        <div className="feed-grid">
          <div className="panel reveal">
            <div className="panel-head">
              <div className="t">Live signal feed</div>
              <div className="sub"><span style={{width:6,height:6,borderRadius:99,background:'var(--up)',animation:'pulse 1.5s infinite',display:'inline-block'}}/>last 60m · {FEED_DATA.length} posts</div>
            </div>
            <div>
              {FEED_DATA.map((f,i) => (
                <div className="feed-row" key={i}>
                  <div className="time">{f.t}</div>
                  <div className="who"><div className="h">{f.h}</div><div className="c">{f.c}</div></div>
                  <div className="tkr">${f.tkr}</div>
                  <span className={`pill ${f.verdict==='BUY'?'pill-buy':f.verdict==='SELL'?'pill-sell':'pill-hold'}`} style={{justifySelf:'end'}}>
                    {f.verdict==='BUY'?'▲':f.verdict==='SELL'?'▼':'◆'} {f.verdict}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel reveal">
            <div className="panel-head">
              <div className="t">Trending tickers</div>
              <div className="sub">last 15m</div>
            </div>
            <div>
              {TRENDING.map((t,i) => (
                <div key={t.sym} className="tstock" style={{borderBottom:i<TRENDING.length-1?'1px solid var(--line)':'none'}}>
                  <div className="l">
                    <div style={{display:'flex',flexDirection:'column'}}>
                      <span className="t">${t.sym}</span>
                      <span className="name">{t.name}</span>
                    </div>
                  </div>
                  <div className="prices">
                    <span>{t.px}</span>
                    <span className={t.dir}>{t.ch}</span>
                    <Spark d={t.spark} dir={t.dir}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const VerifiedBadge = () => (
  <svg className="tw-verified" viewBox="0 0 22 22" aria-label="Verified">
    <path fill="#1d9bf0" d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44-.541-.354-1.17-.551-1.817-.569-.646.018-1.276.215-1.817.57-.541.354-.972.853-1.245 1.44-.608-.223-1.264-.27-1.898-.14-.633.131-1.217.437-1.686.882-.445.47-.751 1.053-.882 1.687-.13.633-.083 1.29.14 1.897-.586.274-1.084.705-1.438 1.246-.354.541-.552 1.17-.57 1.816.018.647.216 1.276.57 1.817.354.54.852.972 1.438 1.245-.223.608-.27 1.264-.14 1.898.131.634.437 1.218.882 1.687.47.445 1.053.751 1.686.882.634.13 1.29.083 1.898-.14.273.586.704 1.084 1.245 1.439.541.354 1.17.551 1.817.569.647-.018 1.276-.215 1.817-.57.541-.354.972-.852 1.245-1.438.608.223 1.264.27 1.898.14.633-.131 1.217-.437 1.686-.882.445-.47.751-1.053.882-1.687.13-.634.083-1.29-.14-1.898.586-.273 1.084-.704 1.438-1.245.354-.541.552-1.17.57-1.817zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"/>
  </svg>
);

const TwIcons: any = {
  reply: <svg viewBox="0 0 24 24"><path d="M1.75 10c0-4.556 3.694-8.25 8.25-8.25h4c4.556 0 8.25 3.694 8.25 8.25v5a4.25 4.25 0 0 1-4.25 4.25h-7.19l-4.29 4.286-1.52-1.515 3.37-3.36A8.25 8.25 0 0 1 1.75 10z" strokeLinejoin="round"/></svg>,
  rt: <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16a2 2 0 0 0 2 2h1.5v2h-1.5a4 4 0 0 1-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM19.5 20.13l-4.432-4.14 1.364-1.46 2.068 1.93V8.02a2 2 0 0 0-2-2H15v-2h1.5a4 4 0 0 1 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14z"/></svg>,
  like: <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91z" strokeLinejoin="round"/></svg>,
  views: <svg viewBox="0 0 24 24"><path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z"/></svg>,
  bookmark: <svg viewBox="0 0 24 24"><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v17.42L12 17l-8 4.92V4.5z" strokeLinejoin="round"/></svg>,
  share: <svg viewBox="0 0 24 24"><path d="M12 2.59l5.7 5.7-1.41 1.42L13 6.41V16h-2V6.41l-3.3 3.3-1.41-1.42L12 2.59zM21 15l-.02 3.51c0 1.38-1.12 2.49-2.5 2.49H5.5C4.11 21 3 19.88 3 18.5V15h2v3.5a.5.5 0 0 0 .5.5h12.98a.5.5 0 0 0 .5-.5L19 15h2z"/></svg>,
};

const TwActions = ({r,rt,l,v}: {r:string,rt:string,l:string,v:string}) => (
  <div className="tw-actions">
    <span className="tw-action">{TwIcons.reply}<span>{r}</span></span>
    <span className="tw-action">{TwIcons.rt}<span>{rt}</span></span>
    <span className="tw-action">{TwIcons.like}<span>{l}</span></span>
    <span className="tw-action">{TwIcons.views}<span>{v}</span></span>
    <span className="tw-action">{TwIcons.bookmark}</span>
    <span className="tw-action">{TwIcons.share}</span>
  </div>
);

function Tweet({avatarClass,initials,name,handle,date,replyTo,children,actions,extra}: any) {
  return (
    <article className="tweet reveal">
      <div className="tweet-head">
        <div className={`tw-avatar ${avatarClass||''}`}>{initials}</div>
        <div className="tw-meta">
          <div className="tw-line1">
            <span className="tw-name">{name}</span>
            <VerifiedBadge/>
            <span className="tw-handle">{handle}</span>
            <span className="tw-sep">·</span>
            <span className="tw-date">{date}</span>
            <span className="tw-more">···</span>
          </div>
          {replyTo && <div className="tw-replyto">Replying to {replyTo}</div>}
        </div>
      </div>
      <div className="tw-body">{children}</div>
      {extra}
      <TwActions {...actions}/>
    </article>
  );
}

function Why() {
  return (
    <section className="section why" id="how">
      <div className="wrap-narrow why-head">
        <span className="section-kicker">§ 03 — The edge</span>
        <h2>Why <span className="x-italic serif">X</span>Fintel is the ultimate <span className="serif">early signal source.</span></h2>
        <p className="section-lead" style={{margin:'18px auto 0'}}>
          Institutional alpha is hiding in plain sight on FinX. Don&apos;t take our word for it — here&apos;s what the community says.
        </p>
      </div>
      <div className="wrap">
        <div className="tweet-gallery">
          <Tweet avatarClass="av-cole" initials="CT" name="Cole's Trades" handle="@ColesTrades" date="Apr 13" actions={{r:'4',rt:'1',l:'14',v:'614'}}>
            {`I recommend every new investor I know to join the FinX community\n\nIt's a great place to get ideas and immediate stock market news\n\n`}<b>X</b>{` is so underrated!`}
          </Tweet>
          <Tweet avatarClass="av-pepe" initials="🐸" name="Pepe Invests" handle="@pepemoonboy" date="Apr 13" actions={{r:'8',rt:'1',l:'61',v:'5.4K'}}>
            {`I love and hate FinX.\n\nLove because of all the alpha.\n\nHate because of all the alpha.\n\nThere are so many stocks I want to buy 🙈`}
          </Tweet>
          <Tweet avatarClass="av-ren" initials="⚡" name="Ren" handle="@Ren_aramb" date="Apr 13" actions={{r:'9',rt:'6',l:'849',v:'436K'}}
            extra={
              <div className="tw-broker">
                <div className="tw-broker-head"><span className="tw-broker-logo">▲</span>InteractiveBrokers</div>
                <div className="tw-broker-val"><span>Value</span>Performance</div>
                <div className="tw-broker-pct">+260.38%</div>
                <div className="tw-broker-tr">Total return this year</div>
              </div>
            }>
            {`If you are on `}<b>Fin X</b>{` and you aren't following `}<b>Serenity</b>{`, what are you even doing.\n\nThis guy keeps slapping banger after banger.\n\nMy YTD was 2 digits before I started listening.\n\nLet's keep sharing alpha`}
          </Tweet>
          <Tweet avatarClass="av-llm" initials="LM" name="LLM Maven" handle="@GeeFingBeeMan" date="Apr 13"
            replyTo={<><a>@pepemoonboy</a> and <a>@ParadisLabs</a></>}
            actions={{r:'3',rt:'0',l:'2',v:'291'}}>
            {`Everyone thinks everyone outside of FinX knows what's up.\n\nAside from us, NOBODY knows what's up.\n\nWe have the early info here on `}<b>X</b>{` and we need to use it.\n\nThank you to all who contribute. You're amazing!`}
          </Tweet>
        </div>
        <div className="trio">
          <div className="feat reveal"><div className="ico"><I.bolt/></div><div className="t">Saved alpha</div><div className="d">Every FinX leader you follow is bookmarked into a portfolio. We run backtests nightly and email the winners.</div></div>
          <div className="feat reveal"><div className="ico"><I.eye/></div><div className="t">Hive-mind alpha</div><div className="d">The collective intelligence of all 50 tracked FinX leaders, distilled into a daily consensus tape.</div></div>
          <div className="feat reveal"><div className="ico"><I.flag/></div><div className="t">Intelligent flagging</div><div className="d">We detect pump-and-dumps, coordinated posts, and deleted tweets. Receipts never disappear.</div></div>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="cta" className="final-cta">
      <div className="final-cta-inner reveal">
        <h2>Get free <span className="serif">access today.</span></h2>
        <p>Free while we&apos;re in beta. No credit card, no seat minimums, no lock-in. Sign in with X in seconds — we&apos;ll score the rest.</p>
        <div className="final-ctas">
          <a href="/register" className="btn btn-primary btn-lg">Get Free Access <I.arrow /></a>
        </div>
        <div className="final-meta">BETA · SOC-2 IN PROGRESS · NO CARD REQUIRED</div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap foot">
        <Brand />
        <div className="foot-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
          <a href="#">Disclosure</a>
          <a href="#">Contact</a>
        </div>
        <div className="mono" style={{fontSize:12}}>© 2026 XFintel Labs · not investment advice</div>
      </div>
    </footer>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-palette', 'safe');
  }, [theme]);

  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, {threshold:0.08, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: CSS}} />
      <Nav onTheme={toggleTheme} theme={theme} />
      <Hero />
      <Ticker />
      <Performance />
      <FeedAndTrending />
      <Why />
      <FinalCTA />
      <Footer />
    </>
  );
}
