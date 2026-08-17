/*
 * Uppläsning på guidesidorna (spår K17, 2026-08-12).
 *
 * Ligger som EGEN FIL i stället för inline: skriptet är identiskt på 161
 * sidor, och inline kostade ~490 kB över bygget. Som fil hämtas den en gång
 * och cachas. Det tar dessutom bort beroendet av CSP:ns unsafe-inline.
 *
 * Skrivs till dist/guider/lyssna.js av prerender-guides.cjs.
 */
(function () {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return
  var ruta = document.getElementById('lyssna')
  var knapp = document.getElementById('lyssna-knapp')
  var stopp = document.getElementById('lyssna-stopp')
  var status = ruta.querySelector('.lyssna-status')
  var text = document.getElementById('artikeltext')
  if (!ruta || !knapp || !text) return

  ruta.hidden = false
  var talar = false
  var pausad = false

  function satt(etikett, visaStopp, meddelande) {
    knapp.textContent = etikett
    stopp.hidden = !visaStopp
    status.textContent = meddelande || ''
  }

  function nollstall() {
    talar = false
    pausad = false
    satt('Lyssna på texten', false, '')
  }

  /**
   * TG2 (2026-08-17): `innerText` läste upp emojinamnen.
   *
   * Guiderna använder ✅ och ❌ som markörer i gör/gör-inte-listor — 254
   * förekomster i korpusen. `innerText` bryr sig varken om `aria-hidden` eller
   * om `.sr-only`, så uppläsningen sa "kryssmarkering" före varje rad, åtta
   * gånger i rad på den värsta sidan.
   *
   * Efter att renderaren börjat slå in tecknen i `aria-hidden` hade `innerText`
   * dessutom läst BÅDA — "kryssmarkering Undvik:" — alltså sämre än förut.
   * Därför måste den här funktionen följa samma regel som skärmläsaren:
   * hoppa över `aria-hidden`, behåll `.sr-only`.
   *
   * Just den här funktionen är poängen med hela K17: uppläsningen byggdes för
   * lättläst-målgruppen, och det är de som drabbas hårdast av bruset.
   */
  function upplasningstext(rot) {
    var klon = rot.cloneNode(true)
    var dolda = klon.querySelectorAll('[aria-hidden="true"]')
    for (var i = 0; i < dolda.length; i++) {
      dolda[i].parentNode.removeChild(dolda[i])
    }
    // `textContent` i stället för `innerText`: klonen sitter inte i dokumentet
    // och har därför ingen layout, så `innerText` hade gett tom sträng i vissa
    // webbläsare. `.sr-only`-texten ska med — det är den som bär betydelsen.
    return klon.textContent.replace(/\s+/g, ' ').trim()
  }

  knapp.addEventListener('click', function () {
    if (!talar) {
      // Skapa yttrandet vid klick, inte vid sidladdning: rösterna laddas
      // asynkront i flera webbläsare och en tidig utterance blir tyst.
      var u = new SpeechSynthesisUtterance(upplasningstext(text))
      u.lang = 'sv-SE'
      u.rate = 0.9
      u.onend = nollstall
      u.onerror = function () {
        nollstall()
        status.textContent = 'Uppläsningen kunde inte startas.'
      }
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(u)
      talar = true
      pausad = false
      satt('Pausa', true, 'Läser upp texten.')
    } else if (!pausad) {
      window.speechSynthesis.pause()
      pausad = true
      satt('Fortsätt', true, 'Pausad.')
    } else {
      window.speechSynthesis.resume()
      pausad = false
      satt('Pausa', true, 'Läser upp texten.')
    }
  })

  stopp.addEventListener('click', function () {
    window.speechSynthesis.cancel()
    nollstall()
  })

  // Uppläsningen fortsätter annars när man lämnar sidan.
  window.addEventListener('pagehide', function () {
    window.speechSynthesis.cancel()
  })
})()
