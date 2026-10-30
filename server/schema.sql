-- Breezy PostgreSQL Database Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (bcrypt salted password hashes)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(60) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Albums Table
CREATE TABLE IF NOT EXISTS albums (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    year INT,
    cover_url TEXT,
    accent_color VARCHAR(30) DEFAULT '#3b82f6',
    tracks_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Songs Table
CREATE TABLE IF NOT EXISTS songs (
    id VARCHAR(100) PRIMARY KEY,
    album_id VARCHAR(100) REFERENCES albums(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    album_title VARCHAR(255),
    duration INT DEFAULT 0,
    file_path TEXT NOT NULL,
    format VARCHAR(20) DEFAULT 'FLAC',
    bitrate VARCHAR(50) DEFAULT 'FLAC 24-bit / 96.0 kHz',
    genre VARCHAR(60) DEFAULT 'R&B / Soul',
    play_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Listening History Table
CREATE TABLE IF NOT EXISTS listening_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    song_id VARCHAR(100) REFERENCES songs(id) ON DELETE CASCADE,
    listened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_songs_album ON songs(album_id);
CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
