<?php
namespace Session;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;

function get(string $sid, PDO $pdo) {
    $query = 'SELECT * FROM Sessions WHERE SessionID = :sid';
    $values = [':sid' => $sid];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function validate_time(int $time_created, int $time_requested, int $lifetime) : bool {
    return $time_requested <= $time_created + $lifetime;
}

function set(string $sid, string $uname, int $time_requested, PDO $pdo) : bool {
    $query = 'REPLACE INTO Sessions VALUES (:sid, :uname, :time_requested)';
    $values = [':sid' => $sid, ':uname' => $uname, ':time_requested' => $time_requested];
    $stmt = $pdo->prepare($query);
    return $stmt->execute($values);
}

function delete(string $sid, PDO $pdo) : bool {
    $query = 'DELETE FROM Sessions WHERE SessionID = :sid';
    $values = [':sid' => $sid];
    $stmt = $pdo->prepare($query);
    return $stmt->execute($values);
}