<?php
namespace Update;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;

function fetch_all(PDO $pdo) {
    $query = 'SELECT * FROM Updates';
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function set(int $type, int $time, $data, PDO $pdo): int {
    $query = 'REPLACE INTO Updates VALUES (:type, :time, :data)';
    $values = [
        ':type' => $type,
        ':time' => $time,
        ':data' => $data,
    ];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}
