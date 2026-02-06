# Specification

## Summary
**Goal:** Add a dedicated Download/Install page to Jero chat so users can copy the app link and follow clear PWA install instructions on Android and iOS.

**Planned changes:**
- Add a new React route (e.g., `/download`) that renders a Download/Install screen styled consistently with the existing cyber/neon theme.
- Display the app URL derived at runtime from `window.location.origin`, with a “Copy link” action and a visible confirmation message.
- Add English user instructions for installing the web app to the home screen on Android (Chrome/Edge) and iOS (Safari), explicitly clarifying this is not an APK download.
- Add a prominent header navigation button on the main Chat screen (next to Premium) that links to the Download/Install screen (with an English aria-label).
- Add a back action on the Download/Install screen that returns to the main chat route (`/`) without disrupting existing Chat/Premium navigation.
- Enhance the Download/Install screen with an “Install” button that triggers the native PWA install prompt when supported; otherwise hide/disable it with English guidance to use manual instructions.

**User-visible outcome:** Users can open a new Download/Install page from the chat header to copy the app link, see Android/iOS “Add to Home Screen” instructions, and (when supported) install the PWA via a native prompt, then return back to chat.
