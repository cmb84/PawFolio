<?php
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$connection = new AMQPStreamConnection('100.111.184.25', 5672, 'frontend', 'password', '/app');
$channel = $connection->channel();

$channel->queue_declare('frontend_to_backend1', false, false, false, false);
$channel->queue_declare('backend1_to_frontend', false, false, false, false);

// Variables will be changed to equal the frontend input once completed (0 is placeholder)
$username = 0;
$email = 0; 
$password = 0; 

// Build a request
$request = [
    'action' => 'create_user', // correlate with action on other pages
    'params' => [
        'username' => $username,
        'email' => $email,
        'password' => $password
    ]
];

$msg = new AMQPMessage(json_encode($request));
$channel->basic_publish($msg, '', 'frontend_to_backend1');
echo "[Frontend] Sent request: " . json_encode($request) . "\n";

// Listen for response
$callback = function ($msg) {
    echo "[Frontend] Received response: " . $msg->body . "\n";
    $msg->ack();
};

$channel->basic_consume('backend1_to_frontend', '', false, false, false, false, $callback);

while (count($channel->callbacks)) {
    $channel->wait();
}