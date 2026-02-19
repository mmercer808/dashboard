import { useState, useRef, useEffect, useCallback } from "react";

// ─── STYLES ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --forest:      #0f2318;
    --forest-mid:  #1e4a30;
    --forest-hi:   #2c6644;
    --sage:        #6a9b7a;
    --cream:       #f4efe4;
    --parchment:   #e8e0cd;
    --gold:        #c4a040;
    --gold-hi:     #ddb84a;
    --gold-dim:    #8a6e28;
    --ink:         #181714;
    --ink-mid:     #38362f;
    --red:         #7a3030;
    --panel-glass: rgba(12,28,18,0.93);
    --panel-border: rgba(196,160,64,0.18);
    --panel-bg:    rgba(244,239,228,0.97);
    --topbar-h:    44px;
    --gutter:      8px;
    --panel-w:     280px;
    --panel-h:     260px;
  }

  html, body, #root { height: 100%; overflow: hidden; }

  body {
    font-family: 'Lora', Georgia, serif;
    background: var(--forest);
    color: var(--ink);
  }

  /* ── RICH BACKGROUND ── */
  .bg {
    position: fixed; inset: 0; z-index: 0;
    background:
      radial-gradient(ellipse 70% 50% at 15% 85%, rgba(30,74,48,0.55) 0%, transparent 55%),
      radial-gradient(ellipse 50% 70% at 85% 15%, rgba(15,35,24,0.9) 0%, transparent 55%),
      radial-gradient(ellipse 40% 40% at 50% 50%, rgba(44,102,68,0.12) 0%, transparent 70%),
      linear-gradient(155deg, #091810 0%, #0f2318 35%, #162c20 65%, #0c1e14 100%);
  }
  .bg::after {
    content:''; position:absolute; inset:0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='none'/%3E%3Ccircle cx='40' cy='40' r='0.4' fill='rgba(196,160,64,0.08)'/%3E%3Ccircle cx='0' cy='0' r='0.3' fill='rgba(196,160,64,0.05)'/%3E%3Ccircle cx='80' cy='80' r='0.3' fill='rgba(196,160,64,0.05)'/%3E%3C/svg%3E");
    background-size: 80px 80px;
    pointer-events: none;
  }

  /* ── TOPBAR ── */
  .topbar {
    position: fixed; top:0; left:0; right:0; z-index: 200;
    height: var(--topbar-h);
    background: rgba(8,20,12,0.97);
    border-bottom: 1px solid var(--panel-border);
    backdrop-filter: blur(16px);
    display: flex; align-items: center; gap: 16px; padding: 0 16px;
  }
  .topbar-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; color: var(--gold);
    display: flex; align-items: center; gap: 8px;
    letter-spacing: 0.03em;
  }
  .topbar-logo svg { width:18px; height:18px; }
  .topbar-tag {
    font-family: 'DM Mono', monospace; font-size: 0.58rem;
    letter-spacing: 0.16em; text-transform: uppercase; color: var(--sage);
  }
  .topbar-spacer { flex:1; }
  .topbar-actions { display:flex; gap:6px; align-items:center; }

  .user-pill {
    display:flex; align-items:center; gap:8px;
    padding: 4px 10px 4px 5px;
    border: 1px solid var(--panel-border); border-radius: 20px;
    background: rgba(255,255,255,0.04); cursor: pointer;
    transition: background 0.15s;
  }
  .user-pill:hover { background: rgba(255,255,255,0.08); }
  .user-ava {
    width:24px; height:24px; border-radius:50%;
    background: linear-gradient(135deg, var(--forest-mid), var(--gold));
    display:flex; align-items:center; justify-content:center;
    font-size:0.6rem; font-weight:700; color:white;
  }
  .user-name { font-family:'DM Mono',monospace; font-size:0.72rem; color:var(--cream); }

  /* ── PERIMETER LAYOUT ── */
  .shell {
    position: fixed;
    top: var(--topbar-h); left:0; right:0; bottom:0;
    z-index: 1;
    display: grid;
    grid-template-columns: var(--panel-w) 1fr var(--panel-w);
    grid-template-rows: var(--panel-h) 1fr var(--panel-h);
    gap: var(--gutter);
    padding: var(--gutter);
  }

  /* Corner + edge panel slots */
  .slot { position: relative; overflow: hidden; }

  /* ── MODULE PANEL ── */
  .mod-panel {
    width: 100%; height: 100%;
    background: var(--panel-glass);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    display: flex; flex-direction: column;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(196,160,64,0.08);
    animation: panelIn 0.3s ease both;
  }
  @keyframes panelIn {
    from { opacity:0; transform: scale(0.97); }
    to   { opacity:1; transform: scale(1); }
  }

  .mod-head {
    flex-shrink: 0;
    display: flex; align-items: center; gap: 7px;
    padding: 8px 10px;
    border-bottom: 1px solid var(--panel-border);
    background: rgba(196,160,64,0.04);
    cursor: default;
    user-select: none;
  }
  .mod-head-icon { font-size: 0.85rem; }
  .mod-head-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.78rem; color: var(--gold-hi);
    flex:1; white-space: nowrap; overflow:hidden; text-overflow: ellipsis;
  }
  .mod-head-btn {
    width:16px; height:16px; border-radius:50%;
    border: none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    font-size:0.55rem;
    transition: background 0.15s;
  }
  .mod-head-swap { background: rgba(60,80,60,0.5); color: rgba(160,220,180,0.7); }
  .mod-head-swap:hover { background: var(--forest-mid); color:white; }
  .mod-head-close { background: rgba(122,48,48,0.5); color: rgba(255,200,200,0.7); }
  .mod-head-close:hover { background: var(--red); color:white; }

  .mod-body {
    flex:1; overflow-y: auto; overflow-x: hidden;
    padding: 10px;
    scrollbar-width: thin;
    scrollbar-color: rgba(196,160,64,0.25) transparent;
  }
  .mod-body::-webkit-scrollbar { width:4px; }
  .mod-body::-webkit-scrollbar-thumb { background: rgba(196,160,64,0.25); border-radius:2px; }

  /* Empty slot placeholder */
  .slot-empty {
    width:100%; height:100%;
    border: 1px dashed rgba(196,160,64,0.12);
    border-radius:8px;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:8px; cursor:pointer;
    transition: all 0.2s;
    background: rgba(255,255,255,0.01);
  }
  .slot-empty:hover {
    border-color: rgba(196,160,64,0.3);
    background: rgba(196,160,64,0.03);
  }
  .slot-empty-icon { font-size:1.4rem; opacity:0.2; }
  .slot-empty-label {
    font-family: 'DM Mono', monospace; font-size:0.58rem;
    letter-spacing:0.12em; text-transform:uppercase;
    color: rgba(196,160,64,0.28);
  }

  /* Dock picker overlay */
  .dock-picker {
    position:absolute; inset:0; z-index:10;
    background: rgba(8,20,12,0.97);
    border: 1px solid var(--panel-border);
    border-radius:8px;
    display:flex; flex-direction:column;
    padding:10px; gap:4px;
    animation: panelIn 0.2s ease;
    overflow-y:auto;
  }
  .dock-picker-label {
    font-family:'DM Mono',monospace; font-size:0.58rem;
    letter-spacing:0.12em; text-transform:uppercase;
    color:var(--gold-dim); margin-bottom:4px; padding-bottom:6px;
    border-bottom:1px solid rgba(196,160,64,0.1);
  }
  .dock-pick-item {
    display:flex; align-items:center; gap:8px;
    padding:7px 8px; border-radius:5px; cursor:pointer;
    background:transparent; border:1px solid transparent;
    transition:all 0.12s;
  }
  .dock-pick-item:hover {
    background:rgba(196,160,64,0.1); border-color:rgba(196,160,64,0.2);
  }
  .dock-pick-icon { font-size:0.9rem; }
  .dock-pick-name {
    font-size:0.78rem; color:var(--cream);
    font-family:'Lora',serif;
  }
  .dock-pick-cancel {
    margin-top:4px; padding:6px;
    font-family:'DM Mono',monospace; font-size:0.6rem;
    letter-spacing:0.08em; text-transform:uppercase;
    color:var(--sage); background:transparent; border:none; cursor:pointer;
    text-align:center; border-top:1px solid rgba(196,160,64,0.1);
  }
  .dock-pick-cancel:hover { color:var(--cream); }

  /* ── BOOK BROWSER (center) ── */
  .browser {
    background: var(--panel-glass);
    border: 1px solid var(--panel-border);
    border-radius: 8px;
    backdrop-filter: blur(10px);
    display:flex; flex-direction:column;
    overflow:hidden;
    box-shadow: 0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(196,160,64,0.08);
  }
  .browser-head {
    flex-shrink:0;
    padding:12px 14px;
    border-bottom:1px solid var(--panel-border);
    background: rgba(196,160,64,0.04);
    display:flex; flex-direction:column; gap:10px;
  }
  .browser-head-row { display:flex; align-items:center; gap:10px; }
  .browser-title {
    font-family:'Playfair Display',serif;
    font-size:1rem; color:var(--gold-hi);
    display:flex; align-items:center; gap:8px;
    flex-shrink:0;
  }
  .browser-search {
    flex:1; display:flex;
    background:rgba(255,255,255,0.06);
    border:1px solid rgba(196,160,64,0.2);
    border-radius:5px; overflow:hidden;
    transition: border-color 0.2s;
    max-width:380px;
  }
  .browser-search:focus-within { border-color:rgba(196,160,64,0.5); }
  .browser-search input {
    flex:1; border:none; outline:none; background:transparent;
    padding:7px 10px;
    font-family:'Lora',serif; font-size:0.82rem; color:var(--cream);
  }
  .browser-search input::placeholder { color:rgba(196,160,64,0.35); }
  .browser-search button {
    background:var(--forest-hi); color:var(--cream);
    border:none; cursor:pointer; padding:7px 12px;
    font-family:'DM Mono',monospace; font-size:0.65rem;
    letter-spacing:0.06em; transition:background 0.15s;
  }
  .browser-search button:hover { background:var(--forest-mid); }
  .result-count {
    font-family:'DM Mono',monospace; font-size:0.58rem;
    color:rgba(196,160,64,0.35); flex-shrink:0;
  }

  .genre-chips { display:flex; gap:5px; flex-wrap:wrap; }
  .gchip {
    padding:3px 10px; border-radius:20px;
    border:1px solid rgba(196,160,64,0.2);
    font-size:0.62rem; font-family:'DM Mono',monospace;
    cursor:pointer; background:transparent; color:rgba(196,160,64,0.6);
    transition:all 0.12s;
  }
  .gchip.on, .gchip:hover {
    background:rgba(196,160,64,0.15); color:var(--gold-hi); border-color:var(--gold);
  }

  /* Book grid */
  .browser-body {
    flex:1; overflow-y:auto; overflow-x:hidden; padding:14px;
    scrollbar-width:thin; scrollbar-color:rgba(196,160,64,0.2) transparent;
  }
  .browser-body::-webkit-scrollbar { width:4px; }
  .browser-body::-webkit-scrollbar-thumb { background:rgba(196,160,64,0.2); border-radius:2px; }

  .book-grid {
    display:grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap:14px;
  }

  .book-card {
    border-radius:7px; overflow:hidden;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(196,160,64,0.1);
    cursor:pointer; transition:all 0.2s;
  }
  .book-card:hover {
    background:rgba(255,255,255,0.08);
    border-color:rgba(196,160,64,0.4);
    transform:translateY(-3px);
    box-shadow:0 8px 24px rgba(0,0,0,0.45);
  }
  .book-cover {
    height:110px; display:flex; align-items:flex-end;
    padding:8px; position:relative;
    flex-shrink:0;
  }
  .book-spine {
    position:absolute; left:0; top:0; bottom:0; width:6px;
    background:rgba(0,0,0,0.3);
  }
  .book-emoji { font-size:1.5rem; z-index:1; }
  .book-info { padding:8px 9px; }
  .book-title {
    font-family:'Playfair Display',serif;
    font-size:0.7rem; color:var(--cream);
    line-height:1.3; margin-bottom:3px;
  }
  .book-author { font-size:0.6rem; color:var(--sage); font-style:italic; margin-bottom:5px; }
  .book-avail {
    font-family:'DM Mono',monospace; font-size:0.56rem; letter-spacing:0.04em;
  }
  .avail-y { color:#4aaa78; }
  .avail-n { color:#a05050; }

  /* ── BOOK DETAIL MODAL ── */
  .modal-ov {
    position:fixed; inset:0; z-index:500;
    background:rgba(5,15,8,0.78); backdrop-filter:blur(6px);
    display:flex; align-items:center; justify-content:center;
    animation:fadeIn 0.2s ease;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    width:400px; max-width:92vw;
    background: rgba(14,30,18,0.99);
    border:1px solid rgba(196,160,64,0.3);
    border-radius:12px;
    box-shadow:0 24px 64px rgba(0,0,0,0.55);
    animation:slideUp 0.22s ease;
    overflow:hidden;
  }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-cover {
    height:130px; display:flex; align-items:flex-end;
    padding:14px; position:relative;
  }
  .modal-cover-spine {
    position:absolute; left:0; top:0; bottom:0; width:8px;
    background:rgba(0,0,0,0.3);
  }
  .modal-cover-emoji { font-size:2.6rem; z-index:1; }
  .modal-cover-title {
    font-family:'Playfair Display',serif;
    font-size:1.1rem; color:white;
    text-shadow:0 2px 8px rgba(0,0,0,0.7); z-index:1; margin-left:10px;
    line-height:1.25;
  }
  .modal-body { padding:18px 20px; }
  .mf-label {
    font-family:'DM Mono',monospace; font-size:0.58rem;
    letter-spacing:0.12em; text-transform:uppercase;
    color:var(--gold-dim); margin-bottom:4px;
  }
  .mf-val { font-size:0.82rem; color:rgba(196,220,208,0.85); margin-bottom:12px; }
  .modal-foot {
    padding:12px 20px;
    border-top:1px solid rgba(196,160,64,0.12);
    display:flex; justify-content:flex-end; gap:8px;
  }
  .btn {
    padding:6px 14px; border-radius:5px; border:none; cursor:pointer;
    font-family:'DM Mono',monospace; font-size:0.65rem;
    letter-spacing:0.07em; text-transform:uppercase; transition:all 0.15s;
  }
  .btn-outline {
    background:transparent; border:1px solid rgba(196,160,64,0.3); color:var(--sage);
  }
  .btn-outline:hover { border-color:var(--gold); color:var(--gold-hi); }
  .btn-gold { background:var(--gold); color:var(--forest); font-weight:600; }
  .btn-gold:hover { background:var(--gold-hi); }
  .btn-primary { background:var(--forest-hi); color:var(--cream); }
  .btn-primary:hover { background:var(--forest-mid); }
  .btn-sm { padding:3px 8px; font-size:0.58rem; }
  .confirm-flash {
    text-align:center; color:#4aaa78;
    font-family:'DM Mono',monospace; font-size:0.72rem; padding:6px 0;
  }

  /* ── PANEL CONTENT ATOMS ── */
  .p-label {
    font-family:'DM Mono',monospace; font-size:0.55rem;
    letter-spacing:0.12em; text-transform:uppercase;
    color:var(--gold-dim); margin-bottom:7px; margin-top:10px;
  }
  .p-label:first-child { margin-top:0; }

  .stat-row { display:flex; gap:6px; margin-bottom:8px; }
  .stat-box {
    flex:1; border-radius:6px; padding:8px 10px;
    background:linear-gradient(135deg, var(--forest-mid), var(--forest-hi));
    border:1px solid rgba(196,160,64,0.12);
  }
  .stat-num {
    font-family:'Playfair Display',serif;
    font-size:1.4rem; color:var(--gold-hi); line-height:1;
  }
  .stat-lbl {
    font-family:'DM Mono',monospace; font-size:0.52rem;
    letter-spacing:0.1em; text-transform:uppercase;
    color:rgba(200,220,208,0.6); margin-top:2px;
  }

  .co-item {
    display:flex; gap:8px; padding:8px;
    background:rgba(255,255,255,0.04); border-radius:5px;
    border:1px solid rgba(196,160,64,0.1); margin-bottom:6px;
    align-items:center;
  }
  .co-thumb {
    width:32px; height:44px; border-radius:3px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-size:1rem;
  }
  .co-info { flex:1; min-width:0; }
  .co-title { font-family:'Playfair Display',serif; font-size:0.7rem; color:var(--cream); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .co-author { font-size:0.6rem; color:var(--sage); font-style:italic; margin-bottom:3px; }
  .due-badge {
    font-family:'DM Mono',monospace; font-size:0.52rem;
    padding:2px 6px; border-radius:3px; flex-shrink:0;
  }
  .due-ok { background:rgba(46,120,76,0.2); color:#4aaa78; }
  .due-warn { background:rgba(180,148,40,0.15); color:#c8a040; }
  .due-late { background:rgba(120,40,40,0.2); color:#c06060; }

  .hist-item {
    display:flex; gap:8px; padding:7px 0;
    border-bottom:1px solid rgba(196,160,64,0.07);
    align-items:center;
  }
  .hist-emoji { font-size:1rem; flex-shrink:0; width:22px; text-align:center; }
  .hist-info { flex:1; min-width:0; }
  .hist-title { font-family:'Playfair Display',serif; font-size:0.7rem; color:var(--cream); }
  .hist-author { font-size:0.58rem; color:var(--sage); font-style:italic; }
  .hist-stars { color:var(--gold); font-size:0.6rem; flex-shrink:0; }

  .notif-item {
    display:flex; gap:8px; padding:7px 0;
    border-bottom:1px solid rgba(196,160,64,0.07); cursor:pointer;
  }
  .notif-dot {
    width:6px; height:6px; border-radius:50%; margin-top:5px; flex-shrink:0;
  }
  .nd-unread { background:var(--gold); }
  .nd-read { background:rgba(196,160,64,0.2); }
  .notif-text { font-size:0.7rem; color:rgba(196,220,208,0.8); line-height:1.5; }
  .notif-time { font-family:'DM Mono',monospace; font-size:0.55rem; color:rgba(196,160,64,0.4); margin-top:2px; }

  .club-post {
    background:rgba(255,255,255,0.04); border:1px solid rgba(196,160,64,0.1);
    border-radius:5px; padding:8px; margin-bottom:6px;
  }
  .club-post-hd { display:flex; align-items:center; gap:6px; margin-bottom:5px; }
  .club-ava {
    width:20px; height:20px; border-radius:50%; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    font-size:0.52rem; font-weight:700; color:white;
  }
  .club-name { font-size:0.68rem; font-weight:600; color:var(--cream); }
  .club-time { font-family:'DM Mono',monospace; font-size:0.55rem; color:rgba(196,160,64,0.4); margin-left:auto; }
  .club-text { font-size:0.7rem; color:rgba(196,220,208,0.8); line-height:1.5; }
  .club-input { display:flex; gap:6px; margin-top:8px; }
  .club-input input {
    flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(196,160,64,0.2);
    border-radius:4px; padding:5px 8px;
    font-family:'Lora',serif; font-size:0.72rem; color:var(--cream); outline:none;
  }
  .club-input input::placeholder { color:rgba(196,160,64,0.3); }
  .club-input input:focus { border-color:rgba(196,160,64,0.4); }

  .acct-avatar {
    width:44px; height:44px; border-radius:50%; margin:0 auto 8px;
    background:linear-gradient(135deg, var(--forest-mid), var(--gold));
    display:flex; align-items:center; justify-content:center;
    font-size:1rem; font-weight:700; color:white;
    border:2px solid rgba(196,160,64,0.3);
  }
  .acct-name {
    font-family:'Playfair Display',serif;
    text-align:center; color:var(--cream); font-size:0.85rem;
  }
  .acct-card {
    font-family:'DM Mono',monospace; font-size:0.55rem;
    color:var(--sage); text-align:center; margin-bottom:10px; letter-spacing:0.08em;
  }
  .acct-status {
    background:rgba(196,160,64,0.07); border:1px solid rgba(196,160,64,0.15);
    border-radius:6px; padding:8px;
  }
  .acct-row {
    display:flex; justify-content:space-between; align-items:center;
    font-size:0.68rem; margin-bottom:5px; color:rgba(196,220,208,0.75);
  }
  .acct-row:last-child { margin-bottom:0; }

  .branch-item {
    display:flex; align-items:center; gap:6px;
    padding:5px 6px; border-radius:4px; cursor:pointer;
    color:rgba(196,220,208,0.65); font-size:0.68rem;
    border:1px solid transparent; margin-bottom:3px; transition:all 0.12s;
  }
  .branch-item.active {
    background:rgba(196,160,64,0.08); border-color:rgba(196,160,64,0.18); color:var(--gold-hi);
  }
  .branch-item:hover { background:rgba(255,255,255,0.04); }

  .tab-row {
    display:flex; gap:2px; margin-bottom:8px;
    border-bottom:1px solid rgba(196,160,64,0.12);
  }
  .tab {
    padding:4px 8px; font-family:'DM Mono',monospace; font-size:0.58rem;
    letter-spacing:0.08em; text-transform:uppercase; cursor:pointer;
    color:rgba(196,160,64,0.45); border-bottom:2px solid transparent;
    margin-bottom:-1px; transition:all 0.12s;
  }
  .tab.on { color:var(--gold-hi); border-bottom-color:var(--gold); }
  .tab:hover { color:var(--gold-hi); }

  .prog-wrap { margin-bottom:8px; }
  .prog-hd { display:flex; justify-content:space-between; font-size:0.6rem; margin-bottom:3px; }
  .prog-hd span:first-child { font-family:'DM Mono',monospace; color:rgba(196,220,208,0.7); }
  .prog-hd span:last-child { color:var(--sage); }
  .prog-bar { height:4px; background:rgba(196,160,64,0.1); border-radius:2px; overflow:hidden; }
  .prog-fill { height:100%; background:linear-gradient(90deg,var(--forest-hi),var(--gold)); border-radius:2px; }

  /* Login */
  .login-wrap {
    position:fixed; inset:0; z-index:999;
    display:flex; align-items:center; justify-content:center;
    background:linear-gradient(155deg,#050e08 0%,#0f2318 50%,#081410 100%);
  }
  .login-card {
    width:360px;
    background:rgba(14,30,18,0.99);
    border:1px solid rgba(196,160,64,0.25);
    border-radius:14px;
    box-shadow:0 28px 80px rgba(0,0,0,0.55);
    overflow:hidden;
    animation:slideUp 0.35s ease;
  }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .login-hd {
    background:linear-gradient(135deg, #0a1c10, #1a3a22);
    padding:28px 24px 20px; text-align:center;
    border-bottom:1px solid rgba(196,160,64,0.15);
  }
  .login-logo { font-size:2rem; margin-bottom:10px; }
  .login-title {
    font-family:'Playfair Display',serif;
    font-size:1.5rem; color:var(--gold-hi); margin-bottom:3px;
  }
  .login-sub {
    font-family:'DM Mono',monospace; font-size:0.58rem;
    letter-spacing:0.15em; text-transform:uppercase; color:var(--sage);
  }
  .login-body { padding:24px; }
  .lf { margin-bottom:14px; }
  .lf label {
    display:block; font-family:'DM Mono',monospace; font-size:0.58rem;
    letter-spacing:0.1em; text-transform:uppercase; color:var(--gold-dim); margin-bottom:5px;
  }
  .lf input {
    width:100%; padding:9px 12px;
    background:rgba(255,255,255,0.05); border:1px solid rgba(196,160,64,0.2);
    border-radius:6px; outline:none;
    font-family:'Lora',serif; font-size:0.85rem; color:var(--cream);
    transition:border-color 0.2s;
  }
  .lf input:focus { border-color:rgba(196,160,64,0.45); }
  .lf input::placeholder { color:rgba(196,160,64,0.25); }
  .login-submit {
    width:100%; padding:11px;
    background:var(--forest-hi); color:var(--cream);
    border:none; border-radius:7px; cursor:pointer;
    font-family:'DM Mono',monospace; font-size:0.75rem;
    letter-spacing:0.1em; text-transform:uppercase;
    transition:background 0.2s; margin-top:4px;
  }
  .login-submit:hover { background:var(--forest-mid); }
  .login-hint {
    text-align:center; margin-top:12px;
    font-size:0.65rem; color:rgba(196,160,64,0.35); font-style:italic;
  }

  ::-webkit-scrollbar { width:4px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(196,160,64,0.2); border-radius:2px; }
`;

// ─── DATA ──────────────────────────────────────────────────────────────────────
const BOOKS = [
  { id:1,  title:"The Name of the Wind",          author:"Patrick Rothfuss",      genre:"Fantasy",  available:true,  emoji:"📖", color:["#2a4280","#182050"], year:2007, pages:662 },
  { id:2,  title:"Pachinko",                       author:"Min Jin Lee",            genre:"Literary", available:false, emoji:"🌸", color:["#804030","#501e10"], year:2017, pages:485 },
  { id:3,  title:"Project Hail Mary",              author:"Andy Weir",              genre:"Sci-Fi",   available:true,  emoji:"🚀", color:["#184038","#0e2820"], year:2021, pages:476 },
  { id:4,  title:"Lessons in Chemistry",           author:"Bonnie Garmus",          genre:"Fiction",  available:true,  emoji:"⚗️", color:["#503080","#301850"], year:2022, pages:390 },
  { id:5,  title:"The Midnight Library",           author:"Matt Haig",              genre:"Fiction",  available:false, emoji:"🌙", color:["#182850","#0e1c38"], year:2020, pages:304 },
  { id:6,  title:"Tomorrow, and Tomorrow",         author:"Gabrielle Zevin",        genre:"Literary", available:true,  emoji:"🎮", color:["#305020","#1c3010"], year:2022, pages:416 },
  { id:7,  title:"The Priory of the Orange Tree",  author:"Samantha Shannon",       genre:"Fantasy",  available:true,  emoji:"🐉", color:["#6a2a10","#3e1808"], year:2019, pages:848 },
  { id:8,  title:"Piranesi",                       author:"Susanna Clarke",         genre:"Fantasy",  available:false, emoji:"🏛️", color:["#6a5a10","#3e3608"], year:2020, pages:272 },
  { id:9,  title:"A Memory Called Empire",         author:"Arkady Martine",         genre:"Sci-Fi",   available:true,  emoji:"🌌", color:["#204060","#102030"], year:2019, pages:462 },
  { id:10, title:"The Poppy War",                  author:"R.F. Kuang",             genre:"Fantasy",  available:false, emoji:"🌺", color:["#702020","#401010"], year:2018, pages:544 },
  { id:11, title:"Sea of Tranquility",             author:"Emily St. John Mandel",  genre:"Sci-Fi",   available:true,  emoji:"🌊", color:["#1a3a5a","#0e2038"], year:2022, pages:255 },
  { id:12, title:"Babel",                          author:"R.F. Kuang",             genre:"Literary", available:true,  emoji:"🗼", color:["#1a4030","#0e2818"], year:2022, pages:545 },
];

const CHECKED_OUT = [
  { id:1, title:"Cloud Atlas",   author:"David Mitchell",  due:"Feb 22", status:"ok",   emoji:"☁️",  color:["#2a508a","#183060"] },
  { id:2, title:"Piranesi",      author:"Susanna Clarke",  due:"Feb 18", status:"warn", emoji:"🏛️",  color:["#8a6a10","#504010"] },
  { id:3, title:"Bewilderment",  author:"Richard Powers",  due:"Feb 12", status:"late", emoji:"🌿",  color:["#1a7a40","#0e4828"] },
];

const HISTORY = [
  { title:"Station Eleven",                    author:"E.S.J. Mandel",     returned:"Jan 30", rating:5, emoji:"🎭" },
  { title:"The Invisible Life of Addie LaRue", author:"V.E. Schwab",        returned:"Jan 14", rating:4, emoji:"✨" },
  { title:"Mexican Gothic",                    author:"S. Moreno-Garcia",  returned:"Dec 28", rating:5, emoji:"🌹" },
  { title:"Dune",                              author:"Frank Herbert",      returned:"Dec 10", rating:5, emoji:"🏜️" },
];

const CLUB_POSTS = [
  { id:1, user:"Margaret O.", ini:"MO", color:"#2d4a8a", text:"Chapter 12 completely floored me — the sympathy system felt so earned!", time:"2h" },
  { id:2, user:"James R.",    ini:"JR", color:"#8a3a2d", text:"The slow build of Kvothe's reputation vs self-perception is masterful.", time:"1h" },
  { id:3, user:"Priya S.",    ini:"PS", color:"#2d8a4a", text:"Meeting Thursday 7pm. Through chapter 20. Bring theories! 📚", time:"45m" },
];

const NOTIFS = [
  { text:"Piranesi is due back tomorrow — don't forget!", time:"2h ago", read:false },
  { text:"Hold on The Midnight Library ready for pickup at Main Branch.", time:"5h ago", read:false },
  { text:"Bewilderment is 6 days overdue. Fine: $0.60 applied.", time:"1d ago", read:false },
  { text:"Book club: Thursday 7pm, Community Room B.", time:"2d ago", read:true },
  { text:"New arrivals in Literary Fiction — 14 titles this week.", time:"3d ago", read:true },
];

// ─── MODULE DEFINITIONS ────────────────────────────────────────────────────────
const MODULE_DEFS = [
  { id:"loans",   label:"My Loans",        icon:"📚" },
  { id:"notifs",  label:"Notifications",   icon:"🔔" },
  { id:"history", label:"Reading History", icon:"📜" },
  { id:"club",    label:"Book Club",       icon:"💬" },
  { id:"account", label:"Account",         icon:"👤" },
  { id:"stats",   label:"Reading Stats",   icon:"📊" },
];

// ─── MODULE COMPONENTS ─────────────────────────────────────────────────────────
function LoansModule() {
  const [renewId, setRenewId] = useState(null);
  return (
    <div>
      <div className="stat-row">
        <div className="stat-box"><div className="stat-num">3</div><div className="stat-lbl">Out</div></div>
        <div className="stat-box"><div className="stat-num">1</div><div className="stat-lbl">Holds</div></div>
        <div className="stat-box" style={{background:"linear-gradient(135deg,#6a2020,#501010)"}}>
          <div className="stat-num">1</div><div className="stat-lbl">Overdue</div>
        </div>
      </div>
      <div className="p-label">Currently Out</div>
      {CHECKED_OUT.map(b=>(
        <div key={b.id} className="co-item">
          <div className="co-thumb" style={{background:`linear-gradient(160deg,${b.color[0]},${b.color[1]})`}}>{b.emoji}</div>
          <div className="co-info">
            <div className="co-title">{b.title}</div>
            <div className="co-author">{b.author}</div>
            {renewId===b.id
              ? <span style={{fontSize:"0.55rem",fontFamily:"'DM Mono',monospace",color:"#4aaa78"}}>✓ Renewed → Mar 4</span>
              : <button className="btn btn-outline btn-sm" onClick={()=>setRenewId(b.id)}>Renew</button>
            }
          </div>
          <div className={`due-badge ${b.status==="ok"?"due-ok":b.status==="warn"?"due-warn":"due-late"}`}>
            {b.status==="late"?"⚠ ":""}Due {b.due}
          </div>
        </div>
      ))}
      <div className="p-label">Hold Ready</div>
      <div className="co-item">
        <div className="co-thumb" style={{background:"linear-gradient(160deg,#182850,#0e1c38)"}}>🌙</div>
        <div className="co-info">
          <div className="co-title">The Midnight Library</div>
          <div className="co-author">Matt Haig</div>
          <div style={{fontSize:"0.55rem",fontFamily:"'DM Mono',monospace",color:"var(--sage)"}}>Main Branch · Expires Feb 20</div>
        </div>
        <div className="due-badge due-ok">Ready</div>
      </div>
    </div>
  );
}

function NotifsModule() {
  const [notifs, setNotifs] = useState(NOTIFS);
  const unread = notifs.filter(n=>!n.read).length;
  return (
    <div>
      {unread>0 && (
        <button className="btn btn-outline btn-sm" style={{width:"100%",marginBottom:8}}
          onClick={()=>setNotifs(p=>p.map(n=>({...n,read:true})))}>
          Mark all read ({unread})
        </button>
      )}
      {notifs.map((n,i)=>(
        <div key={i} className="notif-item"
          onClick={()=>setNotifs(p=>p.map((x,xi)=>xi===i?{...x,read:true}:x))}>
          <div className={`notif-dot ${n.read?"nd-read":"nd-unread"}`}/>
          <div>
            <div className="notif-text" style={{fontWeight:n.read?400:600}}>{n.text}</div>
            <div className="notif-time">{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryModule() {
  const [tab, setTab] = useState("hist");
  return (
    <div>
      <div className="tab-row">
        {[["hist","History"],["lists","Lists"]].map(([k,l])=>(
          <div key={k} className={`tab ${tab===k?"on":""}`} onClick={()=>setTab(k)}>{l}</div>
        ))}
      </div>
      {tab==="hist" && HISTORY.map((b,i)=>(
        <div key={i} className="hist-item">
          <div className="hist-emoji">{b.emoji}</div>
          <div className="hist-info">
            <div className="hist-title">{b.title}</div>
            <div className="hist-author">{b.author} · {b.returned}</div>
          </div>
          {b.rating&&<div className="hist-stars">{"★".repeat(b.rating)}</div>}
        </div>
      ))}
      {tab==="lists" && (
        <div>
          {["Want to Read (12)","Favourites (8)","Club Picks (5)"].map((l,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"7px 0",borderBottom:"1px solid rgba(196,160,64,0.08)"}}>
              <div>
                <div style={{fontSize:"0.72rem",fontFamily:"'Playfair Display',serif",color:"var(--cream)"}}>
                  {l.split("(")[0].trim()}
                </div>
                <div style={{fontSize:"0.55rem",fontFamily:"'DM Mono',monospace",color:"var(--sage)"}}>
                  {l.match(/\((\d+)\)/)?.[1]} books
                </div>
              </div>
              <button className="btn btn-outline btn-sm">View</button>
            </div>
          ))}
          <button className="btn btn-primary btn-sm" style={{marginTop:8,width:"100%"}}>+ New List</button>
        </div>
      )}
    </div>
  );
}

function ClubModule() {
  const [reply, setReply] = useState("");
  const [posts, setPosts] = useState(CLUB_POSTS);
  const handlePost = () => {
    if(!reply.trim()) return;
    setPosts(p=>[...p,{id:p.length+1,user:"You",ini:"AJ",color:"#2d5a3a",text:reply,time:"now"}]);
    setReply("");
  };
  return (
    <div>
      <div style={{background:"rgba(196,160,64,0.06)",border:"1px solid rgba(196,160,64,0.15)",
        borderRadius:5,padding:"7px 9px",marginBottom:8}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"0.72rem",color:"var(--cream)",marginBottom:2}}>The Name of the Wind</div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.55rem",color:"var(--sage)"}}>Ch 1–20 · Thu Feb 20, 7pm</div>
      </div>
      {posts.map(p=>(
        <div key={p.id} className="club-post">
          <div className="club-post-hd">
            <div className="club-ava" style={{background:p.color}}>{p.ini}</div>
            <div className="club-name">{p.user}</div>
            <div className="club-time">{p.time}</div>
          </div>
          <div className="club-text">{p.text}</div>
        </div>
      ))}
      <div className="club-input">
        <input value={reply} onChange={e=>setReply(e.target.value)}
          placeholder="Share thoughts…" onKeyDown={e=>e.key==="Enter"&&handlePost()}/>
        <button className="btn btn-primary btn-sm" onClick={handlePost}>Post</button>
      </div>
    </div>
  );
}

function AccountModule() {
  return (
    <div>
      <div className="acct-avatar">AJ</div>
      <div className="acct-name">Alex Johnson</div>
      <div className="acct-card">CARD #78234-B</div>
      <div className="acct-status">
        <div className="acct-row"><span>Fine balance</span><span style={{color:"#c06060"}}>$0.60</span></div>
        <div className="acct-row"><span>Books out</span><span style={{color:"var(--gold-hi)"}}>3 / 10</span></div>
        <div className="acct-row"><span>Member since</span><span>2019</span></div>
        <div className="acct-row"><span>Home branch</span><span>Main St.</span></div>
      </div>
      <div className="p-label">Branches</div>
      {["Main Street Branch","Eastside Library","Central Digital Hub"].map((b,i)=>(
        <div key={b} className={`branch-item ${i===0?"active":""}`}>
          <span style={{fontSize:"0.85rem"}}>🏛️</span>{b}
        </div>
      ))}
    </div>
  );
}

function StatsModule() {
  return (
    <div>
      <div className="stat-row">
        <div className="stat-box"><div className="stat-num">23</div><div className="stat-lbl">Books '24</div></div>
        <div className="stat-box"><div className="stat-num">4.3</div><div className="stat-lbl">Avg ★</div></div>
      </div>
      <div className="p-label">By Genre</div>
      {[["Fiction",45],["Literary",30],["Sci-Fi",15],["Fantasy",10]].map(([g,p])=>(
        <div key={g} className="prog-wrap">
          <div className="prog-hd"><span>{g}</span><span>{p}%</span></div>
          <div className="prog-bar"><div className="prog-fill" style={{width:`${p}%`}}/></div>
        </div>
      ))}
      <div className="p-label">Monthly Pace</div>
      <div style={{display:"flex",gap:3,alignItems:"flex-end",height:36}}>
        {[3,4,2,5,4,3,4,5,2,4,3,2].map((v,i)=>(
          <div key={i} style={{
            flex:1,
            background:`rgba(196,160,64,${0.12+v*0.07})`,
            height:`${(v/5)*100}%`, minHeight:3,
            borderRadius:"2px 2px 0 0",
          }}/>
        ))}
      </div>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:"0.5rem",
        color:"rgba(196,160,64,0.3)",marginTop:3,textAlign:"center",letterSpacing:"0.1em"}}>
        JAN — DEC
      </div>
    </div>
  );
}

const MODULE_COMPONENTS = {
  loans: LoansModule, notifs: NotifsModule, history: HistoryModule,
  club: ClubModule, account: AccountModule, stats: StatsModule
};

// Slot grid positions: 3×3 grid, center col is browser
const SLOT_STYLE = {
  tl: { gridColumn:1, gridRow:1 },
  tr: { gridColumn:3, gridRow:1 },
  lm: { gridColumn:1, gridRow:2 },
  rm: { gridColumn:3, gridRow:2 },
  bl: { gridColumn:1, gridRow:3 },
  br: { gridColumn:3, gridRow:3 },
};
const SLOT_NAMES = ["tl","tr","lm","rm","bl","br"];

// ─── APP ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("alex.johnson@email.com");
  const [password, setPassword] = useState("");

  const [slots, setSlots] = useState({
    tl:"loans",   tr:"notifs",
    lm:"account", rm:"club",
    bl:"history", br:"stats",
  });
  const [picking, setPicking] = useState(null);

  // Book browser
  const [query,       setQuery]       = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [selected,    setSelected]    = useState(null);
  const [doneBook,    setDoneBook]    = useState(null);
  const genres = ["All","Fantasy","Sci-Fi","Fiction","Literary"];

  const filtered = BOOKS.filter(b=>
    (activeGenre==="All" || b.genre===activeGenre) &&
    (b.title.toLowerCase().includes(query.toLowerCase()) ||
     b.author.toLowerCase().includes(query.toLowerCase()))
  );

  const handleCheckout = () => {
    setDoneBook(selected.id);
    setTimeout(()=>{ setDoneBook(null); setSelected(null); }, 1800);
  };

  const assignModule = (slot, modId) => {
    setSlots(prev=>{
      const next = {...prev};
      const existingSlot = Object.entries(next).find(([,v])=>v===modId)?.[0];
      if(existingSlot && existingSlot!==slot) next[existingSlot] = next[slot];
      next[slot] = modId;
      return next;
    });
    setPicking(null);
  };

  if(!loggedIn) {
    return (
      <>
        <style>{CSS}</style>
        <div className="bg"/>
        <div className="login-wrap">
          <div className="login-card">
            <div className="login-hd">
              <div className="login-logo">📚</div>
              <div className="login-title">LibraryLink</div>
              <div className="login-sub">Public Library Portal</div>
            </div>
            <div className="login-body">
              <div className="lf">
                <label>Library Card / Email</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="card number or email"/>
              </div>
              <div className="lf">
                <label>PIN / Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>
              </div>
              <button className="login-submit" onClick={()=>setLoggedIn(true)}>
                Sign In to Library Account
              </button>
              <div className="login-hint">Don't have a card? Visit your local branch to register.</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="bg"/>

      {/* TOPBAR */}
      <div className="topbar">
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round"/>
          </svg>
          LibraryLink
        </div>
        <div className="topbar-tag">Modular Public Library Portal</div>
        <div className="topbar-spacer"/>
        <div className="topbar-actions">
          <div className="user-pill" onClick={()=>setLoggedIn(false)}>
            <div className="user-ava">AJ</div>
            <div className="user-name">Alex J.</div>
          </div>
        </div>
      </div>

      {/* PERIMETER SHELL — 3×3 grid */}
      <div className="shell">

        {/* 6 perimeter module slots */}
        {SLOT_NAMES.map(slot=>{
          const modId  = slots[slot];
          const modDef = modId ? MODULE_DEFS.find(m=>m.id===modId) : null;
          const ModComp= modId ? MODULE_COMPONENTS[modId] : null;

          return (
            <div key={slot} className="slot" style={SLOT_STYLE[slot]}>
              {picking===slot ? (
                <div className="dock-picker">
                  <div className="dock-picker-label">Choose Module</div>
                  {MODULE_DEFS.map(m=>(
                    <div key={m.id} className="dock-pick-item" onClick={()=>assignModule(slot,m.id)}>
                      <span className="dock-pick-icon">{m.icon}</span>
                      <span className="dock-pick-name">{m.label}</span>
                    </div>
                  ))}
                  <button className="dock-pick-cancel" onClick={()=>setPicking(null)}>✕ Cancel</button>
                </div>
              ) : modDef ? (
                <div className="mod-panel">
                  <div className="mod-head">
                    <span className="mod-head-icon">{modDef.icon}</span>
                    <span className="mod-head-title">{modDef.label}</span>
                    <button className="mod-head-btn mod-head-swap" onClick={()=>setPicking(slot)} title="Swap module">⇄</button>
                    <button className="mod-head-btn mod-head-close"
                      onClick={()=>setSlots(p=>({...p,[slot]:null}))} title="Remove">✕</button>
                  </div>
                  <div className="mod-body"><ModComp/></div>
                </div>
              ) : (
                <div className="slot-empty" onClick={()=>setPicking(slot)}>
                  <div className="slot-empty-icon">＋</div>
                  <div className="slot-empty-label">Add Module</div>
                </div>
              )}
            </div>
          );
        })}

        {/* CENTRAL BOOK BROWSER — spans full center column, all 3 rows */}
        <div className="browser" style={{gridColumn:2, gridRow:"1 / 4"}}>
          <div className="browser-head">
            <div className="browser-head-row">
              <div className="browser-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round"/>
                </svg>
                Catalogue Browser
              </div>
              <div className="browser-search">
                <input
                  value={query}
                  onChange={e=>setQuery(e.target.value)}
                  placeholder="Search title, author, ISBN…"
                />
                <button>Search</button>
              </div>
              <div className="result-count">{filtered.length} results</div>
            </div>
            <div className="genre-chips">
              {genres.map(g=>(
                <button key={g} className={`gchip ${activeGenre===g?"on":""}`} onClick={()=>setActiveGenre(g)}>{g}</button>
              ))}
            </div>
          </div>
          <div className="browser-body">
            <div className="book-grid">
              {filtered.map(book=>(
                <div key={book.id} className="book-card" onClick={()=>setSelected(book)}>
                  <div className="book-cover" style={{background:`linear-gradient(160deg,${book.color[0]},${book.color[1]})`}}>
                    <div className="book-spine"/>
                    <span className="book-emoji">{book.emoji}</span>
                  </div>
                  <div className="book-info">
                    <div className="book-title">{book.title}</div>
                    <div className="book-author">{book.author}</div>
                    <div className={`book-avail ${book.available?"avail-y":"avail-n"}`}>
                      {book.available?"● Available":"○ Checked Out"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* BOOK DETAIL MODAL */}
      {selected && (
        <div className="modal-ov" onClick={()=>setSelected(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-cover" style={{background:`linear-gradient(160deg,${selected.color[0]},${selected.color[1]})`}}>
              <div className="modal-cover-spine"/>
              <span className="modal-cover-emoji">{selected.emoji}</span>
              <span className="modal-cover-title">{selected.title}</span>
            </div>
            <div className="modal-body">
              <div className="mf-label">Author</div>
              <div className="mf-val">{selected.author}</div>
              <div className="mf-label">Genre · Year</div>
              <div className="mf-val">{selected.genre} · {selected.year}</div>
              <div className="mf-label">Pages</div>
              <div className="mf-val">{selected.pages}</div>
              <div className="mf-label">Status</div>
              <div className="mf-val" style={{color:selected.available?"#4aaa78":"#c06060"}}>
                {selected.available?"✓ Available — ready for checkout":"⏸ Checked out — place a hold?"}
              </div>
              {doneBook===selected.id && (
                <div className="confirm-flash">✓ Checkout confirmed! Enjoy your read.</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={()=>setSelected(null)}>Cancel</button>
              {selected.available
                ? <button className="btn btn-gold" onClick={handleCheckout}>Check Out</button>
                : <button className="btn btn-primary">Place Hold</button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
