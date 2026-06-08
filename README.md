# What's Today

A daily-news discussion platform powered by AI-curated topics.
Every day an AI selects one trending issue, an admin reviews and publishes it, and users post opinions, vote, and discuss in threaded comments.


[![CI](https://github.com/ehdgus4173/WP_Final-Project_FE/actions/workflows/ci.yml/badge.svg)](https://github.com/ehdgus4173/WP_Final-Project_FE/actions/workflows/ci.yml)

## Live Demo

- **App**: https://wp-final-project-fe.onrender.com
- **API**: https://wp-final-projcet-be.onrender.com/api
- **API Docs (Swagger)**: https://wp-final-projcet-be.onrender.com/api/docs

> The backend runs on Render's free tier and sleeps after 50 seconds of inactivity. The first request after a long idle may take up to a minute to respond.

## Repositories

- **Frontend** (this repo): https://github.com/ehdgus4173/WP_Final-Project_FE
- **Backend**: https://github.com/ehdgus4173/WP_Final-Projcet_BE

## Team

| Member | Role |
|--------|------|
| Hong Junsoo |  Documentation · Coordination |
| Lim Donghyun | Backend · Database · AI integration |
| Kim Byungchan | Frontend (Home, Board, Post Detail, Admin) |
| Kim Sinwoo | Frontend (Login, Register, Write, OAuth, mention system) |

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Frontend** | Vanilla JS + Vite 8 | No framework overhead; multi-page input + HTML env replacement |
| **Backend** | Node.js + Express 4 | Unified JS stack |
| **Database** | Supabase (PostgreSQL 16) | Managed hosting + `pg_cron` for scheduled jobs |
| **Auth** | JWT (Bearer in `Authorization` header) + bcrypt | Stateless |
| **OAuth** | Supabase Auth (Google + GitHub) | Social login |
| **AI** | Google Gemini | Daily issue generation |
| **Deploy** | Render (Static Site + Web Service) | Free tier, auto-deploy on push |
| **API Docs** | Swagger UI (OpenAPI 3.0) | Served at `/api/docs` |
| **CI** | GitHub Actions | Build verification on every push |

## Core Features

- AI-curated daily issues with admin review (approve / reject / regenerate)
- Email/password signup + Google / GitHub social login (Supabase OAuth)
- Posts + threaded comments (1-depth replies)
- Upvote / downvote on posts with toggle semantics
- Likes on comments
- `@mention` autocomplete in comment textareas (post author + commenters)
- Inline reply form under each comment
- Click on a username or mention to scroll to that comment
- Responsive layout (desktop, tablet, mobile)
- Three-tier admin protection (UI hide → page-level role gate → backend `requireAdmin`)

## Pages

| File | Route | Description |
|------|-------|-------------|
| `index.html` | `/` | Home — today's issue + past issues archive |
| `board.html` | `/board.html?id=:issueId` | Issue detail + post list (sortable Top / Latest) |
| `post.html` | `/post.html?id=:postId` | Post detail + comments (reply, like, mention) |
| `write.html` | `/write.html?issueId=:id` or `?postId=:id` | Write a new post or edit existing |
| `login.html` | `/login.html` | Email/password login + social login |
| `register.html` | `/register.html` | Account creation |
| `callback.html` | `/callback.html` | OAuth callback handler (Google / GitHub) |
| `admin.html` | `/admin.html` | Admin-only — review pending AI candidates |

## Getting Started

### Prerequisites
- Node.js 20 LTS or later
- npm 10+

### Install & run

```bash
npm install
npm run dev
```

The dev server runs on `http://localhost:5173`.

### Environment variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Purpose | Required for |
|----------|---------|--------------|
| `VITE_API_URL` | Backend REST API base URL | All API calls |
| `VITE_SUPABASE_URL` | Supabase project URL | Google / GitHub OAuth |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key | Google / GitHub OAuth |

Without the Supabase variables, email/password login still works, but the OAuth buttons will be disabled. See `.env.example` for inline notes.

Vite injects these values into HTML at build time via the `%VITE_FOO%` token pattern; runtime code reads them off `window.__VAR__`.

### Production build

```bash
npm run build
npm run preview
```

The build output is in `dist/`. A custom Vite plugin copies the `js/` folder into `dist/js/` since the HTML files load scripts as non-modules.

## API Documentation

Full REST API documentation is served from the deployed backend at:

**https://wp-final-projcet-be.onrender.com/api/docs**

Authentication: send `Authorization: Bearer <JWT>` for any auth-required endpoint.

## Architecture Notes

- **Multi-page setup**: each HTML loads its own page-specific JS plus shared utilities (`api.js`, `shared.js`)
- **Shared API client**: a single `apiFetch` wrapper attaches the JWT, unwraps the `{ success, data }` response envelope, and exposes both `code` and `status` on thrown errors
- **Env injection**: Vite replaces `%VITE_*%` tokens in HTML at build/serve time; runtime code reads them off `window.__VAR__`
- **Optimistic UI**: comment likes and post votes update immediately; failures revert the change
- **Inline reply form**: clicking Reply opens a mini-form directly under the parent comment, not at the page bottom
- **ID type coercion**: backend returns BIGINT user IDs sometimes as string, sometimes as number depending on the route. Frontend uses `String(a) === String(b)` for all ID comparisons

## Security

- Passwords hashed with bcrypt (cost factor 10)
- JWT stored in `localStorage` under `wt_token`
- All user-supplied text passes through `escapeHTML` before DOM insertion (XSS mitigation)
- Admin actions guarded server-side via `requireAdmin` middleware — client-side checks are UX only
- `CRON_SECRET` for the AI generation endpoint stays server-side; admins trigger via a separate `/api/admin/regenerate-issues` endpoint
- Branch protection rules enforce that `main` and `develop` are updated only via pull request

## Continuous Integration

GitHub Actions runs on every push to `main` and `develop`, and on every pull request targeting either branch. The workflow runs `npm install` followed by `npm run build` to catch regressions before merge.

## Testing

Tests are part of the backend repository. See the backend README for `npm test` instructions.

## Deployment

The app deploys to Render automatically on every push to `main`.

| Service | Type | Build Command | Publish Directory |
|---------|------|---------------|-------------------|
| Frontend | Static Site | `npm install && npm run build` | `dist` |
| Backend | Web Service | (see backend repo) | — |

Both environment variable groups (`VITE_API_URL`, `VITE_SUPABASE_*`) must be configured in Render's dashboard for the deployed site to function fully.

## Git Workflow

- `main` — stable; only updated via PR from `develop`
- `develop` — integration branch; all feature work merges here first
- `feature/*`, `fix/*`, `chore/*`, `docs/*` — task branches cut from `develop`

Both `main` and `develop` are protected — direct pushes are rejected; every change goes through a pull request.

## AI Usage Disclosure

Per course policy, this project used AI assistants during development:
- **Claude (Anthropic)** — code generation, debugging, code review, documentation drafting
- **Google Gemini** — runtime use only (daily issue generation in production)

All AI-generated code was reviewed and modified by team members before commit. Team members are individually responsible for understanding and being able to explain any code attributed to them.

## License

This project is academic coursework and not licensed for redistribution.