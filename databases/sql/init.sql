-- Run this file one time to create the databases
-- Uses and creates the main IT490 database
CREATE DATABASE IF NOT EXISTS IT490;
USE IT490;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    email VARCHAR(100),
    password VARCHAR(255)
);

INSERT INTO users (username, email, password) VALUES
('example_user', 'example@example.com', '12345');
