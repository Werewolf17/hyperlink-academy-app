CREATE TABLE IF NOT EXISTS activation_keys
(
    key_hash      text NOT NULL PRIMARY KEY,
    created_time  text NOT NULL,
    display_name  text NOT NULL,
    password_hash text NOT NULL,
    email         text NOT NULL
);

CREATE TABLE IF NOT EXISTS password_reset_keys
(
    key_hash      text PRIMARY KEY NOT NULL,
    created_time  text NOT NULL,
    email         text NOT NULL
);

CREATE TABLE IF NOT EXISTS people (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    email         text NOT NULL UNIQUE,
    display_name  text NOT NULL,
    password_hash text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS courses (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    name          text NOT NULL,
    duration      text NOT NULL,
    description   text NOT NULL,
    cost          real NOT NULL
);

CREATE TABLE IF NOT EXISTS course_maintainers (
    course        text REFERENCES courses(id) NOT NULL,
    maintainer    text REFERENCES people(id) NOT NULL
    PRIMARY KEY (person_id, instance_id)
)


CREATE TABLE IF NOT EXISTS course_instances (
    id            text NOT NULL UNIQUE PRIMARY KEY,
    start_date    text NOT NULL,
    end_date      text NOT NULL,
    facillitator  text REFERENCES people(id) NOT NULL
    course        text REFERENCES courses(id) NOT NULL
);

CREATE TABLE IF NOT EXISTS people_in_instances (
    person_id     text REFERENCES people(id) NOT NULL,
    instance_id   text REFERENCES course_instances(id) NOT NULL,
    PRIMARY KEY (person_id, instance_id)
)
