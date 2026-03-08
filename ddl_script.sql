-- KOMPLEX Database DDL Script
-- Generated from Drizzle ORM models

-- Create ENUMS first
CREATE TYPE media_type AS ENUM ('image', 'video');
CREATE TYPE feedback_status AS ENUM ('resolved', 'unresolved', 'dismissed');
CREATE TYPE response_type AS ENUM ('normal', 'komplex');

-- Create core tables (no dependencies)
CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    name TEXT,
    order_index INTEGER
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uid TEXT UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    date_of_birth DATE,
    is_admin BOOLEAN,
    is_verified BOOLEAN,
    is_social BOOLEAN,
    email TEXT,
    phone TEXT,
    profile_image TEXT,
    profile_image_key TEXT,
    last_topic_id INTEGER, -- Will add FK constraint later due to circular reference
    last_video_id INTEGER, -- Will add FK constraint later due to circular reference
    last_ai_tab_id INTEGER, -- Will add FK constraint later due to circular reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create tables with grade dependencies
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name TEXT,
    icon TEXT,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    order_index INTEGER
);

-- Create tables with subject dependencies
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    name TEXT,
    icon TEXT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    order_index INTEGER
);

-- Create exercises table (references users)
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    video_id INTEGER,
    duration INTEGER,
    title TEXT,
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    subject TEXT,
    grade VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create topics table (references lessons and exercises)
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    component JSONB,
    component_code TEXT,
    exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    order_index INTEGER
);

-- Create videos table (references users)
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    description TEXT,
    view_count INTEGER,
    type TEXT,
    topic TEXT,
    video_url TEXT,
    video_url_for_deletion TEXT,
    thumbnail_url TEXT,
    thumbnail_url_for_deletion TEXT,
    duration INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_ai_tabs table (references users)
CREATE TABLE user_ai_tabs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    tab_name TEXT,
    tab_summary TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Now add the circular foreign key constraints to users table
ALTER TABLE users ADD CONSTRAINT fk_users_last_topic FOREIGN KEY (last_topic_id) REFERENCES topics(id);
ALTER TABLE users ADD CONSTRAINT fk_users_last_video FOREIGN KEY (last_video_id) REFERENCES videos(id);
ALTER TABLE users ADD CONSTRAINT fk_users_last_ai_tab FOREIGN KEY (last_ai_tab_id) REFERENCES user_ai_tabs(id);

-- Create questions table (references exercises and users)
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    exercise_id INTEGER,
    user_id INTEGER,
    title TEXT,
    question_type TEXT,
    section VARCHAR,
    image_url TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create choices table (references questions)
CREATE TABLE choices (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id),
    text TEXT,
    is_correct BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user relationship tables
CREATE TABLE followers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    followed_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, followed_id)
);

-- Create feedbacks table
CREATE TABLE feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT,
    type TEXT,
    status feedback_status,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create feedback_media table
CREATE TABLE feedback_media (
    id SERIAL PRIMARY KEY,
    feedback_id INTEGER REFERENCES feedbacks(id),
    public_url TEXT,
    secure_url TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forums table
CREATE TABLE forums (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    description TEXT,
    view_count INTEGER,
    type TEXT,
    topic TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_medias table
CREATE TABLE forum_medias (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id),
    url TEXT,
    url_for_deletion TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_likes table
CREATE TABLE forum_likes (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, forum_id)
);

-- Create forum_comments table
CREATE TABLE forum_comments (
    id SERIAL PRIMARY KEY,
    forum_id INTEGER REFERENCES forums(id),
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_comment_medias table
CREATE TABLE forum_comment_medias (
    id SERIAL PRIMARY KEY,
    forum_comment_id INTEGER REFERENCES forum_comments(id),
    url TEXT,
    url_for_deletion TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_comment_likes table
CREATE TABLE forum_comment_likes (
    id SERIAL PRIMARY KEY,
    forum_comment_id INTEGER REFERENCES forum_comments(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(forum_comment_id, user_id)
);

-- Create forum_replies table
CREATE TABLE forum_replies (
    id SERIAL PRIMARY KEY,
    forum_comment_id INTEGER REFERENCES forum_comments(id),
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_reply_medias table
CREATE TABLE forum_reply_medias (
    id SERIAL PRIMARY KEY,
    forum_reply_id INTEGER REFERENCES forum_replies(id),
    url TEXT,
    url_for_deletion TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create forum_reply_likes table
CREATE TABLE forum_reply_likes (
    id SERIAL PRIMARY KEY,
    forum_reply_id INTEGER REFERENCES forum_replies(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(forum_reply_id, user_id)
);

-- Create news table
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    description TEXT,
    type TEXT,
    topic TEXT,
    view_count INTEGER,
    like_amount INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create news_media table
CREATE TABLE news_media (
    id SERIAL PRIMARY KEY,
    news_id INTEGER REFERENCES news(id),
    url TEXT,
    url_for_deletion TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_comments table
CREATE TABLE video_comments (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_comment_medias table
CREATE TABLE video_comment_medias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    url_for_deletion TEXT,
    video_comment_id INTEGER REFERENCES video_comments(id),
    url TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_comment_like table
CREATE TABLE video_comment_like (
    id SERIAL PRIMARY KEY,
    video_comment_id INTEGER REFERENCES video_comments(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(video_comment_id, user_id)
);

-- Create video_replies table
CREATE TABLE video_replies (
    id SERIAL PRIMARY KEY,
    video_comment_id INTEGER REFERENCES video_comments(id),
    user_id INTEGER REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_reply_medias table
CREATE TABLE video_reply_medias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    url_for_deletion TEXT,
    video_reply_id INTEGER REFERENCES video_replies(id),
    url TEXT,
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create video_reply_like table
CREATE TABLE video_reply_like (
    id SERIAL PRIMARY KEY,
    video_reply_id INTEGER REFERENCES video_replies(id),
    user_id INTEGER REFERENCES users(id),
    media_type media_type,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(video_reply_id, user_id)
);

-- Create video_likes table
CREATE TABLE video_likes (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id),
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(video_id, user_id)
);

-- Create books table (library)
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    grade_id INTEGER REFERENCES grades(id),
    lesson_id INTEGER REFERENCES lessons(id),
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    subject_id INTEGER REFERENCES subjects(id),
    published_date DATE,
    description TEXT,
    pdf_url TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notes table
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT,
    content TEXT,
    topic TEXT,
    tags VARCHAR,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_at DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Create user history tables
CREATE TABLE user_exercise_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    exercise_id INTEGER REFERENCES exercises(id),
    score INTEGER,
    time_taken INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE exercise_question_history (
    id SERIAL PRIMARY KEY,
    exercise_history_id INTEGER REFERENCES user_exercise_history(id),
    question_id INTEGER REFERENCES questions(id),
    is_correct BOOLEAN NOT NULL
);

CREATE TABLE user_video_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    video_id INTEGER REFERENCES videos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user AI tables
CREATE TABLE user_ai_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    ai_result TEXT,
    prompt TEXT,
    tab_id INTEGER REFERENCES user_ai_tabs(id),
    rating INTEGER,
    rating_feedback TEXT,
    response_type response_type DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_ai_topic_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    topic_id INTEGER REFERENCES topics(id),
    prompt TEXT,
    ai_result TEXT,
    summary TEXT,
    rating INTEGER,
    rating_feedback TEXT,
    response_type response_type DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user saved content tables
CREATE TABLE user_saved_news (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    news_id INTEGER REFERENCES news(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, news_id)
);

CREATE TABLE user_saved_videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    video_id INTEGER REFERENCES videos(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- Create user OAuth table
CREATE TABLE user_oauth (
    id SERIAL PRIMARY KEY,
    uid TEXT REFERENCES users(uid),
    provider TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_subjects_grade_id ON subjects(grade_id);
CREATE INDEX idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX idx_topics_lesson_id ON topics(lesson_id);
CREATE INDEX idx_topics_exercise_id ON topics(exercise_id);
CREATE INDEX idx_exercises_user_id ON exercises(user_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_questions_exercise_id ON questions(exercise_id);
CREATE INDEX idx_choices_question_id ON choices(question_id);
CREATE INDEX idx_forums_user_id ON forums(user_id);
CREATE INDEX idx_forum_comments_forum_id ON forum_comments(forum_id);
CREATE INDEX idx_forum_replies_forum_comment_id ON forum_replies(forum_comment_id);
CREATE INDEX idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX idx_video_replies_video_comment_id ON video_replies(video_comment_id);
CREATE INDEX idx_news_user_id ON news(user_id);
CREATE INDEX idx_feedbacks_user_id ON feedbacks(user_id);
CREATE INDEX idx_user_exercise_history_user_id ON user_exercise_history(user_id);
CREATE INDEX idx_user_video_history_user_id ON user_video_history(user_id);
CREATE INDEX idx_user_ai_history_user_id ON user_ai_history(user_id);
CREATE INDEX idx_user_ai_topic_history_user_id ON user_ai_topic_history(user_id);