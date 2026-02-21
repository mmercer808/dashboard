import { useState, useEffect } from "react";

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
    background: rgba(15,36,25,0.96);
    border-bottom: 1px solid rgba(200,168,75,0.25);
    backdrop-filter: blur(12px);
    display: flex; align-items: center; padding: 0 20px; gap: 16px;
  }

  .topbar-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem;
    color: var(--gold);
    letter-spacing: 0.02em;
    display: flex; align-items: center; gap: 9px;
    flex-shrink: 0;
  }

  .topbar-tagline {
    font-size: 0.65rem;
    color: var(--sage);
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.7;
  }

  /* ── CURRENTLY READING BANNER ── */
  .now-reading-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(200,168,75,0.07);
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 8px;
    padding: 6px 14px;
    min-width: 0;
    cursor: pointer;
    transition: background 0.2s;
  }

  .now-reading-bar:hover { background: rgba(200,168,75,0.13); }

  .now-reading-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
    flex-shrink: 0;
  }

  .now-reading-divider {
    width: 1px; height: 16px;
    background: rgba(200,168,75,0.25);
    flex-shrink: 0;
  }

  .now-reading-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.82rem;
    color: var(--cream);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .now-reading-due {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    color: var(--sage);
    flex-shrink: 0;
    margin-left: auto;
  }

  .now-reading-due.warn { color: #e0b060; }
  .now-reading-due.late { color: #e07070; }

  .now-reading-progress {
    width: 60px; height: 3px;
    background: rgba(200,168,75,0.15);
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .now-reading-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--forest-mid), var(--gold));
    border-radius: 2px;
    transition: width 1s ease;
  }

  .topbar-right {
    display: flex; align-items: center; gap: 8px; flex-shrink: 0;
  }

  .toggle-btn {
    padding: 5px 10px;
    font-size: 0.62rem;
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

  .topbar-user {
    display: flex; align-items: center; gap: 9px;
    padding: 5px 12px;
    background: var(--glass);
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 40px;
    cursor: pointer;
    transition: background 0.2s;
  }
  .topbar-user:hover { background: rgba(255,255,255,0.12); }

  .topbar-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(135deg, var(--forest-mid), var(--gold));
    display: flex; align-items: center; justify-content: center;
    font-size: 0.65rem; color: var(--cream); font-weight: 700;
  }

  .topbar-user-name { font-size: 0.78rem; color: var(--cream); font-family: 'DM Mono', monospace; }

  /* ── LAYOUT ── */
  .panel-host {
    position: fixed; top: 56px; bottom: 0; left: 0; right: 0;
    display: flex;
  }

  .sidebar {
    width: 268px;
    background: rgba(12,28,20,0.92);
    border-right: 1px solid rgba(200,168,75,0.15);
    backdrop-filter: blur(8px);
    display: flex; flex-direction: column;
    transition: width 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sidebar.collapsed { width: 0; opacity: 0; pointer-events: none; }

  .sidebar-right {
    border-right: none;
    border-left: 1px solid rgba(200,168,75,0.15);
  }

  .panel-main {
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  /* ── SEASONAL SHELF ── */
  .seasonal-shelf {
    background: rgba(12,28,20,0.7);
    border-bottom: 1px solid rgba(200,168,75,0.12);
    padding: 14px 24px;
    flex-shrink: 0;
  }

  .seasonal-shelf-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 12px;
  }

  .seasonal-shelf-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.6rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
  }

  .seasonal-shelf-name {
    font-family: 'Playfair Display', serif;
    font-size: 0.88rem;
    color: var(--cream);
    font-style: italic;
  }

  .seasonal-shelf-scroll {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .seasonal-shelf-scroll::-webkit-scrollbar { height: 3px; }
  .seasonal-shelf-scroll::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.25); border-radius: 2px; }

  .shelf-book {
    flex-shrink: 0;
    width: 56px;
    cursor: pointer;
    transition: transform 0.18s;
  }
  .shelf-book:hover { transform: translateY(-4px); }

  .shelf-book-cover {
    width: 56px; height: 76px;
    border-radius: 4px;
    display: flex; align-items: flex-end; padding: 5px;
    position: relative;
    margin-bottom: 5px;
    box-shadow: 2px 3px 8px rgba(0,0,0,0.3);
  }

  .shelf-book-spine {
    position: absolute; left: 0; top: 0; bottom: 0; width: 5px;
    background: rgba(0,0,0,0.25);
    border-radius: 4px 0 0 4px;
  }

  .shelf-book-emoji { font-size: 1rem; z-index: 1; }

  .shelf-book-title {
    font-family: 'Playfair Display', serif;
    font-size: 0.58rem;
    color: rgba(245,240,232,0.8);
    line-height: 1.3;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── MAIN CONTENT ── */
  .main-content {
    flex: 1;
    overflow: auto;
    padding: 22px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── CARD ── */
  .card {
    background: var(--panel-bg);
    border-radius: 12px;
    border: 1px solid rgba(200,168,75,0.2);
    box-shadow: 0 4px 24px var(--shadow);
    overflow: hidden;
    animation: fadeUp 0.3s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .card-header {
    padding: 14px 18px;
    border-bottom: 1px solid rgba(200,168,75,0.15);
    background: linear-gradient(90deg, rgba(26,58,42,0.06), transparent);
    display: flex; align-items: center; gap: 10px;
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    color: var(--forest);
  }

  .card-body { padding: 18px; }

  /* ── SIDEBAR NAV ── */
  .sidebar-section {
    padding: 16px 14px 10px;
    border-bottom: 1px solid rgba(200,168,75,0.08);
  }

  .sidebar-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 10px;
  }

  .nav-item {
    display: flex; align-items: center; gap: 9px;
    padding: 7px 8px;
    border-radius: 6px;
    cursor: pointer;
    color: rgba(200,220,210,0.65);
    font-size: 0.82rem;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .nav-item:hover { background: rgba(255,255,255,0.06); color: var(--cream); }
  .nav-item.active {
    background: rgba(200,168,75,0.12);
    color: var(--gold-light);
    border-left: 2px solid var(--gold);
    padding-left: 6px;
  }

  .nav-badge {
    margin-left: auto;
    background: var(--warm-red);
    color: white;
    font-size: 0.58rem;
    font-family: 'DM Mono', monospace;
    padding: 1px 5px;
    border-radius: 8px;
  }

  /* ── BRANCH SELECTOR ── */
  .branch-selector {
    padding: 14px;
    border-bottom: 1px solid rgba(200,168,75,0.08);
  }

  .branch-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 8px;
    border-radius: 5px;
    cursor: pointer;
    color: rgba(200,220,210,0.6);
    font-size: 0.74rem;
    transition: all 0.15s;
    margin-bottom: 2px;
  }
  .branch-item:hover { background: rgba(255,255,255,0.05); color: var(--cream); }
  .branch-item.active {
    background: rgba(200,168,75,0.1);
    color: var(--cream);
    border: 1px solid rgba(200,168,75,0.2);
  }

  .branch-dot {
    width: 6px; height: 6px; border-radius: 50%;
    flex-shrink: 0;
  }
  .branch-dot-active { background: var(--sage); }
  .branch-dot-inactive { background: rgba(200,220,210,0.2); }

  /* ── STREAK WIDGET ── */
  .streak-widget {
    padding: 14px;
    margin-top: auto;
  }

  .streak-inner {
    background: rgba(200,168,75,0.08);
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }

  .streak-flame { font-size: 1.4rem; margin-bottom: 4px; }

  .streak-count {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem;
    color: var(--gold-light);
    line-height: 1;
    margin-bottom: 2px;
  }

  .streak-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem;
    letter-spacing: 0.1em;
    color: var(--sage);
    text-transform: uppercase;
  }

  .streak-months {
    display: flex; gap: 3px; justify-content: center;
    margin-top: 10px;
  }

  .streak-pip {
    width: 14px; height: 4px;
    border-radius: 2px;
  }
  .streak-pip-active { background: var(--gold); }
  .streak-pip-inactive { background: rgba(200,168,75,0.15); }

  .streak-month-row {
    display: flex; gap: 3px; justify-content: center;
    margin-top: 3px;
  }

  .streak-month-label {
    font-family: 'DM Mono', monospace;
    font-size: 0.5rem;
    color: rgba(122,171,138,0.5);
    width: 14px;
    text-align: center;
  }

  /* ── ACCOUNT PANEL ── */
  .account-panel {
    padding: 18px 14px;
    overflow-y: auto;
  }

  .account-avatar-wrap {
    text-align: center; margin-bottom: 18px;
  }

  .account-avatar {
    width: 52px; height: 52px; border-radius: 50%;
    margin: 0 auto 10px;
    background: linear-gradient(135deg, #2c5f42, #c8a84b);
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; font-weight: 700; color: white;
    border: 2px solid rgba(200,168,75,0.35);
  }

  .account-name {
    font-family: 'Playfair Display', serif;
    color: var(--cream); font-size: 0.92rem; margin-bottom: 2px;
  }

  .account-card-num {
    font-family: 'DM Mono', monospace;
    font-size: 0.58rem; color: var(--sage);
    letter-spacing: 0.08em;
  }

  .account-status-box {
    background: rgba(200,168,75,0.08);
    border: 1px solid rgba(200,168,75,0.2);
    border-radius: 7px;
    padding: 11px 12px;
    margin-bottom: 14px;
  }

  .account-status-row {
    display: flex; justify-content: space-between;
    font-size: 0.74rem;
    color: rgba(200,220,210,0.75);
    margin-bottom: 5px;
  }
  .account-status-row:last-child { margin-bottom: 0; }

  /* ── SEARCH ── */
  .search-bar {
    display: flex;
    background: white;
    border: 1.5px solid rgba(26,58,42,0.2);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 14px;
    transition: border-color 0.2s;
  }
  .search-bar:focus-within { border-color: var(--forest-mid); }
  .search-bar input {
    flex: 1; border: none; outline: none;
    padding: 9px 13px;
    font-family: 'Lora', serif; font-size: 0.88rem;
  }
  .search-bar button {
    background: var(--forest); color: var(--cream);
    border: none; cursor: pointer; padding: 9px 16px;
    font-family: 'DM Mono', monospace; font-size: 0.72rem;
    letter-spacing: 0.06em; transition: background 0.2s;
  }
  .search-bar button:hover { background: var(--forest-mid); }

  .filter-chips { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }

  .chip {
    padding: 3px 11px; border-radius: 20px;
    border: 1px solid rgba(26,58,42,0.22);
    font-size: 0.7rem; font-family: 'DM Mono', monospace;
    cursor: pointer; background: white; color: var(--ink-mid);
    transition: all 0.15s;
  }
  .chip.active, .chip:hover { background: var(--forest); color: var(--cream); border-color: var(--forest); }

  .book-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 14px;
  }

  .book-card {
    border-radius: 8px; overflow: hidden;
    border: 1px solid rgba(26,58,42,0.12);
    background: white; cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  }
  .book-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(26,58,42,0.15); }

  .book-cover-art {
    height: 100px; display: flex; align-items: flex-end; padding: 7px;
    position: relative;
  }

  .book-spine-shadow {
    position: absolute; left: 0; top: 0; bottom: 0; width: 6px;
    background: rgba(0,0,0,0.22);
  }

  .book-cover-emoji { z-index: 1; font-size: 1.3rem; }

  .book-meta { padding: 7px 9px; }
  .book-title-sm { font-family: 'Playfair Display', serif; font-size: 0.72rem; line-height: 1.25; margin-bottom: 2px; }
  .book-author-sm { font-size: 0.66rem; color: var(--ink-mid); font-style: italic; margin-bottom: 3px; }
  .book-avail { font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.04em; }
  .avail-yes { color: #2e7d52; }
  .avail-no { color: var(--warm-red); }

  /* ── BOOKSHOP CTA ── (affiliate link example) */
  .bookshop-cta {
    display: flex; align-items: center; gap: 6px;
    margin-top: 8px; padding: 5px 8px;
    background: rgba(26,58,42,0.06);
    border: 1px dashed rgba(26,58,42,0.18);
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .bookshop-cta:hover { background: rgba(26,58,42,0.1); }
  .bookshop-cta-text {
    font-family: 'DM Mono', monospace; font-size: 0.6rem;
    color: var(--forest); letter-spacing: 0.05em;
  }

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
    width: 420px; max-width: 92vw;
    animation: slideUp 0.22s ease;
  }
  @keyframes slideUp { from { transform: translateY(18px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  .modal-header {
    padding: 18px 22px 14px;
    border-bottom: 1px solid rgba(200,168,75,0.2);
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem; color: var(--forest);
    display: flex; justify-content: space-between; align-items: center;
  }
  .modal-body { padding: 18px 22px; }
  .modal-footer { padding: 14px 22px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid rgba(200,168,75,0.15); flex-wrap: wrap; }
  .modal-close { background: none; border: none; cursor: pointer; font-size: 1rem; color: var(--ink-mid); }

  .field-label { font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--forest); margin-bottom: 5px; }
  .field-value { font-size: 0.85rem; color: var(--ink-mid); margin-bottom: 12px; }

  /* ── BUTTONS ── */
  .btn {
    padding: 7px 14px; border-radius: 6px; border: none; cursor: pointer;
    font-family: 'DM Mono', monospace; font-size: 0.7rem;
    letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.2s;
  }
  .btn-primary { background: var(--forest); color: var(--cream); }
  .btn-primary:hover { background: var(--forest-mid); }
  .btn-gold { background: var(--gold); color: var(--forest); font-weight: 600; }
  .btn-gold:hover { background: var(--gold-light); }
  .btn-libby { background: #0c3a6b; color: white; }
  .btn-libby:hover { background: #0e4a8a; }
  .btn-outline { background: transparent; border: 1px solid rgba(26,58,42,0.28); color: var(--forest); }
  .btn-outline:hover { background: rgba(26,58,42,0.06); }
  .btn-sm { padding: 4px 9px; font-size: 0.62rem; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.28); border-radius: 3px; }

  .sidebar-footer {
    padding: 12px 14px;
    margin-top: auto;
  }

  .sidebar-footer-text {
    font-family: 'DM Mono', monospace;
    font-size: 0.54rem;
    color: rgba(122,171,138,0.4);
    letter-spacing: 0.06em;
    line-height: 1.7;
  }

  /* ── ACCESSIBILITY TOGGLE ── */
  .a11y-toggle {
    display: flex; align-items: center; gap: 8px;
    padding: 7px 8px;
    border-radius: 5px;
    cursor: pointer;
    color: rgba(200,220,210,0.5);
    font-size: 0.7rem;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.06em;
    transition: all 0.15s;
    margin-top: 4px;
  }
  .a11y-toggle:hover { background: rgba(255,255,255,0.05); color: var(--sage); }
`;

// ── DATA ──
const BOOKS = [
  { id: 1, title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", available: true, emoji: "📖", color: ["#2d4a8a","#1a2d5a"], year: 2007, pages: 662 },
  { id: 2, title: "Pachinko", author: "Min Jin Lee", genre: "Literary", available: false, emoji: "🌸", color: ["#8a4a2d","#5a2d1a"], year: 2017, pages: 485 },
  { id: 3, title: "Project Hail Mary", author: "Andy Weir", genre: "Sci-Fi", available: true, emoji: "🚀", color: ["#1a4a3a","#0f2d24"], year: 2021, pages: 476 },
  { id: 4, title: "Lessons in Chemistry", author: "Bonnie Garmus", genre: "Fiction", available: true, emoji: "⚗️", color: ["#5a3a8a","#3a2060"], year: 2022, pages: 390 },
  { id: 5, title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", available: false, emoji: "🌙", color: ["#1a3a5a","#0f2040"], year: 2020, pages: 304 },
  { id: 6, title: "Tomorrow, and Tomorrow", author: "Gabrielle Zevin", genre: "Literary", available: true, emoji: "🎮", color: ["#3a5a2a","#223614"], year: 2022, pages: 416 },
  { id: 7, title: "A Memory Called Empire", author: "Arkady Martine", genre: "Sci-Fi", available: true, emoji: "🏛️", color: ["#4a2a5a","#2d1a3a"], year: 2019, pages: 462 },
  { id: 8, title: "The Poppy War", author: "R.F. Kuang", genre: "Fantasy", available: false, emoji: "🌺", color: ["#8a2a2a","#5a1a1a"], year: 2018, pages: 530 },
];

const SEASONAL_SHELF = {
  label: "Staff Picks",
  name: "February Reads",
  books: [
    { title: "Piranesi", emoji: "🏛️", color: ["#8a7a2d","#5a501a"] },
    { title: "Giovanni's Room", emoji: "🗼", color: ["#2d5a8a","#1a3560"] },
    { title: "Crying in H Mart", emoji: "🍜", color: ["#8a3a2d","#5a2010"] },
    { title: "Detransition, Baby", emoji: "🌷", color: ["#5a2a7a","#3a1050"] },
    { title: "Mexican Gothic", emoji: "🌹", color: ["#2a5a3a","#183324"] },
    { title: "The Echo Wife", emoji: "🧬", color: ["#2a5a6a","#163844"] },
    { title: "Anxious People", emoji: "🏠", color: ["#6a5a2a","#433a14"] },
    { title: "Cloud Cuckoo Land", emoji: "☁️", color: ["#2a4a7a","#162e50"] },
  ]
};

const BRANCHES = [
  { name: "Main Street Branch", active: true },
  { name: "Eastside Library", active: false },
  { name: "Central Digital Hub", active: false },
];

const STREAK_MONTHS = ["S", "O", "N", "D", "J", "F"];
const STREAK_ACTIVE = [true, true, true, true, true, false];

// ─ Currently reading book for topbar
const CURRENT_BOOK = {
  title: "Cloud Atlas",
  author: "David Mitchell",
  due: "Feb 22",
  dueStatus: "ok",
  readPct: 62,
};

// ── BOOK COVER ──
function BookCover({ book, height = 100 }) {
  return (
    <div style={{
      background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})`,
      height,
      width: "100%",
      display: "flex", alignItems: "flex-end", padding: 7,
      position: "relative",
    }}>
      <div className="book-spine-shadow" />
      <span className="book-cover-emoji">{book.emoji}</span>
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
        <span>🔍</span>
        <span className="card-title">Catalogue Browser</span>
        {filtered.length < BOOKS.length && (
          <span style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "var(--sage)" }}>
            {filtered.length} results
          </span>
        )}
      </div>
      <div className="card-body">
        <div className="search-bar">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search title, author, ISBN…" />
          <button>Search</button>
        </div>
        <div className="filter-chips">
          {genres.map(g => (
            <button key={g} className={`chip ${activeGenre === g ? "active" : ""}`} onClick={() => setActiveGenre(g)}>{g}</button>
          ))}
        </div>
        <div className="book-grid">
          {filtered.map(book => (
            <div key={book.id} className="book-card" onClick={() => setSelectedBook(book)}>
              <div className="book-cover-art" style={{ background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})` }}>
                <div className="book-spine-shadow" />
                <span className="book-cover-emoji">{book.emoji}</span>
              </div>
              <div className="book-meta">
                <div className="book-title-sm">{book.title}</div>
                <div className="book-author-sm">{book.author}</div>
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
              <div className="field-label">Genre · Year · Pages</div>
              <div className="field-value">{selectedBook.genre} · {selectedBook.year} · {selectedBook.pages} pages</div>
              <div className="field-label">Availability</div>
              <div className="field-value" style={{ color: selectedBook.available ? "#2e7d52" : "#8b3a3a" }}>
                {selectedBook.available ? "✓ Available — ready for checkout" : "⏸ Checked out — place a hold?"}
              </div>

              {/* Affiliate link example */}
              <div className="bookshop-cta">
                <span style={{ fontSize: "0.85rem" }}>📖</span>
                <span className="bookshop-cta-text">Buy a copy · Bookshop.org supports indie stores</span>
                <span style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--sage)" }}>affiliate ↗</span>
              </div>

              {checkoutDone && (
                <div style={{ textAlign: "center", color: "#2e7d52", fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", padding: "10px 0" }}>
                  ✓ Checkout confirmed! Enjoy your read.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedBook(null)}>Cancel</button>
              <button className="btn btn-libby">Read with Libby ↗</button>
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

// ── MAIN APP ──
export default function App() {
  const [activePanel, setActivePanel] = useState("search");
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [activeBranch, setActiveBranch] = useState(0);
  const [readPct] = useState(CURRENT_BOOK.readPct);

  const PANELS = [
    { id: "search",   label: "Catalogue",   icon: "🔍" },
    { id: "loans",    label: "My Loans",    icon: "📚", badge: "!" },
    { id: "history",  label: "History",     icon: "📜" },
    { id: "club",     label: "Book Club",   icon: "💬" },
    { id: "notifs",   label: "Alerts",      icon: "🔔", badge: "3" },
    { id: "stats",    label: "Reading Stats", icon: "📊" },
  ];

  return (
    <>
      <style>{style}</style>
      <div className="app-bg" />

      {/* ── TOP BAR ── */}
      <div className="topbar">
        <div className="topbar-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round"/>
          </svg>
          LibraryLink
        </div>
        <div className="topbar-tagline">Main Street Branch</div>

        {/* ── CURRENTLY READING BANNER ── */}
        <div className="now-reading-bar" title="Currently checked out · click to manage">
          <span className="now-reading-label">Now Reading</span>
          <div className="now-reading-divider" />
          <span className="now-reading-title">{CURRENT_BOOK.title}</span>
          <div className="now-reading-progress">
            <div className="now-reading-progress-fill" style={{ width: `${readPct}%` }} />
          </div>
          <span className={`now-reading-due ${CURRENT_BOOK.dueStatus}`}>
            Due {CURRENT_BOOK.due}
          </span>
        </div>

        <div className="topbar-right">
          <button className={`toggle-btn ${leftOpen ? "active" : ""}`} onClick={() => setLeftOpen(v => !v)}>◀ Nav</button>
          <button className={`toggle-btn ${rightOpen ? "active" : ""}`} onClick={() => setRightOpen(v => !v)}>Account ▶</button>
          <div className="topbar-user">
            <div className="topbar-avatar">AJ</div>
            <div className="topbar-user-name">Alex J.</div>
          </div>
        </div>
      </div>

      {/* ── PANEL HOST ── */}
      <div className="panel-host">

        {/* ── LEFT SIDEBAR ── */}
        <div className={`sidebar ${leftOpen ? "" : "collapsed"}`}>
          <div className="sidebar-section">
            <div className="sidebar-label">Modules</div>
            {PANELS.map(p => (
              <div key={p.id} className={`nav-item ${activePanel === p.id ? "active" : ""}`} onClick={() => setActivePanel(p.id)}>
                <span style={{ fontSize: "0.9rem" }}>{p.icon}</span>
                {p.label}
                {p.badge && (
                  <span className="nav-badge" style={{ background: p.badge === "!" ? "var(--warm-red)" : "#2c5f42" }}>
                    {p.badge}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* ── BRANCH SELECTOR ── */}
          <div className="branch-selector">
            <div className="sidebar-label">My Libraries</div>
            {BRANCHES.map((b, i) => (
              <div key={b.name} className={`branch-item ${activeBranch === i ? "active" : ""}`} onClick={() => setActiveBranch(i)}>
                <div className={`branch-dot ${activeBranch === i ? "branch-dot-active" : "branch-dot-inactive"}`} />
                {b.name}
              </div>
            ))}
          </div>

          {/* ── READING STREAK ── */}
          <div className="streak-widget">
            <div className="streak-inner">
              <div className="streak-flame">🔥</div>
              <div className="streak-count">5</div>
              <div className="streak-label">Month Streak</div>
              <div className="streak-months">
                {STREAK_ACTIVE.map((active, i) => (
                  <div key={i} className={`streak-pip ${active ? "streak-pip-active" : "streak-pip-inactive"}`} />
                ))}
              </div>
              <div className="streak-month-row">
                {STREAK_MONTHS.map((m, i) => (
                  <span key={i} className="streak-month-label">{m}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className="a11y-toggle" title="Accessibility options">
              <span>♿</span> Accessibility
            </div>
            <div className="sidebar-footer-text">
              LibraryLink v1.0<br />
              Evergreen API · Vercel
            </div>
          </div>
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="panel-main">

          {/* ── SEASONAL SHELF ── */}
          <div className="seasonal-shelf">
            <div className="seasonal-shelf-header">
              <span style={{ fontSize: "1rem" }}>🌿</span>
              <span className="seasonal-shelf-label">Staff Picks</span>
              <span style={{ margin: "0 6px", color: "rgba(200,168,75,0.3)", fontSize: "0.7rem" }}>·</span>
              <span className="seasonal-shelf-name">February Reads</span>
              <span style={{
                marginLeft: "auto",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.58rem",
                color: "var(--sage)",
                cursor: "pointer",
                opacity: 0.6
              }}>View all →</span>
            </div>
            <div className="seasonal-shelf-scroll">
              {SEASONAL_SHELF.books.map((book, i) => (
                <div key={i} className="shelf-book">
                  <div className="shelf-book-cover" style={{ background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})` }}>
                    <div className="shelf-book-spine" />
                    <span className="shelf-book-emoji">{book.emoji}</span>
                  </div>
                  <div className="shelf-book-title">{book.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── CONTENT CARD ── */}
          <div className="main-content">
            <div className="card">
              <SearchPanel />
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR — ACCOUNT ── */}
        <div className={`sidebar sidebar-right ${rightOpen ? "" : "collapsed"}`}>
          <div className="account-panel">
            <div className="account-avatar-wrap">
              <div className="account-avatar">AJ</div>
              <div className="account-name">Alex Johnson</div>
              <div className="account-card-num">Card #78234-B · Main Street</div>
            </div>

            <div className="account-status-box">
              <div className="sidebar-label">Account Status</div>
              <div className="account-status-row">
                <span>Fine balance</span>
                <span style={{ color: "#e09090" }}>$0.60</span>
              </div>
              <div className="account-status-row">
                <span>Books out</span>
                <span style={{ color: "var(--gold-light)" }}>3 / 10</span>
              </div>
              <div className="account-status-row">
                <span>Holds ready</span>
                <span style={{ color: "#7aab8a" }}>1 pickup</span>
              </div>
              <div className="account-status-row" style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid rgba(200,168,75,0.15)" }}>
                <span>Home branch</span>
                <span>Main St.</span>
              </div>
            </div>

            <div className="sidebar-label">Reading This Year</div>
            <div style={{
              display: "flex", gap: 8, marginBottom: 16
            }}>
              {[["23", "Books '24"], ["4.3", "Avg ★"]].map(([n, l]) => (
                <div key={l} style={{
                  flex: 1,
                  background: "linear-gradient(135deg, var(--forest), var(--forest-mid))",
                  borderRadius: 8, padding: "11px 12px",
                }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--gold-light)", lineHeight: 1, marginBottom: 3 }}>{n}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(200,220,210,0.65)" }}>{l}</div>
                </div>
              ))}
            </div>

            <div className="sidebar-label">By Genre</div>
            {[["Fiction", 45], ["Literary", 30], ["Sci-Fi", 15], ["Fantasy", 10]].map(([g, pct]) => (
              <div key={g} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 3 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", color: "rgba(200,220,210,0.7)" }}>{g}</span>
                  <span style={{ color: "var(--sage)", fontFamily: "'DM Mono', monospace", fontSize: "0.62rem" }}>{pct}%</span>
                </div>
                <div style={{ height: 4, background: "rgba(200,168,75,0.1)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, var(--forest-mid), var(--gold))", borderRadius: 2 }} />
                </div>
              </div>
            ))}

            <div style={{ marginTop: 14 }}>
              <div className="sidebar-label">Book Club</div>
              <div style={{
                background: "rgba(200,168,75,0.07)",
                border: "1px solid rgba(200,168,75,0.18)",
                borderRadius: 7, padding: "10px 11px",
              }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.82rem", color: "var(--cream)", marginBottom: 4 }}>
                  The Name of the Wind
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "var(--sage)", lineHeight: 1.6 }}>
                  Ch 1–20 · Thu Feb 20, 7pm<br />
                  Community Room B
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
