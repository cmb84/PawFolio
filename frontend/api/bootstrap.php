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

$autoloadCandidates = [
    dirname(__DIR__) . '/vendor/autoload.php',
    __DIR__ . '/../../vendor/autoload.php',
];

$autoloadLoadedFrom = null;
foreach ($autoloadCandidates as $cand) {
    if (is_file($cand)) {
        require_once $cand;
        $autoloadLoadedFrom = $cand;
        break;
    }
}

if (!$autoloadLoadedFrom) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Composer autoload not found']);
    exit;
}

define('APP_ENV', getenv('APP_ENV') ?: 'production');
define('APP_VERSION', '2.3');
define('APP_DEBUG', APP_ENV !== 'production');
define('BOOTSTRAP_START', microtime(true));

define('RMQ_HOST', getenv('RMQ_HOST') ?: '100.111.184.25');
define('RMQ_PORT', (int)(getenv('RMQ_PORT') ?: 5672));
define('RMQ_USER', getenv('RMQ_USER') ?: 'backend1');
define('RMQ_PASS', getenv('RMQ_PASS') ?: 'password');
define('RMQ_VHOST', getenv('RMQ_VHOST') ?: '/app');

define('RMQ_QUEUE_F2B1', 'frontend_to_backend1');
define('RMQ_QUEUE_B1F',  'backend1_to_frontend');

set_error_handler(function ($severity, $message, $file, $line) {
    $log = sprintf('[PHP ERROR] %s in %s:%d', $message, $file, $line);
    error_log($log);
    if (APP_DEBUG) {
        json_out(['ok' => false, 'error' => $message, 'file' => $file, 'line' => $line], 500);
    } else {
        json_out(['ok' => false, 'error' => 'Internal server error'], 500);
    }
});

set_exception_handler(function (Throwable $e) {
    $log = sprintf('[UNCAUGHT EXCEPTION] %s in %s:%d', $e->getMessage(), $e->getFile(), $e->getLine());
    error_log($log);
    if (APP_DEBUG) {
        json_out([
            'ok'    => false,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    } else {
        json_out(['ok' => false, 'error' => 'Unexpected server exception'], 500);
    }
});

function read_json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false) {
        json_out(['ok' => false, 'error' => 'Failed to read request body'], 400);
    }

    $data = json_decode($raw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        json_out([
            'ok'     => false,
            'error'  => 'Invalid JSON body',
            'detail' => json_last_error_msg(),
            'raw'    => APP_DEBUG ? $raw : null
        ], 400);
    }

    if (!is_array($data)) {
        json_out(['ok' => false, 'error' => 'JSON body must decode to an object or array'], 400);
    }

    return $data;
}

function json_out(array $data, int $code = 200): void {
    http_response_code($code);

    if (APP_DEBUG) {
        $data['_meta'] = [
            'env'     => APP_ENV,
            'elapsed' => round(microtime(true) - BOOTSTRAP_START, 4),
            'version' => APP_VERSION
        ];
    }

    try {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        error_log('[JSON OUTPUT ERROR] ' . $e->getMessage());
        echo '{"ok":false,"error":"Failed to encode JSON response"}';
    }
    exit;
}

function set_auth_cookie(?string $token, int $ttl = 604800): void {
    if (!$token) return;

    $secure   = (APP_ENV === 'production');
    $samesite = $secure ? 'None' : 'Lax';

    setcookie('auth_token', $token, [
        'expires'  => time() + $ttl,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => $samesite,
    ]);
}

function clear_auth_cookie(): void {
    $secure   = (APP_ENV === 'production');
    $samesite = $secure ? 'None' : 'Lax';
    setcookie('auth_token', '', [
        'expires'  => time() - 3600,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => $samesite,
    ]);
}

function get_auth_token(): string {
    return $_COOKIE['auth_token'] ?? '';
}

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

function get_rabbitmq_channel(): ?array {
    static $connection = null;
    static $channel = null;

    if ($connection && $channel) {
        return [$connection, $channel];
    }

    try {
        $connection = new AMQPStreamConnection(
            RMQ_HOST,
            RMQ_PORT,
            RMQ_USER,
            RMQ_PASS,
            RMQ_VHOST,
            false,
            'AMQPLAIN',
            null,
            'en_US',
            10.0,
            10.0,
            null,
            false,
            30
        );

        $channel = $connection->channel();

        $channel->queue_declare(RMQ_QUEUE_F2B1, false, false, false, false);
        $channel->queue_declare(RMQ_QUEUE_B1F,  false, false, false, false);

        return [$connection, $channel];
    } catch (Throwable $e) {
        error_log('[RabbitMQ INIT ERROR] ' . $e->getMessage());
        return null;
    }
}

function rabbitmq_publish(string $queue, array $payload): bool {
    try {
        [$connection, $channel] = get_rabbitmq_channel() ?? [null, null];
        if (!$connection || !$channel) {
            throw new RuntimeException('Failed to connect to RabbitMQ');
        }

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $msg  = new AMQPMessage($json, ['content_type' => 'application/json']);
        $channel->basic_publish($msg, '', $queue);
        return true;
    } catch (Throwable $e) {
        error_log('[RabbitMQ PUBLISH ERROR] ' . $e->getMessage());
        return false;
    }
}

function check_db_connection(): string {
    try {
        require_once __DIR__ . '/../../databases/db.php';
        $pdo = getPDO();
        $stmt = $pdo->query('SELECT 1');
        return $stmt && $stmt->fetchColumn() == 1 ? 'ok' : 'failed';
    } catch (Throwable $e) {
        error_log('[HealthCheck][DB] ' . $e->getMessage());
        return 'failed: ' . $e->getMessage();
    }
}

function check_rabbitmq_connection(): string {
    try {
        [$connection, $channel] = get_rabbitmq_channel() ?? [null, null];
        if (!$connection || !$channel) {
            throw new RuntimeException('Could not connect to RabbitMQ');
        }
        $channel->close();
        $connection->close();
        return 'ok';
    } catch (Throwable $e) {
        error_log('[HealthCheck][RabbitMQ] ' . $e->getMessage());
        return 'failed: ' . $e->getMessage();
    }
}

if (isset($_GET['ping'])) {
    json_out([
        'ok'        => true,
        'env'       => APP_ENV,
        'version'   => APP_VERSION,
        'session'   => session_id(),
        'time'      => date('c'),
        'db'        => check_db_connection(),
        'rabbitmq'  => check_rabbitmq_connection(),
    ]);
}
?>
