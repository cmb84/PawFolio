<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('GET');

$user = current_user();
if (!$user) {
    json_out(['ok' => false, 'error' => 'Not authenticated'], 401);
}

json_out([
    'ok'   => true,
    'user' => $user,
]);
