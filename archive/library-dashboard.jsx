import { useState, useRef, useCallback, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --forest: #1a3a2a;
    --forest-mid: #2c5f42;
    --forest-light: #3d7a57;
    --sage: #7aab8a;
    --cream: #f5f0e8;
    --parchment: #ede5d5;
    --gold: #c8a84b;
    --gold-light: #e2c97e;
    --ink: #1c1c1a;
    --ink-mid: #3d3d38;
    --warm-red: #8b3a3a;
    --shadow: rgba(26,58,42,0.18);
    --panel-bg: rgba(245,240,232,0.97);
    --glass: rgba(255,255,255,0.08);
  }

  html, body, #root { height: 100%; }

  body {
    font-family: 'Lora', Georgia, serif;
    background: var(--forest);
    color: var(--ink);
    overflow: hidden;
  }

  /* ── BACKGROUND TEXTURE ── */
  .app-bg {
    position: fixed; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 80%, rgba(44,95,66,0.6) 0%, transparent 60%),
      radial-gradient(ellipse 60% 80% at 80% 20%, rgba(26,58,42,0.8) 0%, transparent 60%),
      linear-gradient(160deg, #0f2419 0%, #1a3a2a 40%, #243d30 100%);
  }

  .app-bg::before {
    content: '';
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='0.5' fill='rgba(200,168,75,0.12)'/%3E%3C/svg%3E");
    background-size: 60px 60px;
  }

  /* ── TOP BAR ── */
  .topbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
    height: 56px;
    background: rgba(15,36,25,0.95);
    border-bottom: 1px solid rgba(200,168,75,0.25);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; padding: 0 24px; gap: 20px;
  }

  .topbar-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    color: var(--gold);
    letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 10px;
  }

  .topbar-logo svg { width: 24px; height: 24px; }

  .topbar-tagline {
    font-size: 0.7rem;
    color: var(--sage);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .topbar-spacer { flex: 1; }

  .topbar-user {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 14px;
    background: var(--glass);
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 40px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .topbar-user:hover { background: rgba(255,255,255,0.12); }

  .topbar-user-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, var(--forest-mid), var(--gold));
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; color: var(--cream); font-weight: 700;
  }

  .topbar-user-name {
    font-size: 0.8rem; color: var(--cream); font-family: 'DM Mono', monospace;
  }

  .topbar-panel-toggle {
    display: flex; gap: 6px;
  }

  .toggle-btn {
    padding: 5px 10px;
    font-size: 0.65rem;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid rgba(200,168,75,0.3);
    border-radius: 4px;
    background: transparent;
    color: var(--sage);
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn:hover, .toggle-btn.active {
    background: rgba(200,168,75,0.15);
    color: var(--gold-light);
    border-color: var(--gold);
  }

  /* ── PANELS ── */
  .panel-host {
    position: fixed; top: 56px; bottom: 0; left: 0; right: 0;
    display: flex; gap: 0;
  }

  .panel-sidebar {
    width: 280px;
    background: rgba(12,28,20,0.92);
    border-right: 1px solid rgba(200,168,75,0.15);
    backdrop-filter: blur(8px);
    display: flex; flex-direction: column;
    transition: width 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }

  .panel-sidebar.collapsed { width: 0; opacity: 0; pointer-events: none; }

  .panel-sidebar-right {
    border-right: none;
    border-left: 1px solid rgba(200,168,75,0.15);
  }

  .panel-main {
    flex: 1;
    overflow: auto;
    padding: 28px;
    display: flex; flex-direction: column; gap: 24px;
  }

  .sidebar-section {
    padding: 18px 16px 10px;
    border-bottom: 1px solid rgba(200,168,75,0.08);
  }

  .sidebar-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
  }

  .sidebar-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px;
    border-radius: 6px;
    cursor: pointer;
    color: rgba(200,220,210,0.7);
    font-size: 0.85rem;
    transition: all 0.15s;
    margin-bottom: 2px;
  }

  .sidebar-nav-item:hover { background: rgba(255,255,255,0.06); color: var(--cream); }
  .sidebar-nav-item.active {
    background: rgba(200,168,75,0.12);
    color: var(--gold-light);
    border-left: 2px solid var(--gold);
    padding-left: 8px;
  }

  .sidebar-nav-icon { width: 16px; opacity: 0.8; }

  .badge {
    margin-left: auto;
    background: var(--warm-red);
    color: white;
    font-size: 0.6rem;
    font-family: 'DM Mono', monospace;
    padding: 1px 6px;
    border-radius: 10px;
  }

  /* ── CARDS ── */
  .card {
    background: var(--panel-bg);
    border-radius: 12px;
    border: 1px solid rgba(200,168,75,0.2);
    box-shadow: 0 4px 24px var(--shadow);
    overflow: hidden;
    animation: fadeUp 0.3s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid rgba(200,168,75,0.15);
    background: linear-gradient(90deg, rgba(26,58,42,0.06), transparent);
    display: flex; align-items: center; gap: 10px;
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    color: var(--forest);
  }

  .card-body { padding: 20px; }

  /* ── SEARCH ── */
  .search-bar {
    display: flex;
    background: white;
    border: 1.5px solid rgba(26,58,42,0.2);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .search-bar:focus-within { border-color: var(--forest-mid); }

  .search-bar input {
    flex: 1; border: none; outline: none;
    padding: 10px 14px;
    font-family: 'Lora', serif;
    font-size: 0.9rem;
    background: transparent;
  }

  .search-bar button {
    background: var(--forest);
    color: var(--cream);
    border: none; cursor: pointer;
    padding: 10px 18px;
    font-family: 'DM Mono', monospace;
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    transition: background 0.2s;
  }

  .search-bar button:hover { background: var(--forest-mid); }

  .filter-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }

  .chip {
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(26,58,42,0.25);
    font-size: 0.72rem;
    font-family: 'DM Mono', monospace;
    cursor: pointer;
    background: white;
    color: var(--ink-mid);
    transition: all 0.15s;
  }

  .chip.active, .chip:hover {
    background: var(--forest);
    color: var(--cream);
    border-color: var(--forest);
  }

  /* ── BOOK GRID ── */
  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 16px;
  }

  .book-card {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(26,58,42,0.12);
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }

  .book-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(26,58,42,0.15);
  }

  .book-cover {
    height: 110px;
    display: flex; align-items: flex-end; padding: 8px;
    position: relative;
  }

  .book-cover-spine {
    position: absolute; left: 0; top: 0; bottom: 0;
    width: 8px;
    opacity: 0.6;
  }

  .book-title-small {
    font-family: 'Playfair Display', serif;
    font-size: 0.72rem;
    line-height: 1.3;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.4);
    z-index: 1;
  }

  .book-meta { padding: 8px 10px; }

  .book-author {
    font-size: 0.7rem;
    color: var(--ink-mid);
    font-style: italic;
    margin-bottom: 4px;
  }

  .book-avail {
    font-family: 'DM Mono', monospace;
    font-size: 0.62rem;
    letter-spacing: 0.05em;
  }

  .avail-yes { color: #2e7d52; }
  .avail-no { color: var(--warm-red); }

  /* ── BOOK LIST ITEM ── */
  .book-list-item {
    display: flex; gap: 14px; padding: 12px 0;
    border-bottom: 1px solid rgba(200,168,75,0.12);
    align-items: flex-start;
  }

  .book-list-item:last-child { border-bottom: none; }

  .book-thumb {
    width: 44px; height: 60px; border-radius: 4px;
    flex-shrink: 0; display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem;
  }

  .book-list-info { flex: 1; }

  .book-list-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.88rem;
    margin-bottom: 2px;
  }

  .book-list-author {
    font-size: 0.75rem; color: var(--ink-mid); font-style: italic; margin-bottom: 6px;
  }

  .book-list-meta {
    font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--sage);
  }

  /* ── BUTTONS ── */
  .btn {
    padding: 7px 16px;
    border-radius: 6px;
    border: none; cursor: pointer;
    font-family: 'DM Mono', monospace;
    font-size: 0.72rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: all 0.2s;
  }

  .btn-primary {
    background: var(--forest);
    color: var(--cream);
  }

  .btn-primary:hover { background: var(--forest-mid); }

  .btn-gold {
    background: var(--gold);
    color: var(--forest);
    font-weight: 600;
  }

  .btn-gold:hover { background: var(--gold-light); }

  .btn-outline {
    background: transparent;
    border: 1px solid rgba(26,58,42,0.3);
    color: var(--forest);
  }

  .btn-outline:hover { background: rgba(26,58,42,0.06); }

  .btn-sm { padding: 4px 10px; font-size: 0.64rem; }

  /* ── STAT ROW ── */
  .stat-row {
    display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap;
  }

  .stat-box {
    flex: 1; min-width: 90px;
    background: linear-gradient(135deg, var(--forest), var(--forest-mid));
    border-radius: 10px;
    padding: 14px 16px;
    color: var(--cream);
  }

  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 1.8rem;
    line-height: 1;
    color: var(--gold-light);
    margin-bottom: 4px;
  }

  .stat-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  /* ── CHECKOUT ITEM ── */
  .checkout-item {
    display: flex; gap: 14px; padding: 14px;
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 8px; margin-bottom: 10px;
    background: white;
    align-items: center;
  }

  .due-badge {
    font-family: 'DM Mono', monospace; font-size: 0.62rem;
    padding: 3px 8px; border-radius: 4px;
    margin-left: auto; flex-shrink: 0;
  }

  .due-ok { background: rgba(46,125,82,0.1); color: #2e7d52; }
  .due-warn { background: rgba(200,168,75,0.15); color: #8a6a00; }
  .due-late { background: rgba(139,58,58,0.12); color: var(--warm-red); }

  /* ── BOOK CLUB ── */
  .club-post {
    padding: 14px;
    border: 1px solid rgba(200,168,75,0.15);
    border-radius: 8px;
    background: white;
    margin-bottom: 10px;
  }

  .club-post-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }

  .avatar-sm {
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; font-weight: 700; color: white;
  }

  .club-post-name { font-size: 0.8rem; font-weight: 600; }
  .club-post-time { font-size: 0.65rem; color: rgba(0,0,0,0.4); font-family: 'DM Mono', monospace; margin-left: auto; }

  .club-post-text { font-size: 0.82rem; color: var(--ink-mid); line-height: 1.55; }

  .club-reply-input {
    display: flex; gap: 8px; margin-top: 16px;
  }

  .club-reply-input input {
    flex: 1; border: 1px solid rgba(26,58,42,0.2); border-radius: 6px;
    padding: 8px 12px; font-family: 'Lora', serif; font-size: 0.85rem; outline: none;
  }

  /* ── NOTIF ── */
  .notif-item {
    display: flex; gap: 12px; padding: 12px 0;
    border-bottom: 1px solid rgba(200,168,75,0.1);
    align-items: flex-start;
  }

  .notif-dot {
    width: 8px; height: 8px; border-radius: 50%;
    margin-top: 5px; flex-shrink: 0;
  }

  .notif-unread { background: var(--gold); }
  .notif-read { background: rgba(0,0,0,0.15); }

  .notif-text { font-size: 0.82rem; color: var(--ink-mid); line-height: 1.5; }
  .notif-time { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: rgba(0,0,0,0.35); margin-top: 3px; }

  /* ── TABS ── */
  .tab-row {
    display: flex; gap: 4px; margin-bottom: 18px;
    border-bottom: 1px solid rgba(200,168,75,0.2);
  }

  .tab {
    padding: 7px 14px;
    font-family: 'DM Mono', monospace;
    font-size: 0.68rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    color: var(--ink-mid);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.15s;
  }

  .tab.active { color: var(--forest); border-bottom-color: var(--gold); }
  .tab:hover { color: var(--forest); }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(10,25,16,0.7);
    backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .modal {
    background: var(--cream);
    border-radius: 14px;
    border: 1px solid rgba(200,168,75,0.3);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    width: 420px; max-width: 90vw;
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .modal-header {
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(200,168,75,0.2);
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    color: var(--forest);
    display: flex; justify-content: space-between; align-items: center;
  }

  .modal-body { padding: 20px 24px; }
  .modal-footer { padding: 16px 24px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid rgba(200,168,75,0.15); }

  .modal-close { background: none; border: none; cursor: pointer; font-size: 1.1rem; color: var(--ink-mid); }

  .field-label { font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--forest); margin-bottom: 6px; }

  .field-value { font-size: 0.88rem; color: var(--ink-mid); margin-bottom: 14px; }

  .progress-bar { height: 6px; background: rgba(26,58,42,0.12); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--forest-mid), var(--gold)); border-radius: 3px; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.3); border-radius: 3px; }

  /* ── LOGIN ── */
  .login-screen {
    position: fixed; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(160deg, #0a1910 0%, #1a3a2a 50%, #0f2419 100%);
  }

  .login-card {
    width: 380px;
    background: rgba(245,240,232,0.97);
    border-radius: 16px;
    border: 1px solid rgba(200,168,75,0.3);
    box-shadow: 0 24px 64px rgba(0,0,0,0.35);
    overflow: hidden;
    animation: slideUp 0.4s ease;
  }

  .login-header {
    background: linear-gradient(135deg, var(--forest), #0f2419);
    padding: 32px 28px 24px;
    text-align: center;
  }

  .login-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem; color: var(--gold-light);
    margin-bottom: 4px;
  }

  .login-sub {
    font-family: 'DM Mono', monospace;
    font-size: 0.65rem; color: var(--sage);
    letter-spacing: 0.14em; text-transform: uppercase;
  }

  .login-body { padding: 28px; }

  .login-field { margin-bottom: 16px; }

  .login-field label {
    display: block;
    font-family: 'DM Mono', monospace; font-size: 0.65rem;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--forest); margin-bottom: 6px;
  }

  .login-field input {
    width: 100%; padding: 10px 14px;
    border: 1.5px solid rgba(26,58,42,0.2);
    border-radius: 7px; outline: none;
    font-family: 'Lora', serif; font-size: 0.9rem;
    transition: border-color 0.2s;
    background: white;
  }

  .login-field input:focus { border-color: var(--forest-mid); }

  .login-submit {
    width: 100%; padding: 12px;
    background: var(--forest);
    color: var(--cream);
    border: none; border-radius: 8px; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 0.8rem;
    letter-spacing: 0.1em; text-transform: uppercase;
    transition: background 0.2s;
    margin-top: 6px;
  }

  .login-submit:hover { background: var(--forest-mid); }

  .login-hint {
    text-align: center; margin-top: 14px;
    font-size: 0.72rem; color: var(--ink-mid); font-style: italic;
  }
`;

// ─── DATA ──────────────────────────────────────────────────────────────────────
const BOOKS = [
  { id: 1, title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", available: true, emoji: "📖", color: ["#2d4a8a","#1a2d5a"], year: 2007, pages: 662 },
  { id: 2, title: "Pachinko", author: "Min Jin Lee", genre: "Literary", available: false, emoji: "🌸", color: ["#8a4a2d","#5a2d1a"], year: 2017, pages: 485 },
  { id: 3, title: "Project Hail Mary", author: "Andy Weir", genre: "Sci-Fi", available: true, emoji: "🚀", color: ["#1a4a3a","#0f2d24"], year: 2021, pages: 476 },
  { id: 4, title: "Lessons in Chemistry", author: "Bonnie Garmus", genre: "Fiction", available: true, emoji: "⚗️", color: ["#5a3a8a","#3a2060"], year: 2022, pages: 390 },
  { id: 5, title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", available: false, emoji: "🌙", color: ["#1a3a5a","#0f2040"], year: 2020, pages: 304 },
  { id: 6, title: "Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Literary", available: true, emoji: "🎮", color: ["#3a5a2a","#223614"], year: 2022, pages: 416 },
];

const CHECKED_OUT = [
  { id: 1, title: "Cloud Atlas", author: "David Mitchell", due: "Feb 22", status: "ok", emoji: "☁️", color: ["#2d5a8a","#1a3560"] },
  { id: 2, title: "Piranesi", author: "Susanna Clarke", due: "Feb 18", status: "warn", emoji: "🏛️", color: ["#8a7a2d","#5a501a"] },
  { id: 3, title: "Bewilderment", author: "Richard Powers", due: "Feb 12", status: "late", emoji: "🌿", color: ["#2d8a4a","#1a5a30"] },
];

const HISTORY = [
  { title: "Station Eleven", author: "Emily St. John Mandel", returned: "Jan 30", rating: 5, emoji: "🎭" },
  { title: "The Invisible Life of Addie LaRue", author: "V.E. Schwab", returned: "Jan 14", rating: 4, emoji: "✨" },
  { title: "Mexican Gothic", author: "Silvia Moreno-Garcia", returned: "Dec 28", rating: 5, emoji: "🌹" },
  { title: "Piranesi", author: "Susanna Clarke", returned: "Checked Out", rating: null, emoji: "🏛️" },
];

const CLUB_POSTS = [
  { id: 1, user: "Margaret O.", initials: "MO", color: "#2d4a8a", text: "Chapter 12 completely floored me — the way Rothfuss weaves the sympathy system into everyday magic felt so earned. Anyone else notice the callback to the prologue?", time: "2h ago" },
  { id: 2, user: "James R.", initials: "JR", color: "#8a3a2d", text: "Yes! And the scene in the archives — I had to put the book down for a minute. The slow build of Kvothe's reputation vs his self-perception is masterful.", time: "1h ago" },
  { id: 3, user: "Priya S.", initials: "PS", color: "#2d8a4a", text: "Meeting this Thursday at 7pm as usual. We'll be covering through chapter 20. Bring your snacks and your theories!", time: "45m ago" },
];

const NOTIFS = [
  { text: "Piranesi is due back tomorrow — don't forget!", time: "2h ago", read: false },
  { text: "Your hold on The Midnight Library is ready for pickup at Main Branch.", time: "5h ago", read: false },
  { text: "Bewilderment is now 6 days overdue. A fine of $0.60 has been applied.", time: "1d ago", read: false },
  { text: "Book club meeting reminder: Thursday at 7pm, Community Room B.", time: "2d ago", read: true },
  { text: "New arrivals in Literary Fiction — 14 titles added this week.", time: "3d ago", read: true },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function BookCover({ book, size = "grid" }) {
  const isGrid = size === "grid";
  return (
    <div style={{
      background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})`,
      height: isGrid ? 110 : 60,
      width: isGrid ? "100%" : 44,
      borderRadius: isGrid ? "0" : "4px",
      display: "flex", alignItems: "flex-end", padding: isGrid ? 8 : 4,
      position: "relative", flexShrink: 0,
      fontSize: isGrid ? "1.4rem" : "1.2rem",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
        background: "rgba(0,0,0,0.25)",
      }} />
      <span>{book.emoji}</span>
    </div>
  );
}

// ── SEARCH PANEL ──
function SearchPanel() {
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [selectedBook, setSelectedBook] = useState(null);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const genres = ["All", "Fantasy", "Sci-Fi", "Fiction", "Literary"];

  const filtered = BOOKS.filter(b =>
    (activeGenre === "All" || b.genre === activeGenre) &&
    (b.title.toLowerCase().includes(query.toLowerCase()) || b.author.toLowerCase().includes(query.toLowerCase()))
  );

  const handleCheckout = () => {
    setCheckoutDone(true);
    setTimeout(() => { setCheckoutDone(false); setSelectedBook(null); }, 1800);
  };

  return (
    <>
      <div className="card-header">
        <span style={{ fontSize: "1.1rem" }}>🔍</span>
        <span className="card-title">Search the Catalogue</span>
      </div>
      <div className="card-body">
        <div className="search-bar">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, author, ISBN…"
          />
          <button>Search</button>
        </div>
        <div className="filter-chips">
          {genres.map(g => (
            <button key={g} className={`chip ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>
              {g}
            </button>
          ))}
        </div>
        <div className="book-grid">
          {filtered.map(book => (
            <div key={book.id} className="book-card" onClick={() => setSelectedBook(book)}>
              <BookCover book={book} size="grid" />
              <div className="book-meta">
                <div className="book-list-title" style={{ fontSize: "0.78rem", marginBottom: 2 }}>{book.title}</div>
                <div className="book-author">{book.author}</div>
                <div className={`book-avail ${book.available ? "avail-yes" : "avail-no"}`}>
                  {book.available ? "● Available" : "○ Checked Out"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              {selectedBook.emoji} {selectedBook.title}
              <button className="modal-close" onClick={() => setSelectedBook(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="field-label">Author</div>
              <div className="field-value">{selectedBook.author}</div>
              <div className="field-label">Genre</div>
              <div className="field-value">{selectedBook.genre} · {selectedBook.year}</div>
              <div className="field-label">Pages</div>
              <div className="field-value">{selectedBook.pages}</div>
              <div className="field-label">Status</div>
              <div className="field-value" style={{ color: selectedBook.available ? "#2e7d52" : "#8b3a3a" }}>
                {selectedBook.available ? "✓ Available — ready for checkout" : "⏸ Currently checked out — place a hold?"}
              </div>
              {checkoutDone && (
                <div style={{ textAlign: "center", color: "#2e7d52", fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", padding: "10px 0" }}>
                  ✓ Checkout confirmed! Enjoy your read.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedBook(null)}>Cancel</button>
              {selectedBook.available
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

// ── CHECKOUT PANEL ──
function CheckoutPanel() {
  const [renewId, setRenewId] = useState(null);

  return (
    <>
      <div className="card-header">
        <span style={{ fontSize: "1.1rem" }}>📚</span>
        <span className="card-title">Checked Out & Holds</span>
      </div>
      <div className="card-body">
        <div className="stat-row">
          <div className="stat-box">
            <div className="stat-num">3</div>
            <div className="stat-label">Checked Out</div>
          </div>
          <div className="stat-box">
            <div className="stat-num">1</div>
            <div className="stat-label">Holds Ready</div>
          </div>
          <div className="stat-box" style={{ background: "linear-gradient(135deg, #8b3a3a, #6b2020)" }}>
            <div className="stat-num">1</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <div className="sidebar-label" style={{ marginBottom: 12 }}>Currently Checked Out</div>
        {CHECKED_OUT.map(book => (
          <div key={book.id} className="checkout-item">
            <BookCover book={book} size="list" />
            <div style={{ flex: 1 }}>
              <div className="book-list-title">{book.title}</div>
              <div className="book-list-author">{book.author}</div>
              {renewId === book.id
                ? <span style={{ fontSize: "0.65rem", fontFamily: "'DM Mono', monospace", color: "#2e7d52" }}>✓ Renewed — now due Mar 4</span>
                : <button className="btn btn-outline btn-sm" onClick={() => setRenewId(book.id)}>Renew</button>
              }
            </div>
            <div className={`due-badge ${book.status === "ok" ? "due-ok" : book.status === "warn" ? "due-warn" : "due-late"}`}>
              {book.status === "late" ? "⚠ " : ""}Due {book.due}
            </div>
          </div>
        ))}

        <div className="sidebar-label" style={{ marginTop: 20, marginBottom: 12 }}>Holds Ready for Pickup</div>
        <div className="checkout-item">
          <BookCover book={{ emoji: "🌙", color: ["#1a3a5a","#0f2040"] }} size="list" />
          <div style={{ flex: 1 }}>
            <div className="book-list-title">The Midnight Library</div>
            <div className="book-list-author">Matt Haig</div>
            <div className="book-list-meta">Main Branch · Expires Feb 20</div>
          </div>
          <div className="due-badge due-ok">Ready</div>
        </div>
      </div>
    </>
  );
}

// ── HISTORY PANEL ──
function HistoryPanel() {
  const [tab, setTab] = useState("history");

  return (
    <>
      <div className="card-header">
        <span style={{ fontSize: "1.1rem" }}>📜</span>
        <span className="card-title">Reading History & Lists</span>
      </div>
      <div className="card-body">
        <div className="tab-row">
          {["history","lists","stats"].map(t => (
            <div key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </div>
          ))}
        </div>

        {tab === "history" && HISTORY.map((b, i) => (
          <div key={i} className="book-list-item">
            <div style={{ fontSize: "1.3rem", width: 32, textAlign: "center" }}>{b.emoji}</div>
            <div className="book-list-info">
              <div className="book-list-title">{b.title}</div>
              <div className="book-list-author">{b.author}</div>
              <div className="book-list-meta">{b.returned}</div>
            </div>
            {b.rating && (
              <div style={{ color: "#c8a84b", fontSize: "0.75rem", flexShrink: 0 }}>
                {"★".repeat(b.rating)}{"☆".repeat(5 - b.rating)}
              </div>
            )}
          </div>
        ))}

        {tab === "lists" && (
          <div>
            {["Want to Read (12)", "Favourites (8)", "Book Club Picks (5)"].map((l, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0", borderBottom: "1px solid rgba(200,168,75,0.1)"
              }}>
                <div>
                  <div style={{ fontSize: "0.88rem", fontFamily: "'Playfair Display', serif" }}>
                    {l.split("(")[0].trim()}
                  </div>
                  <div style={{ fontSize: "0.65rem", fontFamily: "'DM Mono', monospace", color: "#7aab8a" }}>
                    {l.match(/\((\d+)\)/)?.[1]} books
                  </div>
                </div>
                <button className="btn btn-outline btn-sm">View</button>
              </div>
            ))}
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>+ New List</button>
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div className="stat-row">
              <div className="stat-box"><div className="stat-num">23</div><div className="stat-label">Books 2024</div></div>
              <div className="stat-box"><div className="stat-num">4.3</div><div className="stat-label">Avg Rating</div></div>
            </div>
            {[["Fiction", 45], ["Literary", 30], ["Sci-Fi", 15], ["Fantasy", 10]].map(([g, pct]) => (
              <div key={g} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace" }}>{g}</span>
                  <span style={{ color: "#7aab8a" }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ── BOOK CLUB PANEL ──
function BookClubPanel() {
  const [reply, setReply] = useState("");
  const [posts, setPosts] = useState(CLUB_POSTS);

  const handlePost = () => {
    if (!reply.trim()) return;
    setPosts(prev => [...prev, {
      id: prev.length + 1,
      user: "You",
      initials: "AJ",
      color: "#2d5a3a",
      text: reply,
      time: "just now"
    }]);
    setReply("");
  };

  return (
    <>
      <div className="card-header">
        <span style={{ fontSize: "1.1rem" }}>💬</span>
        <span className="card-title">Book Club</span>
      </div>
      <div className="card-body">
        <div style={{
          background: "linear-gradient(90deg, rgba(26,58,42,0.08), transparent)",
          border: "1px solid rgba(200,168,75,0.2)",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
          fontSize: "0.82rem",
        }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", marginBottom: 2 }}>
            Currently Reading: The Name of the Wind
          </div>
          <div style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#7aab8a" }}>
            Chapters 1–20 · Next meeting Thu Feb 20, 7pm
          </div>
        </div>

        {posts.map(p => (
          <div key={p.id} className="club-post">
            <div className="club-post-header">
              <div className="avatar-sm" style={{ background: p.color }}>{p.initials}</div>
              <div className="club-post-name">{p.user}</div>
              <div className="club-post-time">{p.time}</div>
            </div>
            <div className="club-post-text">{p.text}</div>
          </div>
        ))}

        <div className="club-reply-input">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="Share your thoughts…"
            onKeyDown={e => e.key === "Enter" && handlePost()}
          />
          <button className="btn btn-primary" onClick={handlePost}>Post</button>
        </div>
      </div>
    </>
  );
}

// ── NOTIF PANEL ──
function NotifPanel() {
  const [notifs, setNotifs] = useState(NOTIFS);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <>
      <div className="card-header">
        <span style={{ fontSize: "1.1rem" }}>🔔</span>
        <span className="card-title">Notifications</span>
        {unread > 0 && (
          <button
            className="btn btn-outline btn-sm"
            style={{ marginLeft: "auto" }}
            onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="card-body">
        {notifs.map((n, i) => (
          <div key={i} className="notif-item" onClick={() => setNotifs(prev => prev.map((x, xi) => xi === i ? { ...x, read: true } : x))} style={{ cursor: "pointer" }}>
            <div className={`notif-dot ${n.read ? "notif-read" : "notif-unread"}`} />
            <div>
              <div className="notif-text" style={{ fontWeight: n.read ? 400 : 600 }}>{n.text}</div>
              <div className="notif-time">{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── ACCOUNT SIDEBAR ──
function AccountSidebar() {
  return (
    <div style={{ padding: "20px 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", margin: "0 auto 10px",
          background: "linear-gradient(135deg, #2c5f42, #c8a84b)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.3rem", fontWeight: 700, color: "white",
          border: "2px solid rgba(200,168,75,0.4)"
        }}>AJ</div>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "var(--cream)", fontSize: "0.95rem" }}>Alex Johnson</div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--sage)", marginTop: 2 }}>CARD #78234-B</div>
      </div>
      <div style={{ background: "rgba(200,168,75,0.1)", borderRadius: 8, padding: "12px", marginBottom: 16, border: "1px solid rgba(200,168,75,0.2)" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--gold)", marginBottom: 8, letterSpacing: "0.1em" }}>ACCOUNT STATUS</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(200,220,210,0.8)", marginBottom: 6 }}>
          <span>Fine balance</span><span style={{ color: "#e09090" }}>$0.60</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(200,220,210,0.8)", marginBottom: 6 }}>
          <span>Books out</span><span style={{ color: "var(--gold-light)" }}>3 / 10</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(200,220,210,0.8)" }}>
          <span>Home branch</span><span>Main St.</span>
        </div>
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "var(--gold)", letterSpacing: "0.1em", marginBottom: 10 }}>PREFERRED LIBRARY</div>
      {["Main Street Branch", "Eastside Library", "Central Digital Hub"].map((b, i) => (
        <div key={b} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer", color: "rgba(200,220,210,0.75)", fontSize: "0.78rem", background: i === 0 ? "rgba(200,168,75,0.1)" : "transparent", border: i === 0 ? "1px solid rgba(200,168,75,0.2)" : "1px solid transparent", marginBottom: 4 }}>
          <span style={{ fontSize: "0.85rem" }}>🏛️</span> {b}
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const PANELS = [
  { id: "search", label: "Search", icon: "🔍", component: SearchPanel },
  { id: "checkout", label: "Loans", icon: "📚", component: CheckoutPanel },
  { id: "history", label: "History", icon: "📜", component: HistoryPanel },
  { id: "club", label: "Book Club", icon: "💬", component: BookClubPanel },
  { id: "notifs", label: "Alerts", icon: "🔔", component: NotifPanel },
];

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("alex.johnson@email.com");
  const [password, setPassword] = useState("");
  const [activePanel, setActivePanel] = useState("search");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const PanelComp = PANELS.find(p => p.id === activePanel)?.component || SearchPanel;

  if (!loggedIn) {
    return (
      <>
        <style>{style}</style>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-header">
              <div style={{ fontSize: "2.4rem", marginBottom: 12 }}>📚</div>
              <div className="login-title">LibraryLink</div>
              <div className="login-sub">Public Library Portal</div>
            </div>
            <div className="login-body">
              <div className="login-field">
                <label>Library Card / Email</label>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="card number or email" />
              </div>
              <div className="login-field">
                <label>PIN / Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <button className="login-submit" onClick={() => setLoggedIn(true)}>
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
      <style>{style}</style>
      <div className="app-bg" />

      {/* TOP BAR */}
      <div className="topbar">
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" />
          </svg>
          LibraryLink
        </div>
        <div className="topbar-tagline">Modular Public Library Portal</div>
        <div className="topbar-spacer" />

        <div className="topbar-panel-toggle">
          <button className={`toggle-btn ${leftOpen ? "active" : ""}`} onClick={() => setLeftOpen(v => !v)}>◀ Nav</button>
          <button className={`toggle-btn ${rightOpen ? "active" : ""}`} onClick={() => setRightOpen(v => !v)}>Account ▶</button>
        </div>

        <div className="topbar-user" onClick={() => setLoggedIn(false)}>
          <div className="topbar-user-avatar">AJ</div>
          <div className="topbar-user-name">Alex J.</div>
        </div>
      </div>

      {/* PANEL HOST */}
      <div className="panel-host">

        {/* LEFT SIDEBAR — NAV */}
        <div className={`panel-sidebar ${leftOpen ? "" : "collapsed"}`}>
          <div className="sidebar-section">
            <div className="sidebar-label">Modules</div>
            {PANELS.map(p => (
              <div
                key={p.id}
                className={`sidebar-nav-item ${activePanel === p.id ? "active" : ""}`}
                onClick={() => setActivePanel(p.id)}
              >
                <span>{p.icon}</span>
                {p.label}
                {p.id === "notifs" && <span className="badge">3</span>}
                {p.id === "checkout" && <span className="badge" style={{ background: "#8b3a3a" }}>!</span>}
              </div>
            ))}
          </div>
          <div className="sidebar-section">
            <div className="sidebar-label">My Libraries</div>
            {["Main Street Branch", "Eastside Library"].map(b => (
              <div key={b} className="sidebar-nav-item" style={{ fontSize: "0.75rem" }}>
                <span>🏛️</span> {b}
              </div>
            ))}
          </div>
          <div style={{ padding: "16px", marginTop: "auto" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "rgba(122,171,138,0.5)", letterSpacing: "0.06em" }}>
              LIBRARYLINK v1.0<br />
              Vercel Hosted · Generic API<br />
              OCLC WorldCat Compatible
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="panel-main">
          <div className="card" style={{ flex: "none" }}>
            <PanelComp key={activePanel} />
          </div>
        </div>

        {/* RIGHT SIDEBAR — ACCOUNT */}
        <div className={`panel-sidebar panel-sidebar-right ${rightOpen ? "" : "collapsed"}`}>
          <AccountSidebar />
        </div>

      </div>
    </>
  );
}
