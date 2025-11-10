<?php
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/validation.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$RMQ_HOST  = '100.111.184.25';
$RMQ_PORT  = 5672;
$RMQ_USER  = 'backend1';
$RMQ_PASS  = 'password';
$RMQ_VHOST = '/app';

try {
    $connection = new AMQPStreamConnection($RMQ_HOST, $RMQ_PORT, $RMQ_USER, $RMQ_PASS, $RMQ_VHOST);
    $channel    = $connection->channel();

    // Declare queues
    $channel->queue_declare('frontend_to_backend1', false, false, false, false);
    $channel->queue_declare('backend1_to_backend2', false, false, false, false);
    $channel->queue_declare('backend2_to_backend1', false, false, false, false);
    $channel->queue_declare('backend1_to_frontend', false, false, false, false);

    echo "[Backend1] Listening for messages...\n";

    $callbackFrontend = function ($msg) use ($channel) {
        $body = $msg->body ?? '{}';
        $data = json_decode($body, true) ?: [];

        echo "[Backend1] ← Received from Frontend: " . json_encode($data) . "\n";

        // Run validation 
        $validation = validateUserData($data['params'] ?? [], $data['action'] ?? '');
        if (!$validation['ok']) {
            $errMsg = json_encode(['ok' => false, 'error' => $validation['error']]);
            $response = new AMQPMessage($errMsg);
            $channel->basic_publish($response, '', 'backend1_to_frontend');
            $channel->basic_ack($msg->delivery_info['delivery_tag']);
            echo "[Backend1] Validation failed: {$validation['error']}\n";
            return;
        }

        $data['params'] = $validation['data'];
        $forward = new AMQPMessage(json_encode($data));

        // Send message to Backend2
        $channel->basic_publish($forward, '', 'backend1_to_backend2');
        echo "[Backend1] → Forwarded to Backend2: " . json_encode($data) . "\n";

        $channel->basic_ack($msg->delivery_info['delivery_tag']);
    };

    $callbackBackend2 = function ($msg) use ($channel) {
        $body = $msg->body ?? '{}';
        $data = json_decode($body, true) ?: [];

        echo "[Backend1] ↩ Received from Backend2: " . json_encode($data) . "\n";

        // Forward to frontend
        $forward = new AMQPMessage(json_encode($data));
        $channel->basic_publish($forward, '', 'backend1_to_frontend');
        echo "[Backend1] → Sent to Frontend.\n";

        $channel->basic_ack($msg->delivery_info['delivery_tag']);
    };

    // Start consuming from both queues
    $channel->basic_consume('frontend_to_backend1', '', false, false, false, false, $callbackFrontend);
    $channel->basic_consume('backend2_to_backend1', '', false, false, false, false, $callbackBackend2);

    // Keep connection open
    while (count($channel->callbacks)) {
        $channel->wait();
    }
} catch (Throwable $e) {
    error_log('[Backend1 ERROR] ' . $e->getMessage());
    echo "[Backend1] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>