-- XFintel database schema
-- Run this in the Supabase SQL editor to create all tables.

-- 1. influencers
create table if not exists influencers (
  id                uuid primary key default gen_random_uuid(),
  x_handle          text not null unique,
  display_name      text not null,
  profile_image_url text,
  follower_count    integer,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- 2. posts
create table if not exists posts (
  id             uuid primary key default gen_random_uuid(),
  influencer_id  uuid not null references influencers (id) on delete cascade,
  x_post_id      text not null unique,
  content        text not null,
  category       text not null check (category in (
                   'trade_call', 'upside', 'downside', 'exit', 'portfolio', 'opinion'
                 )),
  ticker_symbols text[] not null default '{}',
  posted_at      timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists posts_influencer_id_idx  on posts (influencer_id);
create index if not exists posts_posted_at_idx      on posts (posted_at desc);
create index if not exists posts_ticker_symbols_idx on posts using gin (ticker_symbols);

-- 3. watchlist
create table if not exists watchlist (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,
  influencer_id uuid not null references influencers (id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (user_id, influencer_id)
);

create index if not exists watchlist_user_id_idx on watchlist (user_id);
