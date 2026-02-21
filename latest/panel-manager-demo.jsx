// ═══════════════════════════════════════════════════════════════════════════
//  LIBRARYLINK — PanelManager Architecture Demo
//  Shows: PanelShell → PanelContent → Module composition
//  Shows: Universe 1 (Shell State) vs Universe 2 (Data State) separation
//  Shows: Template loading, freeform drag, snap zones, context injection
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useReducer, useContext, createContext, useRef, useCallback, useEffect, useId } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  UNIVERSE 1: SHELL STATE
//  Lives here. Never touches library data. Persists to localStorage.
//  This is the load-bearing architecture piece.
// ─────────────────────────────────────────────────────────────────────────────

const SNAP_ZONES = {
  "top-left":     { x: 16,  y: 72,  w: 280, h: 320, label: "Top Left" },
  "top-right":    { x: 724, y: 72,  w: 280, h: 320, label: "Top Right" },
  "bottom-left":  { x: 16,  y: 420, w: 280, h: 240, label: "Bottom Left" },
  "bottom-right": { x: 724, y: 420, w: 280, h: 240, label: "Bottom Right" },
  "center":       { x: 312, y: 72,  w: 396, h: 588, label: "Center" },
};

const SNAP_GRAVITY = 80; // px — how close before attraction kicks in

// ── Shell State Shape ──────────────────────────────────────────────────────
// This is the COMPLETE definition of Universe 1.
// Note: NO book data, NO API calls, NO library-specific content.
const initialShellState = {
  panels: {
    "search":  { id: "search",  zone: "center",       x: 312, y: 72,  w: 396, h: 588, open: true,  minimized: false, zIndex: 10 },
    "loans":   { id: "loans",   zone: "top-left",     x: 16,  y: 72,  w: 280, h: 320, open: true,  minimized: false, zIndex: 10 },
    "notifs":  { id: "notifs",  zone: "top-right",    x: 724, y: 72,  w: 280, h: 320, open: true,  minimized: false, zIndex: 10 },
    "streak":  { id: "streak",  zone: "bottom-left",  x: 16,  y: 420, w: 280, h: 240, open: true,  minimized: false, zIndex: 10 },
    "account": { id: "account", zone: "bottom-right", x: 724, y: 420, w: 280, h: 240, open: true,  minimized: false, zIndex: 10 },
  },
  activeTemplate: "default",
  topZ: 10,
};

// ── Shell Reducer ──────────────────────────────────────────────────────────
// Every mutation to Universe 1 goes through here. Clean, testable, serializable.
function shellReducer(state, action) {
  switch (action.type) {

    case "MOVE_PANEL": {
      // During drag: update position continuously (called from drag handler)
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.id]: { ...state.panels[action.id], x: action.x, y: action.y, zone: null }
        }
      };
    }

    case "SNAP_PANEL": {
      // On drop: snap to nearest zone (or stay freeform if none close enough)
      const zone = action.zone ? SNAP_ZONES[action.zone] : null;
      return {
        ...state,
        panels: {
          ...state.panels,
          [action.id]: {
            ...state.panels[action.id],
            zone: action.zone,
            x: zone ? zone.x : action.x,
            y: zone ? zone.y : action.y,
            w: zone ? zone.w : state.panels[action.id].w,
            h: zone ? zone.h : state.panels[action.id].h,
          }
        }
      };
    }

    case "RAISE_PANEL": {
      const newZ = state.topZ + 1;
      return {
        ...state,
        topZ: newZ,
        panels: { ...state.panels, [action.id]: { ...state.panels[action.id], zIndex: newZ } }
      };
    }

    case "MINIMIZE_PANEL": {
      return {
        ...state,
        panels: { ...state.panels, [action.id]: { ...state.panels[action.id], minimized: !state.panels[action.id].minimized } }
      };
    }

    case "CLOSE_PANEL": {
      return {
        ...state,
        panels: { ...state.panels, [action.id]: { ...state.panels[action.id], open: false } }
      };
    }

    case "OPEN_PANEL": {
      const newZ2 = state.topZ + 1;
      return {
        ...state,
        topZ: newZ2,
        panels: { ...state.panels, [action.id]: { ...state.panels[action.id], open: true, minimized: false, zIndex: newZ2 } }
      };
    }

    case "LOAD_TEMPLATE": {
      // ← THIS is the answer to "can you swap contexts / templates?"
      // You replace the entire panels map atomically. React sees new references,
      // re-renders everything, panels animate to new positions.
      // The modules inside don't know or care — Universe 2 is untouched.
      return {
        ...action.template,
        topZ: state.topZ + Object.keys(action.template.panels).length,
      };
    }

    default: return state;
  }
}

// ── Shell Context ──────────────────────────────────────────────────────────
const ShellContext = createContext(null);

function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be inside ShellProvider");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
//  UNIVERSE 2: LIBRARY DATA STATE
//  Completely separate. Shell doesn't import anything from here.
//  In production this would be fetched from the ILS API.
// ─────────────────────────────────────────────────────────────────────────────

const LibraryDataContext = createContext(null);

const MOCK_DATA = {
  patron: { name: "Alex Johnson", card: "78234-B", fines: 0.60, booksOut: 3, maxBooks: 10 },
  loans: [
    { id: 1, title: "Cloud Atlas",   author: "David Mitchell",  due: "Feb 22", status: "ok",   emoji: "☁️", color: ["#2d5a8a","#1a3560"] },
    { id: 2, title: "Piranesi",      author: "Susanna Clarke",  due: "Feb 18", status: "warn", emoji: "🏛️", color: ["#8a7a2d","#5a501a"] },
    { id: 3, title: "Bewilderment",  author: "R. Powers",       due: "Feb 12", status: "late", emoji: "🌿", color: ["#2d8a4a","#1a5a30"] },
  ],
  notifs: [
    { id: 1, text: "Piranesi due tomorrow!", time: "2h ago", read: false, type: "due" },
    { id: 2, text: "Hold on Midnight Library ready for pickup.", time: "5h ago", read: false, type: "hold" },
    { id: 3, text: "Bewilderment 6 days overdue. Fine: $0.60.", time: "1d ago", read: false, type: "fine" },
    { id: 4, text: "Book club Thursday 7pm.", time: "2d ago", read: true, type: "club" },
  ],
  streak: { months: 5, history: [true,true,true,true,true,false], labels: ["S","O","N","D","J","F"] },
  books: [
    { id: 1, title: "The Name of the Wind", author: "Patrick Rothfuss", genre: "Fantasy", available: true,  emoji: "📖", color: ["#2d4a8a","#1a2d5a"] },
    { id: 2, title: "Pachinko",             author: "Min Jin Lee",       genre: "Literary",available: false, emoji: "🌸", color: ["#8a4a2d","#5a2d1a"] },
    { id: 3, title: "Project Hail Mary",    author: "Andy Weir",         genre: "Sci-Fi",  available: true,  emoji: "🚀", color: ["#1a4a3a","#0f2d24"] },
    { id: 4, title: "Lessons in Chemistry", author: "B. Garmus",         genre: "Fiction", available: true,  emoji: "⚗️", color: ["#5a3a8a","#3a2060"] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL CONTEXT — the "opt-in awareness" layer
//  Modules can call usePanel() to get capabilities from their container.
//  Modules that don't call it are completely unaware they're in a panel.
// ─────────────────────────────────────────────────────────────────────────────

const PanelContext = createContext(null);

// This hook is what a module calls if it wants to talk to its panel.
// Optional — modules that don't call it just render normally.
function usePanel() {
  return useContext(PanelContext); // returns null if not in a panel — that's fine
}

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 1: PanelShell
//  Handles: position, drag, resize, z-index, open/close animation
//  Knows: where it is on screen, its own ID
//  Does NOT know: what's inside it
// ─────────────────────────────────────────────────────────────────────────────

function PanelShell({ id, children }) {
  const { state, dispatch } = useShell();
  const panel = state.panels[id];
  const dragRef = useRef(null);
  const startRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState(null);
  const [nearZone, setNearZone] = useState(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest("[data-no-drag]")) return;
    e.preventDefault();
    dispatch({ type: "RAISE_PANEL", id });
    startRef.current = { mx: e.clientX, my: e.clientY, px: panel.x, py: panel.y };
    setIsDragging(true);
    setDragPos({ x: panel.x, y: panel.y });
  }, [panel, id, dispatch]);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e) => {
      const dx = e.clientX - startRef.current.mx;
      const dy = e.clientY - startRef.current.my;
      const nx = startRef.current.px + dx;
      const ny = startRef.current.py + dy;
      setDragPos({ x: nx, y: ny });

      // Calculate snap gravity — find nearest zone center
      let nearest = null, nearestDist = Infinity;
      for (const [zoneName, zone] of Object.entries(SNAP_ZONES)) {
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;
        const pcx = nx + panel.w / 2;
        const pcy = ny + panel.h / 2;
        const dist = Math.hypot(cx - pcx, cy - pcy);
        if (dist < nearestDist) { nearestDist = dist; nearest = zoneName; }
      }
      setNearZone(nearestDist < SNAP_GRAVITY * 2 ? nearest : null);
    };

    const onUp = (e) => {
      const dx = e.clientX - startRef.current.mx;
      const dy = e.clientY - startRef.current.my;
      const nx = startRef.current.px + dx;
      const ny = startRef.current.py + dy;

      // Find closest snap zone within gravity radius
      let snapZone = null, snapDist = Infinity;
      for (const [zoneName, zone] of Object.entries(SNAP_ZONES)) {
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2;
        const pcx = nx + panel.w / 2;
        const pcy = ny + panel.h / 2;
        const dist = Math.hypot(cx - pcx, cy - pcy);
        if (dist < SNAP_GRAVITY * 2.5 && dist < snapDist) { snapDist = dist; snapZone = zoneName; }
      }
      dispatch({ type: "SNAP_PANEL", id, zone: snapZone, x: nx, y: ny });
      setIsDragging(false);
      setDragPos(null);
      setNearZone(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging, id, panel.w, panel.h, dispatch]);

  if (!panel?.open) return null;

  const pos = isDragging && dragPos ? dragPos : { x: panel.x, y: panel.y };
  const w = panel.w;
  const h = panel.minimized ? 40 : panel.h;

  // PanelContext value — what modules can access via usePanel()
  const panelCtxValue = {
    panelId: id,
    dimensions: { w, h: panel.h },
    minimized: panel.minimized,
    minimize: () => dispatch({ type: "MINIMIZE_PANEL", id }),
    close: () => dispatch({ type: "CLOSE_PANEL", id }),
    isInZone: !!panel.zone,
    zone: panel.zone,
  };

  return (
    <PanelContext.Provider value={panelCtxValue}>
      <div
        ref={dragRef}
        style={{
          position: "absolute",
          left: pos.x,
          top: pos.y,
          width: w,
          height: h,
          zIndex: panel.zIndex,
          transition: isDragging ? "none" : "left 0.35s cubic-bezier(.34,1.56,.64,1), top 0.35s cubic-bezier(.34,1.56,.64,1), width 0.3s ease, height 0.3s ease",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: isDragging
            ? "0 24px 60px rgba(0,0,0,0.4), 0 0 0 2px rgba(200,168,75,0.6)"
            : nearZone
              ? "0 8px 32px rgba(0,0,0,0.25), 0 0 0 2px rgba(200,168,75,0.35)"
              : "0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(200,168,75,0.15)",
          transform: isDragging ? "scale(1.02) rotate(0.5deg)" : "scale(1) rotate(0deg)",
          background: "rgba(245,240,232,0.97)",
          cursor: isDragging ? "grabbing" : "default",
          userSelect: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title bar — the drag handle */}
        <div
          onMouseDown={onMouseDown}
          style={{
            height: 40,
            background: "linear-gradient(90deg, #1a3a2a, #2c5f42)",
            display: "flex", alignItems: "center",
            padding: "0 10px", gap: 8,
            cursor: isDragging ? "grabbing" : "grab",
            flexShrink: 0,
            borderBottom: "1px solid rgba(200,168,75,0.2)",
          }}
        >
          {/* Drag indicator dots */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2, opacity: 0.4 }}>
            {[0,1,2].map(r => (
              <div key={r} style={{ display: "flex", gap: 2 }}>
                {[0,1].map(c => <div key={c} style={{ width: 2, height: 2, borderRadius: "50%", background: "#c8a84b" }} />)}
              </div>
            ))}
          </div>

          {children[0] /* ← PanelContent passes title as first child */}

          {/* Controls — data-no-drag prevents drag when clicking buttons */}
          <div data-no-drag="true" style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button onClick={() => dispatch({ type: "MINIMIZE_PANEL", id })}
              style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "#c8a84b", cursor: "pointer", fontSize: "0.6rem", color: "#1a3a2a", fontWeight: 700 }}>
              {panel.minimized ? "+" : "−"}
            </button>
            <button onClick={() => dispatch({ type: "CLOSE_PANEL", id })}
              style={{ width: 18, height: 18, borderRadius: "50%", border: "none", background: "#8b3a3a", cursor: "pointer", fontSize: "0.6rem", color: "white", fontWeight: 700 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Content area — only shown when not minimized */}
        {!panel.minimized && (
          <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
            {children[1] /* ← the actual module content */}
          </div>
        )}
      </div>
    </PanelContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 2: PanelContent
//  Handles: title, icon, internal layout, scroll context
//  Sits between PanelShell and the Module
//  This is what you configure per-panel — not the shell, not the module
// ─────────────────────────────────────────────────────────────────────────────

function PanelContent({ title, icon, children, noPadding = false }) {
  return (
    <>
      {/* Slot 0: title bar content (goes into PanelShell's title bar) */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: "0.95rem" }}>{icon}</span>
        <span style={{
          fontFamily: "'Georgia', serif",
          fontSize: "0.82rem",
          color: "rgba(245,240,232,0.9)",
          letterSpacing: "0.01em",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
        }}>{title}</span>
      </div>

      {/* Slot 1: module content */}
      <div style={{ padding: noPadding ? 0 : "14px 14px", height: "100%" }}>
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 3: MODULES
//  These are completely unaware of panels, drag, or layout.
//  They just render. Universe 2 data flows in through LibraryDataContext.
//  They can OPTIONALLY call usePanel() to get container capabilities.
// ─────────────────────────────────────────────────────────────────────────────

// ── Module: Loans ──────────────────────────────────────────────────────────
function LoansModule() {
  const data = useContext(LibraryDataContext);
  const panel = usePanel(); // Optional — this module uses it to know its dimensions

  // Example of panel-aware behavior: compact view when panel is small
  const compact = panel?.dimensions?.w < 260;

  return (
    <div>
      {/* Universe 2 data renders here, no knowledge of shell state */}
      {data.loans.map(loan => (
        <div key={loan.id} style={{
          display: "flex", gap: 10, padding: "9px 0",
          borderBottom: "1px solid rgba(200,168,75,0.12)",
          alignItems: "center",
        }}>
          <div style={{
            width: compact ? 28 : 36, height: compact ? 38 : 48,
            background: `linear-gradient(160deg, ${loan.color[0]}, ${loan.color[1]})`,
            borderRadius: 3, display: "flex", alignItems: "flex-end",
            padding: 3, flexShrink: 0, fontSize: compact ? "0.8rem" : "1rem"
          }}>{loan.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: compact ? "0.72rem" : "0.8rem", marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loan.title}</div>
            {!compact && <div style={{ fontSize: "0.66rem", color: "#666", fontStyle: "italic" }}>{loan.author}</div>}
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: "0.62rem", padding: "2px 6px", borderRadius: 3, flexShrink: 0,
            background: loan.status === "ok" ? "rgba(46,125,82,0.1)" : loan.status === "warn" ? "rgba(200,168,75,0.15)" : "rgba(139,58,58,0.12)",
            color: loan.status === "ok" ? "#2e7d52" : loan.status === "warn" ? "#8a6a00" : "#8b3a3a",
          }}>
            {loan.status === "late" ? "⚠ " : ""}Due {loan.due}
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: "0.62rem", color: "#7aab8a" }}>
        {data.patron.booksOut} / {data.patron.maxBooks} books out
        {data.patron.fines > 0 && <span style={{ color: "#e09090", marginLeft: 10 }}>Fine: ${data.patron.fines.toFixed(2)}</span>}
      </div>
    </div>
  );
}

// ── Module: Notifications ───────────────────────────────────────────────────
function NotifsModule() {
  const data = useContext(LibraryDataContext);
  const [notifs, setNotifs] = useState(data.notifs);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div>
      {unread > 0 && (
        <button onClick={() => setNotifs(prev => prev.map(n => ({ ...n, read: true })))}
          data-no-drag="true"
          style={{ marginBottom: 10, fontFamily: "monospace", fontSize: "0.62rem", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(26,58,42,0.2)", background: "transparent", cursor: "pointer", color: "#2c5f42" }}>
          Mark all read ({unread})
        </button>
      )}
      {notifs.map(n => (
        <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
          style={{ display: "flex", gap: 9, padding: "8px 0", borderBottom: "1px solid rgba(200,168,75,0.1)", cursor: "pointer", alignItems: "flex-start" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 4, flexShrink: 0, background: n.read ? "rgba(0,0,0,0.15)" : "#c8a84b" }} />
          <div>
            <div style={{ fontSize: "0.78rem", color: "#3d3d38", fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.text}</div>
            <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(0,0,0,0.35)", marginTop: 2 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Module: Streak ──────────────────────────────────────────────────────────
function StreakModule() {
  const data = useContext(LibraryDataContext);
  const { streak } = data;

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.8rem", marginBottom: 4 }}>🔥</div>
      <div style={{ fontFamily: "'Georgia', serif", fontSize: "2rem", color: "#c8a84b", lineHeight: 1, marginBottom: 2 }}>{streak.months}</div>
      <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#7aab8a", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Month Reading Streak</div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 4 }}>
        {streak.history.map((active, i) => (
          <div key={i} style={{ width: 22, height: 5, borderRadius: 2, background: active ? "#c8a84b" : "rgba(200,168,75,0.15)" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
        {streak.labels.map((l, i) => (
          <div key={i} style={{ width: 22, fontFamily: "monospace", fontSize: "0.52rem", color: "rgba(122,171,138,0.5)", textAlign: "center" }}>{l}</div>
        ))}
      </div>
      <div style={{ marginTop: 14, padding: "8px 10px", background: "rgba(26,58,42,0.06)", borderRadius: 6, fontSize: "0.72rem", color: "#3d3d38", fontStyle: "italic" }}>
        "You've read every month since September!"
      </div>
    </div>
  );
}

// ── Module: Search (simplified) ────────────────────────────────────────────
function SearchModule() {
  const data = useContext(LibraryDataContext);
  const panel = usePanel();
  const [q, setQ] = useState("");

  const filtered = data.books.filter(b =>
    b.title.toLowerCase().includes(q.toLowerCase()) || b.author.toLowerCase().includes(q.toLowerCase())
  );

  // Panel-aware: use grid or list based on panel width
  const useGrid = panel?.dimensions?.w > 300;

  return (
    <div>
      <div style={{ display: "flex", background: "white", border: "1.5px solid rgba(26,58,42,0.2)", borderRadius: 7, overflow: "hidden", marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, author…"
          data-no-drag="true"
          style={{ flex: 1, border: "none", outline: "none", padding: "8px 12px", fontFamily: "'Georgia', serif", fontSize: "0.85rem" }} />
        <div style={{ padding: "8px 12px", background: "#1a3a2a", color: "#f5f0e8", fontFamily: "monospace", fontSize: "0.7rem", display: "flex", alignItems: "center" }}>
          Search
        </div>
      </div>
      <div style={{
        display: useGrid ? "grid" : "flex",
        gridTemplateColumns: useGrid ? "repeat(auto-fill, minmax(110px, 1fr))" : undefined,
        flexDirection: useGrid ? undefined : "column",
        gap: 10
      }}>
        {filtered.map(book => (
          <div key={book.id} style={{
            background: "white", borderRadius: 7,
            border: "1px solid rgba(26,58,42,0.1)",
            overflow: "hidden", cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 16px rgba(26,58,42,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            {useGrid ? (
              <>
                <div style={{ height: 80, background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})`, display: "flex", alignItems: "flex-end", padding: 6, fontSize: "1.2rem" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, background: "rgba(0,0,0,0.2)" }} />
                  {book.emoji}
                </div>
                <div style={{ padding: "6px 8px" }}>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: "0.68rem", marginBottom: 2, lineHeight: 1.3 }}>{book.title}</div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: book.available ? "#2e7d52" : "#8b3a3a" }}>
                    {book.available ? "● Available" : "○ Checked Out"}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", gap: 10, padding: 8, alignItems: "center" }}>
                <div style={{ width: 32, height: 44, background: `linear-gradient(160deg, ${book.color[0]}, ${book.color[1]})`, borderRadius: 3, flexShrink: 0, display: "flex", alignItems: "flex-end", padding: 3, fontSize: "0.85rem" }}>{book.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Georgia', serif", fontSize: "0.78rem" }}>{book.title}</div>
                  <div style={{ fontSize: "0.66rem", color: "#666", fontStyle: "italic" }}>{book.author}</div>
                </div>
                <div style={{ fontFamily: "monospace", fontSize: "0.58rem", color: book.available ? "#2e7d52" : "#8b3a3a" }}>{book.available ? "●" : "○"}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Module: Account ──────────────────────────────────────────────────────────
function AccountModule() {
  const data = useContext(LibraryDataContext);
  const { patron } = data;
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 50, height: 50, borderRadius: "50%", margin: "0 auto 10px", background: "linear-gradient(135deg, #2c5f42, #c8a84b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: 700, color: "white", border: "2px solid rgba(200,168,75,0.3)" }}>
        {patron.name.split(" ").map(n => n[0]).join("")}
      </div>
      <div style={{ fontFamily: "'Georgia', serif", fontSize: "0.9rem", marginBottom: 2 }}>{patron.name}</div>
      <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#7aab8a", marginBottom: 14 }}>Card #{patron.card}</div>
      <div style={{ background: "rgba(200,168,75,0.08)", border: "1px solid rgba(200,168,75,0.2)", borderRadius: 7, padding: "10px 12px" }}>
        {[["Books Out", `${patron.booksOut} / ${patron.maxBooks}`], ["Fines", `$${patron.fines.toFixed(2)}`], ["Home Branch", "Main St."]].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#3d3d38", marginBottom: 6 }}>
            <span style={{ color: "#7aab8a", fontFamily: "monospace", fontSize: "0.65rem" }}>{k}</span>
            <span style={{ color: k === "Fines" && patron.fines > 0 ? "#e09090" : "#3d3d38" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATES
//  This is what makes each library's layout unique.
//  Pure JSON — no components, no code. Just configuration.
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = {
  default: {
    name: "Default Layout",
    panels: {
      search:  { id: "search",  zone: "center",       x: 312, y: 72,  w: 396, h: 540, open: true,  minimized: false, zIndex: 10 },
      loans:   { id: "loans",   zone: "top-left",     x: 16,  y: 72,  w: 280, h: 290, open: true,  minimized: false, zIndex: 10 },
      notifs:  { id: "notifs",  zone: "top-right",    x: 724, y: 72,  w: 280, h: 290, open: true,  minimized: false, zIndex: 10 },
      streak:  { id: "streak",  zone: "bottom-left",  x: 16,  y: 390, w: 280, h: 210, open: true,  minimized: false, zIndex: 10 },
      account: { id: "account", zone: "bottom-right", x: 724, y: 390, w: 280, h: 210, open: true,  minimized: false, zIndex: 10 },
    },
    activeTemplate: "default",
    topZ: 10,
  },
  focus: {
    name: "Focus Mode",
    panels: {
      search:  { id: "search",  zone: "center",       x: 160, y: 72,  w: 700, h: 540, open: true,  minimized: false, zIndex: 10 },
      loans:   { id: "loans",   zone: "top-left",     x: 16,  y: 72,  w: 120, h: 80,  open: true,  minimized: true,  zIndex: 9  },
      notifs:  { id: "notifs",  zone: "top-right",    x: 884, y: 72,  w: 120, h: 80,  open: true,  minimized: true,  zIndex: 9  },
      streak:  { id: "streak",  zone: "bottom-left",  x: 16,  y: 380, w: 120, h: 40,  open: false, minimized: false, zIndex: 8  },
      account: { id: "account", zone: "bottom-right", x: 884, y: 380, w: 120, h: 40,  open: false, minimized: false, zIndex: 8  },
    },
    activeTemplate: "focus",
    topZ: 10,
  },
  overview: {
    name: "Overview",
    panels: {
      search:  { id: "search",  zone: "center",       x: 290, y: 72,  w: 440, h: 250, open: true,  minimized: false, zIndex: 10 },
      loans:   { id: "loans",   zone: "top-left",     x: 16,  y: 72,  w: 258, h: 280, open: true,  minimized: false, zIndex: 10 },
      notifs:  { id: "notifs",  zone: "top-right",    x: 750, y: 72,  w: 258, h: 280, open: true,  minimized: false, zIndex: 10 },
      streak:  { id: "streak",  zone: "bottom-left",  x: 16,  y: 370, w: 258, h: 230, open: true,  minimized: false, zIndex: 10 },
      account: { id: "account", zone: "bottom-right", x: 750, y: 370, w: 258, h: 230, open: true,  minimized: false, zIndex: 10 },
    },
    activeTemplate: "overview",
    topZ: 10,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN APP — wires everything together
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [shellState, dispatch] = useReducer(shellReducer, TEMPLATES.default);
  const [showGuide, setShowGuide] = useState(true);

  const shellCtx = { state: shellState, dispatch };

  // Serialize shell state to URL (Innovation #2 from the discussion)
  const serializeToURL = () => {
    const compressed = btoa(JSON.stringify(shellState));
    const url = `${window.location.origin}?layout=${compressed}`;
    navigator.clipboard.writeText(url).catch(() => {});
    alert("Layout URL copied to clipboard!\n\nAnyone with this link sees your exact layout.");
  };

  // PANEL_CONFIG maps panel IDs to their PanelContent + Module combination.
  // This is the "drop any component into a panel" system.
  // Adding a new module = adding one entry here. PanelShell never changes.
  const PANEL_CONFIG = {
    search:  { title: "Catalogue Browser", icon: "🔍", Module: SearchModule },
    loans:   { title: "My Loans",          icon: "📚", Module: LoansModule },
    notifs:  { title: "Notifications",     icon: "🔔", Module: NotifsModule },
    streak:  { title: "Reading Streak",    icon: "🔥", Module: StreakModule },
    account: { title: "Account",           icon: "👤", Module: AccountModule },
  };

  return (
    <LibraryDataContext.Provider value={MOCK_DATA}>
      <ShellContext.Provider value={shellCtx}>
        <div style={{
          width: "100%", height: "100vh", minHeight: 680,
          background: "linear-gradient(160deg, #0f2419 0%, #1a3a2a 40%, #243d30 100%)",
          position: "relative", overflow: "hidden",
          fontFamily: "'Georgia', serif",
        }}>

          {/* Background texture */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='0.5' fill='rgba(200,168,75,0.1)'/%3E%3C/svg%3E\")", backgroundSize: "60px 60px", pointerEvents: "none" }} />

          {/* Snap zone ghost guides — visible while dragging to show where panels will snap */}
          {Object.entries(SNAP_ZONES).map(([name, zone]) => (
            <div key={name} style={{
              position: "absolute",
              left: zone.x, top: zone.y, width: zone.w, height: zone.h,
              border: "1px dashed rgba(200,168,75,0.12)",
              borderRadius: 12,
              pointerEvents: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.55rem", color: "rgba(200,168,75,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{zone.label}</span>
            </div>
          ))}

          {/* ── TOP BAR ── */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 56, zIndex: 1000,
            background: "rgba(15,36,25,0.96)", borderBottom: "1px solid rgba(200,168,75,0.2)",
            backdropFilter: "blur(12px)", display: "flex", alignItems: "center", padding: "0 18px", gap: 12,
          }}>
            <div style={{ fontFamily: "'Georgia', serif", fontSize: "1.1rem", color: "#c8a84b", letterSpacing: "0.02em", flexShrink: 0 }}>
              📚 LibraryLink
            </div>
            <div style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "#7aab8a", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7 }}>
              Panel Architecture Demo
            </div>

            {/* Template switcher */}
            <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.6rem", color: "rgba(122,171,138,0.6)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Template:</span>
              {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                <button key={key}
                  onClick={() => dispatch({ type: "LOAD_TEMPLATE", template: TEMPLATES[key] })}
                  style={{
                    padding: "4px 10px",
                    fontFamily: "monospace", fontSize: "0.62rem", letterSpacing: "0.06em",
                    border: `1px solid ${shellState.activeTemplate === key ? "#c8a84b" : "rgba(200,168,75,0.25)"}`,
                    borderRadius: 4, cursor: "pointer",
                    background: shellState.activeTemplate === key ? "rgba(200,168,75,0.15)" : "transparent",
                    color: shellState.activeTemplate === key ? "#e2c97e" : "#7aab8a",
                    transition: "all 0.2s",
                  }}>
                  {tmpl.name}
                </button>
              ))}

              {/* Re-open closed panels */}
              {Object.values(shellState.panels).filter(p => !p.open).map(p => (
                <button key={p.id}
                  onClick={() => dispatch({ type: "OPEN_PANEL", id: p.id })}
                  style={{ padding: "4px 9px", fontFamily: "monospace", fontSize: "0.6rem", border: "1px solid rgba(139,58,58,0.4)", borderRadius: 4, cursor: "pointer", background: "rgba(139,58,58,0.1)", color: "#e09090" }}>
                  + {PANEL_CONFIG[p.id].title}
                </button>
              ))}

              <button onClick={serializeToURL}
                style={{ padding: "4px 10px", fontFamily: "monospace", fontSize: "0.62rem", border: "1px solid rgba(200,168,75,0.3)", borderRadius: 4, cursor: "pointer", background: "rgba(200,168,75,0.08)", color: "#c8a84b" }}>
                📋 Copy Layout URL
              </button>
            </div>
          </div>

          {/* ── RENDER ALL PANELS ── */}
          {/* This is the key loop: PanelShell wraps PanelContent wraps Module */}
          {Object.keys(PANEL_CONFIG).map(panelId => {
            const { title, icon, Module } = PANEL_CONFIG[panelId];
            return (
              <PanelShell key={panelId} id={panelId}>
                <PanelContent title={title} icon={icon}>
                  <Module />
                </PanelContent>
              </PanelShell>
            );
          })}

          {/* ── ARCHITECTURE GUIDE ── */}
          {showGuide && (
            <div style={{
              position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
              background: "rgba(15,36,25,0.95)", border: "1px solid rgba(200,168,75,0.25)",
              borderRadius: 10, padding: "12px 18px", zIndex: 2000,
              backdropFilter: "blur(8px)", maxWidth: 680, width: "90%",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#c8a84b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Architecture Layer Guide
                </div>
                <button onClick={() => setShowGuide(false)} style={{ border: "none", background: "none", color: "#7aab8a", cursor: "pointer", fontSize: "0.75rem" }}>✕ dismiss</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { layer: "PanelShell", color: "#8a3a2d", desc: "Handles drag, snap, z-index, minimize/close. Knows position, nothing else." },
                  { layer: "PanelContent", color: "#2d4a8a", desc: "Provides title, icon, scroll context. Sits between Shell and Module." },
                  { layer: "Module", color: "#2d8a4a", desc: "Pure content. Reads Universe 2 data. Optionally calls usePanel() for container info." },
                ].map(({ layer, color, desc }) => (
                  <div key={layer} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "9px 10px", borderLeft: `3px solid ${color}` }}>
                    <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: color, marginBottom: 4 }}>{layer}</div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(200,220,210,0.7)", lineHeight: 1.5 }}>{desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontFamily: "monospace", fontSize: "0.62rem", color: "rgba(122,171,138,0.6)", lineHeight: 1.8 }}>
                Try: <span style={{ color: "#c8a84b" }}>drag panels by their title bars</span> · <span style={{ color: "#c8a84b" }}>switch templates</span> (watch state swap atomically) · <span style={{ color: "#c8a84b" }}>close panels</span> and reopen them · <span style={{ color: "#c8a84b" }}>minimize</span> to title bar only
              </div>
            </div>
          )}

        </div>
      </ShellContext.Provider>
    </LibraryDataContext.Provider>
  );
}
