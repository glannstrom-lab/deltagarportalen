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

  knapp.addEventListener('click', function () {
    if (!talar) {
      // Skapa yttrandet vid klick, inte vid sidladdning: rösterna laddas
      // asynkront i flera webbläsare och en tidig utterance blir tyst.
      var u = new SpeechSynthesisUtterance(text.innerText)
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
