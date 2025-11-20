<?php
declare(strict_types=1);

/**
 * Shared PDO factory for the PawFolio database.
 *  - Keeps one connection alive per PHP process.
 *  - Retries automatically on failure.
 *  - Allows environment variable overrides.
 *
 * Env vars (optional, with sensible defaults):
 *  - DB_HOST  (default: 127.0.0.1)
 *  - DB_PORT  (default: 3306)
 *  - DB_NAME  (default: pawfolio)
 *  - DB_USER  (default: pawfolio)
 *  - DB_PASS  (default: changeme)
 */
function getPDO(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dbHost = getenv('DB_HOST') ?: '127.0.0.1';
    $dbPort = getenv('DB_PORT') ?: '3306';
    $dbName = getenv('DB_NAME') ?: 'pawfolio';
    $dbUser = getenv('DB_USER') ?: 'pawfolio';
    $dbPass = getenv('DB_PASS') ?: 'changeme';

    $dsn = "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4";

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

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
            sleep(2); // small back-off before retry
        }
    }

    return $pdo;
}
