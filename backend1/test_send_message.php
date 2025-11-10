<?php
// par36 - 10/3/25 - file for test sending RabbitMQ messages/queues
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

try {
    // RabbitMQ connection
    $connection = new AMQPStreamConnection('100.111.184.25', 5672, 'backend1', 'password', '/app'); // Connection parameters
    $channel = $connection->channel();
    // Declare durable queue (set to true)
    $queueName = 'test';
    $channel->queue_declare($queueName, false, true, false, false);
    $messages = [
        "Greetings from Backend1!",
        "This is a test."
    ];
    foreach ($messages as $rawBody) {
        // Ensure message body is a string (for testing and clarify)
        $body = mb_convert_encoding((string) $rawBody, 'UTF-8', 'auto');

        // Debug output
        echo "Preparing to send message...\n";
        echo "Type: " . gettype($body) . "\n";
        echo "Length: " . strlen($body) . "\n";
        var_dump($body);
        try {
            $msg = new AMQPMessage($body, ['delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT]);
            $channel->basic_publish($msg, '', $queueName);
            echo " [x] Sent: $body\n";
        } catch (Exception $ex) {
            echo " [!] Failed to send message: " . $ex->getMessage() . "\n";
        }
    }
    $channel->close();
    $connection->close();
} catch (Exception $e) {
    echo " [!] Connection or setup error: " . $e->getMessage() . "\n";
    exit(1);
}
