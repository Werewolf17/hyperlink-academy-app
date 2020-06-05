CREATE TABLE IF NOT EXISTS activation_keys
(
    key_hash      text NOT NULL PRIMARY KEY,
    created_time  text NOT NULL,
    password_hash text NOT NULL,
    email         text NOT NULL,
    username      text NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_keys
(
    key_hash      text PRIMARY KEY NOT NULL,
    created_time  text NOT NULL,
    email         text NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    username      text NOT NULL UNIQUE,
    email         text NOT NULL UNIQUE,
    password_hash text NOT NULL UNIQUE,
    display_name  text,
    bio           text,
    link          text
);

CREATE TABLE IF NOT EXISTS courses (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    name          text NOT NULL,
    category_id   integer NULL,
    duration      text NOT NULL,
    invite_only   boolean NOT NULL DEFAULT false,
    description   text NOT NULL,
    cost          real NOT NULL,
    prerequisites text NOT NULL
);

CREATE TABLE IF NOT EXISTS course_maintainers (
    course        text REFERENCES courses(id) NOT NULL,
    maintainer    text REFERENCES people(id) NOT NULL,
    PRIMARY KEY (course, maintainer)
);

CREATE TABLE IF NOT EXISTS admins (
    person text references people(id) UNIQUE NOT NULL PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS course_cohorts (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    start_date    text NOT NULL,
    facilitator  text REFERENCES people(id) NOT NULL,
    course        text REFERENCES courses(id) NOT NULL,
    completed     text
);

CREATE TABLE IF NOT EXISTS people_in_cohorts (
    person_id     text REFERENCES people(id) NOT NULL,
    cohort_id   text REFERENCES course_cohorts(id) NOT NULL,
    PRIMARY KEY (person_id, cohort_id)
);

CREATE TABLE IF NOT EXISTS course_invites (
    course        text REFERENCES courses(id) NOT NULL,
    email         text NOT NULL,
    PRIMARY KEY (course, email)
);
