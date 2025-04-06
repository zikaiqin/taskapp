<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

class Database {
    private static Database $instance;
    private PDO $pdo;

    private function __construct() {
        $dsn = getenv('DB_CONN');
        $username = getenv('DB_USER');
        $password = getenv('DB_PWD');
        if (empty($dsn) || empty($username) || empty($password)) {
            throw new Exception('Database connection details are not set in environment variables.');
        }

        $options = [
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        try {
            $this->pdo = new PDO($dsn, $username, $password, $options);
        } catch (Exception $e) {
            throw new Exception('Database error:\n' . $e->getMessage());
        }
    }

    public static function get(): PDO {
        if (empty(self::$instance)) {
            self::$instance = new Database();
        }
        return self::$instance->pdo;
    }
}
