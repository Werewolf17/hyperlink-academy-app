CREATE TABLE activation_keys
(
key_hash     text NOT NULL PRIMARY KEY,
time         text NOT NULL,
password_hash text NOT NULL,
email        text NOT NULL
);

CREATE TABLE password_reset_keys
(
key_hash text PRIMARY KEY NOT NULL,
time     text NOT NULL,
email    text NOT NULL
);

CREATE TABLE people (
id text NOT NULL PRIMARY KEY,
email text NOT NULL UNIQUE,
password_hash text NOT NULL UNIQUE
);
