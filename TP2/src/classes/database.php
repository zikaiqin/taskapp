<?php
if (isset($_GET['source'])) { die(highlight_file(__FILE__, 1)); }

class Database {
    private static Database $instance;
    private PDO $pdo;

    private function __construct() {
        # Read host, user, pwd and schema from '/config.json'
        $fp = dirname(__DIR__) . '/config.json';
        $configs = file_get_contents($fp);
        if (!$configs) {
            throw new Exception('Missing configs for database');
        }
        $db_conf = json_decode($configs, true)['database'];

        $dsn = 'mysql:host=' . $db_conf['host'] . ';dbname=' . $db_conf['schema'];
        $options = [
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];
        try {
            $this->pdo = new PDO($dsn, $db_conf['user'], $db_conf['password'], $options);
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
