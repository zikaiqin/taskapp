<?php
namespace Assignee;
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

use PDO;
use function Request\require_values;

function fetch_all(PDO $pdo) {
    $query = 'SELECT * FROM Assignees';
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function get_by_task(string $task_id, PDO $pdo) {
    $query = 'SELECT * FROM Assignees WHERE TaskID = :id';
    $values = [':id' => $task_id];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function get_by_user(string $username, PDO $pdo) {
    $query = 'SELECT * FROM Assignees WHERE Username = :uname';
    $values = [':uname' => $username];
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    if (is_array($table = $stmt->fetchAll())) {
        return $table;
    }
    return false;
}

function assign(string $task_id, PDO $pdo, ...$users) : int {
    if (count($users) === 0) return 0;
    $query = 'INSERT IGNORE INTO Assignees VALUES '
        . implode(',', array_fill(0, count($users), '(?, ?)'));
    $stmt = $pdo->prepare($query);
    foreach ($users as $index => $user) {
        $stmt->bindValue(2 * $index + 1, $task_id);
        $stmt->bindValue(2 * $index + 2, $user);
    }
    $stmt->execute();
    return $stmt->rowCount();
}

function verify (array $assignees, array $users) : bool {
    foreach ($assignees as $assignee) {
        $found = false;
        foreach ($users as $row) {
            if ($row['Username'] === $assignee) {
                $found = true;
                break;
            }
        }
        if (!$found) {
            http_response_code(400);
            echo "L\'utilisateur $assignee n'existe pas.";
            return false;
        }
    }
    return true;
}
