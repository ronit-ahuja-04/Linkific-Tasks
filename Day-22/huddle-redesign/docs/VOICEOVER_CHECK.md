# VoiceOver check (10 minutes, on a Mac)

Automated tools check about a third of WCAG. This is the part a person has to hear. Run it once on the redesigned app and fill in the last column.

**Set up**
1. `npm run dev`, open http://localhost:5177 in **Safari** (VoiceOver works best with Safari), sign in as `ada@example.com` / `demo-password-123`.
2. Turn VoiceOver on: **Cmd + F5**. Turn it off the same way.
3. Keys used below: **VO** = Control + Option. **VO + U** opens the rotor (lists of headings, landmarks, links, form controls); Left/Right switches list, Up/Down moves, Enter jumps. **Tab** moves between controls.

| # | Do this | You should hear (roughly) | OK? |
|---|---|---|---|
| 1 | On the dashboard, press **Tab** once | "Skip to content, link". Press Enter: VoiceOver moves to the page content. | |
| 2 | **VO + U**, go to **Landmarks** | banner, navigation "Main", main (and "Notifications" region) | |
| 3 | Rotor **Headings** | "Good afternoon, Ada", heading level 1, then level-2 headings: Needs you, Recent team notes, My recent files, Workspace, Start something | |
| 4 | **Tab** through the sidebar to a room with unread messages (post one from another browser first, or skip) | "General, 2 unread, link" | |
| 5 | Press Enter on **Notes** in the sidebar | VoiceOver reads the new page's heading "Notes" (focus moved there) | |
| 6 | Tab to **Mine** and press Space | "Mine, toggle button, selected" (or "pressed"); the list heading now says "My notes" | |
| 7 | **New note**, fill a title, **Create note** | "Note created" is announced (from the toast) without moving focus | |
| 8 | Open **Chat**, open **General**, Tab to the message box | "Message, combo box" plus the hint "Enter sends. Shift+Enter starts a new line." | |
| 9 | Type `hello`, press Enter | Your message is read out (the conversation is a live log) | |
| 10 | Type `@gr` | A list of people opens; Down arrow reads "@grace, Grace Hopper"; Enter picks it | |
| 11 | Sign out, then sign in with a wrong password | "Email or password is incorrect" is read at once; focus stays on "Sign in" | |
| 12 | **Cmd + F5** off | | |

**Record the result** in `ACCESSIBILITY_AUDIT.md` under "VoiceOver pass": the date, macOS and Safari versions, and anything that sounded wrong (what you did, what you heard, what you expected).

NVDA and JAWS are Windows-only screen readers, so they are not covered here. The ARIA snapshot tests (`e2e/keyboard-aria.spec.js`) check the accessibility tree that all screen readers read from, but only a listening pass shows how it actually sounds.
