CREATE TABLE users (
    did CHAR(32) PRIMARY KEY NOT NULL,
    at_handle VARCHAR(253),
    community_handles TEXT,
    registered BOOLEAN,
    description TEXT,
    avatar TEXT,
    banner TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_community_handles ON users(community_handles);