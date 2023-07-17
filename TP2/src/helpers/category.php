<?php
namespace Category;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;

function fetch_all(PDO $pdo) {
    $query = 'SELECT * FROM Categories';
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function get_by_name(string $name, PDO $pdo) {
    $query = 'SELECT * FROM Categories WHERE Name = :name';
    $values = [':name' => $name];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function get_by_id(string $id, PDO $pdo) {
    $query = 'SELECT * FROM Categories WHERE CategoryID = :id';
    $values = [':id' => $id];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function set(string $id, string $name, string $desc, PDO $pdo, bool $replace = true) : int {
    $query = ($replace ? 'REPLACE' : 'INSERT') . ' INTO Categories VALUES (:id, :name, :desc)';
    $values = [':id' => $id, ':name' => $name, ':desc' => $desc];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}

function delete(string $id, PDO $pdo) : int {
    $query = 'DELETE FROM Categories WHERE CategoryID = :id';
    $values = [':id' => $id];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}
