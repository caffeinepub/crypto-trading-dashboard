# Specification

## Summary
**Goal:** Ensure all dropdown/select/popover-style overlays are fully opaque and readable in both light and dark themes, and polish overlay behavior across the UI.

**Planned changes:**
- Fix global theme CSS variables/tokens so Tailwind/Shadcn utilities (e.g., `bg-popover`, `text-popover-foreground`, `border-border`) render correct opaque overlay backgrounds instead of transparent fallbacks.
- Apply consistent overlay styling for DropdownMenu, Select, Popover, ContextMenu, and Tooltip so panels have readable text contrast in light/dark mode plus a visible border and shadow.
- Audit dropdown-related interactions and address obvious usability issues (z-index/stacking above sticky headers, consistent padding/radius, avoid clipping on small screens/mobile), without editing files under `frontend/src/components/ui`.

**User-visible outcome:** Opening any dropdown/select/popover/tooltip shows an opaque, clearly bordered/shadowed panel with readable text in light and dark mode, and menus reliably appear above other UI and remain usable on small screens.
