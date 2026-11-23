# UX review: Huddle before the redesign

**Method:** every page of Day 17's Huddle on the seed data only, desktop (1440×900, light and dark) and phone (390×844), screenshots taken by `scripts/screenshots.mjs` (in [`screenshots/before/`](screenshots/before/)). Each finding names the design principle it breaks and what the redesign will do. IDs are referenced from the commits and the README.

## Across the app

| ID | What is wrong | Principle | Planned fix |
|---|---|---|---|
| UX-1 | Developer explanations compete with the product: "What this app demonstrates" is the **largest card on the dashboard**; "How this page works (the supabase-js calls)" sits **above** the notes; "How this works" appears **inside the sign-in form** and the chat. | Visual hierarchy | Keep them (they are why Day 17 exists), but in one consistent, collapsed **"Under the hood"** panel at the end of each page. |
| UX-2 | Every list item is an underlined link in the brand colour, so "All notes" looks as important as a note's title; primary and secondary actions look alike. | Contrast | Links styled by role: titles as plain headings that are links; text links underlined; "See all" as a quiet secondary link. |
| UX-3 | One green plus greys. Nothing is reserved for "needs your attention": unread mentions look like everything else. | Colour | A green scale, a warm-grey scale, **one accent** (amber, complementary to green) used only for attention, and semantic colours. |
| UX-4 | No type scale: sizes between 13 and 28 px picked per component; raw dates (`23/11/2026`) and handles everywhere. | Typography, hierarchy | A modular scale (ratio 1.25), defined weights; relative dates ("2 hours ago") with the full date on hover. |
| UX-5 | The top bar holds 6 links and 5 controls. On a phone it wraps into **three rows, about 190 px**, before any content. | Mobile-first, white space | Sidebar on desktop; a single compact bar with a menu button on phones. |
| UX-6 | Buttons come in several heights; "Apply filters" wraps onto two lines next to a taller "Reset"; card padding varies by page. | Repetition (consistency), alignment | One button and card system used everywhere. |

## Dashboard

| ID | What is wrong | Principle | Planned fix |
|---|---|---|---|
| UX-7 | Five identical stat cards; **"Unread mentions" is last** and styled like "Rooms". The eye lands on counts, not on what to do next. | Visual hierarchy, F-pattern | Top-left: greeting and **what needs you** (mentions, unread rooms, accented). Stats demoted to a quiet strip. |
| UX-8 | Cards of different heights leave large gaps; "My recent files" is an almost empty card beside a tall one. | Alignment, proximity | An aligned grid; compact empty states. |

## Chat

| ID | What is wrong | Principle | Planned fix |
|---|---|---|---|
| UX-9 | **The newest message is at the top**, far from the composer: the reverse of every chat app. | Convention, proximity | Oldest to newest, the conversation scrolled to the latest message, the composer directly under it. |
| UX-10 | The room list is loose text with no container, search or unread counts; "New room" is styled like a room; with no room open, "Pick a room" floats in empty space. | Proximity, white space | A rooms panel (search, sections, unread counts), a distinct "New room" button, a designed empty state. |
| UX-11 | The message box is taller than the attach and send buttons, which sit on its baseline; presence ("Online now: ada") is small text top-right. | Alignment | An aligned composer bar; presence shown as avatars in the room header. |

## Notes

| ID | What is wrong | Principle | Planned fix |
|---|---|---|---|
| UX-12 | Six filters, "Apply" and "Reset" in a big panel above the notes; search and "New note" are separated from each other and from the filters. | Proximity, hierarchy | One toolbar: search + "New note"; filters as a collapsible row with the active ones shown as removable chips. |
| UX-13 | Cards show noise ("Priority 0"); author and date are tiny and the actions are plain buttons. | Contrast, white space | Priority shown only when set; clearer meta line; consistent actions. |

## Files, Profile, Query lab, Sign-in

| ID | What is wrong | Principle | Planned fix |
|---|---|---|---|
| UX-14 | Files and Profile mix tasks with long explanations of buckets and sessions. | Hierarchy | Tasks first; explanations in "Under the hood". |
| UX-15 | The Query lab is a long single column of 27 cards with no way to jump between them. | Proximity, navigation | A sticky list of sections beside the cards (desktop). |
| UX-16 | Sign-in is a generic centred card. | Z-pattern | A split layout: the product's promise on the left, the form on the right (desktop); the form alone on phones. |
