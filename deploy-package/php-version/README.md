# 🐘 PHP-version

AI-lösning för Deltagarportalen med PHP + cURL.

---

## ✅ Förutsättningar

Din host måste ha:
- PHP 7.4+ (helst 8.0+)
- cURL-tillägget aktiverat
- Tillåtelse för utgående HTTP-anrop (de flesta har detta)

**Passar för:**
- Loopia
- One.com
- Binero
- Miss Hosting
- Samtliga större svenska webbhotell

---

## 📦 Installation

### Steg 1: Ladda upp filer
Ladda upp alla filer till din webbhotell via FTP eller filhanteraren.

Struktur efter uppladdning:
```
public_html/ (eller motsvarande)
├── config.php
├── api/
│   ├── cv-optimering.php
│   └── coach-rad.php
└── public/
    └── index.html
```

### Steg 2: Konfigurera API-nyckel
Öppna `config.php` i en texteditor (eller via cPanel > File Manager).

Ändra raden:
```php
define('OPENROUTER_API_KEY', 'sk-or-v1-din-riktiga-nyckel-här');
```

### Steg 3: Testa
Gå till: `https://din-domain.com/public/`

Du bör se Deltagarportalen AI-demo.

---

## 🔧 Konfiguration för olika hosts

### Loopia
1. Ladda upp filer till `public_html/`
2. Se till att PHP 8.0+ är aktiverat
3. cURL är vanligtvis aktiverat som standard

### One.com
1. Använd File Manager eller FTP
2. Ladda upp till rot-mappen
3. PHP-version kan ändras i kontrollpanelen

### cPanel (generellt)
1. Filhanteraren → public_html/
2. Ladda upp filerna
3. Se till att filerna har rätt rättigheter (644 för filer, 755 för mappar)

---

## 📂 Filstruktur

```
php-version/
├── config.php              # Konfiguration (EDITERA DENNA!)
├── README.md              # Denna fil
├── api/                   # API-endpoints
│   ├── cv-optimering.php
│   └── coach-rad.php
└── public/                # Frontend
    └── index.html
```

---

## 🔒 Säkerhet

- **Viktigt:** Ändra rättigheterna på `config.php` till 640 (läsbar endast för ägaren)
- Lägg aldrig API-nyckeln i JavaScript-filer
- Se till att `.gitignore` finns om du använder git

---

## 🐛 Felsökning

### "API-nyckel ej konfigurerad"
Öppna `config.php` och fyll i din riktiga API-nyckel.

### "Kunde inte kommunicera med AI-tjänsten"
Kontrollera att cURL är aktiverat:
1. Skapa en fil `test.php` med innehåll:
```php
<?php phpinfo(); ?>
```
2. Gå till `din-domain.com/test.php`
3. Sök efter "curl" - om du inte ser det, kontakta ditt webbhotell

### "500 Internal Server Error"
- Kontrollera att PHP är 7.4+
- Kontrollera filrättigheter
- Se server-loggar om möjligt

### "404 Not Found"
Se till att filerna laddats upp till rätt mapp (vanligtvis `public_html/`).

---

## 📝 Testa cURL

Skapa filen `test-curl.php`:
```php
<?php
if (function_exists('curl_init')) {
    echo "✅ cURL är aktiverat!";
} else {
    echo "❌ cURL saknas. Kontakta ditt webbhotell.";
}
?>
```

Gå till `din-domain.com/test-curl.php` för att testa.

---

## 📞 Support

Vanliga problem:
1. **Ingen output** → Kontrollera PHP-version
2. **Timeout** → Vissa hosts har korta timeouts, försök igen
3. **SSL-fel** → Kontakta webbhotell om certifikatproblem

Kontakta ditt webbhotells support om du har problem med cURL eller PHP.
