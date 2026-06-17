# Resolute Portal — Team Git Workflow Runbook

A simple guide for everyone on the team. Follow this every day to avoid breaking each other's work.

---

## The Golden Rule

> **Never commit directly to `main`. Always work on your own branch.**

---

## Who Owns What

Agree on this before starting. Two people editing the same file = conflict.

| Person | Branch | Files to work on |
|---|---|---|
| Person A | `feature/supabase-orders` | `src/context/OrderContext.jsx`, `src/data/mockData.js` |
| Person B | `feature/supabase-auth` | `src/context/AuthContext.jsx`, `src/pages/LoginPage.jsx` |
| Person C | `feature/supabase-activity` | `src/pages/admin/AdminDashboard.jsx`, `src/components/AssignModal.jsx` |

Change the names and files to match your actual team split.

---

## First-Time Setup (do this once)

```bash
# Check you are connected to the shared repo
git remote -v
# Should show: origin  https://github.com/Sagar-Dabasia/Resolute.git

# Get the latest code
git checkout main
git pull origin main

# Create your personal branch (use your own name/feature)
git checkout -b feature/supabase-orders
```

---

## Every Morning (start of work)

```bash
# Step 1: Save any unsaved work first
git add .
git commit -m "wip: what you were doing"

# Step 2: Get your teammates' latest changes
git fetch origin

# Step 3: Bring their changes under your work
git rebase origin/main
```

If Step 3 shows a conflict, see the **Fixing Conflicts** section below.

---

## While Working (save often)

```bash
# Save your work with a clear message
git add src/context/OrderContext.jsx
git commit -m "feat: connect orders to Supabase"

# Or add all changed files at once
git add .
git commit -m "fix: handle missing assignedTo field"
```

Good commit message examples:
- `feat: add Supabase orders table`
- `fix: resolve null user crash in modal`
- `wip: half done with auth migration`

---

## Sharing Your Work (push to GitHub)

```bash
# Push your branch to GitHub
git push origin feature/supabase-orders
```

Do this at least once a day so your work is backed up and your teammates can see it.

---

## When Your Feature is Done (Pull Request)

1. Push your branch one last time:
   ```bash
   git push origin feature/supabase-orders
   ```

2. Go to [github.com/Sagar-Dabasia/Resolute](https://github.com/Sagar-Dabasia/Resolute)

3. You will see a yellow banner: **"Compare & pull request"** — click it

4. Write a short description of what you built

5. Ask a teammate to review it

6. Once approved, click **"Merge pull request"**

7. Tell the team: "I merged feature/supabase-orders into main"

---

## After Someone Merges (sync your branch)

When a teammate merges their branch into main, run this:

```bash
git checkout main
git pull origin main

git checkout feature/your-branch
git rebase origin/main
```

This brings their changes into your branch so you are always building on the latest code.

---

## Fixing Conflicts

A conflict happens when two people edited the same lines in the same file. Git will pause and tell you which file has a conflict.

**Step 1:** Open the conflicting file in VS Code. You will see this:

```
<<<<<<< HEAD (your changes)
const myCode = 'this is what I wrote'
=======
const myCode = 'this is what my teammate wrote'
>>>>>>> origin/main
```

**Step 2:** Delete the conflict markers and keep the correct code (or combine both):

```
const myCode = 'the correct final version'
```

**Step 3:** Save the file, then continue:

```bash
git add src/the-conflicting-file.jsx
git rebase --continue
```

**Tip:** VS Code shows conflict files in red in the sidebar and has Accept Current / Accept Incoming buttons to make this easier.

---

## Quick Reference Cheat Sheet

```
START OF DAY
  git fetch origin
  git rebase origin/main

WHILE WORKING
  git add .
  git commit -m "feat: what you did"

END OF DAY
  git push origin feature/your-branch

TEAMMATE MERGED? (after they tell you)
  git checkout main && git pull origin main
  git checkout feature/your-branch
  git rebase origin/main

FEATURE DONE?
  git push origin feature/your-branch
  → Open Pull Request on GitHub
  → Get review → Merge
```

---

## Common Mistakes to Avoid

| Mistake | What to do instead |
|---|---|
| `git push origin main` | Never push to main directly |
| Working for 3 days without pushing | Push every day — `git push origin feature/your-branch` |
| Two people editing the same file | Agree on file ownership before starting |
| Forgetting to rebase before pushing | Always `git rebase origin/main` before a pull request |
| Committing `node_modules` | Already in `.gitignore` — don't touch it |

---

## Getting Help

If you are stuck or scared you will break something:

1. **Do not force push** (`git push --force`) — this can erase teammates' work
2. Ask a teammate before doing anything destructive
3. `git status` always tells you exactly where you are
4. `git log --oneline -10` shows the last 10 commits so you can see what happened
