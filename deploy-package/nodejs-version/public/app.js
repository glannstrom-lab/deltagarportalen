/**
 * 🚀 Deltagarportalen - Frontend JavaScript
 */

// API-bas URL (samma domän, relativ sökväg)
const API_BASE = '/api';

/**
 * 📝 CV-optimering
 */
async function optimeraCV() {
    const text = document.getElementById('cv-text').value;
    const yrke = document.getElementById('cv-yrke').value;
    const resultDiv = document.getElementById('cv-result');
    const loadingDiv = document.getElementById('cv-loading');
    const btn = document.getElementById('cv-btn');

    if (text.length < 30) {
        alert('Skriv minst 30 tecken i CV-texten');
        return;
    }

    // Visa loading
    loadingDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/cv-optimering`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cvText: text, yrke })
        });

        const data = await response.json();

        if (data.success) {
            resultDiv.innerHTML = formatResult(data.feedback);
            resultDiv.classList.remove('hidden');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #dc2626;">❌ ${error.message || 'Ett fel uppstod'}</p>`;
        resultDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        btn.disabled = false;
    }
}

/**
 * 💼 Fråga jobbcoachen
 */
async function fragaCoach() {
    const situation = document.getElementById('coach-situation').value;
    const fråga = document.getElementById('coach-fraga').value;
    const resultDiv = document.getElementById('coach-result');
    const loadingDiv = document.getElementById('coach-loading');
    const btn = document.getElementById('coach-btn');

    if (situation.length < 10) {
        alert('Beskriv din situation (minst 10 tecken)');
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/coach-rad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ situation, fråga })
        });

        const data = await response.json();

        if (data.success) {
            resultDiv.innerHTML = formatResult(data.råd);
            resultDiv.classList.remove('hidden');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #dc2626;">❌ ${error.message || 'Ett fel uppstod'}</p>`;
        resultDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        btn.disabled = false;
    }
}

/**
 * 🏥 Arbetsanpassning
 */
async function foreslaAnpassning() {
    const begränsning = document.getElementById('anpass-begransning').value;
    const uppgifter = document.getElementById('anpass-uppgifter').value;
    const resultDiv = document.getElementById('anpass-result');
    const loadingDiv = document.getElementById('anpass-loading');
    const btn = document.getElementById('anpass-btn');

    if (!begränsning || !uppgifter) {
        alert('Fyll i båda fälten');
        return;
    }

    loadingDiv.classList.remove('hidden');
    resultDiv.classList.add('hidden');
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/anpassning`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ begränsning, arbetsuppgifter: uppgifter })
        });

        const data = await response.json();

        if (data.success) {
            resultDiv.innerHTML = formatResult(data.anpassningar);
            resultDiv.classList.remove('hidden');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: #dc2626;">❌ ${error.message || 'Ett fel uppstod'}</p>`;
        resultDiv.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        btn.disabled = false;
    }
}

/**
 * 🎨 Formatera resultat (konvertera markdown-liknande till HTML)
 */
function formatResult(text) {
    return text
        .replace(/🌟/g, '<h3>🌟')
        .replace(/💡/g, '<h3>💡')
        .replace(/🎯/g, '<h3>🎯')
        .replace(/🏥/g, '<h3>🏥')
        .replace(/🔧/g, '<h3>🔧')
        .replace(/📋/g, '<h3>📋')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// Hjälp för Enter-tangent i textarea
document.querySelectorAll('textarea').forEach(textarea => {
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            const btn = textarea.closest('.feature-card').querySelector('button');
            btn.click();
        }
    });
});

console.log('🚀 Deltagarportalen laddad!');
