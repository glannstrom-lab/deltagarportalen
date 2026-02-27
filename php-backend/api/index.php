<?php
/**
 * Deltagarportalen - PHP Backend API
 * Kompatibel med Simply och annan delad hosting
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Hantera preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ladda konfiguration och bibliotek
require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/Response.php';

// Initiera databas
$db = Database::getInstance();

// Hämta request path - hantera undermappar korrekt
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Ta bort allt före och inklusive /api/
if (strpos($path, '/api/') !== false) {
    $path = substr($path, strpos($path, '/api/') + 5); // +5 för att hoppa över '/api/'
}

$path = trim($path, '/');
$segments = explode('/', $path);

$endpoint = $segments[0] ?? '';
$subEndpoint = $segments[1] ?? '';
$id = $segments[2] ?? null;

// Hämta request body
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Routing
try {
    switch ($endpoint) {
        case 'health':
            Response::success(['status' => 'ok', 'timestamp' => date('c')]);
            break;
            
        case 'auth':
            handleAuth($subEndpoint, $input, $db);
            break;
            
        case 'cv':
            handleCV($subEndpoint, $id, $input, $db);
            break;
            
        case 'cover-letter':
            handleCoverLetter($subEndpoint, $id, $input, $db);
            break;
            
        case 'interest':
            handleInterest($subEndpoint, $input, $db);
            break;
            
        case 'user':
            handleUser($subEndpoint, $id, $input, $db);
            break;
            
        case 'settings':
            handleSettings($input, $db);
            break;
            
        case 'jobs':
            handleJobs($subEndpoint, $input);
            break;
            
        default:
            Response::error('Endpoint not found', 404);
    }
} catch (Exception $e) {
    error_log('API Error: ' . $e->getMessage());
    Response::error('Internal server error', 500);
}

// ==================== HANDLERS ====================

function handleAuth($action, $input, $db) {
    $auth = new Auth($db);
    
    switch ($action) {
        case 'register':
            if (empty($input['email']) || empty($input['password'])) {
                Response::error('Email and password required', 400);
            }
            $result = $auth->register($input['email'], $input['password'], $input);
            Response::success($result);
            break;
            
        case 'login':
            if (empty($input['email']) || empty($input['password'])) {
                Response::error('Email and password required', 400);
            }
            $result = $auth->login($input['email'], $input['password']);
            if (!$result) {
                Response::error('Invalid credentials', 401);
            }
            Response::success($result);
            break;
            
        case 'me':
            $user = Auth::getCurrentUser($db);
            if (!$user) {
                Response::error('Unauthorized', 401);
            }
            Response::success($user);
            break;
            
        default:
            Response::error('Auth action not found', 404);
    }
}

function handleCV($action, $id, $input, $db) {
    $user = Auth::getCurrentUser($db);
    if (!$user) {
        Response::error('Unauthorized', 401);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if ($action === 'versions') {
                $versions = $db->query(
                    "SELECT * FROM cv_versions WHERE user_id = ? ORDER BY created_at DESC",
                    [$user['id']]
                );
                Response::success($versions);
            } else {
                $cv = $db->queryOne(
                    "SELECT * FROM cvs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1",
                    [$user['id']]
                );
                if (!$cv) {
                    // Returnera tomt CV om inget finns
                    Response::success([
                        'id' => null,
                        'firstName' => $user['first_name'] ?? '',
                        'lastName' => $user['last_name'] ?? '',
                        'email' => $user['email'] ?? '',
                        'phone' => $user['phone'] ?? '',
                        'summary' => '',
                        'workExperience' => [],
                        'education' => [],
                        'skills' => [],
                        'languages' => []
                    ]);
                }
                $cv['workExperience'] = json_decode($cv['work_experience'] ?? '[]', true);
                $cv['education'] = json_decode($cv['education'] ?? '[]', true);
                $cv['skills'] = json_decode($cv['skills'] ?? '[]', true);
                $cv['languages'] = json_decode($cv['languages'] ?? '[]', true);
                Response::success($cv);
            }
            break;
            
        case 'POST':
        case 'PUT':
            $data = json_encode([
                'workExperience' => $input['workExperience'] ?? [],
                'education' => $input['education'] ?? [],
                'skills' => $input['skills'] ?? [],
                'languages' => $input['languages'] ?? []
            ]);
            
            // Kolla om CV finns
            $existing = $db->queryOne(
                "SELECT id FROM cvs WHERE user_id = ?",
                [$user['id']]
            );
            
            if ($existing) {
                $db->execute(
                    "UPDATE cvs SET first_name = ?, last_name = ?, email = ?, phone = ?, 
                     summary = ?, work_experience = ?, education = ?, skills = ?, 
                     languages = ?, updated_at = datetime('now') 
                     WHERE user_id = ?",
                    [
                        $input['firstName'] ?? $user['first_name'] ?? '',
                        $input['lastName'] ?? $user['last_name'] ?? '',
                        $input['email'] ?? $user['email'] ?? '',
                        $input['phone'] ?? $user['phone'] ?? '',
                        $input['summary'] ?? '',
                        $data,
                        $user['id']
                    ]
                );
            } else {
                $db->execute(
                    "INSERT INTO cvs (user_id, first_name, last_name, email, phone, 
                     summary, work_experience, education, skills, languages) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $user['id'],
                        $input['firstName'] ?? $user['first_name'] ?? '',
                        $input['lastName'] ?? $user['last_name'] ?? '',
                        $input['email'] ?? $user['email'] ?? '',
                        $input['phone'] ?? $user['phone'] ?? '',
                        $input['summary'] ?? '',
                        $data,
                        $data,
                        $data,
                        $data
                    ]
                );
            }
            
            Response::success(['success' => true, 'message' => 'CV saved']);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
}

function handleCoverLetter($action, $id, $input, $db) {
    $user = Auth::getCurrentUser($db);
    if (!$user) {
        Response::error('Unauthorized', 401);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $letters = $db->query(
                "SELECT * FROM cover_letters WHERE user_id = ? ORDER BY created_at DESC",
                [$user['id']]
            );
            foreach ($letters as &$letter) {
                $letter['jobDetails'] = json_decode($letter['job_details'] ?? '{}', true);
            }
            Response::success($letters);
            break;
            
        case 'POST':
            $letterId = $db->execute(
                "INSERT INTO cover_letters (user_id, title, company, content, job_details) 
                 VALUES (?, ?, ?, ?, ?)",
                [
                    $user['id'],
                    $input['title'] ?? 'Nytt brev',
                    $input['company'] ?? '',
                    $input['content'] ?? '',
                    json_encode($input['jobDetails'] ?? [])
                ]
            );
            Response::success(['id' => $letterId, 'success' => true]);
            break;
            
        case 'PUT':
            if (!$id) {
                Response::error('ID required', 400);
            }
            $db->execute(
                "UPDATE cover_letters SET title = ?, company = ?, content = ?, 
                 job_details = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
                [
                    $input['title'] ?? '',
                    $input['company'] ?? '',
                    $input['content'] ?? '',
                    json_encode($input['jobDetails'] ?? []),
                    $id,
                    $user['id']
                ]
            );
            Response::success(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                Response::error('ID required', 400);
            }
            $db->execute(
                "DELETE FROM cover_letters WHERE id = ? AND user_id = ?",
                [$id, $user['id']]
            );
            Response::success(['success' => true]);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
}

function handleInterest($action, $input, $db) {
    $user = Auth::getCurrentUser($db);
    if (!$user) {
        Response::error('Unauthorized', 401);
    }
    
    switch ($action) {
        case 'result':
            if ($_SERVER['REQUEST_METHOD'] === 'GET') {
                $result = $db->queryOne(
                    "SELECT * FROM interest_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                    [$user['id']]
                );
                if (!$result) {
                    Response::error('No result found', 404);
                }
                $result['answers'] = json_decode($result['answers'] ?? '{}', true);
                $result['categories'] = json_decode($result['categories'] ?? '[]', true);
                $result['recommendations'] = json_decode($result['recommendations'] ?? '[]', true);
                Response::success($result);
            } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $resultId = $db->execute(
                    "INSERT INTO interest_results (user_id, answers, categories, recommendations) 
                     VALUES (?, ?, ?, ?)",
                    [
                        $user['id'],
                        json_encode($input['answers'] ?? []),
                        json_encode($input['categories'] ?? []),
                        json_encode($input['recommendations'] ?? [])
                    ]
                );
                Response::success(['id' => $resultId, 'success' => true]);
            }
            break;
            
        default:
            Response::error('Action not found', 404);
    }
}

function handleUser($action, $id, $input, $db) {
    $user = Auth::getCurrentUser($db);
    if (!$user) {
        Response::error('Unauthorized', 401);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            if ($action === 'me' || !$id) {
                // Hämta användarens inställningar också
                $settings = $db->queryOne(
                    "SELECT * FROM user_settings WHERE user_id = ?",
                    [$user['id']]
                );
                
                // Ta bort känslig data
                unset($user['password_hash']);
                
                // Konvertera int till boolean för inställningar
                if ($settings) {
                    $settings['calmMode'] = (bool)$settings['calm_mode'];
                    $settings['highContrast'] = (bool)$settings['high_contrast'];
                    $settings['largeText'] = (bool)$settings['large_text'];
                    $settings['reduceMotion'] = (bool)$settings['reduce_motion'];
                    $settings['emailNotifications'] = (bool)$settings['email_notifications'];
                    $settings['jobAlerts'] = (bool)$settings['job_alerts'];
                    unset($settings['calm_mode'], $settings['high_contrast'], 
                          $settings['large_text'], $settings['reduce_motion'],
                          $settings['email_notifications'], $settings['job_alerts']);
                }
                
                Response::success([
                    'user' => $user,
                    'settings' => $settings
                ]);
            }
            break;
            
        case 'PUT':
            // Uppdatera profilfält
            $db->execute(
                "UPDATE users SET 
                 first_name = COALESCE(?, first_name), 
                 last_name = COALESCE(?, last_name), 
                 phone = COALESCE(?, phone), 
                 address = COALESCE(?, address), 
                 postal_code = COALESCE(?, postal_code), 
                 city = COALESCE(?, city),
                 date_of_birth = COALESCE(?, date_of_birth),
                 bio = COALESCE(?, bio),
                 current_phase = COALESCE(?, current_phase),
                 updated_at = datetime('now') 
                 WHERE id = ?",
                [
                    $input['firstName'] ?? null,
                    $input['lastName'] ?? null,
                    $input['phone'] ?? null,
                    $input['address'] ?? null,
                    $input['postalCode'] ?? null,
                    $input['city'] ?? null,
                    $input['dateOfBirth'] ?? null,
                    $input['bio'] ?? null,
                    $input['currentPhase'] ?? null,
                    $user['id']
                ]
            );
            Response::success(['success' => true, 'message' => 'Profile updated']);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
}

function handleSettings($input, $db) {
    $user = Auth::getCurrentUser($db);
    if (!$user) {
        Response::error('Unauthorized', 401);
    }
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            $settings = $db->queryOne(
                "SELECT * FROM user_settings WHERE user_id = ?",
                [$user['id']]
            );
            
            if (!$settings) {
                // Skapa default-inställningar
                $db->execute(
                    "INSERT INTO user_settings (user_id) VALUES (?)",
                    [$user['id']]
                );
                $settings = $db->queryOne(
                    "SELECT * FROM user_settings WHERE user_id = ?",
                    [$user['id']]
                );
            }
            
            // Konvertera till camelCase och boolean
            Response::success([
                'calmMode' => (bool)$settings['calm_mode'],
                'highContrast' => (bool)$settings['high_contrast'],
                'largeText' => (bool)$settings['large_text'],
                'reduceMotion' => (bool)$settings['reduce_motion'],
                'emailNotifications' => (bool)$settings['email_notifications'],
                'jobAlerts' => (bool)$settings['job_alerts'],
                'preferredLanguage' => $settings['preferred_language']
            ]);
            break;
            
        case 'PUT':
        case 'POST':
            // Kolla om inställningar finns
            $existing = $db->queryOne(
                "SELECT id FROM user_settings WHERE user_id = ?",
                [$user['id']]
            );
            
            if ($existing) {
                $db->execute(
                    "UPDATE user_settings SET 
                     calm_mode = ?,
                     high_contrast = ?,
                     large_text = ?,
                     reduce_motion = ?,
                     email_notifications = ?,
                     job_alerts = ?,
                     preferred_language = ?
                     WHERE user_id = ?",
                    [
                        $input['calmMode'] ? 1 : 0,
                        $input['highContrast'] ? 1 : 0,
                        $input['largeText'] ? 1 : 0,
                        $input['reduceMotion'] ? 1 : 0,
                        $input['emailNotifications'] ? 1 : 0,
                        $input['jobAlerts'] ? 1 : 0,
                        $input['preferredLanguage'] ?? 'sv',
                        $user['id']
                    ]
                );
            } else {
                $db->execute(
                    "INSERT INTO user_settings 
                     (user_id, calm_mode, high_contrast, large_text, reduce_motion,
                      email_notifications, job_alerts, preferred_language)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [
                        $user['id'],
                        $input['calmMode'] ? 1 : 0,
                        $input['highContrast'] ? 1 : 0,
                        $input['largeText'] ? 1 : 0,
                        $input['reduceMotion'] ? 1 : 0,
                        $input['emailNotifications'] ? 1 : 0,
                        $input['jobAlerts'] ? 1 : 0,
                        $input['preferredLanguage'] ?? 'sv'
                    ]
                );
            }
            
            Response::success(['success' => true, 'message' => 'Settings saved']);
            break;
            
        default:
            Response::error('Method not allowed', 405);
    }
}

function handleJobs($action, $input) {
    // Proxy till Arbetsförmedlingens API
    if ($action === 'platsbanken' || $action === 'search') {
        $query = http_build_query($_GET);
        $url = "https://platsbanken-api.arbetsformedlingen.se/jobs/v1/search?$query";
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        $response = curl_exec($ch);
        curl_close($ch);
        
        echo $response;
        exit;
    }
    
    Response::error('Action not found', 404);
}
