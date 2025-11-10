<?php
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/rabbitmq_to_db.php';

use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$RMQ_HOST  = '100.111.184.25';
$RMQ_PORT  = 5672;
$RMQ_USER  = 'backend2';
$RMQ_PASS  = 'password';
$RMQ_VHOST = '/app';

try {
    $connection = new AMQPStreamConnection($RMQ_HOST, $RMQ_PORT, $RMQ_USER, $RMQ_PASS, $RMQ_VHOST);
    $channel    = $connection->channel();

    // Declare all queues this service touches
    $channel->queue_declare('backend1_to_backend2', false, false, false, false);
    $channel->queue_declare('backend2_to_backend1', false, false, false, false);
    $channel->queue_declare('db_request_queue',     false, false, false, false);
    $channel->queue_declare('db_response_queue',    false, false, false, false);

    echo "[Backend2] Running and waiting for messages...\n";

    $callbackFrontend = function ($msg) use ($channel) {
        $body = $msg->body ?? '{}';
        $data = json_decode($body, true) ?: [];

        echo "[Backend2] ← Received from Backend1: " . json_encode($data) . "\n";

        // Forward to DB queue
        $forward = new AMQPMessage(json_encode($data));
        $channel->basic_publish($forward, '', 'db_request_queue');

        $channel->basic_ack($msg->delivery_info['delivery_tag']);
    };

    $callbackDB = function ($msg) use ($channel) {
        $body = $msg->body ?? '{}';
        $data = json_decode($body, true) ?: [];

        echo "[Backend2] ↩ Received DB response: " . json_encode($data) . "\n";

        $forward = new AMQPMessage(json_encode($data));
        $channel->basic_publish($forward, '', 'backend2_to_backend1');

        $channel->basic_ack($msg->delivery_info['delivery_tag']);
    };

    // Register both consumers
    $channel->basic_consume('backend1_to_backend2', '', false, false, false, false, $callbackFrontend);
    $channel->basic_consume('db_response_queue',    '', false, false, false, false, $callbackDB);

    // Keep the event loop alive
    while (count($channel->callbacks)) {
        $channel->wait();
    }
} catch (Throwable $e) {
    error_log('[Backend2 ERROR] ' . $e->getMessage());
    echo "[Backend2] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>