<?php
/**
 * Filuppladdning för profilbilder
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../lib/Database.php';
require_once __DIR__ . '/../lib/Auth.php';
require_once __DIR__ . '/../lib/Response.php';

// Kontrollera inloggning
$user = Auth::getCurrentUser(Database::getInstance());
if (!$user) {
    Response::error('Unauthorized', 401);
}

// Kontrollera att fil laddades upp
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    Response::error('No file uploaded or upload error', 400);
}

$file = $_FILES['image'];

// Validera filtyp
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($file['type'], $allowedTypes)) {
    Response::error('Invalid file type. Only JPG, PNG, GIF, WebP allowed', 400);
}

// Validera filstorlek (max 5MB)
if ($file['size'] > 5 * 1024 * 1024) {
    Response::error('File too large. Max 5MB', 400);
}

// Skapa uploads-mapp om den inte finns
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Generera unikt filnamn
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'profile_' . $user['id'] . '_' . uniqid() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Flytta filen
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    Response::error('Failed to save file', 500);
}

// Spara sökväg i databasen
$db = Database::getInstance();
$webPath = '/uploads/' . $filename;

// Ta bort gammal bild om det finns en
if (!empty($user['profile_image'])) {
    $oldPath = __DIR__ . '/..' . $user['profile_image'];
    if (file_exists($oldPath) && strpos($oldPath, 'profile_' . $user['id']) !== false) {
        unlink($oldPath);
    }
}

$db->execute(
    "UPDATE users SET profile_image = ? WHERE id = ?",
    [$webPath, $user['id']]
);

Response::success(['url' => $webPath, 'message' => 'Image uploaded successfully']);
