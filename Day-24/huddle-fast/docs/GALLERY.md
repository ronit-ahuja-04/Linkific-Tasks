# Before and after

Same pages, same data (the seed, after `npm run db:reset`), same window sizes, taken by [`scripts/screenshots.mjs`](../scripts/screenshots.mjs): desktop 1440×900 in light and dark, phone 390×844. "Before" is the Day 17 design (M1); "after" is the Day 22 redesign (M6).

Jump to: [Dashboard](#dashboard) · [Chat: room browser](#chat-room-browser) · [Chat: a room](#chat-a-room) · [Notes](#notes) · [Files](#files) · [Profile](#profile) · [Query lab](#query-lab) · [Sign in](#sign-in) · [Phone](#phone) · [Style guide](#style-guide)

## Dashboard

F-pattern: "Needs you" top left; notes and files as rows with names and relative times; the five tiles became a quiet list; the explainer is under the hood.

| | Before | After |
|---|---|---|
| Light | ![Dashboard before, light](screenshots/before/dashboard-light.jpg) | ![Dashboard after, light](screenshots/after/dashboard-light.jpg) |
| Dark | ![Dashboard before, dark](screenshots/before/dashboard-dark.jpg) | ![Dashboard after, dark](screenshots/after/dashboard-dark.jpg) |

## Chat: room browser

`/chat` lists rooms (yours with unread counts, then public ones) with search and New room; the sidebar now holds your rooms on every page.

| | Before | After |
|---|---|---|
| Light | ![Chat: room browser before, light](screenshots/before/chat-light.jpg) | ![Chat: room browser after, light](screenshots/after/chat-light.jpg) |
| Dark | ![Chat: room browser before, dark](screenshots/before/chat-dark.jpg) | ![Chat: room browser after, dark](screenshots/after/chat-dark.jpg) |

## Chat: a room

Full width, oldest first, grouped by author, composer at the bottom, About / Online now beside it.

| | Before | After |
|---|---|---|
| Light | ![Chat: a room before, light](screenshots/before/chat-room-light.jpg) | ![Chat: a room after, light](screenshots/after/chat-room-light.jpg) |
| Dark | ![Chat: a room before, dark](screenshots/before/chat-room-dark.jpg) | ![Chat: a room after, dark](screenshots/after/chat-room-dark.jpg) |

## Notes

One toolbar, quick chips, equal-height cards; "Priority 0" is gone.

| | Before | After |
|---|---|---|
| Light | ![Notes before, light](screenshots/before/notes-light.jpg) | ![Notes after, light](screenshots/after/notes-light.jpg) |
| Dark | ![Notes before, dark](screenshots/before/notes-dark.jpg) | ![Notes after, dark](screenshots/after/notes-dark.jpg) |

## Files

Header, upload card, "My files" with a count; the bucket demo is under the hood; no sideways scroll at 320 px.

| | Before | After |
|---|---|---|
| Light | ![Files before, light](screenshots/before/files-light.jpg) | ![Files after, light](screenshots/after/files-light.jpg) |
| Dark | ![Files before, dark](screenshots/before/files-dark.jpg) | ![Files after, dark](screenshots/after/files-dark.jpg) |

## Profile

The same header and grid as every page; the SQL notes are under the hood.

| | Before | After |
|---|---|---|
| Light | ![Profile before, light](screenshots/before/profile-light.jpg) | ![Profile after, light](screenshots/after/profile-light.jpg) |
| Dark | ![Profile before, dark](screenshots/before/profile-dark.jpg) | ![Profile after, dark](screenshots/after/profile-dark.jpg) |

## Query lab

Filter chips like Notes; headings h1 → h2 → h3; one live region instead of 27.

| | Before | After |
|---|---|---|
| Light | ![Query lab before, light](screenshots/before/lab-light.jpg) | ![Query lab after, light](screenshots/after/lab-light.jpg) |
| Dark | ![Query lab before, dark](screenshots/before/lab-dark.jpg) | ![Query lab after, dark](screenshots/after/lab-dark.jpg) |

## Sign in

Z-pattern split: the pitch on brand green, the form on the right.

| | Before | After |
|---|---|---|
| Light | ![Sign in before, light](screenshots/before/login-light.jpg) | ![Sign in after, light](screenshots/after/login-light.jpg) |
| Dark | ![Sign in before, dark](screenshots/before/login-dark.jpg) | ![Sign in after, dark](screenshots/after/login-dark.jpg) |

## Phone

Day 17's header wrapped into three rows (about 190 px) before any content; now one 56 px bar with a Menu button. In chat, the room list and the conversation are two screens.

| | Before | After |
|---|---|---|
| Dashboard | <img src="screenshots/before/dashboard-phone.jpg" alt="Dashboard before, phone" width="300"> | <img src="screenshots/after/dashboard-phone.jpg" alt="Dashboard after, phone" width="300"> |
| Chat room | <img src="screenshots/before/chat-room-phone.jpg" alt="Chat room before, phone" width="300"> | <img src="screenshots/after/chat-room-phone.jpg" alt="Chat room after, phone" width="300"> |
| Notes | <img src="screenshots/before/notes-phone.jpg" alt="Notes before, phone" width="300"> | <img src="screenshots/after/notes-phone.jpg" alt="Notes after, phone" width="300"> |
| Sign in | <img src="screenshots/before/login-phone.jpg" alt="Sign in before, phone" width="300"> | <img src="screenshots/after/login-phone.jpg" alt="Sign in after, phone" width="300"> |

## Style guide

New on Day 22: `/styleguide`, every token and component rendered live from the CSS, in both themes.

| Light | Dark |
|---|---|
| ![Style guide, light](screenshots/styleguide-light.jpg) | ![Style guide, dark](screenshots/styleguide-dark.jpg) |
