// ═══════════════════════════════════════════════════════════════════════════
//  LIBRARYLINK — PanelManager v2: Snap-to-Fill + Live Resize Context
//
//  NEW in this version:
//  1. ResizeObserver inside PanelShell → pushes live px dimensions to PanelContext
//  2. Modules respond to LIVE container size (not stale state dimensions)
//  3. Snap-to-fill: dropping into a zone animates BOTH position AND size
//  4. Gravity well visualization: zones pulse as you drag near them
//  5. Snap indicator: ghost outline shows where panel will land before you drop
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useReducer, useContext, createContext, useRef,
         useCallback, useEffect, useMemo } from "react";

// ─────────────────────────────────────────────────────────────────────────────
//  SNAP ZONES — the "template regions" of the layout
//  Each zone is an attractor. Panels fly in and fill it on drop.
// ─────────────────────────────────────────────────────────────────────────────

const SNAP_ZONES = {
  "top-left":     { x: 12,  y: 64,  w: 272, h: 300, label: "Top Left"     },
  "top-right":    { x: 740, y: 64,  w: 272, h: 300, label: "Top Right"    },
  "bottom-left":  { x: 12,  y: 376, w: 272, h: 230, label: "Bottom Left"  },
  "bottom-right": { x: 740, y: 376, w: 272, h: 230, label: "Bottom Right" },
  "center":       { x: 296, y: 64,  w: 432, h: 542, label: "Center"       },
};

// How close (px) before gravity kicks in — measured center-to-center
const GRAVITY_THRESHOLD = 160;
const SNAP_THRESHOLD    = 100;

// ─────────────────────────────────────────────────────────────────────────────
//  UNIVERSE 1 — SHELL STATE
// ─────────────────────────────────────────────────────────────────────────────

function shellReducer(state, action) {
  switch (action.type) {

    case "MOVE_PANEL":
      return {
        ...state,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id],
            x: action.x, y: action.y, zone: null
          }
        }
      };

    case "SNAP_PANEL": {
      const zone = action.zone ? SNAP_ZONES[action.zone] : null;
      return {
        ...state,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id],
            zone:   action.zone  ?? null,
            x:      zone ? zone.x : action.x,
            y:      zone ? zone.y : action.y,
            // ← KEY: size takes on zone dimensions when snapping
            w:      zone ? zone.w : state.panels[action.id].w,
            h:      zone ? zone.h : state.panels[action.id].h,
            snapping: !!zone,   // triggers a brief "settle" css class
          }
        }
      };
    }

    case "CLEAR_SNAPPING":
      return {
        ...state,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id], snapping: false }
        }
      };

    case "RAISE_PANEL": {
      const z = state.topZ + 1;
      return { ...state, topZ: z,
        panels: { ...state.panels, [action.id]: { ...state.panels[action.id], zIndex: z } }
      };
    }

    case "MINIMIZE_PANEL":
      return { ...state,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id],
            minimized: !state.panels[action.id].minimized }
        }
      };

    case "CLOSE_PANEL":
      return { ...state,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id], open: false }
        }
      };

    case "OPEN_PANEL": {
      const z2 = state.topZ + 1;
      return { ...state, topZ: z2,
        panels: { ...state.panels,
          [action.id]: { ...state.panels[action.id], open: true, minimized: false, zIndex: z2 }
        }
      };
    }

    case "LOAD_TEMPLATE":
      // Atomic swap of all panel state — modules never notice, data untouched
      return { ...action.template, topZ: state.topZ + 5 };

    default: return state;
  }
}

const ShellCtx = createContext(null);
const useShell = () => useContext(ShellCtx);

// ─────────────────────────────────────────────────────────────────────────────
//  UNIVERSE 2 — LIBRARY DATA (completely separate)
// ─────────────────────────────────────────────────────────────────────────────

const DataCtx = createContext(null);

const MOCK = {
  patron: { name: "Alex Johnson", card: "78234-B", fines: 0.60, out: 3, max: 10 },
  loans: [
    { id:1, title:"Cloud Atlas",   author:"David Mitchell", due:"Feb 22", status:"ok",   emoji:"☁️",  color:["#2d5a8a","#1a3560"] },
    { id:2, title:"Piranesi",      author:"Susanna Clarke", due:"Feb 18", status:"warn", emoji:"🏛️", color:["#8a7a2d","#5a501a"] },
    { id:3, title:"Bewilderment",  author:"R. Powers",      due:"Feb 12", status:"late", emoji:"🌿",  color:["#2d8a4a","#1a5a30"] },
  ],
  notifs: [
    { id:1, text:"Piranesi due tomorrow!",                       time:"2h ago",  read:false },
    { id:2, text:"Hold on Midnight Library ready for pickup.",   time:"5h ago",  read:false },
    { id:3, text:"Bewilderment 6 days overdue. Fine: $0.60.",   time:"1d ago",  read:false },
    { id:4, text:"Book club Thursday 7pm.",                      time:"2d ago",  read:true  },
  ],
  streak: { months:5, history:[true,true,true,true,true,false], labels:["S","O","N","D","J","F"] },
  books: [
    { id:1, title:"The Name of the Wind", author:"Patrick Rothfuss", genre:"Fantasy", available:true,  emoji:"📖", color:["#2d4a8a","#1a2d5a"] },
    { id:2, title:"Pachinko",             author:"Min Jin Lee",       genre:"Literary",available:false, emoji:"🌸", color:["#8a4a2d","#5a2d1a"] },
    { id:3, title:"Project Hail Mary",    author:"Andy Weir",         genre:"Sci-Fi",  available:true,  emoji:"🚀", color:["#1a4a3a","#0f2d24"] },
    { id:4, title:"Lessons in Chemistry", author:"B. Garmus",         genre:"Fiction", available:true,  emoji:"⚗️", color:["#5a3a8a","#3a2060"] },
    { id:5, title:"The Midnight Library", author:"Matt Haig",         genre:"Fiction", available:false, emoji:"🌙", color:["#1a3a5a","#0f2040"] },
    { id:6, title:"Piranesi",             author:"Susanna Clarke",    genre:"Literary",available:true,  emoji:"🏛️",color:["#8a7a2d","#5a501a"] },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  PANEL CONTEXT — live dimensions pushed by ResizeObserver
//  This is what closes the loop between shell resizing and module content
// ─────────────────────────────────────────────────────────────────────────────

const PanelCtx = createContext(null);
const usePanel = () => useContext(PanelCtx);  // returns null outside a panel — fine

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 1: PanelShell
//  The key addition: ResizeObserver on the content area feeds live px dimensions
//  into PanelContext so modules always know their REAL rendered size
// ─────────────────────────────────────────────────────────────────────────────

function PanelShell({ id, children }) {
  const { state, dispatch } = useShell();
  const panel  = state.panels[id];

  // Live rendered dimensions — updated by ResizeObserver, not from state
  const [liveDims, setLiveDims] = useState({ w: panel?.w ?? 280, h: panel?.h ?? 300 });
  const contentRef = useRef(null);
  const dragRef    = useRef(null);
  const startRef   = useRef(null);

  const [isDragging,  setIsDragging]  = useState(false);
  const [dragPos,     setDragPos]     = useState(null);
  const [nearestZone, setNearestZone] = useState(null);  // zone name or null
  const [snapGhost,   setSnapGhost]   = useState(null);  // zone geometry to show ghost

  // ── ResizeObserver: the closed loop ────────────────────────────────────
  // Every time the panel's content area physically changes size in the DOM
  // (CSS transition finishing, manual resize, template swap) → push to context.
  // Modules reading usePanel().dimensions always get the REAL pixel size.
  useEffect(() => {
    if (!contentRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setLiveDims({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  // Clear snapping flag after transition completes
  useEffect(() => {
    if (!panel?.snapping) return;
    const t = setTimeout(() => dispatch({ type: "CLEAR_SNAPPING", id }), 400);
    return () => clearTimeout(t);
  }, [panel?.snapping, id, dispatch]);

  // ── Drag handling ──────────────────────────────────────────────────────
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
      const nx = startRef.current.px + (e.clientX - startRef.current.mx);
      const ny = startRef.current.py + (e.clientY - startRef.current.my);
      setDragPos({ x: nx, y: ny });

      // Find nearest zone and measure distance
      let nearest = null, nearestDist = Infinity;
      for (const [name, zone] of Object.entries(SNAP_ZONES)) {
        const dist = Math.hypot(
          (zone.x + zone.w / 2) - (nx + panel.w / 2),
          (zone.y + zone.h / 2) - (ny + panel.h / 2)
        );
        if (dist < nearestDist) { nearestDist = dist; nearest = name; }
      }

      if (nearestDist < GRAVITY_THRESHOLD) {
        setNearestZone(nearest);
        // Show ghost only when within snap threshold
        setSnapGhost(nearestDist < SNAP_THRESHOLD ? SNAP_ZONES[nearest] : null);
      } else {
        setNearestZone(null);
        setSnapGhost(null);
      }
    };

    const onUp = (e) => {
      const nx = startRef.current.px + (e.clientX - startRef.current.mx);
      const ny = startRef.current.py + (e.clientY - startRef.current.my);

      let snapZone = null, snapDist = Infinity;
      for (const [name, zone] of Object.entries(SNAP_ZONES)) {
        const dist = Math.hypot(
          (zone.x + zone.w / 2) - (nx + panel.w / 2),
          (zone.y + zone.h / 2) - (ny + panel.h / 2)
        );
        if (dist < SNAP_THRESHOLD && dist < snapDist) { snapDist = dist; snapZone = name; }
      }

      dispatch({ type: "SNAP_PANEL", id, zone: snapZone, x: nx, y: ny });
      setIsDragging(false);
      setDragPos(null);
      setNearestZone(null);
      setSnapGhost(null);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, [isDragging, id, panel, dispatch]);

  if (!panel?.open) return null;

  const pos = (isDragging && dragPos) ? dragPos : { x: panel.x, y: panel.y };
  const w   = panel.w;
  const h   = panel.minimized ? 40 : panel.h;

  // Is this panel near a zone? Used for glow effect
  const isNear = isDragging && !!nearestZone;
  const willSnap = isDragging && !!snapGhost;

  // ── PanelContext value uses LIVE dimensions from ResizeObserver ─────────
  const panelCtxValue = useMemo(() => ({
    panelId:   id,
    dimensions: liveDims,          // ← LIVE, not state — ResizeObserver fed
    minimized:  panel.minimized,
    zone:       panel.zone,
    isSnapping: panel.snapping,
    minimize:  () => dispatch({ type: "MINIMIZE_PANEL", id }),
    close:     () => dispatch({ type: "CLOSE_PANEL",    id }),
  }), [id, liveDims, panel.minimized, panel.zone, panel.snapping, dispatch]);

  return (
    <>
      {/* ── Snap ghost: shows target zone outline before drop ── */}
      {willSnap && (
        <div style={{
          position: "absolute",
          left: snapGhost.x, top: snapGhost.y,
          width: snapGhost.w, height: snapGhost.h,
          border: "2px solid rgba(200,168,75,0.7)",
          borderRadius: 12,
          background: "rgba(200,168,75,0.06)",
          pointerEvents: "none",
          zIndex: panel.zIndex - 1,
          animation: "ghostPulse 0.6s ease infinite alternate",
        }} />
      )}

      <PanelCtx.Provider value={panelCtxValue}>
        <div
          ref={dragRef}
          style={{
            position:  "absolute",
            left:      pos.x,
            top:       pos.y,
            width:     w,
            height:    h,
            zIndex:    panel.zIndex,
            // Smooth spring transition for BOTH position and size
            transition: isDragging ? "box-shadow 0.15s, transform 0.15s"
              : "left 0.38s cubic-bezier(.34,1.4,.64,1), top 0.38s cubic-bezier(.34,1.4,.64,1), width 0.35s cubic-bezier(.34,1.4,.64,1), height 0.35s cubic-bezier(.34,1.4,.64,1), box-shadow 0.2s",
            borderRadius:    12,
            overflow:        "hidden",
            display:         "flex",
            flexDirection:   "column",
            background:      "rgba(245,240,232,0.97)",
            userSelect:      "none",
            cursor:          isDragging ? "grabbing" : "default",
            // Elevation + glow changes based on drag state
            boxShadow: isDragging
              ? "0 28px 64px rgba(0,0,0,0.45), 0 0 0 2px rgba(200,168,75,0.7)"
              : isNear
              ? "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1.5px rgba(200,168,75,0.4)"
              : "0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(200,168,75,0.15)",
            transform: isDragging
              ? "scale(1.025) rotate(0.4deg)"
              : panel.snapping
              ? "scale(1.008)"  // brief "settle" bounce
              : "scale(1)",
          }}
        >
          {/* ── Title bar (drag handle) ── */}
          <div
            onMouseDown={onMouseDown}
            style={{
              height:        40,
              background:    "linear-gradient(90deg, #1a3a2a, #2c5f42)",
              display:       "flex",
              alignItems:    "center",
              padding:       "0 10px",
              gap:           8,
              cursor:        isDragging ? "grabbing" : "grab",
              flexShrink:    0,
              borderBottom:  "1px solid rgba(200,168,75,0.2)",
            }}
          >
            {/* Drag grip dots */}
            <div style={{ display:"flex", flexDirection:"column", gap:2, opacity:0.35 }}>
              {[0,1,2].map(r => (
                <div key={r} style={{ display:"flex", gap:2 }}>
                  {[0,1].map(c => <div key={c} style={{ width:2, height:2, borderRadius:"50%", background:"#c8a84b" }} />)}
                </div>
              ))}
            </div>

            {/* Title content — injected by PanelContent as first child */}
            {children[0]}

            {/* Zone badge — shows which zone the panel is in */}
            {panel.zone && !isDragging && (
              <div style={{ marginLeft: 4, fontFamily:"monospace", fontSize:"0.52rem", color:"rgba(200,168,75,0.5)", letterSpacing:"0.06em", flexShrink:0 }}>
                [{panel.zone}]
              </div>
            )}

            {/* Window controls */}
            <div data-no-drag="true" style={{ marginLeft:"auto", display:"flex", gap:5 }}>
              <WinBtn color="#c8a84b" textColor="#1a3a2a"
                onClick={() => dispatch({ type:"MINIMIZE_PANEL", id })}>
                {panel.minimized ? "+" : "−"}
              </WinBtn>
              <WinBtn color="#8b3a3a" textColor="white"
                onClick={() => dispatch({ type:"CLOSE_PANEL", id })}>
                ✕
              </WinBtn>
            </div>
          </div>

          {/* ── Content area — watched by ResizeObserver ── */}
          {!panel.minimized && (
            <div ref={contentRef} style={{ flex:1, overflow:"auto", minHeight:0 }}>
              {children[1]}
            </div>
          )}
        </div>
      </PanelCtx.Provider>
    </>
  );
}

function WinBtn({ color, textColor, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width:16, height:16, borderRadius:"50%", border:"none",
      background:color, cursor:"pointer", fontSize:"0.55rem",
      color:textColor, fontWeight:700, lineHeight:"16px",
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0,
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 2: PanelContent
//  Provides title/icon to the shell's title bar, and a scroll context to module
// ─────────────────────────────────────────────────────────────────────────────

function PanelContent({ title, icon, children }) {
  return (
    <>
      {/* slot 0 → title bar */}
      <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, minWidth:0 }}>
        <span style={{ fontSize:"0.9rem" }}>{icon}</span>
        <span style={{ fontFamily:"'Georgia',serif", fontSize:"0.8rem",
          color:"rgba(245,240,232,0.9)", whiteSpace:"nowrap",
          overflow:"hidden", textOverflow:"ellipsis" }}>
          {title}
        </span>
      </div>
      {/* slot 1 → content */}
      <div style={{ padding:"12px", height:"100%" }}>
        {children}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LAYER 3: MODULES — respond to live dimensions via usePanel()
//  This is the closed loop: ResizeObserver → PanelContext → module re-renders
// ─────────────────────────────────────────────────────────────────────────────

// ── Loans ──
function LoansModule() {
  const { loans, patron } = useContext(DataCtx);
  const panel = usePanel();
  // Module reads LIVE dimensions — responds as CSS animation plays out
  const compact = (panel?.dimensions?.w ?? 280) < 240;

  return (
    <div>
      <DimBadge panel={panel} />
      {loans.map(l => (
        <div key={l.id} style={{ display:"flex", gap:compact?6:10, padding:"8px 0",
          borderBottom:"1px solid rgba(200,168,75,0.1)", alignItems:"center" }}>
          <div style={{ width:compact?24:36, height:compact?32:48, flexShrink:0,
            background:`linear-gradient(160deg,${l.color[0]},${l.color[1]})`,
            borderRadius:3, display:"flex", alignItems:"flex-end",
            padding:3, fontSize:compact?"0.7rem":"1rem" }}>{l.emoji}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:compact?"0.7rem":"0.78rem",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.title}</div>
            {!compact && <div style={{ fontSize:"0.64rem", color:"#666", fontStyle:"italic" }}>{l.author}</div>}
          </div>
          <DueBadge status={l.status} due={l.due} compact={compact} />
        </div>
      ))}
      <div style={{ marginTop:10, fontFamily:"monospace", fontSize:"0.6rem", color:"#7aab8a" }}>
        {patron.out}/{patron.max} books · {patron.fines > 0 && <span style={{color:"#e09090"}}>Fine ${patron.fines.toFixed(2)}</span>}
      </div>
    </div>
  );
}

// ── Notifications ──
function NotifsModule() {
  const { notifs: raw } = useContext(DataCtx);
  const [notifs, setNotifs] = useState(raw);
  const unread = notifs.filter(n => !n.read).length;

  return (
    <div>
      {unread > 0 && (
        <button data-no-drag="true"
          onClick={() => setNotifs(p => p.map(n => ({ ...n, read:true })))}
          style={{ marginBottom:9, fontFamily:"monospace", fontSize:"0.6rem",
            padding:"2px 8px", border:"1px solid rgba(26,58,42,0.2)",
            borderRadius:4, background:"transparent", cursor:"pointer", color:"#2c5f42" }}>
          Mark all read ({unread})
        </button>
      )}
      {notifs.map(n => (
        <div key={n.id}
          onClick={() => setNotifs(p => p.map(x => x.id===n.id ? {...x,read:true} : x))}
          style={{ display:"flex", gap:8, padding:"7px 0",
            borderBottom:"1px solid rgba(200,168,75,0.1)", cursor:"pointer" }}>
          <div style={{ width:7, height:7, borderRadius:"50%", marginTop:4, flexShrink:0,
            background: n.read ? "rgba(0,0,0,0.15)" : "#c8a84b" }} />
          <div>
            <div style={{ fontSize:"0.76rem", color:"#3d3d38",
              fontWeight: n.read ? 400 : 600, lineHeight:1.4 }}>{n.text}</div>
            <div style={{ fontFamily:"monospace", fontSize:"0.58rem",
              color:"rgba(0,0,0,0.35)", marginTop:2 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Streak ──
function StreakModule() {
  const { streak } = useContext(DataCtx);
  const panel = usePanel();
  const w = panel?.dimensions?.w ?? 280;
  // Compact layout when panel is narrow
  const horiz = w < 200;

  return (
    <div style={{ textAlign:"center" }}>
      <DimBadge panel={panel} />
      {horiz ? (
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:"1.8rem" }}>🔥</span>
          <div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:"1.6rem", color:"#c8a84b", lineHeight:1 }}>{streak.months}</div>
            <div style={{ fontFamily:"monospace", fontSize:"0.55rem", color:"#7aab8a", letterSpacing:"0.08em" }}>MONTH STREAK</div>
          </div>
          <div style={{ display:"flex", gap:3, marginLeft:"auto" }}>
            {streak.history.map((a,i) => (
              <div key={i} style={{ width:14, height:4, borderRadius:2, background: a?"#c8a84b":"rgba(200,168,75,0.15)" }} />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize:"2rem", marginBottom:4 }}>🔥</div>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:"2.2rem", color:"#c8a84b", lineHeight:1, marginBottom:2 }}>{streak.months}</div>
          <div style={{ fontFamily:"monospace", fontSize:"0.6rem", color:"#7aab8a", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:14 }}>Month Reading Streak</div>
          <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:4 }}>
            {streak.history.map((a,i) => (
              <div key={i} style={{ width:22, height:5, borderRadius:2, background: a?"#c8a84b":"rgba(200,168,75,0.15)" }} />
            ))}
          </div>
          <div style={{ display:"flex", gap:4, justifyContent:"center", marginBottom:12 }}>
            {streak.labels.map((l,i) => (
              <div key={i} style={{ width:22, fontFamily:"monospace", fontSize:"0.5rem", color:"rgba(122,171,138,0.5)", textAlign:"center" }}>{l}</div>
            ))}
          </div>
          <div style={{ padding:"8px 10px", background:"rgba(26,58,42,0.06)", borderRadius:6,
            fontSize:"0.7rem", color:"#3d3d38", fontStyle:"italic", lineHeight:1.5 }}>
            "You've read every month since September!"
          </div>
        </>
      )}
    </div>
  );
}

// ── Search — the most dimension-aware module ──
function SearchModule() {
  const { books } = useContext(DataCtx);
  const panel = usePanel();
  const [q, setQ] = useState("");

  const w = panel?.dimensions?.w ?? 400;
  const h = panel?.dimensions?.h ?? 400;

  // Three layout modes driven by live container dimensions
  const layout = w > 360 ? "grid" : w > 220 ? "list" : "micro";

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(q.toLowerCase()) ||
    b.author.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <DimBadge panel={panel} />

      <div style={{ display:"flex", background:"white",
        border:"1.5px solid rgba(26,58,42,0.18)", borderRadius:7,
        overflow:"hidden", marginBottom:10 }}>
        <input value={q} onChange={e => setQ(e.target.value)}
          data-no-drag="true"
          placeholder={layout === "micro" ? "Search…" : "Search title, author…"}
          style={{ flex:1, border:"none", outline:"none", padding:"7px 11px",
            fontFamily:"'Georgia',serif", fontSize:"0.84rem" }} />
        <div style={{ padding:"7px 11px", background:"#1a3a2a", color:"#f5f0e8",
          fontFamily:"monospace", fontSize:"0.68rem", display:"flex", alignItems:"center" }}>
          {layout === "micro" ? "🔍" : "Search"}
        </div>
      </div>

      {/* Layout transitions smoothly as ResizeObserver fires during snap animation */}
      {layout === "grid" && (
        <div style={{ display:"grid",
          gridTemplateColumns:`repeat(auto-fill, minmax(${w > 500 ? 130 : 110}px, 1fr))`,
          gap:10 }}>
          {filtered.map(b => (
            <BookCard key={b.id} book={b} mode="grid" />
          ))}
        </div>
      )}

      {layout === "list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {filtered.map(b => <BookCard key={b.id} book={b} mode="list" />)}
        </div>
      )}

      {layout === "micro" && (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          {filtered.map(b => <BookCard key={b.id} book={b} mode="micro" />)}
        </div>
      )}
    </div>
  );
}

// ── Account ──
function AccountModule() {
  const { patron } = useContext(DataCtx);
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ width:48, height:48, borderRadius:"50%", margin:"0 auto 9px",
        background:"linear-gradient(135deg,#2c5f42,#c8a84b)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"1rem", fontWeight:700, color:"white",
        border:"2px solid rgba(200,168,75,0.3)" }}>
        {patron.name.split(" ").map(n => n[0]).join("")}
      </div>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:"0.88rem", marginBottom:2 }}>{patron.name}</div>
      <div style={{ fontFamily:"monospace", fontSize:"0.58rem", color:"#7aab8a", marginBottom:12 }}>Card #{patron.card}</div>
      <div style={{ background:"rgba(200,168,75,0.07)", border:"1px solid rgba(200,168,75,0.2)", borderRadius:7, padding:"9px 11px" }}>
        {[["Books Out",`${patron.out}/${patron.max}`],["Fines",`$${patron.fines.toFixed(2)}`],["Branch","Main St."]].map(([k,v]) => (
          <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.73rem", color:"#3d3d38", marginBottom:5 }}>
            <span style={{ fontFamily:"monospace", fontSize:"0.62rem", color:"#7aab8a" }}>{k}</span>
            <span style={{ color: k==="Fines"&&patron.fines>0 ? "#e09090" : "#3d3d38" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  SHARED MICRO COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// Shows live px dimensions in corner — illustrates ResizeObserver firing in real time
function DimBadge({ panel }) {
  if (!panel) return null;
  return (
    <div style={{ fontFamily:"monospace", fontSize:"0.52rem", color:"rgba(122,171,138,0.45)",
      marginBottom:6, letterSpacing:"0.06em" }}>
      live: {panel.dimensions.w} × {panel.dimensions.h}px
    </div>
  );
}

function DueBadge({ status, due, compact }) {
  const colors = { ok:["rgba(46,125,82,0.1)","#2e7d52"], warn:["rgba(200,168,75,0.15)","#8a6a00"], late:["rgba(139,58,58,0.12)","#8b3a3a"] };
  const [bg, fg] = colors[status];
  return (
    <div style={{ fontFamily:"monospace", fontSize:"0.58rem", padding:"2px 5px",
      borderRadius:3, flexShrink:0, background:bg, color:fg }}>
      {status==="late" ? "⚠ " : ""}{compact ? due : `Due ${due}`}
    </div>
  );
}

function BookCard({ book, mode }) {
  const [hov, setHov] = useState(false);
  if (mode === "grid") return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:"white", borderRadius:7, overflow:"hidden",
        border:"1px solid rgba(26,58,42,0.1)", cursor:"pointer",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? "0 6px 16px rgba(26,58,42,0.15)" : "0 1px 4px rgba(0,0,0,0.06)",
        transition:"transform 0.15s, box-shadow 0.15s" }}>
      <div style={{ height:80, background:`linear-gradient(160deg,${book.color[0]},${book.color[1]})`,
        display:"flex", alignItems:"flex-end", padding:6, position:"relative", fontSize:"1.2rem" }}>
        <div style={{ position:"absolute", left:0, top:0, bottom:0, width:5, background:"rgba(0,0,0,0.2)" }} />
        {book.emoji}
      </div>
      <div style={{ padding:"6px 8px" }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:"0.68rem", lineHeight:1.3, marginBottom:2 }}>{book.title}</div>
        <div style={{ fontFamily:"monospace", fontSize:"0.58rem", color: book.available?"#2e7d52":"#8b3a3a" }}>
          {book.available ? "● Available" : "○ Out"}
        </div>
      </div>
    </div>
  );
  if (mode === "list") return (
    <div style={{ display:"flex", gap:9, padding:"7px 0",
      borderBottom:"1px solid rgba(200,168,75,0.1)", alignItems:"center" }}>
      <div style={{ width:32, height:44, flexShrink:0,
        background:`linear-gradient(160deg,${book.color[0]},${book.color[1]})`,
        borderRadius:3, display:"flex", alignItems:"flex-end",
        padding:3, fontSize:"0.85rem" }}>{book.emoji}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:"0.76rem" }}>{book.title}</div>
        <div style={{ fontSize:"0.64rem", color:"#666", fontStyle:"italic" }}>{book.author}</div>
      </div>
      <div style={{ fontFamily:"monospace", fontSize:"0.6rem", color: book.available?"#2e7d52":"#8b3a3a" }}>
        {book.available ? "●" : "○"}
      </div>
    </div>
  );
  // micro
  return (
    <div style={{ display:"flex", alignItems:"center", gap:7, padding:"4px 0",
      borderBottom:"1px solid rgba(200,168,75,0.08)" }}>
      <span style={{ fontSize:"0.85rem" }}>{book.emoji}</span>
      <span style={{ fontFamily:"'Georgia',serif", fontSize:"0.68rem", flex:1,
        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{book.title}</span>
      <span style={{ fontFamily:"monospace", fontSize:"0.58rem",
        color: book.available?"#2e7d52":"#8b3a3a" }}>{book.available?"●":"○"}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  TEMPLATES (pure JSON, no component code)
// ─────────────────────────────────────────────────────────────────────────────

const TEMPLATES = {
  default: {
    name:"Default",
    activeTemplate:"default",
    topZ:10,
    panels:{
      search:  {id:"search",  zone:"center",       x:296,y:64, w:432,h:542, open:true,  minimized:false, zIndex:10},
      loans:   {id:"loans",   zone:"top-left",     x:12, y:64, w:272,h:300, open:true,  minimized:false, zIndex:10},
      notifs:  {id:"notifs",  zone:"top-right",    x:740,y:64, w:272,h:300, open:true,  minimized:false, zIndex:10},
      streak:  {id:"streak",  zone:"bottom-left",  x:12, y:376,w:272,h:230, open:true,  minimized:false, zIndex:10},
      account: {id:"account", zone:"bottom-right", x:740,y:376,w:272,h:230, open:true,  minimized:false, zIndex:10},
    }
  },
  focus: {
    name:"Focus",
    activeTemplate:"focus",
    topZ:10,
    panels:{
      search:  {id:"search",  zone:"center",       x:296,y:64, w:432,h:542, open:true,  minimized:false, zIndex:11},
      loans:   {id:"loans",   zone:"top-left",     x:12, y:64, w:272,h:300, open:true,  minimized:true,  zIndex:9 },
      notifs:  {id:"notifs",  zone:"top-right",    x:740,y:64, w:272,h:300, open:true,  minimized:true,  zIndex:9 },
      streak:  {id:"streak",  zone:"bottom-left",  x:12, y:376,w:272,h:230, open:false, minimized:false, zIndex:8 },
      account: {id:"account", zone:"bottom-right", x:740,y:376,w:272,h:230, open:false, minimized:false, zIndex:8 },
    }
  },
  reading: {
    name:"Reading",
    activeTemplate:"reading",
    topZ:10,
    panels:{
      search:  {id:"search",  zone:null,           x:60, y:80, w:340,h:400, open:true,  minimized:false, zIndex:10},
      loans:   {id:"loans",   zone:"center",       x:296,y:64, w:432,h:542, open:true,  minimized:false, zIndex:11},
      notifs:  {id:"notifs",  zone:"top-right",    x:740,y:64, w:272,h:300, open:true,  minimized:false, zIndex:10},
      streak:  {id:"streak",  zone:"bottom-right", x:740,y:376,w:272,h:230, open:true,  minimized:false, zIndex:10},
      account: {id:"account", zone:"bottom-left",  x:12, y:376,w:272,h:230, open:true,  minimized:false, zIndex:10},
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  ZONE OVERLAY — shows gravity wells during drag, ghost on near-snap
// ─────────────────────────────────────────────────────────────────────────────

function ZoneOverlays({ draggingId, state }) {
  const draggedPanel = draggingId ? state.panels[draggingId] : null;
  return (
    <>
      {Object.entries(SNAP_ZONES).map(([name, zone]) => {
        const occupied = Object.values(state.panels).find(p => p.zone === name && p.id !== draggingId && p.open);
        return (
          <div key={name} style={{
            position:"absolute",
            left:zone.x, top:zone.y, width:zone.w, height:zone.h,
            border: occupied
              ? "1px dashed rgba(200,168,75,0.08)"
              : "1px dashed rgba(200,168,75,0.18)",
            borderRadius:12,
            pointerEvents:"none",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background 0.2s, border-color 0.2s",
          }}>
            {!occupied && (
              <span style={{ fontFamily:"monospace", fontSize:"0.52rem",
                color:"rgba(200,168,75,0.18)", letterSpacing:"0.1em",
                textTransform:"uppercase" }}>{zone.label}</span>
            )}
          </div>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_CONFIG = {
  search:  { title:"Catalogue Browser", icon:"🔍", Module: SearchModule  },
  loans:   { title:"My Loans",          icon:"📚", Module: LoansModule   },
  notifs:  { title:"Notifications",     icon:"🔔", Module: NotifsModule  },
  streak:  { title:"Reading Streak",    icon:"🔥", Module: StreakModule  },
  account: { title:"Account",           icon:"👤", Module: AccountModule },
};

export default function App() {
  const [shell, dispatch] = useReducer(shellReducer, TEMPLATES.default);
  const [tip, setTip] = useState(true);

  const closed = Object.values(shell.panels).filter(p => !p.open);

  return (
    <>
      <style>{`
        @keyframes ghostPulse {
          from { opacity: 0.5; }
          to   { opacity: 1;   }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,168,75,0.25); border-radius: 2px; }
      `}</style>

      <DataCtx.Provider value={MOCK}>
        <ShellCtx.Provider value={{ state: shell, dispatch }}>
          <div style={{
            width:"100%", height:"100vh", minHeight:640,
            background:"linear-gradient(160deg,#0f2419 0%,#1a3a2a 40%,#243d30 100%)",
            position:"relative", overflow:"hidden",
            fontFamily:"'Georgia',serif",
          }}>

            {/* Texture */}
            <div style={{ position:"absolute", inset:0, pointerEvents:"none",
              backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Ccircle cx='30' cy='30' r='0.5' fill='rgba(200,168,75,0.1)'/%3E%3C/svg%3E\")",
              backgroundSize:"60px 60px" }} />

            {/* Zone overlays */}
            <ZoneOverlays state={shell} draggingId={null} />

            {/* ── TOP BAR ── */}
            <div style={{
              position:"absolute", top:0, left:0, right:0, height:56, zIndex:1000,
              background:"rgba(15,36,25,0.96)", borderBottom:"1px solid rgba(200,168,75,0.2)",
              backdropFilter:"blur(12px)", display:"flex", alignItems:"center",
              padding:"0 16px", gap:10,
            }}>
              <div style={{ fontFamily:"'Georgia',serif", fontSize:"1.1rem", color:"#c8a84b", flexShrink:0 }}>
                📚 LibraryLink
              </div>
              <div style={{ fontFamily:"monospace", fontSize:"0.58rem", color:"#7aab8a",
                letterSpacing:"0.1em", textTransform:"uppercase", opacity:0.6 }}>
                v2 · resize-to-fill demo
              </div>

              <div style={{ marginLeft:"auto", display:"flex", gap:5, alignItems:"center", flexWrap:"wrap" }}>
                <span style={{ fontFamily:"monospace", fontSize:"0.58rem", color:"rgba(122,171,138,0.5)", letterSpacing:"0.08em" }}>TEMPLATE:</span>
                {Object.entries(TEMPLATES).map(([k, t]) => (
                  <button key={k}
                    onClick={() => dispatch({ type:"LOAD_TEMPLATE", template: TEMPLATES[k] })}
                    style={{
                      padding:"4px 9px", fontFamily:"monospace", fontSize:"0.6rem",
                      letterSpacing:"0.05em", borderRadius:4, cursor:"pointer",
                      border:`1px solid ${shell.activeTemplate===k ? "#c8a84b" : "rgba(200,168,75,0.22)"}`,
                      background: shell.activeTemplate===k ? "rgba(200,168,75,0.14)" : "transparent",
                      color: shell.activeTemplate===k ? "#e2c97e" : "#7aab8a",
                      transition:"all 0.18s",
                    }}>{t.name}</button>
                ))}
                {closed.map(p => (
                  <button key={p.id}
                    onClick={() => dispatch({ type:"OPEN_PANEL", id: p.id })}
                    style={{ padding:"4px 8px", fontFamily:"monospace", fontSize:"0.58rem",
                      border:"1px solid rgba(139,58,58,0.35)", borderRadius:4, cursor:"pointer",
                      background:"rgba(139,58,58,0.08)", color:"#e09090" }}>
                    + {PANEL_CONFIG[p.id].title}
                  </button>
                ))}
              </div>
            </div>

            {/* ── PANELS ── */}
            {Object.keys(PANEL_CONFIG).map(id => {
              const { title, icon, Module } = PANEL_CONFIG[id];
              return (
                <PanelShell key={id} id={id}>
                  <PanelContent title={title} icon={icon}>
                    <Module />
                  </PanelContent>
                </PanelShell>
              );
            })}

            {/* ── TIP OVERLAY ── */}
            {tip && (
              <div style={{
                position:"absolute", bottom:14, left:"50%", transform:"translateX(-50%)",
                background:"rgba(15,36,25,0.96)", border:"1px solid rgba(200,168,75,0.22)",
                borderRadius:9, padding:"11px 16px", zIndex:2000,
                backdropFilter:"blur(8px)", maxWidth:660, width:"92%",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontFamily:"monospace", fontSize:"0.62rem", color:"#c8a84b", letterSpacing:"0.1em" }}>
                    WHAT'S NEW: RESIZE-TO-FILL
                  </div>
                  <button onClick={() => setTip(false)}
                    style={{ border:"none", background:"none", color:"#7aab8a", cursor:"pointer", fontSize:"0.72rem" }}>✕</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:9 }}>
                  {[
                    { label:"Snap fills zone", desc:"Drop a panel into a zone and it animates to fill it — both position AND size." },
                    { label:"ResizeObserver loop", desc:"The 'live: W×H' badge in each module updates in real time as the CSS spring plays out." },
                    { label:"Module responsiveness", desc:"SearchModule switches grid→list→micro. LoansModule compacts. All driven by live dims, not state." },
                  ].map(({ label, desc }) => (
                    <div key={label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:6, padding:"8px 10px", borderLeft:"3px solid rgba(200,168,75,0.5)" }}>
                      <div style={{ fontFamily:"monospace", fontSize:"0.62rem", color:"#c8a84b", marginBottom:3 }}>{label}</div>
                      <div style={{ fontSize:"0.7rem", color:"rgba(200,220,210,0.7)", lineHeight:1.5 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily:"monospace", fontSize:"0.6rem", color:"rgba(122,171,138,0.55)", lineHeight:1.9 }}>
                  Try: <span style={{color:"#c8a84b"}}>drag a panel near a zone</span> (ghost outline appears) · <span style={{color:"#c8a84b"}}>drop to snap-fill</span> · <span style={{color:"#c8a84b"}}>switch templates</span> and watch all panels reflow · resize your browser window
                </div>
              </div>
            )}

          </div>
        </ShellCtx.Provider>
      </DataCtx.Provider>
    </>
  );
}
