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

CREATE UNIQUE INDEX people_username_index on people (lower(username));
CREATE UNIQUE INDEX people_email_index on people (lower(email));

CREATE TYPE course_status AS ENUM ('draft', 'live', 'archived');
CREATE TYPE course_types as ENUM ('course', 'club');
CREATE TABLE IF NOT EXISTS courses (
    id            text NOT NULL UNIQUE PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name          text NOT NULL,
    type          course_types NOT NULL default('course')
    status        course_status NOT NULL DEFAULT 'draft',
    category_id   integer NULL,
    duration      text NOT NULL,
    invite_only   boolean NOT NULL DEFAULT false,
    description   text NOT NULL,
    cost          real NOT NULL,
    prerequisites text NOT NULL
);

CREATE TYPE template_types AS ENUM ('prepopulated', 'triggered');
CREATE TABLE IF NOT EXISTS course_templates (
    course        text REFERENCES courses(id) NOT NULL,
    content       text  NOT NULL,
    name          text NOT NULL,
    type          template_types NOT NULL default 'prepopulated',
    PRIMARY KEY (name, course)
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
    id            integer UNIQUE PRIMARY KEY,
    start_date    text NOT NULL,
    facilitator   text REFERENCES people(id) NOT NULL,
    course        text REFERENCES courses(id) NOT NULL,
    live          boolean NOT NULL DEFAULT(false),
    completed     text
);

CREATE TABLE IF NOT EXISTS people_in_cohorts (
    person        text REFERENCES people(id) NOT NULL,
    cohort        integer REFERENCES course_cohorts(id) NOT NULL,
    PRIMARY KEY   (person_id, cohort_id)
);

CREATE TABLE IF NOT EXISTS course_invites (
    course        text REFERENCES courses(id) NOT NULL,
    email         text NOT NULL,
    PRIMARY KEY (course, email)
);

CREATE TABLE IF NOT EXISTS people_watching_courses (
    person        text REFERENCES people(id) NOT NULL,
    course        integer REFERENCES courses(id) NOT NULL,
    PRIMARY KEY (course, person)
);

CREATE TYPE discount_types AS ENUM ('percentage', 'absolute');
CREATE TABLE IF NOT EXISTS course_discounts (
    name text not null,
    type discount_types not null,
    course integer REFERENCES courses(id) NOT NULL,
    code text NOT NULL UNIQUE,
    max_redeems integer NOT NULL default (0),
    redeems integer NOT NULL default (0),
    amount integer not null,
    PRIMARY KEY (course, code)
);

CREATE TABLE IF NOT EXISTS events (
   id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
   start_date text NOT NULL,
   end_date text NOT NULL,
   name text NOT NULL,
   location text NOT NULL,
   description text NOT NULL
);

create table if not exists no_account_rsvps (
   email text not null,
   name text not null,
   event integer references events(id) not null,
   primary key (email, event)
)

CREATE TABLE IF NOT EXISTS cohort_events (
  cohort integer REFERENCES course_cohorts(id) NOT NULL,
  event integer REFERENCES events(id) NOT NULL,
  PRIMARY KEY (cohort, event)
);

CREATE TABLE IF NOT EXISTS standalone_events (
  event integer references events(id) NOT NULL PRIMARY KEY,
  cost integer not null,
  max_attendees integer
);

CREATE TABLE standalone_events_in_courses (
  course integer references courses(id) NOT NULL,
  standalone_event integer references standalone_events(event) NOT NULL,
  PRIMARY KEY (course, standalone_event)
);


CREATE TABLE refunds (
  payment_intent text primary key not null,
  amount integer not null
);

CREATE TABLE cohort_refunds (
  refund text REFERENCES refunds(payment_intent) primary key,
  person text references people(id),
  cohort integer REFERENCES course_cohorts(id),
);
