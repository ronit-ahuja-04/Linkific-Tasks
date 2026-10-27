# Git Practice Log & Learning Record

**Intern:** Ronit Ahuja  
**Date:** Tuesday, 27 October 2026  
**Context:** Month 1, Day 3 — Git, GitHub & Package Managers  

---

## 1. Tutorials & Video Training (V-1)

| Topic / Title | Source / Channel | Duration | Key Takeaways |
|---|---|---|---|
| Git & GitHub Crash Course | Traversy Media / Fireship | 1.0 hr | Three-stage architecture (Working Directory, Index/Staging, Repository), commit hashing, remote sync |
| npm & package.json Deep Dive | Programming with Mosh | 0.8 hr | Semantic versioning rules, lockfile determinism, scripts automation, devDependencies vs dependencies |
| Git Workflow & Merge Conflicts | The Net Ninja | 0.7 hr | Feature-branch lifecycle, fast-forward vs merge commits, resolving merge markers |

---

## 2. Local Git Plumbing Verification (`git-scratch`)

Conducted in local scratch repository `/Users/ronitahuja/.gemini/antigravity-ide/scratch/Day3/git-scratch`:

### Terminal Execution Output:
```
Initialized empty Git repository in /Users/ronitahuja/.gemini/antigravity-ide/scratch/Day3/git-scratch/.git/
[master (root-commit) b7f8c80] chore: initial scratch commit
 1 file changed, 1 insertion(+)
 create mode 100644 practice.txt

diff --git a/practice.txt b/practice.txt
index e97fd15..8731ba0 100644
--- a/practice.txt
+++ b/practice.txt
@@ -1 +1,2 @@
 # Git Scratchpad
+Line 2: testing diff

[master c1c5f00] feat: add line 2 for staging demo
 1 file changed, 1 insertion(+)
Saved working directory and index state WIP on master: c1c5f00 feat: add line 2 for staging demo
Dropped refs/stash@{0} (dba0a74533549dc10aaee7dab813d2cb07b19afc)

* c1c5f00 (HEAD -> master, tag: v0.1.0) feat: add line 2 for staging demo
* b7f8c80 chore: initial scratch commit
```

---

## 3. GitHub Fork & Upstream Sync (GH-2)
* **Forked Repository:** `octocat/Spoon-Knife`
* **Personal Fork:** `https://github.com/ronit-ahuja-04/Spoon-Knife`
* **Remote Verification:**
  ```bash
  origin    git@github.com:ronit-ahuja-04/Spoon-Knife.git (fetch)
  origin    git@github.com:ronit-ahuja-04/Spoon-Knife.git (push)
  upstream  https://github.com/octocat/Spoon-Knife.git (fetch)
  upstream  https://github.com/octocat/Spoon-Knife.git (push)
  ```
* Verified synchronization using GitHub's **Sync fork** interface without opening unsolicited pull requests upstream.

---

## 4. Conventional Commits Summary
All 25+ non-merge commits across our 8 PRs follow the Angular Conventional Commits specification:
* `feat:` new user-facing functionality
* `fix:` bug fixes and error resilience
* `docs:` documentation updates
* `chore:` dependency management and tooling
* `test:` unit and regression tests
