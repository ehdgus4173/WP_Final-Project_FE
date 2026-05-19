# WP_Final-Project_FE

# What's Today — Frontend

## Overview
A community web app for reading and discussing today's top news issues.
Issues are generated daily by AI and users can write posts and leave comments.

## Tech Stack
- Vanilla JS (no framework)
- Vite 5
- REST API (`/api`) — JSON over HTTP, JWT via httpOnly cookie

## Pages
| File | Route | Description |
|------|-------|-------------|
| `index.html` | `/` | Home — today's issues + archive |
| `board.html` | `/board.html?id=` | Issue detail + post list |
| `post.html` | `/post.html?id=` | Post detail + comments |
| `write.html` | `/write.html?issueId=` | Write / edit a post |
| `auth.html` | `/auth.html` | Login / Register |


## Getting Started
```bash
npm install
npm run dev
```
## Team(FE)
| Member | Pages |
|--------|-------|
| Kim Byungchan | Home, Board, Post Detail |
| Kim Sinwoo | Auth, Write |