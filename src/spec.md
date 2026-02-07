# Specification

## Summary
**Goal:** Add last-seen timestamps to presence and improve online/offline UI indicators across the chat app.

**Planned changes:**
- Extend the Motoko presence backend to store and expose per-user last-seen timestamps alongside online/offline state, without breaking existing presence queries.
- Update the React Query data layer to fetch a combined presence + last-seen payload and reuse it consistently in ChatThread header, ConversationsList, and ContactsPanel.
- Adjust presence UI to always show a dot (green online, grey offline) and display “Last seen …” when offline with a known timestamp, with clear English fallbacks when unknown/unavailable.

**User-visible outcome:** Users see a consistent green/grey presence dot everywhere, and when someone is offline the app shows “Last seen …” (or “Offline”/“Status unavailable” when appropriate).
