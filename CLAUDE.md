# Claude Code Rules for "Is It Rhubarb Yet?"

**This file is the RULES.** It loads into every session, so keep it short. Where
a rule names a hook, the hook enforces it. Where it names none, this paragraph
is the only enforcement.

## Environment
- Claude runs inside the container started by `.devcontainer/run.sh`. Only this
  project is mounted, at `/workspace`. The SessionStart hook says if a session
  is NOT in the container: say so before doing anything else.
- A change to `.devcontainer/` (packages, toggles) reaches the container when
  I run that worktree's `.devcontainer/run.sh` from the host, or after merge.
  Tell me which.
- **Scratch files go in this project's `tmp/`** (gitignored), never the system
  `/tmp`, never `~`.
- Build: `sh tools/build.sh` (bakes today's verdicts with Node, then
  Jekyll; `bundle exec jekyll build` alone leaves them empty). Check the
  data file: `python3 -I tools/check-foods.py`. Kit tests:
  `python3 -m pytest`. Verdict tests: `node --test tests/verdict/verdict.test.js`.
  Card and icon tests, after a build: `node --test tests/cards/cards.test.js`.
- **Serving for me to look at:** read `PORTS` in `.devcontainer/kit.env`
  (`host:container` pairs), listen on `0.0.0.0:<container port>`
  (`bundle exec jekyll serve --host 0.0.0.0 --port 9000`), and give me
  `http://localhost:<host port>/`, plus the `baseurl` from `_config.yml`.
  No pair in `PORTS` means I can't reach it: ask me to add one.
- Visual checks: `node tools/dev/shoot.js <base-url> <label> [--engine webkit]
  [--scheme dark] [--click <text>] [--type <text>] <page>...` writes `tmp/shots/`
  (WebKit is the engine nearest Safari), and
  `node tools/dev/slice-png.js tmp/shots/<file>.png` cuts a tall one. Use these
  rather than writing new ones in `tmp/`. A page is relative to the base URL
  (`.`, `calendar/`), never `/calendar/`: a leading `/` reads as a file path
  outside the project and is blocked.
- The site is Jekyll with no plugins, vanilla JS and inline SVG only. No
  raster images, no npm, no new gems without asking.
- `_data/foods.yml` is the source of truth for seasons. `tools/make-foods.py`
  derived it once from the New Covent Garden Market PDF and is kept for
  provenance; rerunning it overwrites hand edits.
- Reads outside the working directory are refused, except `/opt`, other
  agents' worktrees and `/dev/null`. Reading and writing `/dev/null` is
  allowed in every form: as a redirection (`> /dev/null`, `2>/dev/null`,
  `< /dev/null`) and as a command argument (`curl -o /dev/null`). If the
  harness still asks, say yes.
- **Paths are relative to the working directory.** No leading `cd`, no
  `git -C`, no absolute paths into the project.
- **One plain command per Bash call.** Anything that needs a loop, a chain, a
  pipe, or a variable or `$(...)` expanded into a command goes in a script in
  `tmp/` with every argument written out literally, run as `sh tmp/<name>.sh`.
  Programs go in files too: never `python3 -c` or `node -e`.
  `guard-unanalyzable-bash.py` and `guard-inline-script.py` enforce it.
- **Never `sed` or `awk`**, in any form. Use the Edit tool, or Python in a
  file. `guard-sed.py` and `guard-awk.py` enforce it.
- **A command that must reach outside the working directory becomes a script
  in `scripts/`** with one fixed action and validated arguments, its safety
  stated in its header, and dry-run tests. Ask me before allowing it in
  `.claude/settings.json`. `scripts/git-diff-main-checkout.sh` is the model.

## Critical restrictions
- NEVER run `rm -rf` outside `tmp/` without asking me first.
- **NEVER change file permissions without asking me first, every time.** No
  `chmod`, `chown` or `sudo`. A yes to one is not a yes to the next.
  `.claude/settings.json` denies all three.
- NEVER read or create `.env` files or `.claude/settings.local.json`.
- NEVER alter shell dotfiles or system configuration.

## Git workflow
- A new worktree starts from the current HEAD (`worktree.baseRef` in
  `.claude/settings.json`), not `origin/main`. If one lacks work you expect,
  `git merge --ff-only <branch>`.
- **Never commit or merge on `main`**, in any repo in the tree.
  `guard-main-branch.py` enforces it. Starting new work on `main`? Branch first.
- **Check `git branch --show-current` in its own tool call immediately before
  every commit.** Run it in the same command and it prints after the commit has
  already happened.
- Commit freely. Write the message to a file: `git commit -F tmp/msg.txt`.
- A commit subject starts with a prefix: `(feature)`, `(fix)`, `(styling)`,
  `(design)`, `(data)`, `(docs)`, `(refactor)`, `(test)` or `(chore)`.
- **Never `git reset --hard`, `git checkout --`, `git restore` or `git clean -f`
  over a dirty tree without asking me.** `guard-destructive-git.py` enforces it.
  To set work aside, use `git stash push -u -m <tag>`.
- **From a worktree, see my uncommitted edits in the main checkout** with
  `sh scripts/git-diff-main-checkout.sh` (`--stat`, or `--patch
  tmp/<name>.patch` for `git apply`).
- **Update main without checking it out:** `sh scripts/git-fetch-main.sh`, then
  `git merge origin/main`.
- **The workflow:** push the branch with
  `sh scripts/git-push-agent.sh <branch>:<branch>`, then open the PR with
  `sh scripts/gh-write.sh pr-create <repo> <branch> "<title>" tmp/body.md`.
  **I review and merge. Claude never merges, approves or closes a PR as
  merged.** After I merge: fetch, delete the branch locally and remotely
  (`sh scripts/git-push-agent.sh :<branch>`), and branch afresh.
- **One PR per sitting, not one per topic.** Keep each topic as its own commit
  and list the commits in the PR description.
- **Every PR's base is `main`.** Never stack PRs. Before pushing to a branch,
  read the PR's state:
  `sh scripts/gh-read.sh repos/<owner>/<repo>/pulls/<N> --fields state,merged`.
- Put `Fixes #N` in the commit, AND one closing line per issue in the PR
  description. A PR the bot account opens does not close issues from commit
  messages alone.

## GitHub
- The agent account's token is `AGENT_GH_TOKEN`. It reaches only the
  repositories in `scripts/github.conf`, or in a gitignored
  `scripts/github.local.conf` when there is one. **Use the wrappers in
  `scripts/`, never bare `gh` or `git push`.**
- **Never print, echo, log or commit the token, and never put its name in an
  `echo` or `printf`.** `guard-token-expansion.py` enforces it. To find out
  whether it works, use it and read the 401/403.
- **Never create issues or PRs in a burst.** Many creations in an hour get the
  account flagged as spam, and GitHub then hides everything it ever wrote. A
  batch is ONE issue with a checklist.
- Never change repository settings, secrets, Actions settings or collaborators.
  A Pages workflow publishes nothing until I set Settings → Pages → Source to
  GitHub Actions: when you add one, say so in the PR description.

## Writing
- **A code comment states a constraint the code cannot show**, in the present
  tense. No dates, no history, no "used to". The story goes in the commit
  message.
- **When code changes, rewrite its comment.** Never append a paragraph beneath
  the old one.
- Name files, never line numbers, in documents and comments.

## Working with me
- Ask me decisions as you hit them, and bring the fact that forces the
  decision.
- Do not trust a document over the code. If they disagree, the code wins and
  the document gets fixed.
- When you finish, say what changed and where, what you verified and how,
  which issues are touched, which PRs are waiting on me, and what is undone
  and why.
