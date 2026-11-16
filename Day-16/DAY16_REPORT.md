# Day 16 Report: Firebase Storage and a real-time dashboard, built into FlowLane

**Programme:** Linkific internship, Month 1 (training phase), Day 16
**Author:** Ronit Ahuja
**Project:** FlowLane with Firebase Storage and a live dashboard, in `Day-16/flowlane-firebase` (the Day 15 FlowLane, copied and extended)
**Pull requests:** #76 (start from the Day 15 app), #77 (Storage layer, rules, tests), #78 (profile photo and task images), #79 (Live dashboard, README, PRD), #80 and #81 (local emulator mode, upload timeout and its fix)
**Time spent:** [fill in your hours]

## 1. Summary

Day 16 is Firebase end to end: authentication, Firestore, real-time listeners and file uploads, finished as one complete app. FlowLane already ran on Firebase Auth and Firestore, so most of the task list was met by the app I already had. Rather than build a second, smaller blog or todo app, I closed the two gaps in the list and documented the rest. The gaps were **file uploads** (Cloud Storage) and a **real-time dashboard**. Users can now upload a profile photo and attach up to six images to a task, and a new Live tab shows project numbers that change by themselves when anyone on the project changes the board. A README takes someone from an empty Firebase console to a running app.

## 2. Deliverables checklist

| Deliverable | Status | Where |
|---|---|---|
| React app integrated with Firebase | Done (Auth, Firestore, and now Storage, from one config module) | `src/lib/firebase.js` |
| Authentication working (email + Google) | Done (already in the app; sign up, sign in, sign out, current user, `onAuthStateChanged`) | `src/context/AuthContext.jsx` |
| Firestore CRUD operations | Done: projects, tasks, users, invitations, chat, notifications, with `where`, `orderBy` and `limit` queries | `src/store/`, `src/lib/useLatestMessages.js` |
| Real-time updates implemented | Done: every list is an `onSnapshot` listener; chat, board, notifications, and the new Live tab | `src/store/listeners.js` |
| File upload functionality | Done: profile photo and task images; upload with progress, download URLs, display, delete | `lib/storage.js`, `AvatarUploader.jsx`, `TaskAttachments.jsx`, `storage.rules` |
| Complete application (blog, chat, or todo) | FlowLane: a collaborative task board with chat and a dashboard | `Day-16/flowlane-firebase` |
| Protected routes based on auth | Done (since Day 15) | `src/components/RouteGuards.jsx` |
| User profile stored in Firestore | Done: `users/{uid}`, now including the photo | `lib/profilePhoto.js` |
| README with Firebase setup guide | Done | `flowlane-firebase/README.md` |
| Watch tutorials, read docs | Mine to do | not recorded here |

## 3. What was built

- **Profile photo.** Pick an image on the Profile page, watch the progress bar, and the new photo appears on the page, in the header and for teammates, without a reload. Replacing or removing a photo deletes the old file from Storage.
- **Task images.** In a task, add up to six images (several at once). They show as thumbnails that open full size in a new tab, with name and size; the owner can remove one. A teammate with the task open sees an image appear live. Deleting a task or a project deletes its image files.
- **Storage rules.** Images only (PNG, JPEG, GIF, WebP; SVG is refused because it can carry scripts), 2 MB for photos, 5 MB for task images. A photo can be changed only by its owner. A task image can be read only by members of that project (the rule reads the project's Firestore document) and added or deleted only by the project owner.
- **Live tab.** A third view next to Board and Activity: task, done, in-progress, high-priority and image counts; tasks per column and per priority as bars with text alternatives; who has how many open and done tasks; every project the user belongs to; and the five newest chat messages. A line says "Live" and how long ago the last update arrived. Nothing is polled: the numbers are computed from the board in Redux, which an `onSnapshot` listener already keeps current.
- **Setup guide and local mode.** The README covers the Firebase console steps, the `.env` keys, deploying the rules, the emulators, a troubleshooting table, and a mapping of every Day 16 task item to the code. `npm run dev:local` runs the whole app on the Auth, Firestore and Storage emulators, so uploads work without a real Storage bucket.

## 4. Findings

- **Most of Day 16 was already there.** Seeing that early avoided a duplicate app. The honest work was the gap analysis: mapping each bullet of the task list to code, and building only what was missing.
- **A Firestore listener is already a dashboard feed.** The Live tab needed no new fetching. Because the board is kept live in Redux, a pure function over it (`lib/stats.js`) gives numbers that update for everyone. The projects listener even delivers whole project documents, so "all your projects" cost no extra listener.
- **Storage security is a separate system.** Firestore rules do not cover Storage. The attachment rules reach into Firestore (`firestore.get`) to find the project's owner and members, so a file is protected by the same membership as the board.
- **The browser is not the protection.** The size and type checks in the browser exist for friendly messages; `storage.rules` is what actually stops a bad upload, and it has its own tests.

## 5. Quality results

| Layer | Result |
|---|---|
| Unit and component tests | 556 passing (Day 15's tests plus storage helpers, the profile photo flow, the avatar uploader, task attachments and their Redux thunks, the stats functions, the Live tab, the latest-messages hook; translations complete in English, Spanish and Hindi) |
| API tests | 110 passing (unchanged) |
| Security-rules tests | 38 passing: Firestore's 23 plus 15 for Storage (avatars, attachments, size and type limits, outsiders, signed-out visitors, everything else closed) |
| Browser end-to-end tests | 134 tests in Chrome against the Auth, Firestore and Storage emulators. In the last full run 132 passed and 2 failed; both are flaky tests from earlier days (see section 6) |
| Accessibility | axe-core WCAG 2.1 AA: zero violations on the profile page, the task panel with images, and the Live tab, light and dark |
| Lint | no new warnings (the existing ones are in the Calendar and Chat files) |

## 6. Problems found and fixed

- **Removing a photo failed with "Something went wrong".** The Firebase Auth backend rejects `updateProfile({ photoURL: null })` with "photoUrl must be a string", although `null` is documented as the way to clear it. An empty string works, and the app treats it as "no photo". A browser test found it.
- **A removed photo's file stayed in Storage about one run in six.** The file path was read from the Firestore user document, and right after a page load a plain read can answer from a half-empty local cache. Reading from the server fixed most runs; the lasting fix was to take the path from the photo's own URL, which already contains it, with Firestore only as a fallback. It was found by repeating the test twelve times.
- **The two rules test files broke each other.** They share one Firestore emulator and each clears it, so a test failed at random. They now run one after the other.
- **`.visually-hidden` had never been defined** in the stylesheet (the Settings language legend used it). It is now, which the new file inputs also need.
- **The upload sat at "Uploading... 0%" forever** when Storage was not set up on the real project: Firebase's default is to retry for ten minutes. Uploads now fail after 20 seconds with a clear message. My first version of this fix called a function that two unit-test files could not load; I merged before reading the test result, saw the failure on the next run, and fixed it in the following PR (#81).
- **Two failures in the last full run are flaky tests from earlier days.** "The people search filters the list" passed three out of three when rerun alone. "The GitHub token is rejected, the dialog offers Reconnect" fails the same way when run several times in a row in the untouched Day 15 app, so it is not caused by Day 16. Both are written down in the README rather than hidden.

## 7. How the work was done

I read the Day 15 app first and mapped the task list to it, which showed that uploads and a real-time dashboard were the gaps. I then worked in milestones, each a branch and a pull request: the Storage layer and its rules tests, the two upload features, the Live tab, the documentation, and two small follow-ups. Every feature got unit tests, a browser test with two real users where the point is "teammates see it live", and an accessibility check. Several bugs only showed up in the browser tests, not in the unit tests with mocks.

## 8. Limits

- **Not verified: Firebase Storage on a real project.** When I tried, the Storage bucket did not exist on my Firebase project (the Storage API answered 404 and the Firebase CLI said Storage had not been set up). Creating it needs the Blaze (pay-as-you-go) plan. The automated tests and the checks on this day's work ran against the Storage emulator, which applies the real rules but is not Google's service. The README has a checklist for the first real deploy.
- If a file delete fails, the file stays in Storage as an orphan; the app never shows a broken image, because the entry is removed first.
- Only the project owner can add task images (the same people who can edit tasks). Images are not resized or compressed.
- Deleting a project removes the images of the project that is open, the only board the browser holds.
- Only Chrome was tested, and no real phone.

## 9. Next steps

1. Upgrade the Firebase project to Blaze (with a budget alert), turn on Storage, deploy the rules with `firebase deploy --only firestore:rules,storage`, and run the real-project checklist.
2. Delete a project's images with a small server-side function so no file is left behind.
3. Resize images in the browser before upload, and allow members (not only the owner) to attach images if the product wants that.
