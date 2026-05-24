# LogVault

> A modern self-publishing platform where anyone can write, anyone can read.

LogVault is a full-stack blog built with **TypeScript** (Next.js 14 frontend) and **C#** (ASP.NET Core 8 backend), backed by **PostgreSQL**. Every signed-in user can publish posts instantly — no editorial gatekeeping. It's designed around a Medium-style writer experience, with a bento-grid home page, a magazine-style reading view, and a built-in admin moderation panel for keeping the community safe.

---

## Demo credentials

> The reviewer can sign in with these accounts to see every part of the product.

| Role  | Email                   | Password    | What they can do                                                              |
| ----- | ----------------------- | ----------- | ----------------------------------------------------------------------------- |
| Admin | `admin@logvault.local`  | `admin2734` | Full access — moderate users, hide posts, resolve reports, plus all author features |
| Author | (register from `/register`) | choose your own | Publish posts, comment, react, bookmark, follow trending feeds |

Open **`http://localhost:3000`**, click **Sign in** in the top-right, and use the admin credentials. The **Admin panel** appears in the profile dropdown.

---

## 5-minute guided tour

A short script you can follow start-to-finish to see every major feature in roughly 5 minutes.

**Reader experience** (signed-out, then any account)

1. Open **`http://localhost:3000`** — the bento home loads with the trending carousel as the hero. Wait 4 seconds and watch it crossfade to the next slide. Hover the hero to freeze it; a small **PAUSED** chip appears.
2. Press **`⌘K`** (or `Ctrl+K`) — the search input expands. Type something like `cat` and watch the autocomplete suggestions appear in real time. Press **Enter** to submit.
3. Click **Trending tags** above the bento — explore `/tag/<name>` and notice the "You might also like" rail at the bottom showing posts from adjacent tags.
4. Click any post tile. On the post page, look for:
   - the **drop-cap** on the first paragraph
   - the **reading progress bar** at the very top of the viewport (it fills as you scroll)
   - the **floating Table of Contents** on the right (only at desktop ≥1280px)
   - the **reading time left** chip in the bottom corner
   - **code blocks** with syntax highlighting and a copy button, if the post has any
5. At the bottom of the post, hit **♥ Like** — a red heart bursts up from the button and fades. Click again to un-like.
6. Below the like row, write a comment (sign-in required) — it appears instantly. Click the **⋯** menu on your own comment → **Delete** → the styled confirm modal appears (not the browser default).
7. Hit **Save** on the post → check your saved posts at **`/bookmarks`** (also a bento grid).

**Writer experience** (any signed-in account)

8. Click **Write** in the top-right header — opens the editor modal directly on your dashboard at `/admin/posts`.
9. Type a title, paste a markdown body, optionally add a cover image via **Choose file**. The footer shows two CTAs: **Save as draft** (kept private) or **Publish post** (goes live).
10. Pick **Save as draft** first — the post shows on your dashboard with a dashed amber border and a **DRAFT** chip. Open it again → footer now offers **Publish now**.
11. Filter your dashboard with the **All / Published / Drafts** pills at the top.

**Admin experience** (sign in as `admin@logvault.local` / `Admin2734`)

12. Click your profile pill in the top-right → **Admin panel** (only shown to admins) → lands on `/admin/users`.
13. Top of the page: site-wide stats — Users · Admins · Banned · Posts (+ alarm-red tiles for Open reports and Hidden posts when they exist).
14. **Reports section** (visible when reports are open): click **Hide post** on a report row → the post becomes Hidden everywhere on the public site, and the report auto-resolves.
15. **Users table**: ban / unban / promote / demote any user with one click. Banned users immediately lose the ability to log in or publish.
16. **Posts table**: filter by `All / Hidden only`, search by title or author, hide or restore any post.

**Account flows worth a peek**

17. Sign out from the profile dropdown — friendly toast appears: *"Signed out. See you soon, Admin."*
18. Visit **`/register`** in a private window — three-step flow: welcome → community rules (must check the box) → form.
19. Visit **`/forgot`** → submit any email → if Resend is configured, a real email is delivered to that inbox within seconds.

---

## Highlights

### For readers
- **Bento-grid home page** — editorial layout with a featured hero, trending tags rail, and recently-published cards
- **Trending carousel** — three-slide auto-crossfade hero with dot-growth progress indicator (4-second dwell, pause-on-hover, respects `prefers-reduced-motion`)
- **Three feed modes** — Trending · Newest · Most loved (toggle via pill switcher)
- **Search with ⌘K** — global keyboard shortcut, debounced autocomplete suggestions, arrow-key navigation
- **Tag exploration** — `/tag/[slug]` pages with sibling-tag recommendations
- **Author profiles** — `/u/[handle]` with bio + stats + bento grid of their posts
- **Bookmarks** — private reading list at `/bookmarks` (one-tap save from any post)
- **One-emoji reactions** — heart toggle with burst animation; one reaction per reader per post
- **Threaded reading view** — markdown rendering with code syntax highlighting (Prism), Mermaid diagrams, drop-cap on the first paragraph, floating Table of Contents on desktop, reading progress bar at the top, estimated time-left chip
- **Comments** — instant publish, edit & delete your own
- **Dark / light mode** — full theme support with system-preference detection

### For writers
- **Publish instantly** — no approval queue; click *Publish post* and it's live
- **Save as draft** — `PostStatus.Pending` keeps drafts out of public view until you're ready
- **Rich editor modal** — title, slug, cover image upload (with file picker, drag-and-drop, type/size validation), excerpt, markdown body, tag autocomplete
- **Auto-save** — local-storage drafts every 500ms, restored when you reopen the editor
- **Owner-only actions** — Edit / Delete buttons appear on your own posts when viewing them publicly
- **Your dashboard** — `/admin/posts` shows all your posts with filter pills (All / Published / Drafts), stats bar (posts · readers · reactions · comments), inline editor
- **Author byline** — every post shows the writer's name + avatar, linkable to their profile

### For admins
- **Site-wide moderation dashboard** at `/admin/users`
- **Open reports queue** — readers can flag posts (Spam · Harassment · Illegal · Misinformation · Other); admins see them with reporter + reason + post preview, with one-click *Hide & resolve* / *Resolve* / *Dismiss*
- **User moderation** — ban / unban / promote to admin / demote, with confirmation modals
- **Post moderation** — search by title or author, filter by status, hide or restore any post
- **Stats overview** — total users · admins · banned · posts · open reports · hidden posts

### Account & security
- **Multi-step registration** — welcome → community rules → form (required agreement to community rules, stored as `AcceptedRulesAt`)
- **Forgot password** — email-based reset via [Resend](https://resend.com) (1-hour-expiry token, one-time use, auto-sign-in on completion)
- **Banned account guard** — banned users cannot log in or publish, even with a valid JWT
- **Sign-out toast** — friendly farewell message confirming sign-out

### Accessibility
- Skip-to-content link (becomes visible on `Tab` focus)
- Visible focus rings on all interactive elements
- `aria-label` on icon-only buttons
- `aria-live="polite"` on toasts so screen readers announce them
- `prefers-reduced-motion` respected on carousel, heart-burst, animated dots, page transitions
- Tab order matches visual order; keyboard-only navigation supported throughout
- WCAG 4.5:1 contrast in both light and dark mode

---

## Tech stack

Two languages power the project end-to-end:

- **TypeScript** — the entire frontend (Next.js App Router pages, React components, API client, types)
- **C#** — the entire backend (ASP.NET Core Web API, controllers, services, EF Core entities)

| Layer        | Choice                                                                 |
| ------------ | ---------------------------------------------------------------------- |
| Frontend     | **Next.js 14** (App Router) · **TypeScript** · **Tailwind CSS** · **next-themes** |
| Markdown     | `react-markdown` + `remark-gfm`, `react-syntax-highlighter`, Mermaid    |
| Backend      | **C# 12** on **ASP.NET Core 8** Web API                                 |
| ORM          | **Entity Framework Core 8** with **Npgsql** (PostgreSQL provider)       |
| Database     | **PostgreSQL 17**                                                       |
| Auth         | **JWT bearer** tokens, **BCrypt.Net** for password hashing              |
| Email        | **Resend** HTTP API (`SmtpEmailSender` and `ConsoleEmailSender` fallbacks available) |
| Fonts        | **Inter** (sans) + **Fraunces** (display serif) via `next/font`         |

---

## Project structure

```
LogVault/
├── README.md                          ← you are here
├── docker-compose.yml                 ← optional: Postgres in Docker
│
├── backend/
│   ├── Blogfox.sln
│   └── Blogfox.Api/
│       ├── Controllers/               ← Auth, Posts, Comments, Reactions,
│       │                                Bookmarks, Tags, Authors, Uploads,
│       │                                Reports, Admin
│       ├── Data/
│       │   ├── AppDbContext.cs
│       │   └── Migrations/            ← EF migrations (auto-applied on startup)
│       ├── Dtos/                      ← Request/response records
│       ├── Entities/                  ← User, Post, Tag, Comment, PostReaction,
│       │                                Bookmark, PasswordResetToken, Report …
│       ├── Services/
│       │   ├── JwtTokenService.cs
│       │   ├── SlugGenerator.cs
│       │   └── IEmailSender.cs        ← Resend → SMTP → Console fallback chain
│       ├── wwwroot/uploads/           ← uploaded cover images (gitignored)
│       └── Program.cs
│
└── frontend/
    └── src/
        ├── app/                       ← Next.js App Router pages
        │   ├── layout.tsx             ← header + main + skip-link + providers
        │   ├── page.tsx               ← Home (bento + carousel)
        │   ├── posts/[slug]/page.tsx  ← Article reading view
        │   ├── login/page.tsx
        │   ├── register/page.tsx      ← Multi-step: welcome → rules → form
        │   ├── forgot/page.tsx
        │   ├── reset/page.tsx
        │   ├── tag/[slug]/page.tsx
        │   ├── u/[handle]/page.tsx
        │   ├── bookmarks/page.tsx
        │   ├── admin/posts/page.tsx   ← Author dashboard (your posts)
        │   └── admin/users/page.tsx   ← Admin moderation panel
        ├── components/                ← Bento, Carousel, Comments, Reactions,
        │                                ReportButton, Header, etc.
        └── lib/                       ← api client, auth context, utils
```

---

## Prerequisites

| Tool        | Version  | Install                                               |
| ----------- | -------- | ----------------------------------------------------- |
| Node        | 20+      | `nvm install 20` or [nodejs.org](https://nodejs.org)  |
| .NET SDK    | 8.0      | [dotnet.microsoft.com/download](https://dotnet.microsoft.com/download/dotnet/8.0) |
| PostgreSQL  | 14+      | local install **or** `docker compose up -d`           |

---

## Quick start

### 1. Configure the backend secrets

The backend reads from `backend/Blogfox.Api/appsettings.Development.local.json`
(gitignored). Create it with:

```json
{
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=blogfox;Username=blogfox;Password=YOUR_PASSWORD"
  },
  "Jwt": {
    "SigningKey": "any-long-random-string-at-least-32-characters"
  },
  "Resend": {
    "ApiKey": "re_YOUR_RESEND_KEY",
    "FromAddress": "onboarding@resend.dev",
    "FromName": "LogVault"
  }
}
```

> The `Resend` block is optional. If omitted, password-reset emails fall back to
> the console logger so you can copy the reset link from the terminal during
> development.

### 2. Start PostgreSQL

Either use a local install with a `blogfox` database and user, **or**:

```bash
docker compose up -d           # starts Postgres on :5432
```

### 3. Run the API

```bash
cd backend
dotnet run --project Blogfox.Api
# → API live at http://localhost:5046
# → Swagger UI at http://localhost:5046/swagger
```

Migrations are applied automatically on startup. The first time you run it,
all tables are created.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 5. Sign in

Open `http://localhost:3000` → click **Sign in** in the top-right → use the
admin credentials in the box at the top of this README.

---

## API reference (high-level)

> Full request/response schemas are visible at `http://localhost:5046/swagger`
> when the API is running.

### Authentication
| Method | Path                          | Auth | Description                          |
| ------ | ----------------------------- | ---- | ------------------------------------ |
| POST   | `/api/auth/register`          | —    | Create account (must accept rules)   |
| POST   | `/api/auth/login`             | —    | Returns JWT + user payload           |
| POST   | `/api/auth/forgot`            | —    | Emails a reset link (always 200)     |
| POST   | `/api/auth/reset`             | —    | Consumes token, sets password        |

### Posts
| Method | Path                              | Auth          | Description                       |
| ------ | --------------------------------- | ------------- | --------------------------------- |
| GET    | `/api/posts`                      | —             | List with filters: `tag`, `search`, `sort`, `mine`, `page`, `pageSize` |
| GET    | `/api/posts/{slug}`               | —             | Single post; increments unique-viewer cookie |
| POST   | `/api/posts`                      | Author        | Create (defaults to Published; can save as Pending draft) |
| PUT    | `/api/posts/{id}`                 | Owner         | Edit own post; draft → published transition supported |
| DELETE | `/api/posts/{id}`                 | Owner         | Permanent delete                  |
| GET    | `/api/posts/{slug}/related`       | —             | Tag-based recommendations         |

### Engagement
| Method | Path                                          | Auth      | Description                |
| ------ | --------------------------------------------- | --------- | -------------------------- |
| GET    | `/api/posts/{slug}/comments`                  | —         | Approved comments          |
| POST   | `/api/posts/{slug}/comments`                  | User      | Post a comment (instant)   |
| PATCH  | `/api/comments/{id}`                          | Owner     | Edit comment               |
| DELETE | `/api/comments/{id}`                          | Owner     | Delete own comment         |
| GET    | `/api/posts/{slug}/reactions`                 | optional  | Counts + your reaction     |
| PUT    | `/api/posts/{slug}/reactions`                 | User      | Set/replace your reaction  |
| DELETE | `/api/posts/{slug}/reactions`                 | User      | Remove your reaction       |
| GET    | `/api/me/bookmarks`                           | User      | List your bookmarks        |
| POST   | `/api/posts/{slug}/bookmark`                  | User      | Save                       |
| DELETE | `/api/posts/{slug}/bookmark`                  | User      | Un-save                    |
| POST   | `/api/reports`                                | User      | Report a post              |

### Content & uploads
| Method | Path                                  | Auth | Description                          |
| ------ | ------------------------------------- | ---- | ------------------------------------ |
| GET    | `/api/tags`                           | —    | All tags with post counts            |
| GET    | `/api/tags/{slug}/related`            | —    | Discovery into adjacent tags         |
| GET    | `/api/authors/{handle}`               | —    | Public author profile + posts        |
| POST   | `/api/uploads`                        | User | Multipart upload (JPEG/PNG/WebP/GIF ≤ 5 MB) |

### Admin
| Method | Path                                                | Auth  | Description                              |
| ------ | --------------------------------------------------- | ----- | ---------------------------------------- |
| GET    | `/api/admin/stats`                                  | Admin | Site-wide counts                         |
| GET    | `/api/admin/users`                                  | Admin | Searchable user list                     |
| POST   | `/api/admin/users/{id}/{ban\|unban\|promote\|demote}` | Admin | User actions                           |
| GET    | `/api/admin/posts`                                  | Admin | All posts (any status), with filters     |
| POST   | `/api/admin/posts/{id}/{hide\|restore}`             | Admin | Toggle visibility                        |
| GET    | `/api/admin/reports?status=open`                    | Admin | Moderation queue                         |
| POST   | `/api/admin/reports/{id}/resolve?hide=true`         | Admin | Close report + optionally hide the post  |
| POST   | `/api/admin/reports/{id}/dismiss`                   | Admin | Close report with no action              |

---

## Architecture highlights

- **Unique-viewer counting** — anonymous viewers get a long-lived `bfvk` cookie. A composite-key `PostView(PostId, ViewerKey)` row is inserted on first visit; subsequent visits don't double-count.
- **Composite-PK reactions / bookmarks** — `PostReaction(PostId, ReactorKey)` and `Bookmark(UserId, PostId)` use composite primary keys to enforce one-per-user without application-level locks.
- **Soft moderation** — `PostStatus = Hidden` keeps the row in the DB but filters it from every public query, so admins can restore content if needed.
- **Email-sender selection** — `Program.cs` picks `ResendEmailSender` when `Resend:ApiKey` is set, falls back to `SmtpEmailSender` if SMTP is configured, otherwise uses `ConsoleEmailSender` so dev never breaks.
- **Force-dynamic SSR** for content pages (`/`, `/posts/[slug]`, `/tag/[slug]`, `/u/[handle]`) — server-rendered on every request for fresh data + correct cookie handling.
- **Server-component-safe TOC parser** — `extractToc()` lives in a pure `.ts` module so the server-rendered post page can parse markdown headings without crossing into client-component territory.

---

## Roadmap

Already shipped, working in this build:
- ✓ Bento home with hero carousel
- ✓ Drafts + publish flow
- ✓ Reactions, comments, bookmarks
- ✓ Tag pages with discovery rail
- ✓ Search with ⌘K shortcut
- ✓ Admin user + post + report moderation
- ✓ Email-based password reset (Resend)
- ✓ Multi-step registration with community-rules acceptance
- ✓ Hide-on-scroll header + skip-to-content link
- ✓ Reading TOC, reading-time-left chip, reading progress bar

On deck — not yet built:
- Follow another author + "Following" home feed
- In-app + email notifications (new comment / reaction / mention)
- Series / multi-part posts with prev-next navigation
- Inline-image uploads in the markdown editor (only cover image is uploadable today)
- Author analytics dashboard (`/u/{handle}/stats`)
- RSS feed at `/rss.xml`
- Weekly email digest

---

## License

Private project — not for redistribution.
