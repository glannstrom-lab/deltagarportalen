<?php
/**
 * Auth klass - Hanterar autentisering med JWT
 */
class Auth {
    private $db;
    private static $secret = null;
    
    public function __construct($db) {
        $this->db = $db;
        // Ladda secret från miljövariabel eller config
        if (self::$secret === null) {
            $envFile = __DIR__ . '/../.env';
            if (file_exists($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos($line, 'JWT_SECRET=') === 0) {
                        self::$secret = trim(substr($line, 11));
                        break;
                    }
                }
            }
            // Fallback om ingen secret finns
            if (self::$secret === null) {
                self::$secret = 'deltagarportalen-hemlig-nyckel-minst-32-tecken-lang';
            }
        }
    }
    
    /**
     * Registrera ny användare
     */
    public function register($email, $password, $extraData = []) {
        // Validera email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }
        
        // Kolla om email redan finns
        $existing = $this->db->queryOne(
            "SELECT id FROM users WHERE email = ?",
            [$email]
        );
        if ($existing) {
            throw new Exception('Email already registered');
        }
        
        // Hasha lösenord
        $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        
        // Skapa användare
        $userId = $this->db->execute(
            "INSERT INTO users (email, password_hash, first_name, last_name, phone) 
             VALUES (?, ?, ?, ?, ?)",
            [
                $email,
                $passwordHash,
                $extraData['firstName'] ?? null,
                $extraData['lastName'] ?? null,
                $extraData['phone'] ?? null
            ]
        );
        
        // Skapa token
        $token = $this->generateToken($userId);
        
        return [
            'token' => $token,
            'user' => [
                'id' => $userId,
                'email' => $email,
                'firstName' => $extraData['firstName'] ?? null,
                'lastName' => $extraData['lastName'] ?? null
            ]
        ];
    }
    
    /**
     * Logga in användare
     */
    public function login($email, $password) {
        $user = $this->db->queryOne(
            "SELECT * FROM users WHERE email = ?",
            [$email]
        );
        
        if (!$user) {
            return null;
        }
        
        if (!password_verify($password, $user['password_hash'])) {
            return null;
        }
        
        $token = $this->generateToken($user['id']);
        
        return [
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'firstName' => $user['first_name'],
                'lastName' => $user['last_name'],
                'role' => $user['role']
            ]
        ];
    }
    
    /**
     * Generera JWT token
     */
    private function generateToken($userId) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $time = time();
        $payload = json_encode([
            'iss' => 'deltagarportalen',
            'iat' => $time,
            'exp' => $time + (60 * 60 * 24 * 7), // 7 dagar
            'sub' => $userId
        ]);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Verifiera JWT token
     */
    public static function verifyToken($token) {
        if (self::$secret === null) {
            // Ladda secret
            $envFile = __DIR__ . '/../.env';
            if (file_exists($envFile)) {
                $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    if (strpos($line, 'JWT_SECRET=') === 0) {
                        self::$secret = trim(substr($line, 11));
                        break;
                    }
                }
            }
            if (self::$secret === null) {
                self::$secret = 'deltagarportalen-hemlig-nyckel-minst-32-tecken-lang';
            }
        }
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if (!hash_equals($base64Signature, $parts[2])) {
            return null;
        }
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
        
        if (!$payload || $payload['exp'] < time()) {
            return null;
        }
        
        return $payload;
    }
    
    /**
     * Hämta inloggad användare från request
     */
    public static function getCurrentUser($db) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return null;
        }
        
        $token = $matches[1];
        $payload = self::verifyToken($token);
        
        if (!$payload) {
            return null;
        }
        
        return $db->queryOne(
            "SELECT * FROM users WHERE id = ?",
            [$payload['sub']]
        );
    }
}
