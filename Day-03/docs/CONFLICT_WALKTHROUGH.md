# Case Study: Merge Conflict Simulation & Resolution

**Requirement:** GIT-8, GIT-9 (Branch Merging and Real Conflict Resolution)  
**Pull Requests Involved:** PR #6 (`day3/docs-usage-a`) and PR #7 (`day3/docs-usage-b`)  
**Target File:** `Day-03/README.md`  

---

## 1. How the Conflict Was Created

Two developer branches were branched from the exact same commit base on `main`:
1. **Branch A (`day3/docs-usage-a`)** modified lines 28–32 of `Day-03/README.md` to introduce a **markdown table**:
   ```markdown
   ### Basic Usage
   | Command | Options | Purpose |
   |---|---|---|
   | `npm start -- <username>` | Default | Generates public repository analysis |
   | `npm start -- <username> --all` | `--all` | Includes forks and archived repositories |
   | `npm run dev -- <username>` | `--all` | Runs CLI in active watch mode with nodemon |
   ```
2. **Branch B (`day3/docs-usage-b`)** modified the **exact same lines 28–32** with **bulleted CLI examples**:
   ```markdown
   ### Basic Usage
   Run the CLI tool directly with any public GitHub handle:
   * `npm start -- torvalds` - Generate report for Linus Torvalds
   * `npm start -- gaearon --all` - Generate report including forks and archived repos
   * `npm start -- ronit-ahuja-04` - View personal repository metrics
   ```

---

## 2. The Collision on GitHub

* **PR #6** was merged into `main` using **"Create a merge commit"**.
* Immediately upon PR 6 merging, **PR #7 on GitHub** displayed a yellow warning:
  > ⚠️ **"This branch has conflicts that must be resolved"**  
  > *Conflicted file: `Day-03/README.md`*

---

## 3. Local Conflict Inspection & Markers

In the local terminal on branch `day3/docs-usage-b`, running `git merge origin/main` triggered the halt:
```
Auto-merging Day-03/README.md
CONFLICT (content): Merge conflict in Day-03/README.md
Automatic merge failed; fix conflicts and then commit the result.
```

Git marked the conflicting lines directly in `Day-03/README.md`:
```markdown
<<<<<<< HEAD
Run the CLI tool directly with any public GitHub handle:
* `npm start -- torvalds` - Generate report for Linus Torvalds
* `npm start -- gaearon --all` - Generate report including forks and archived repos
* `npm start -- ronit-ahuja-04` - View personal repository metrics
=======
| Command | Options | Purpose |
|---|---|---|
| `npm start -- <username>` | Default | Generates public repository analysis |
| `npm start -- <username> --all` | `--all` | Includes forks and archived repositories |
| `npm run dev -- <username>` | `--all` | Runs CLI in active watch mode with nodemon |
>>>>>>> origin/main
```

### Explaining the Markers:
* `<<<<<<< HEAD`: Points to the local branch's incoming change (`docs-usage-b`).
* `=======`: The barrier separating the two competing edits.
* `>>>>>>> origin/main`: Points to the incoming changes already committed to `main` (from PR #6).

---

## 4. Manual Resolution & Verification

Rather than blindly picking one version and losing the other, we unified both:
1. Kept the **structured table** as the reference guide.
2. Kept the **bullet points** as concrete examples right underneath.
3. Completely deleted the conflict markers.

### Final Merged Content:
```markdown
### Basic Usage

| Command | Options | Purpose |
|---|---|---|
| `npm start -- <username>` | Default | Generates public repository analysis |
| `npm start -- <username> --all` | `--all` | Includes forks and archived repositories |
| `npm run dev -- <username>` | `--all` | Runs CLI in active watch mode with nodemon |

#### Quick Examples:
* `npm start -- torvalds` - Generate report for Linus Torvalds
* `npm start -- gaearon --all` - Generate report including forks and archived repos
* `npm start -- ronit-ahuja-04` - View personal repository metrics
```

### Finishing the Resolution:
```bash
git add Day-03/README.md
git commit -m "merge: resolve usage section conflict from main"
git push origin day3/docs-usage-b
```

Once pushed, PR #7 on GitHub turned green (**"This branch has no conflicts with the base branch"**) and was cleanly merged!
