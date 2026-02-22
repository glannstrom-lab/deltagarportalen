<?php
/**
 * CV-optimering via PHP + OpenRouter
 */

require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
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
$cvText = $input['cvText'] ?? '';
$yrke = $input['yrke'] ?? '';

// Validering
if (strlen($cvText) < 30) {
    http_response_code(400);
    echo json_encode(['error' => 'CV-text måste vara minst 30 tecken']);
    exit;
}

// Kontrollera API-nyckel
if (OPENROUTER_API_KEY === 'sk-or-v1-din-nyckel-har') {
    http_response_code(500);
    echo json_encode(['error' => 'API-nyckel ej konfigurerad. Se config.php']);
    exit;
}

// Bygg prompt
$systemPrompt = "Du är en empatisk CV-expert som hjälper personer tillbaka till arbetsmarknaden. 
Var uppmuntrande, konkret och fokusera på styrkor.
Svara på svenska med dessa rubriker:
🌟 Styrkor
💡 Förbättringsförslag  
🎯 Nästa steg";

$userPrompt = "Ge feedback på detta CV" . ($yrke ? " för $yrke" : '') . ":\n\n$cvText";

// Anropa OpenRouter
$data = [
    'model' => AI_MODEL,
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $userPrompt]
    ],
    'max_tokens' => 1200,
    'temperature' => 0.7
];

$ch = curl_init(OPENROUTER_URL);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . OPENROUTER_API_KEY,
    'Content-Type: application/json',
    'HTTP-Referer: https://' . $_SERVER['HTTP_HOST'],
    'X-Title: Deltagarportalen'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(500);
    echo json_encode(['error' => 'Kunde inte kommunicera med AI-tjänsten']);
    exit;
}

$result = json_decode($response, true);
$feedback = $result['choices'][0]['message']['content'] ?? null;

if (!$feedback) {
    http_response_code(500);
    echo json_encode(['error' => 'Ogiltigt svar från AI']);
    exit;
}

echo json_encode([
    'success' => true,
    'feedback' => $feedback
]);
