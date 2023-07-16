<?php
namespace Request;
use Exception;

if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function require_methods(...$methods) : bool {
    $found = in_array($_SERVER['REQUEST_METHOD'], $methods);
    if (!$found) {
        http_response_code(405);
        echo 'Method not allowed';
    }
    return $found;
}

function require_values(...$values) : bool {
    foreach ($values as $value) {
        if (!isset($value) || $value === '') {
            http_response_code(400);
            echo 'Form incomplete';
            return false;
        }
    }
    return true;
}

function require_authentication($username) : bool {
    if ($username === false) {
        http_response_code(401);
        echo 'Not authenticated';
        return false;
    }
    return true;
}
function require_privilege($actual, $expected) : bool {
    if (!is_numeric($actual) || ((int) $actual !== $expected)) {
        http_response_code(403);
        echo 'Not allowed';
        return false;
    }
    return true;
}
