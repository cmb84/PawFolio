<?php
declare(strict_types=1);

/**
 * Shared PDO factory for the IT490 database.
 *  - Keeps one connection alive per PHP process.
 *  - Retries automatically on failure.
 *  - Allows environment variable overrides.
 */
function getPDO(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dbHost = getenv('DB_HOST') ?: '127.0.0.1';
    $dbName = getenv('DB_NAME') ?: 'test';
    $dbUser = getenv('DB_USER') ?: 'test';
    $dbPass = getenv('DB_PASS') ?: 'test';

    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $dbHost, $dbName);

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET time_zone = '+00:00'"
    ];

    // Basic retry loop in case MySQL isn’t ready yet
    $attempts = 0;
    while (true) {
        try {
            $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
            break;
        } catch (PDOException $e) {
            $attempts++;
            error_log("[DB] Connection attempt {$attempts} failed: " . $e->getMessage());
            if ($attempts >= 3) {
                throw new RuntimeException('Database connection failed after 3 attempts', 0, $e);
            }
            sleep(2); // brief back-off before retry
        }
    }

    return $pdo;
}
?>