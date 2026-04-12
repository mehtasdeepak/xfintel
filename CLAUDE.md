# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

XFintel is a financial intelligence web application built with Next.js 16, TypeScript, and Tailwind CSS v4. It is in early development — no database or auth has been set up yet.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 (configured via `postcss.config.mjs`, no `tailwind.config.*` file — v4 uses CSS-first config in `app/globals.css`)
- **Language**: TypeScript 5

### Directory layout

```
app/              # App Router — routes, layouts, pages
  layout.tsx      # Root layout (html/body, global font, metadata)
  page.tsx        # Home page "/"
  globals.css     # Global styles + Tailwind v4 directives
lib/
  supabase.ts     # Supabase client singleton (use this everywhere)
supabase/
  schema.sql      # Full DB schema — run in Supabase SQL editor to provision tables
public/           # Static assets served at "/"
```

Path alias `@/*` maps to the project root, so `import { x } from "@/app/..."` works everywhere.

### Key conventions

- No `src/` directory — all source lives at the repo root.
- Tailwind v4: use `@import "tailwindcss"` in CSS; do not create a `tailwind.config.ts`.
- Co-locate components with the route that owns them; lift to a top-level `components/` folder only when shared across multiple routes.

## Database (Supabase)

Tables: `influencers`, `posts`, `watchlist`. See `supabase/schema.sql` for full definitions.

- `posts.category` is constrained to: `trade_call | upside | downside | exit | portfolio | opinion`
- `posts.ticker_symbols` is a `text[]` with a GIN index for array queries
- `watchlist.user_id` is a bare `uuid` for now — it will reference `auth.users` once auth is wired up
- Import the client via `import { supabase } from "@/lib/supabase"`
