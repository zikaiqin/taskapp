<?php
namespace User;
use PDO;

if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

function get_by_id(string $uid, PDO $pdo) {
    $query = 'SELECT * FROM Users WHERE UserID = :uid';
    $values = [':uid' => $uid];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($row = $stmt->fetch())) {
        return $row;
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

function add(string $uid, string $uname, string $pwd, int $perms, PDO $pdo) : bool {
    $query = 'INSERT INTO Users VALUES (:uid, :uname, :pwd, :perms)';
    $values = [':uid' => $uid, ':uname' => $uname, ':pwd' => $pwd, ':perms' => $perms];
    $stmt = $pdo->prepare($query);
    return $stmt->execute($values);
}
