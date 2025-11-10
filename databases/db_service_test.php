<?php
declare(strict_types=1);
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/db_test.php';
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;

$RMQ_HOST  = '100.111.184.25';
$RMQ_PORT  = 5672;
$RMQ_USER  = 'database';
$RMQ_PASS  = 'password';
$RMQ_VHOST = '/app';

try {
    $connection = new AMQPStreamConnection($RMQ_HOST, $RMQ_PORT, $RMQ_USER, $RMQ_PASS, $RMQ_VHOST);
    $channel    = $connection->channel();

    // Declare queues
    $channel->queue_declare('db_request_queue', false, false, false, false);
    $channel->queue_declare('db_response_queue', false, false, false, false);

    echo "[DB Service] Listening on db_request_queue...\n";

    $callback = function ($req) use ($channel) {
        $data   = json_decode($req->body ?? '{}', true) ?: [];
        $action = $data['action'] ?? '';
        $params = $data['params'] ?? $data;
        $response = ['status' => 'error', 'message' => 'Unknown action'];

        try {
            $pdo = getPDO();

            switch ($action) {
                case 'register':
                    if (empty($params['email']) || empty($params['username']) || empty($params['password'])) {
                        throw new Exception("Missing required fields for registration");
                    }
                    $stmt = $pdo->prepare("INSERT INTO users (email, username, password)
                                           VALUES (:email, :username, :password)");
                    $stmt->execute([
                        ':email' => $params['email'],
                        ':username' => $params['username'],
                        ':password' => $params['password']
                    ]);
                    $response = [
                        'status'  => 'success',
                        'message' => 'User registered successfully',
                        'user_id' => $pdo->lastInsertId()
                    ];
                    break;

                case 'update':
                    if (empty($params['id'])) {
                        throw new Exception("Missing user ID for update");
                    }
                    $fields = [];
                    $exec = [':id' => $params['id']];
                    foreach (['email', 'username', 'password'] as $f) {
                        if (!empty($params[$f])) {
                            $fields[] = "$f = :$f";
                            $exec[":$f"] = $params[$f];
                        }
                    }
                    if ($fields) {
                        $stmt = $pdo->prepare("UPDATE users SET " . implode(", ", $fields) . " WHERE id = :id");
                        $stmt->execute($exec);
                        $response = [
                            'status'   => 'success',
                            'message'  => 'User updated',
                            'affected' => $stmt->rowCount()
                        ];
                    } else {
                        $response = ['status' => 'error', 'message' => 'No fields to update'];
                    }
                    break;

                case 'delete_user':
                    if (empty($params['id'])) {
                        throw new Exception("Missing user ID for deletion");
                    }
                    $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
                    $stmt->execute([':id' => $params['id']]);
                    $response = [
                        'status'   => 'success',
                        'message'  => 'User deleted',
                        'affected' => $stmt->rowCount()
                    ];
                    break;

                case 'reset_password':
                    if (empty($params['id']) || empty($params['password'])) {
                        throw new Exception("Missing user ID or password");
                    }
                    $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
                    $stmt->execute([
                        ':password' => $params['password'],
                        ':id'       => $params['id']
                    ]);
                    $response = [
                        'status'   => 'success',
                        'message'  => 'Password reset',
                        'affected' => $stmt->rowCount()
                    ];
                    break;

                case 'login':
                    if (empty($params['email']) || empty($params['password'])) {
                        throw new Exception("Missing email or password");
                    }
                    $stmt = $pdo->prepare("SELECT id, username, password FROM users WHERE email = :email");
                    $stmt->execute([':email' => $params['email']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                    if (!$user || !password_verify($params['password'], $user['password'])) {
                        $response = ['status' => 'error', 'message' => 'Invalid credentials'];
                    } else {
                        $response = [
                            'status'  => 'success',
                            'message' => 'Login successful',
                            'user'    => [
                                'id'       => $user['id'],
                                'username' => $user['username'],
                                'email'    => $params['email']
                            ]
                        ];
                    }
                    break;

                default:
                    $response = ['status' => 'error', 'message' => "Unsupported action: $action"];
            }
        } catch (Throwable $e) {
            $response = ['status' => 'error', 'message' => $e->getMessage()];
            error_log('[DB ERROR] ' . $e->getMessage());
        }

        // Publish response to db_response_queue
        $reply = new AMQPMessage(json_encode($response, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        $channel->basic_publish($reply, '', 'db_response_queue');

        $channel->basic_ack($req->delivery_info['delivery_tag']);
        echo "[DB Service] → Response published to db_response_queue\n";
    };

    $channel->basic_consume('db_request_queue', '', false, false, false, false, $callback);

    while (count($channel->callbacks)) {
        $channel->wait();
    }
} catch (Throwable $e) {
    error_log('[DB SERVICE ERROR] ' . $e->getMessage());
    echo "[DB Service] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}
?>