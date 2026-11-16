# Day 16 Standup Walkthrough (about 5 minutes)

**Time spent:** [fill in your hours]. **Pull requests:** #76 to #81 (the main ones: #77 Storage layer, #78 uploads, #79 Live dashboard).

Before you start: `cd Day-16/flowlane-firebase && npm run dev:local` and open http://localhost:5173. That runs the app on the Firebase emulators, so uploads work without the paid plan. Sign up with any email. Have a second browser window (a private window works) signed in as a teammate who accepted an invitation to your project, with the task open. Keep `storage.rules` and `src/lib/stats.js` ready in the editor, and a small PNG on the desktop.

## 0:00 to 0:40, Opening (say)

"Day 16 was Firebase: authentication, Firestore, real-time listeners and file uploads. FlowLane, the project from the last few days, already runs on Firebase Auth and Firestore, with a real-time board and chat. So instead of building a second small app I checked the task list against it and built the two things that were missing: image uploads with Firebase Storage, and a real-time dashboard. I also wrote the Firebase setup guide."

## 0:40 to 3:30, Live demo (do and say)

1. **Profile photo.** Click the avatar, Upload photo, pick the PNG. "The file goes to Cloud Storage with a progress bar. Its download URL is saved on my Firebase Auth profile and on my Firestore user document, so teammates see it too." Point at the header avatar: "It already changed." Try a PDF: "Refused in the browser with a clear message, and refused again by the Storage rules, because the browser can always be bypassed."
2. **Task images.** Open a task, Add image, choose two files. "Up to six per task. They are written to the task with `arrayUnion`, so two people attaching at once can't overwrite each other." Click a thumbnail: "Opens full size." Switch to the second window: "My teammate sees the images appear without reloading, and they have no Add or Remove buttons: only the project owner can change them, in the UI and in the rules."
3. **Live tab.** Open the Live tab in the second window and keep both windows visible. In the first window add a task, then drag a card to Done. "No refresh. These numbers are computed from the board that a Firestore `onSnapshot` listener already keeps live, nothing is polled." Point at "Updated 3s ago", the bars, "Who has what", and the table of all projects. Send a chat message on the Activity tab: "The feed shows the five newest messages: that is a query ordered newest first with a limit of five."
4. **Delete cleanup.** Delete a task that has images. "Its files are deleted from Storage too."

## 3:30 to 4:15, Code (do and say)

Open `storage.rules`.

"Avatars: anyone signed in can see, only the owner can change, images only, under 2 MB. Task images: the rule reads the project's Firestore document to find its owner and members, so a file can only be reached by people on the project." Open `src/lib/stats.js`: "The Live tab is plain functions over the board: counts, priorities, who has what. Easy to test, and live because the board is."

## 4:15 to 4:50, Quality (say)

"556 unit tests, 110 for the API, 38 security-rules tests, 15 of them new for Storage, and 134 browser tests in Chrome against the emulators, with an accessibility audit on every new screen, light and dark. The browser tests found two real bugs: Firebase rejects clearing a photo with null, and a removed photo's file stayed in Storage one run in six because I read its path from a cache that could be empty after a reload. I now read it from the photo's own URL. In the last full run two older tests failed; they are flaky and I documented them."

## 4:50 to 5:00, Gaps and next (say)

"One thing I could not verify by the automated tests: real Firebase Storage. A new bucket needs the paid Blaze plan, so the tests ran on the emulator, which applies the real rules. [If you have since enabled Storage and tried a real upload, say so here.] Next: enable Blaze with a budget alert, deploy the rules and run the real-project checklist in the README."
