<?php
namespace Task;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;

function fetch_all(PDO $pdo) {
    $query = 'SELECT * FROM Tasks';
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function get(string $id, PDO $pdo) {
    $query = 'SELECT * FROM Tasks WHERE TaskID = :id';
    $values = [':id' => $id];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function set(
    string $task_id,
    $category_id,
    $username,
    string $title,
    string $desc,
    string $date,
    int $status,
    PDO $pdo,
    bool $replace = true
): int {
    $query =
        ($replace ? 'REPLACE' : 'INSERT') . ' INTO Tasks VALUES (:tid, :cid, :uname, :title, :desc, :date, :stat)';
    $values = [
        ':tid' => $task_id,
        ':cid' => $category_id,
        ':uname' => $username,
        ':title' => $title,
        ':desc' => $desc,
        ':date' => $date,
        ':stat' => $status,
    ];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}

function delete(string $task_id, PDO $pdo) : int {
    $query = 'DELETE FROM Tasks WHERE TaskID = :id';
    $values = [':id' => $task_id];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}
