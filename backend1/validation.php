<?php
declare(strict_types=1);


// Returns either ['ok'=>true, 'data'=>sanitizedData] or ['ok'=>false, 'error'=>message].
function validateUserData(array $params, string $action): array
{
    $params = array_map('trim', $params);

    $fail = fn(string $msg): array => ['ok' => false, 'error' => $msg];

    // Common email check
    if (isset($params['email']) && !filter_var($params['email'], FILTER_VALIDATE_EMAIL)) {
        return $fail('Invalid email address');
    }

    switch ($action) {
        case 'create_user':
        case 'register':
            if (empty($params['email']) || empty($params['username']) || empty($params['password'])) {
                return $fail('Missing required fields: username, email, or password');
            }

            if (!preg_match('/^[A-Za-z0-9_]{3,15}$/', $params['username'])) {
                return $fail('Invalid username (letters, numbers, at least 8 chars)');
            }

            if (strlen($params['password']) < 8) {
                return $fail('Password must be at least 8 characters long');
            }

            if (!preg_match('/[A-Z]/', $params['password']) ||
                !preg_match('/[a-z]/', $params['password']) ||
                !preg_match('/[0-9]/', $params['password'])) {
                return $fail('Password must include upper, lower, and numeric characters');
            }

            $params['username'] = htmlspecialchars(strip_tags($params['username']), ENT_QUOTES, 'UTF-8');
            $params['password'] = password_hash($params['password'], PASSWORD_BCRYPT);
            break;

        case 'login':
            if (empty($params['email']) || empty($params['password'])) {
                return $fail('Missing email or password');
            }
            if (!filter_var($params['email'], FILTER_VALIDATE_EMAIL)) {
                return $fail('Invalid email format');
            }
            break;

        case 'update_profile':
            if (isset($params['username']) &&
                !preg_match('/^[A-Za-z0-9_]{3,15}$/', $params['username'])) {
                return $fail('Invalid username (letters, numbers, at least 8 chars)');
            }

            if (isset($params['email']) &&
                !filter_var($params['email'], FILTER_VALIDATE_EMAIL)) {
                return $fail('Invalid email format');
            }

            if (isset($params['password'])) {
                if (strlen($params['password']) < 8) {
                    return $fail('Password must be at least 8 characters long');
                }
                $params['password'] = password_hash($params['password'], PASSWORD_BCRYPT);
            }

            if (isset($params['username'])) {
                $params['username'] = htmlspecialchars(strip_tags($params['username']), ENT_QUOTES, 'UTF-8');
            }
            break;

        default:
            return $fail('Unknown validation action');
    }

    return ['ok' => true, 'data' => $params];
}
?>