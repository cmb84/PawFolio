<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$body = read_json_body();

$username = trim((string) ($body['username'] ?? ''));
$email    = trim((string) ($body['email'] ?? ''));
$password = (string) ($body['password'] ?? '');
$confirm  = (string) ($body['confirm'] ?? '');

if ($username === '' || $email === '' || $password === '' || $confirm === '') {
    json_out(['ok' => false, 'error' => 'All fields are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'error' => 'Invalid email address'], 400);
}

if ($password !== $confirm) {
    json_out(['ok' => false, 'error' => 'Passwords do not match'], 400);
}

if (strlen($password) < 8) {
    json_out(['ok' => false, 'error' => 'Password must be at least 8 characters'], 400);
}

try {
    $pdo = getPDO();

    // Check for existing email
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    if ($stmt->fetch()) {
        json_out(['ok' => false, 'error' => 'An account with that email already exists'], 409);
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare(
        'INSERT INTO users (username, email, password) VALUES (:username, :email, :password)'
    );
    $stmt->execute([
        ':username' => $username,
        ':email'    => $email,
        ':password' => $hash,
    ]);

    $userId = (int) $pdo->lastInsertId();
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;

    json_out([
        'ok'   => true,
        'user' => [
            'id'       => $userId,
            'username' => $username,
            'email'    => $email,
        ],
    ]);
} catch (Throwable $e) {
    error_log('[REGISTER] ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'Server error during registration'], 500);
}
