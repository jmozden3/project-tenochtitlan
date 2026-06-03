# Nightly Builder

An autonomous agent that builds **one** living web artifact a little every night
and keeps a public diary of its reasoning. Runs on a disposable cloud VM, in an
isolated container, on a Pro subscription. This is a curiosity experiment, not a
production system.

## How it works
Every night, a cron job runs `nightly.sh`, which:
1. starts the agent (Claude Code, headless) inside a container whose only
   writable area is this repo;
2. the agent reads `STATE.md` + `site/log/JOURNAL.md`, makes **one** change
   inside `site/artifact/`, writes a diary entry, updates state;
3. the host checks the artifact still loads, then commits and pushes;
4. Vercel auto-deploys the push.

The agent is *stateless* between runs — the repo is its only memory.

## Layout
| Path | What it is | Agent may edit? |
|------|------------|-----------------|
| `CONSTITUTION.md` | the standing prompt / the rules | no |
| `nightly.sh` | host wrapper: run, gate, commit, push | no |
| `Dockerfile` | the isolated builder image | no |
| `.claude/settings.json` | permission deny-list | no |
| `site/index.html` | durable public shell (artifact pane + diary) | no |
| `site/artifact/` | **the thing being built** | yes |
| `site/log/JOURNAL.md` | the public diary | yes (append) |
| `STATE.md` | working memory between runs | yes |

Served root on Vercel is **`site/`**.

## Setup runbook (summary)
1. Create a GitHub repo (public), push this scaffold. Make a fine-grained PAT
   scoped to write to *only* this repo.
2. Spin up a small Ubuntu VM. SSH in. Put nothing else on it.
3. Install Node, Docker, git, and Claude Code (`npm i -g @anthropic-ai/claude-code`).
4. Run `claude` once interactively to log in to your subscription. Ensure no
   `ANTHROPIC_API_KEY` is set in the environment.
5. Clone the repo onto the VM; configure git to push with the PAT.
6. `docker build -t nightly-builder .`
7. `bash nightly.sh` once by hand and watch the whole chain work.
8. Import the repo into Vercel; set **Root Directory = site**; confirm a push deploys.
9. Add a CNAME for your subdomain → Vercel.
10. Add a cron job to run `nightly.sh` early morning (mind the VM's UTC clock).
11. Logs land in `logs/`. To stop: comment out the cron line or power off the VM.

## Loosening the leash later
The town spine lives in one line of `CONSTITUTION.md`. To widen toward total
freedom, change the project line to something like *"build any self-contained
visual web page you believe is worth making."* It's a knob — edit and the next
run obeys.
