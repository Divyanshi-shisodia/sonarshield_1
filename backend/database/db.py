"""
SONARSHIELD - SQLite Database Layer
======================================
Lightweight persistence using Python's built-in sqlite3 (no external ORM
dependency required). Tables: mission, sonar_image, detection, anomaly,
analysis_result.
"""
import sqlite3
import os
import json
import time

DB_PATH = os.path.join(os.path.dirname(__file__), "sonarshield.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS mission (
    id TEXT PRIMARY KEY,
    name TEXT,
    operator TEXT,
    survey_area_km2 REAL,
    sonar_source TEXT,
    status TEXT,
    created_at REAL
);

CREATE TABLE IF NOT EXISTS sonar_image (
    id TEXT PRIMARY KEY,
    mission_id TEXT,
    filename TEXT,
    filepath TEXT,
    resolution TEXT,
    is_demo INTEGER,
    uploaded_at REAL
);

CREATE TABLE IF NOT EXISTS detection (
    id TEXT PRIMARY KEY,
    image_id TEXT,
    object_id TEXT,
    x INTEGER, y INTEGER, width INTEGER, height INTEGER,
    confidence REAL,
    class_name TEXT,
    area_px INTEGER,
    detector_mode TEXT
);

CREATE TABLE IF NOT EXISTS anomaly (
    id TEXT PRIMARY KEY,
    detection_id TEXT,
    image_id TEXT,
    mission_id TEXT,
    score REAL,
    risk TEXT,
    status TEXT,
    location TEXT,
    lat REAL,
    lng REAL,
    reasoning TEXT,
    breakdown TEXT,
    created_at REAL
);

CREATE TABLE IF NOT EXISTS analysis_result (
    id TEXT PRIMARY KEY,
    image_id TEXT,
    iou REAL, dice REAL, precision_v REAL, recall_v REAL,
    seg_mode TEXT,
    metrics_label TEXT
);
"""


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(seed_history: bool = True):
    conn = get_conn()
    conn.executescript(SCHEMA)
    conn.commit()

    cur = conn.execute("SELECT COUNT(*) c FROM mission")
    count = cur.fetchone()["c"]
    if count == 0 and seed_history:
        _seed_missions(conn)
    conn.close()


def _seed_missions(conn):
    """Seed a couple of historical missions so Mission History isn't empty
    on first run."""
    now = time.time()
    history = [
        ("SS-2026-013", "Gulf of Khambhat Survey", "Lt. R. Sharma", 1.8, "Klein 3000 SSS", "COMPLETED", now - 86400 * 6),
        ("SS-2026-012", "Chilika Lagoon Sweep", "Lt. R. Sharma", 3.1, "EdgeTech 4205", "COMPLETED", now - 86400 * 14),
    ]
    for m in history:
        conn.execute(
            "INSERT INTO mission (id, name, operator, survey_area_km2, sonar_source, status, created_at) VALUES (?,?,?,?,?,?,?)",
            m,
        )
    conn.commit()


def dict_from_row(row):
    return {k: row[k] for k in row.keys()} if row else None
