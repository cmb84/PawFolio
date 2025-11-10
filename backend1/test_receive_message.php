<?php
// par36 - 10/3/25 - file for test receiving RabbitMQ messages/queues
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Exception\AMQPTimeoutException;
use PhpAmqpLib\Message\AMQPMessage;

try {
    $connection = new AMQPStreamConnection('100.111.184.25', 5672, 'backend1', 'password', '/app'); // Connection parameters
    $channel = $connection->channel();
    $channel->queue_declare('test', false, true, false, false);

    echo " [*] Waiting for messages. To exit press CTRL+C\n";

    $callback = function (AMQPMessage $msg) use ($channel) {
    echo " [x] Received: ", $msg->body, "\n";
    $channel->basic_ack($msg->get('delivery_tag'));
    };
    $channel->basic_consume('test', '', false, false, false, false, $callback);
    while (count($channel->callbacks)) {
        try {
            $channel->wait(null, false, 30); 
        } catch (AMQPTimeoutException $e) {
            echo " [!] Timeout waiting for messages... still alive\n";
        } catch (Exception $e) {
            echo " [!] Error while consuming: " . $e->getMessage() . "\n";
            break;
        }
    }
    echo " [x] Shutting down...\n";
    $channel->close();
    $connection->close();

} catch (Exception $e) {
    echo " [!] Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
