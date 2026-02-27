<?php
/**
 * Database klass - SQLite wrapper
 * Singleton pattern för att återanvända anslutning
 */
class Database {
    private static $instance = null;
    private $pdo;
    private $dbPath;
    
    private function __construct() {
        // Säkerställ att databasmappen finns
        $this->dbPath = __DIR__ . '/../data/';
        if (!is_dir($this->dbPath)) {
            mkdir($this->dbPath, 0755, true);
        }
        
        // Anslut till SQLite
        $dbFile = $this->dbPath . 'deltagarportal.db';
        $this->pdo = new PDO('sqlite:' . $dbFile);
        $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Initiera databasen om den är tom
        $this->initDatabase();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Kör en SELECT-fråga och returnera alla rader
     */
    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    /**
     * Kör en SELECT-fråga och returnera en rad
     */
    public function queryOne($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch();
    }
    
    /**
     * Kör en INSERT/UPDATE/DELETE-fråga
     * Returnera lastInsertId för INSERT
     */
    public function execute($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Initiera databasstruktur
     */
    private function initDatabase() {
        // Användare
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            address TEXT,
            postal_code TEXT,
            city TEXT,
            date_of_birth TEXT,
            bio TEXT,
            profile_image TEXT,
            current_phase TEXT DEFAULT 'exploring',
            role TEXT DEFAULT 'USER',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )");
        
        // CV
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS cvs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            summary TEXT,
            work_experience TEXT,
            education TEXT,
            skills TEXT,
            languages TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
        
        // CV-versioner (historik)
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS cv_versions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            cv_id INTEGER NOT NULL,
            version_number INTEGER NOT NULL,
            data TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (cv_id) REFERENCES cvs(id) ON DELETE CASCADE
        )");
        
        // Personliga brev
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS cover_letters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            company TEXT,
            content TEXT,
            job_details TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
        
        // Intresseguide-resultat
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS interest_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            answers TEXT,
            categories TEXT,
            recommendations TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
        
        // Spara jobb
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS saved_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            external_id TEXT NOT NULL,
            title TEXT,
            company TEXT,
            location TEXT,
            description TEXT,
            url TEXT,
            salary TEXT,
            employment_type TEXT,
            application_deadline TEXT,
            raw_data TEXT,
            status TEXT DEFAULT 'saved',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, external_id)
        )");
        
        // Användarinställningar
        $this->pdo->exec("CREATE TABLE IF NOT EXISTS user_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            calm_mode INTEGER DEFAULT 0,
            high_contrast INTEGER DEFAULT 0,
            large_text INTEGER DEFAULT 0,
            reduce_motion INTEGER DEFAULT 0,
            email_notifications INTEGER DEFAULT 1,
            job_alerts INTEGER DEFAULT 1,
            preferred_language TEXT DEFAULT 'sv',
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )");
        
        // Index för snabbare sökning
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_interest_results_user_id ON interest_results(user_id)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id)");
        $this->pdo->exec("CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id)");
    }
}
