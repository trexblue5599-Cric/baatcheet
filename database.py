# ================================
# Database — SQLite
# ================================

import sqlite3
from datetime import datetime

DB_FILE = "baatcheet.db"


def get_conn():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()

    # ---- users ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at    TEXT NOT NULL
        )
    """)

    # ---- sessions ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token      TEXT PRIMARY KEY,
            user_id    INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # ---- messages ----
    c.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id   INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            text        TEXT NOT NULL,
            timestamp   TEXT NOT NULL,
            seen        INTEGER DEFAULT 0,
            FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # ---- indexes ----
    c.execute("CREATE INDEX IF NOT EXISTS idx_msg_pair ON messages(sender_id, receiver_id)")

    conn.commit()
    conn.close()


# ================================
# USERS
# ================================

def create_user(username, password_hash):
    conn = get_conn()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (username, password_hash, datetime.utcnow().isoformat())
        )
        conn.commit()
        user_id = c.lastrowid
        return user_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()


def get_user_by_username(username):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_users_except(user_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "SELECT id, username FROM users WHERE id != ? ORDER BY username",
        (user_id,)
    )
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ================================
# SESSIONS
# ================================

def create_session(token, user_id):
    conn = get_conn()
    c = conn.cursor()
    c.execute(
        "INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)",
        (token, user_id, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def get_session(token):
    conn = get_conn()
    c = conn.cursor()
    c.execute("SELECT * FROM sessions WHERE token = ?", (token,))
    row = c.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_session(token):
    conn = get_conn()
    c = conn.cursor()
    c.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()


# ================================
# MESSAGES
# ================================

def save_message(sender_id, receiver_id, text):
    conn = get_conn()
    c = conn.cursor()
    ts = datetime.utcnow().isoformat()
    c.execute(
        "INSERT INTO messages (sender_id, receiver_id, text, timestamp) VALUES (?, ?, ?, ?)",
        (sender_id, receiver_id, text, ts)
    )
    conn.commit()
    msg_id = c.lastrowid
    conn.close()
    return msg_id, ts


def get_conversation(user_a, user_b, limit=200):
    conn = get_conn()
    c = conn.cursor()
    c.execute("""
        SELECT m.id, m.sender_id, m.receiver_id, m.text, m.timestamp, u.username AS sender_name
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        WHERE (m.sender_id = ? AND m.receiver_id = ?)
           OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.id ASC
        LIMIT ?
    """, (user_a, user_b, user_b, user_a, limit))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]