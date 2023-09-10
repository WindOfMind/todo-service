CREATE TABLE IF NOT EXISTS list (
    list_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    name varchar(512) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todo (
    todo_id bigserial PRIMARY KEY,
    title varchar(512) NOT NULL,
    description TEXT,
    completed_at timestamptz,
    list_id bigint,
    user_id bigint NOT NUll,
    todoist_item_id varchar(512), -- in the case of separate integration service - should be migrated into a separate standalone DB
    created_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (list_id)
      REFERENCES list (list_id)
);

CREATE INDEX list_idx ON todo (list_id);
CREATE INDEX user_idx ON todo (user_id);
CREATE INDEX todoist_item_id_idx ON todo(todoist_item_id);

CREATE TABLE IF NOT EXISTS user_integration (
    user_integration_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    integration_name varchar(100) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, integration_name)
);

CREATE TABLE IF NOT EXISTS todoist_integration (
    todoist_integration_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    access_token varchar(512),
    sync_token varchar(512),
    status varchar(100) DEFAULT 'active',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS scheduler_task (
    task_id bigserial PRIMARY KEY,
    name varchar(512),
    parameters TEXT, -- serialized JSON with custom parameters
    status varchar(100) DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX status_idx ON scheduler_task (status);