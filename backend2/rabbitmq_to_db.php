<?php
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

function dbms_send_to_db(array $data): void
{
    $RMQ_HOST  = '100.111.184.25';
    $RMQ_PORT  = 5672;
    $RMQ_USER  = 'backend2';   // backend2 publishes to DB
    $RMQ_PASS  = 'password';
    $RMQ_VHOST = '/app';

    try {
        $connection = new AMQPStreamConnection($RMQ_HOST, $RMQ_PORT, $RMQ_USER, $RMQ_PASS, $RMQ_VHOST);
        $channel    = $connection->channel();

        // Declare the DB request queue
        $channel->queue_declare('db_request_queue', false, false, false, false);

        // Publish the message to DB queue
        $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        $msg  = new AMQPMessage($json, ['content_type' => 'application/json']);

        $channel->basic_publish($msg, '', 'db_request_queue');
        echo "[RabbitMQ → DB] Published message: " . $json . "\n";

        $channel->close();
        $connection->close();
    } catch (Throwable $e) {
        error_log('[RabbitMQ → DB ERROR] ' . $e->getMessage());
        echo "[RabbitMQ → DB ERROR] " . $e->getMessage() . "\n";
    }
}
?>