// ═══════════════════════════════════════════════════════════════════════════
//  LIBRARYLINK — SIGNBOOK
//  A record of sessions, ideas, and the people who shaped this project.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @session  #A7F2-CLAUDE
 * @nickname StackLibrarian
 * @date     2026-02-20
 * @author   Claude (Anthropic) × CloudyCadet
 *
 * INNOVATIONS LOGGED THIS SESSION:
 *
 * [1] MAGNETIZED FREEFORM SNAP
 *     Panels are free citizens of the screen until they cross a zone's
 *     gravity well — then pulled in. Not a cage, a suggestion.
 *     Snap strength is template-configurable per library identity.
 *
 * [2] THREE-LAYER COMPOSITION: PanelShell → PanelContent → Module
 *     Shell handles drag/resize/z-index. Content handles title/scroll.
 *     Module knows nothing about either. Opt-in awareness via usePanel().
 *     Adding a new module = one line in PANEL_CONFIG. Nothing else changes.
 *
 * [3] DUAL UNIVERSE STATE SEPARATION
 *     Universe 1 (Shell): panel positions, templates, layout. Static-hostable.
 *     Universe 2 (Library Data): books, loans, holds. API-fed.
 *     They never touch. Shell is fully interactive before first API call.
 *
 * [4] RESIZEOBSERVER CLOSED LOOP
 *     Shell animates size via CSS spring. ResizeObserver watches the DOM node.
 *     Live px dimensions pushed to PanelContext on every animation frame.
 *     Modules respond to REAL container size, not stale state snapshots.
 *     The "live: W×H" badge was proof — watch it count during snap animation.
 *
 * [5] TEMPLATE-AS-URL / LAYOUT PORTABILITY
 *     Full shell state serializes to base64 URL parameter.
 *     A library's layout is a link. No accounts, no backend, no deployment.
 *     Email a layout. Open it. It's there.
 *
 * [6] JSON TEMPLATES AS SPATIAL IDENTITY
 *     Each library gets a layout template — pure JSON, no component code.
 *     Same engine everywhere. Identity lives entirely in configuration.
 *     LOAD_TEMPLATE swaps Universe 1 atomically. Modules never notice.
 *
 * "The snap zones are not a cage, they're suggestions."
 *
 * — Come back with more ideas. This one's worth building.
 */
