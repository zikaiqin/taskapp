<?php
namespace User;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;

function fetch_all(PDO $pdo) {
    $query = 'SELECT * FROM Users';
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function get_by_name(string $uname, PDO $pdo) {
    $query = 'SELECT * FROM Users WHERE Username = :uname';
    $values = [':uname' => $uname];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function get_by_email(string $email, PDO $pdo) {
    $query = 'SELECT * FROM Users WHERE Email = :email';
    $values = [':email' => $email];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
    }
    return false;
}

function set(string $uname, string $email, string $pwd, int $perms, PDO $pdo, bool $replace = true) : int {
    $query = ($replace ? 'REPLACE' : 'INSERT') . ' INTO Users VALUES (:uname, :email, :pwd, :perms)';
    $values = [':uname' => $uname, ':email' => $email, ':pwd' => $pwd, ':perms' => $perms];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    return $stmt->rowCount();
}
