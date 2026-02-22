<?php
/**
 * Deltagarportalen - Konfiguration
 * 
 * INSTRUKTIONER:
 * 1. Byt 'sk-or-v1-din-nyckel-har' mot din riktiga OpenRouter API-nyckel
 * 2. Spara filen
 * 3. KLART!
 */

// ============================================
// FYLL I DIN API-NYCKEL HÄR:
// ============================================
define('OPENROUTER_API_KEY', 'sk-or-v1-din-nyckel-har');

// ============================================
// ÖVRIGA INSTÄLLNINGAR (behöver vanligtvis inte ändras)
// ============================================
define('OPENROUTER_URL', 'https://openrouter.ai/api/v1/chat/completions');
define('AI_MODEL', 'anthropic/claude-3.5-sonnet');

// Kolla att nyckeln är ifylld
if (OPENROUTER_API_KEY === 'sk-or-v1-din-nyckel-har') {
    // Visa varning om nyckeln inte ändrats (endast för debugging)
    // Ta bort eller kommentera ut dessa rader när allt fungerar
    // header('Content-Type: application/json');
    // echo json_encode(['error' => 'API-nyckel ej konfigurerad. Se config.php']);
    // exit;
}
?>
