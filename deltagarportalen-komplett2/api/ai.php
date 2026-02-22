<?php
/**
 * Deltagarportalen - AI API
 * Hanterar alla AI-anrop via OpenRouter
 */

require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Hantera preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Endast POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Endast POST tillåten']);
    exit;
}

// Hämta input
$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

// Kontrollera API-nyckel
if (OPENROUTER_API_KEY === 'sk-or-v1-din-nyckel-har') {
    http_response_code(500);
    echo json_encode(['error' => 'API-nyckel ej konfigurerad. Redigera config.php och fyll i din OpenRouter API-nyckel.']);
    exit;
}

// Route till rätt funktion
switch ($action) {
    case 'cv-optimering':
        handleCvOptimering($input);
        break;
    case 'coach-rad':
        handleCoachRad($input);
        break;
    case 'arbetsanpassning':
        handleArbetsanpassning($input);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Ogiltig action. Använd: cv-optimering, coach-rad, eller arbetsanpassning']);
}

/**
 * CV-optimering
 */
function handleCvOptimering($input) {
    $cvText = $input['cvText'] ?? '';
    $yrke = $input['yrke'] ?? '';
    
    if (strlen($cvText) < 30) {
        http_response_code(400);
        echo json_encode(['error' => 'CV-text måste vara minst 30 tecken']);
        return;
    }
    
    $systemPrompt = "Du är en empatisk CV-expert som hjälper personer tillbaka till arbetsmarknaden. 
Var uppmuntrande, konkret och fokusera på styrkor.
Svara på svenska med dessa rubriker:
🌟 Styrkor
💡 Förbättringsförslag  
🎯 Nästa steg";

    $userPrompt = "Ge feedback på detta CV" . ($yrke ? " för $yrke" : '') . ":\n\n$cvText";
    
    $result = callOpenRouter($systemPrompt, $userPrompt, 1200);
    
    if ($result['success']) {
        echo json_encode(['success' => true, 'feedback' => $result['content']]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
    }
}

/**
 * Jobbcoach-råd
 */
function handleCoachRad($input) {
    $situation = $input['situation'] ?? '';
    $fraga = $input['fraga'] ?? '';
    
    if (strlen($situation) < 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Beskriv situationen (minst 10 tecken)']);
        return;
    }
    
    $systemPrompt = "Du är en erfaren jobbcoach. Ge kort, uppmuntrande och konkret råd. Svara på svenska (max 300 ord).";
    $userPrompt = "Situation: $situation\nFråga: " . ($fraga ?: 'Vad bör jag göra?');
    
    $result = callOpenRouter($systemPrompt, $userPrompt, 600);
    
    if ($result['success']) {
        echo json_encode(['success' => true, 'rad' => $result['content']]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
    }
}

/**
 * Arbetsanpassning
 */
function handleArbetsanpassning($input) {
    $begransning = $input['begransning'] ?? '';
    $uppgifter = $input['uppgifter'] ?? '';
    
    if (!$begransning || !$uppgifter) {
        http_response_code(400);
        echo json_encode(['error' => 'Fyll i både begränsning och arbetsuppgifter']);
        return;
    }
    
    $systemPrompt = "Du är arbetsterapeut. Föreslå konkreta arbetsanpassningar. Kategorisera som: Organisatoriska, Fysiska/tekniska, Stödjande. Svara på svenska.";
    $userPrompt = "Begränsning: $begransning\nArbetsuppgifter: $uppgifter\n\nFöreslå anpassningar:";
    
    $result = callOpenRouter($systemPrompt, $userPrompt, 800);
    
    if ($result['success']) {
        echo json_encode(['success' => true, 'anpassningar' => $result['content']]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => $result['error']]);
    }
}

/**
 * Anropa OpenRouter API
 */
function callOpenRouter($systemPrompt, $userPrompt, $maxTokens = 1000) {
    $data = [
        'model' => AI_MODEL,
        'messages' => [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $userPrompt]
        ],
        'max_tokens' => $maxTokens,
        'temperature' => 0.7
    ];
    
    $ch = curl_init(OPENROUTER_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . OPENROUTER_API_KEY,
        'Content-Type: application/json',
        'HTTP-Referer: https://' . ($_SERVER['HTTP_HOST'] ?? 'localhost'),
        'X-Title: Deltagarportalen'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'cURL-fel: ' . $error];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'OpenRouter svarade med felkod: ' . $httpCode];
    }
    
    $result = json_decode($response, true);
    $content = $result['choices'][0]['message']['content'] ?? null;
    
    if (!$content) {
        return ['success' => false, 'error' => 'Ogiltigt svar från AI'];
    }
    
    return ['success' => true, 'content' => $content];
}
?>
