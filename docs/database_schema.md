# Database Schema

## Engine
- **DBMS**: SQLite (file-based, zero-config)
- **ORM**: SQLAlchemy 2.x
- **Migrations**: Alembic
- **DB File**: `backend/depression_ai.db`
- **Upgrade path**: Change `DATABASE_URL` to PostgreSQL connection string

## Tables

### 1. `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| username | VARCHAR(50) | UNIQUE, NOT NULL |
| email | VARCHAR(120) | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL (bcrypt hash) |
| is_anonymous | BOOLEAN | DEFAULT FALSE |
| consent_given | BOOLEAN | DEFAULT FALSE |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| cumulative_words | INTEGER | NOT NULL, DEFAULT 0 |

### 2. `chat_sessions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | FOREIGN KEY → users.id, NOT NULL |
| started_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| ended_at | DATETIME | NULLABLE |
| total_messages | INTEGER | DEFAULT 0 |
| total_user_words | INTEGER | NOT NULL, DEFAULT 0 |
| session_summary | TEXT | NULLABLE |
| analysis_tier_reached | VARCHAR(30) | NOT NULL, DEFAULT 'gathering' |
| opener_message_id | INTEGER | FOREIGN KEY -> messages.id, NULLABLE |

### 3. `messages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| session_id | INTEGER | FOREIGN KEY → chat_sessions.id |
| user_id | INTEGER | FOREIGN KEY → users.id |
| role | VARCHAR(10) | 'user' or 'assistant' |
| content | TEXT | NOT NULL |
| sentiment_score | FLOAT | NULLABLE (-1.0 to 1.0) |
| depression_risk_score | FLOAT | NULLABLE (0.0 to 1.0) |
| risk_label | VARCHAR(10) | NULLABLE ('low', 'medium', 'high') |
| emotion_label | VARCHAR(20) | NULLABLE (HuggingFace output) |
| message_length | INTEGER | Character count |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### 4. `mood_logs`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| user_id | INTEGER | FOREIGN KEY → users.id |
| date | DATE | One entry per day per user |
| avg_sentiment | FLOAT | Average VADER score for the day |
| avg_risk_score | FLOAT | Average depression risk score |
| dominant_emotion | VARCHAR(20) | NULLABLE |
| message_count | INTEGER | User messages that day |
| late_night_activity | BOOLEAN | Messages between 00:00–05:00 |

## Relationships
```
users (1) ──→ (many) chat_sessions
users (1) ──→ (many) messages
users (1) ──→ (many) mood_logs
chat_sessions (1) ──→ (many) messages
```

## Cascade Behavior
- Deleting a user cascades to all chat_sessions, messages, and mood_logs
