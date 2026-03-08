# Förklaring: Vad betyder storage.foldername?

## 🗂️ Hur bilderna sparas

När du laddar upp en bild, sparas den i en struktur som ser ut så här:

```
cv-images (bucket)
└── profiles (mapp)
    └── abc123 (användarens ID)
        └── 1678901234567-xyz.jpg (bildfilen)
```

**Sökvägen blir:** `profiles/abc123/1678901234567-xyz.jpg`

---

## 🔍 Vad gör storage.foldername?

`storage.foldername(name)` tar sökvägen och delar upp den i delar:

```
"profiles/abc123/1678901234567-xyz.jpg"
          ↓
["profiles", "abc123", "1678901234567-xyz.jpg"]
    [0]       [1]            [2]
```

**[1]** = Den andra delen = användarens ID (`abc123`)

---

## 🔐 Vad kollar policyn?

Policyn säger:
```sql
(storage.foldername(name))[1] = auth.uid()::text
```

**Översatt till svenska:**
> "Användarens ID i sökvägen måste vara samma som den inloggade användarens ID"

---

## 📋 Exempel

**Scenario:** Anna (användare ID: abc123) försöker ändra en bild.

**Filens sökväg:** `profiles/abc123/anna-bild.jpg`

**Vad som händer:**
1. `storage.foldername(name)` → `["profiles", "abc123", "anna-bild.jpg"]`
2. `[1]` → `"abc123"`
3. `auth.uid()` → `"abc123"` (Annas ID)
4. `"abc123" = "abc123"` → ✅ SANT! Anna får ändra.

---

**Scenario:** Anna försöker ändra Beatas bild.

**Filens sökväg:** `profiles/xyz789/beata-bild.jpg`

**Vad som händer:**
1. `storage.foldername(name)` → `["profiles", "xyz789", "beata-bild.jpg"]`
2. `[1]` → `"xyz789"`
3. `auth.uid()` → `"abc123"` (Annas ID)
4. `"xyz789" = "abc123"` → ❌ FALSKT! Anna får INTE ändra.

---

## 🎯 Sammanfattning

| Begrepp | Betydelse |
|---------|-----------|
| `storage.foldername(name)` | Delar upp sökvägen i delar |
| `[1]` | Tar den andra delen (användarens ID-mapp) |
| `auth.uid()` | Den inloggade användarens ID |
| `::text` | Gör om ID:t till text så det kan jämföras |

**Resultat:** Användare får bara ändra/ta bort bilder i sin egen mapp!
