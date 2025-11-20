<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

define('APP_ENV', getenv('APP_ENV') ?: 'dev');
define('APP_DEBUG', APP_ENV !== 'prod');
define('APP_VERSION', '1.0.0');

require_once __DIR__ . '/../../databases/db.php';

/**
 * Output JSON and exit.
 */
function json_out(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Read and decode JSON request body.
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        json_out(['ok' => false, 'error' => 'Failed to read request body'], 400);
    }

    if ($raw === '') {
        return [];
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_out([
            'ok'     => false,
            'error'  => 'Invalid JSON body',
            'detail' => json_last_error_msg(),
        ], 400);
    }

    if (!is_array($data)) {
        json_out(['ok' => false, 'error' => 'JSON body must be an object or array'], 400);
    }

    return $data;
}

/**
 * Enforce HTTP method.
 */
function require_method(string $method): void
{
    if (strcasecmp($_SERVER['REQUEST_METHOD'] ?? '', $method) !== 0) {
        json_out([
            'ok'    => false,
            'error' => "Method {$method} required",
        ], 405);
    }
}

/**
 * Fetch the current logged-in user from the DB using session user_id.
 */
function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    try {
        $pdo = getPDO();
        $stmt = $pdo->prepare('SELECT id, username, email FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => (int) $_SESSION['user_id']]);
        $user = $stmt->fetch();

        return $user ?: null;
    } catch (Throwable $e) {
        error_log('[current_user] ' . $e->getMessage());
        return null;
    }
}

/**
 * Require that a user is logged in (returns user array or 401s).
 */
function require_auth(): array
{
    $user = current_user();
    if (!$user) {
        json_out(['ok' => false, 'error' => 'Not authenticated'], 401);
    }
    return $user;
}

/**
 * Simple health check.
 */
if (isset($_GET['ping'])) {
    $dbOk = false;
    try {
        $pdo = getPDO();
        $pdo->query('SELECT 1');
        $dbOk = true;
    } catch (Throwable $e) {
        $dbOk = false;
    }

    json_out([
        'ok'      => true,
        'env'     => APP_ENV,
        'version' => APP_VERSION,
        'session' => session_id(),
        'time'    => date('c'),
        'db'      => $dbOk,
    ]);
}
