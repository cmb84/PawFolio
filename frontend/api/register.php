<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$body = read_json_body();
$email = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');
$username = trim((string) ($body['username'] ?? ''));

if ($email === '' || $password === '' || $username === '') {
    json_out(['ok' => false, 'error' => 'Username, email, and password are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'error' => 'Invalid email address'], 400);
}

if (strlen($password) < 8) {
    json_out(['ok' => false, 'error' => 'Password must be at least 8 characters long'], 400);
}

$payload = [
    'action' => 'register',
    'params' => [
        'username' => $username,
        'email' => $email,
        'password' => $password
    ],
    'ts' => time(),
];

$response = null;
$maxRetries = 3;
$retryDelays = [5, 10, 15];

for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
    try {
        [$connection, $channel] = get_rabbitmq_channel() ?? [null, null];
        if (!$connection || !$channel) {
            throw new RuntimeException('Failed to connect to RabbitMQ');
        }

        rabbitmq_publish(RMQ_QUEUE_F2B1, $payload);
        error_log("[REGISTER] Attempt #{$attempt} sent 'register' payload to queue: " . RMQ_QUEUE_F2B1);

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

        if ($response) break;

        if ($attempt < $maxRetries) {
            $delay = $retryDelays[$attempt - 1];
            error_log("[REGISTER] No response. Retrying in {$delay}s...");
            sleep($delay);
        }

    } catch (Throwable $e) {
        error_log("[REGISTER ERROR][Attempt #{$attempt}] " . $e->getMessage());
        if ($attempt < $maxRetries) {
            $delay = $retryDelays[$attempt - 1];
            error_log("[REGISTER] Retrying in {$delay}s...");
            sleep($delay);
            continue;
        } else {
            json_out(['ok' => false, 'error' => 'Message broker unavailable'], 500);
        }
    }
}

if (!$response) {
    json_out(['ok' => false, 'error' => 'No response from backend after multiple attempts'], 504);
}

if (($response['status'] ?? '') !== 'success') {
    json_out([
        'ok' => false,
        'error' => $response['message'] ?? 'Registration failed'
    ], 400);
}

$user = $response['user'] ?? [
    'id' => $response['user_id'] ?? null,
    'username' => $username,
    'email' => $email,
];
if (empty($user['id'])) {
    json_out(['ok' => false, 'error' => 'Malformed backend response'], 502);
}

$_SESSION['user'] = $user;

$tokenPayload = base64_encode(json_encode([
    'uid' => $user['id'],
    'ts' => time(),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]));
set_auth_cookie($tokenPayload);

json_out([
    'ok' => true,
    'message' => 'Registration successful',
    'user' => $user,
    'token' => $tokenPayload
]);
?>
