<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$body = read_json_body();

$email    = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_out(['ok' => false, 'error' => 'Email and password are required'], 400);
}

try {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT id, username, email, password FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $row = $stmt->fetch();

    if (!$row) {
        json_out(['ok' => false, 'error' => 'Invalid email or password'], 401);
    }

    if (!password_verify($password, $row['password'])) {
        json_out(['ok' => false, 'error' => 'Invalid email or password'], 401);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $row['id'];

    json_out([
        'ok'   => true,
        'user' => [
            'id'       => (int) $row['id'],
            'username' => $row['username'],
            'email'    => $row['email'],
        ],
    ]);
} catch (Throwable $e) {
    error_log('[LOGIN] ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Server error during login'], 500);
}
