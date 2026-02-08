# Specification

## Summary
**Goal:** Rebrand and refocus the app into a polished, production-ready “Market Rotation Radar” experience for detecting and monitoring capital rotation across BTC/ETH and market-cap tiers.

**Planned changes:**
- Rebrand all UI and PWA metadata to “Market Rotation Radar” (titles, headings, descriptions, manifest fields) and update the service worker cache name/version to prevent stale assets.
- Build a dedicated “Rotation Radar” landing dashboard that prioritizes rotation insights (phase, flows, leaders/laggards) over trade-entry/portfolio workflows, with consistent BTC/ETH/Majors/Mid-caps/Micro-caps segmentation.
- Add a rotation classification layer assigning each top-100 asset to exactly one bucket using a deterministic, documented rule, and compute per-bucket aggregate metrics (performance, relative vs BTC, participation/breadth, volume trend, momentum proxy).
- Implement a “Rotation Phase” engine with a single phase label, confidence score, and metric-based explanation; include smoothing/hysteresis and graceful “insufficient data” handling.
- Add a “Flow & Leaders” view with filtering/sorting (e.g., 24h change, volume, relative strength vs BTC, correlation-derived rotation signal) and click-through to the existing coin detail drill-down.
- Add rotation alerts (phase change, bucket leadership shifts, divergence/rotation-signal alerts) using existing toast/notification infrastructure plus an in-app rotation alert history with cooldowns.
- Persist Rotation Radar preferences (bucket selections, alert rules/thresholds, UI options) using authenticated storage via the existing backend user settings pattern; provide safe local defaults when logged out.
- Production polish across rotation panels: consistent loading/error/empty states, reduced console noise, mobile-first responsiveness, accessibility basics, and memoized rotation computations.
- Apply a cohesive visual theme distinct from the current look, avoiding a primarily blue/purple-forward palette, and keep color semantics consistent across key states in both light and dark modes.
- Add an in-app “How to Use Rotation Radar” guide with a concise glossary aligned to the UI and avoiding claims of guaranteed outcomes.

**User-visible outcome:** Users see a rebranded Market Rotation Radar app that highlights current rotation phase and bucket-level flows, lets them explore leaders/laggards with drill-down, configure rotation alerts, and have their preferences persist across sessions (with sensible defaults when logged out).
