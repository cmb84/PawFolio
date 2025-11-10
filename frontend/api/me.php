<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$token = get_auth_token();
if ($token === '') {
    json_out(['ok' => false, 'error' => 'Missing authentication token'], 401);
}

if (isset($_SESSION['user'])) {
    json_out([
        'ok' => true,
        'user' => $_SESSION['user'],
        'source' => 'session'
    ]);
}

try {
    $decoded = json_decode(base64_decode($token), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($decoded) || empty($decoded['uid'])) {
        throw new Exception('Malformed token payload');
    }
} catch (Throwable $e) {
    json_out([
        'ok' => false,
        'error' => 'Invalid token format',
        'detail' => APP_DEBUG ? $e->getMessage() : null
    ], 401);
}

$payload = [
    'action' => 'get_user',
    'params' => ['id' => $decoded['uid']],
    'ts' => time(),
];

try {
    [$connection, $channel] = get_rabbitmq_channel() ?? [null, null];
    if (!$connection || !$channel) {
        throw new RuntimeException('Failed to connect to RabbitMQ');
    }

    rabbitmq_publish(RMQ_QUEUE_F2B1, $payload);
    error_log("[ME] Sent get_user payload to queue: " . RMQ_QUEUE_F2B1);

    $response = null;
    $callback = function ($rep) use (&$response) {
        $response = json_decode($rep->body ?? '{}', true);
    };

    $channel->basic_consume(RMQ_QUEUE_B1F, '', false, true, false, false, $callback);

    $start = microtime(true);
    while (!$response && (microtime(true) - $start) < 10.0) {
        $channel->wait(null, false, 9);
    }

    $channel->close();
    $connection->close();
} catch (Throwable $e) {
    error_log('[ME ERROR][RabbitMQ] ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Message broker unavailable'], 500);
}

if (!$response) {
    json_out(['ok' => false, 'error' => 'No response from backend'], 504);
}

if (($response['status'] ?? '') !== 'success') {
    json_out([
        'ok' => false,
        'error' => $response['message'] ?? 'Failed to retrieve user data'
    ], 404);
}

$user = $response['user'] ?? null;
if (!$user || !isset($user['id'])) {
    json_out(['ok' => false, 'error' => 'Malformed backend response'], 502);
}

$_SESSION['user'] = [
    'id' => $user['id'],
    'username' => $user['username'] ?? 'Unknown',
    'email' => $user['email'] ?? '',
];

json_out([
    'ok' => true,
    'user' => $_SESSION['user'],
    'source' => 'backend'
]);
?>