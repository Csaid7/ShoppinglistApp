-- Up Migration

CREATE TABLE households (
  id            integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          text        NOT NULL,
  timezone      text        NOT NULL DEFAULT 'America/New_York',
  reminder_time time        NOT NULL DEFAULT '18:00',
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id integer     NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE items (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id integer     NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name         text        NOT NULL CHECK (length(trim(name)) > 0),
  status       text        NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'bought')),
  requested_by integer     REFERENCES users(id) ON DELETE SET NULL,
  bought_by    integer     REFERENCES users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  bought_at    timestamptz,
  -- an item is bought exactly when it has a bought_at time
  CHECK ((status = 'bought') = (bought_at IS NOT NULL))
);

-- one needed item per name per household; bought rows are history and not covered
CREATE UNIQUE INDEX items_one_needed_per_name
  ON items (household_id, lower(name))
  WHERE status = 'needed';

CREATE TABLE push_subscriptions (
  id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      integer     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id integer     NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  endpoint     text        NOT NULL UNIQUE,
  p256dh       text        NOT NULL,
  auth         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Down Migration

DROP TABLE push_subscriptions;
DROP TABLE items;
DROP TABLE users;
DROP TABLE households;
