CREATE TABLE IF NOT EXISTS list (
    list_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    name varchar(512) NOT NULL
);

CREATE TABLE IF NOT EXISTS todo (
    todo_id bigserial PRIMARY KEY,
    title varchar(512) NOT NULL,
    description TEXT,
    status varchar(100) DEFAULT 'active',
    list_id bigint,
    user_id bigint NOT NUll,
    FOREIGN KEY (list_id)
      REFERENCES list (list_id)
)

CREATE INDEX list_idx ON todo (list_id);
CREATE INDEX user_idx ON todo (user_id);