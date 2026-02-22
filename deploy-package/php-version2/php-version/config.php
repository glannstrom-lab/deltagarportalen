<?php
/**
 * Konfiguration för Deltagarportalen AI
 * 
 * 1. Kopiera denna fil till config_secret.php
 * 2. Fyll i din API-nyckel
 * 3. Lägg config_secret.php i .gitignore (om du använder git)
 */

// ÄNDRA DENNA RAD:
define('OPENROUTER_API_KEY', 'sk-or-v1-din-nyckel-har');

// API-endpoint
define('OPENROUTER_URL', 'https://openrouter.ai/api/v1/chat/completions');

// Modell att använda
define('AI_MODEL', 'anthropic/claude-3.5-sonnet');
