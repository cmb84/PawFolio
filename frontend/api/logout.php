<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$token = get_auth_token();

if ($token !== '') {
    $payload = [
        'action' => 'logout',
        'token' => $token,
        'ts' => time(),
    ];

    try {
        [$connection, $channel] = get_rabbitmq_channel() ?? [null, null];
        if (!$connection || !$channel) {
            throw new RuntimeException('Failed to connect to RabbitMQ');
        }

        rabbitmq_publish(RMQ_QUEUE_F2B1, $payload);
        error_log("[LOGOUT] Sent logout payload to queue: " . RMQ_QUEUE_F2B1);

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
        error_log('[LOGOUT ERROR][RabbitMQ] ' . $e->getMessage());
    }
}

clear_auth_cookie();
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

json_out([
    'ok' => true,
    'message' => 'Logout successful'
]);
?>