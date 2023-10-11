CREATE TABLE IF NOT EXISTS list (
    list_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    name varchar(512) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS todo (
    todo_id bigserial PRIMARY KEY,
    title varchar(512) NOT NULL,
    description TEXT,
    completed_at timestamptz,
    list_id bigint,
    user_id bigint NOT NUll,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    external_ref varchar(512) NOT NULL UNIQUE,
    FOREIGN KEY (list_id)
      REFERENCES list (list_id)
);

CREATE INDEX list_idx ON todo (list_id);
CREATE INDEX user_idx ON todo (user_id);

CREATE TABLE IF NOT EXISTS user_integration (
    user_integration_id bigserial PRIMARY KEY,
    user_id bigint NOT NUll,
    integration_name varchar(100) NOT NULL,
    access_token varchar(512) NOT NULL,
    external_user_id varchar(512),
    parameters TEXT,
    status varchar(100) DEFAULT 'pending' NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, integration_name)
);

CREATE INDEX integration_user_id_idx ON user_integration (external_user_id);

CREATE TABLE IF NOT EXISTS todo_mapping(
    todo_mapping_id bigserial PRIMARY KEY,
    todo_id bigint NOT NULL,
    external_item_id varchar(512) NOT NULL,
    user_integration_id bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_integration_id, external_item_id),
    FOREIGN KEY (user_integration_id)
      REFERENCES user_integration (user_integration_id),
    FOREIGN KEY (todo_id)
      REFERENCES todo (todo_id)
);

CREATE INDEX todo_id_idx ON todo_mapping (todo_id);

CREATE TABLE IF NOT EXISTS task (
    task_id bigserial PRIMARY KEY,
    name varchar(512),
    parameters TEXT, -- serialized JSON with custom parameters
    status varchar(100) DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX status_idx ON task (status);