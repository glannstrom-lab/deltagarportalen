<?php
/**
 * Jobbcoach-råd via PHP
 */

require_once '../config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Endast POST tillåten']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$situation = $input['situation'] ?? '';
$fråga = $input['fråga'] ?? '';

if (strlen($situation) < 10) {
    http_response_code(400);
    echo json_encode(['error' => 'Beskriv situationen (minst 10 tecken)']);
    exit;
}

$systemPrompt = "Du är en erfaren jobbcoach. Ge kort, uppmuntrande och konkret råd. Svara på svenska (max 300 ord).";
$userPrompt = "Situation: $situation\nFråga: " . ($fråga ?: 'Vad bör jag göra?');

$data = [
    'model' => AI_MODEL,
    'messages' => [
        ['role' => 'system', 'content' => $systemPrompt],
        ['role' => 'user', 'content' => $userPrompt]
    ],
    'max_tokens' => 600,
    'temperature' => 0.8
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
curl_close($ch);

$result = json_decode($response, true);
$råd = $result['choices'][0]['message']['content'] ?? null;

if (!$råd) {
    http_response_code(500);
    echo json_encode(['error' => 'Kunde inte generera råd']);
    exit;
}

echo json_encode(['success' => true, 'råd' => $råd]);
