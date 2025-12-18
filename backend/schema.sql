-- PawFolio schema additions
-- Run this against your existing database (the one that already has the `users` table).

CREATE TABLE IF NOT EXISTS posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  pet_name VARCHAR(100) NOT NULL,
  species VARCHAR(60) NOT NULL,
  caption TEXT NULL,
  image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_posts_created_at (created_at),
  INDEX idx_posts_user_id (user_id),

  CONSTRAINT fk_posts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
