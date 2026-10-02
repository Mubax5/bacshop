# Instructions for coding agents

## One repository and one app

- This checkout at `C:\Users\Muba Sayang\Documents\SaaS\Bacshop` is the canonical Bacshop repository and the source for the storefront at `http://127.0.0.1:4173/`.
- Before editing, confirm `git rev-parse --show-toplevel` points to this checkout. Keep all work in this repository.
- Do not create, clone, initialize, or switch to another repository, Git worktree, submodule, or sibling project folder unless the user explicitly asks for one.
- Do not recreate or use the former `C:\Downloaded Web Sites\www.tokopedia.com\bacshop-redesign` checkout or the duplicate `C:\Downloaded Web Sites\www.tokopedia.com\bacshop-push-stage` as a working copy or source. Older documents may mention those historical paths; this checkout is authoritative.
- Keep the existing Node HTTP app architecture: `server.js`, `index.html`, `app.js`, and `styles.css`. Do not introduce a second app architecture or replace it with Next.js.
- The normal local preview port is `4173`. Do not start a duplicate Bacshop preview on another port or stop/restart the user's running preview unless explicitly requested. Tests may use isolated temporary ports and temporary data.

## Changes and Git

- Verify each completed code change with the relevant checks, then commit it locally before reporting completion. Do not leave completed requested work uncommitted.
- Use the current branch by default. Do not create branches unless the user asks.
- Do not push to GitHub unless the user explicitly asks in that task. Preserve the existing `origin` remote.
- Do not commit `.env`, `.bacshop-private/`, uploaded user files, credentials, or other private runtime data. Keep all integration credentials in environment variables.
