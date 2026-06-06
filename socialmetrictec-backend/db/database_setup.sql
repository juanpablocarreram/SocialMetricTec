USE socialmetrictec;
-- ============================================================
-- 1. user
--    Natural PK on username.
--    email carries a UNIQUE constraint so users can log in
--    with either username or email (handled at app layer).
-- ============================================================
CREATE TABLE IF NOT EXISTS user (
    username       VARCHAR(100)  NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    email          VARCHAR(255)  NOT NULL,
    is_admin       TINYINT(1)    NOT NULL DEFAULT 0,
    profile        JSON,

    CONSTRAINT pk_user        PRIMARY KEY (username),
    CONSTRAINT uq_user_email  UNIQUE      (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 2. project
--    Surrogate INT PK (AUTO_INCREMENT).
--    page stored as native JSON column (MySQL 8 feature).
--    cover_image_url stored as a URL string — binary assets
--    belong in object storage (S3 / GCS), not the DB.
-- ============================================================
CREATE TABLE IF NOT EXISTS project (
    project_id       INT            NOT NULL AUTO_INCREMENT,
    project_name     VARCHAR(255)   NOT NULL,
    description      TEXT,
    impact_area      VARCHAR(255),
    cover_image_url  VARCHAR(2048),
    is_active        TINYINT(1)     NOT NULL DEFAULT 1,
    page             JSON,
    objetivo         TEXT,
    numero_beneficiarios INT        NOT NULL DEFAULT 0,
    created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_project PRIMARY KEY (project_id),
    CONSTRAINT uq_project_name UNIQUE (project_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 3. tag
--    Natural PK — tag names must be globally unique.
-- ============================================================
CREATE TABLE IF NOT EXISTS tag (
    tag_name  VARCHAR(100) NOT NULL,
 
    CONSTRAINT pk_tag PRIMARY KEY (tag_name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 4. metric  (1 project : N metrics)
--    Cascades on delete: removing a project removes all its
--    associated metrics automatically.
-- ============================================================
CREATE TABLE IF NOT EXISTS metric (
    metric_id     INT          NOT NULL AUTO_INCREMENT,
    metric_title  VARCHAR(255) NOT NULL,
    project_id    INT          NOT NULL,
 
    CONSTRAINT pk_metric         PRIMARY KEY (metric_id),
    CONSTRAINT fk_metric_project FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 5. sub_metric  (1 metric : N sub_metrics)
--    DECIMAL(18,4) prevents floating-point rounding issues
--    for numeric KPI values.
-- ============================================================
CREATE TABLE IF NOT EXISTS sub_metric (
    sub_metric_id     INT            NOT NULL AUTO_INCREMENT,
    sub_metric_title  VARCHAR(255)   NOT NULL,
    sub_metric_value  DECIMAL(18,4),
    metric_id         INT            NOT NULL,
 
    CONSTRAINT pk_sub_metric        PRIMARY KEY (sub_metric_id),
    CONSTRAINT fk_sub_metric_metric FOREIGN KEY (metric_id)
        REFERENCES metric (metric_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 6. beneficiary  (1 project : N beneficiaries)
--    Surrogate PK — a beneficiary has no meaningful existence
--    without its parent project (CASCADE on delete).
-- ============================================================
CREATE TABLE IF NOT EXISTS beneficiary (
    id          INT  NOT NULL AUTO_INCREMENT,
    project_id  INT  NOT NULL,
 
    CONSTRAINT pk_beneficiary         PRIMARY KEY (id),
    CONSTRAINT fk_beneficiary_project FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 7. manages  —  junction table  M:N  (user <-> project)
--    Composite PK from both parent FKs.
--    Resolves the "administra" M:N relationship in the ERD.
-- ============================================================
CREATE TABLE IF NOT EXISTS manages (
    username    VARCHAR(100)  NOT NULL,
    project_id  INT           NOT NULL,
 
    CONSTRAINT pk_manages         PRIMARY KEY (username, project_id),
    CONSTRAINT fk_manages_user    FOREIGN KEY (username)
        REFERENCES user (username)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_manages_project FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
 
 
-- ============================================================
-- 8. project_tag  —  junction table  M:N  (project <-> tag)
--    Composite PK from both parent FKs.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_tag (
    project_id  INT           NOT NULL,
    tag_name    VARCHAR(100)  NOT NULL,
 
    CONSTRAINT pk_project_tag         PRIMARY KEY (project_id, tag_name),
    CONSTRAINT fk_project_tag_project FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_project_tag_tag     FOREIGN KEY (tag_name)
        REFERENCES tag (tag_name)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 9. milestone  (1 project : N milestones)
--    Hitos / timeline de un proyecto. CASCADE on delete.
-- ============================================================
CREATE TABLE IF NOT EXISTS milestone (
    milestone_id  INT           NOT NULL AUTO_INCREMENT,
    project_id    INT           NOT NULL,
    title         VARCHAR(255)  NOT NULL,
    description   TEXT,
    is_completed  TINYINT(1)    NOT NULL DEFAULT 0,
    completed_at  DATETIME,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_milestone         PRIMARY KEY (milestone_id),
    CONSTRAINT fk_milestone_project FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 10. project_photo  (1 project : N photos)
--     url apunta a object storage; uploaded_by referencia user.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_photo (
    photo_id     INT            NOT NULL AUTO_INCREMENT,
    project_id   INT            NOT NULL,
    url          VARCHAR(2048)  NOT NULL,
    caption      VARCHAR(255),
    uploaded_by  VARCHAR(100)   NOT NULL,
    created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_project_photo          PRIMARY KEY (photo_id),
    CONSTRAINT fk_project_photo_project  FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_project_photo_user     FOREIGN KEY (uploaded_by)
        REFERENCES user (username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 11. testimony  (1 project : N testimonies)
--     author_username referencia user; display_name permite
--     mostrar un nombre público distinto del username.
-- ============================================================
CREATE TABLE IF NOT EXISTS testimony (
    testimony_id     INT           NOT NULL AUTO_INCREMENT,
    project_id       INT           NOT NULL,
    author_username  VARCHAR(100)  NOT NULL,
    display_name     VARCHAR(255),
    content          TEXT          NOT NULL,
    category         VARCHAR(100),
    created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_testimony          PRIMARY KEY (testimony_id),
    CONSTRAINT fk_testimony_project  FOREIGN KEY (project_id)
        REFERENCES project (project_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_testimony_user     FOREIGN KEY (author_username)
        REFERENCES user (username)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 12. testimony_tag  —  junction table  (testimony <-> tag libre)
--     tag_name es texto libre (no FK a la tabla tag).
--     Composite PK (testimony_id, tag_name).
-- ============================================================
CREATE TABLE IF NOT EXISTS testimony_tag (
    testimony_id  INT          NOT NULL,
    tag_name      VARCHAR(30)  NOT NULL,

    CONSTRAINT pk_testimony_tag           PRIMARY KEY (testimony_id, tag_name),
    CONSTRAINT fk_testimony_tag_testimony FOREIGN KEY (testimony_id)
        REFERENCES testimony (testimony_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- 13. export_log  —  auditoría de exportaciones CSV
--     Sin FKs a propósito: el registro de auditoría debe
--     sobrevivir al borrado del proyecto o del usuario.
-- ============================================================
CREATE TABLE IF NOT EXISTS export_log (
    export_id    INT           NOT NULL AUTO_INCREMENT,
    exported_by  VARCHAR(100)  NOT NULL,
    project_id   INT,
    date_from    VARCHAR(10),
    date_to      VARCHAR(10),
    row_count    INT           NOT NULL DEFAULT 0,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_export_log PRIMARY KEY (export_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;
