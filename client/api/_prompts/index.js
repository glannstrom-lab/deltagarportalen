// KA3 (2026-09-12): promptbiblioteket för /api/ai, uppdelat per domän. ai.js ägde
// tidigare 2 402 rader varav 1 041 var det här objektet. Nyckelordningen är den
// gamla (Object.keys(PROMPTS) används i test och loggar).
//
// Vercel deployar inte filer i api/ som börjar med understreck som egna funktioner
// (samma skäl som api/_utils/).
const domaner = [require('./konsulent'), require('./ansokan'), require('./karriar'), require('./cv'), require('./intervju'), require('./chatt'), require('./sta'), require('./reflektion')];
const { SANNINGSREGEL } = require('./_delat');

const ORDNING = ['konsulent-rapportutkast', 'personligt-brev', 'karriarplan', 'kompetensgap', 'cv-jobbmatchning', 'cv-import', 'cv-import-erfarenhet', 'adaptation-recommendations', 'adaptation-conversation', 'linkedin-optimering', 'intervju-simulator', 'intervju-sammanfattning', 'profile-summary', 'cv-writing', 'chatbot', 'ai-team-chat', 'sta-document-draft', 'sta-week-summary', 'vecko-reflektion', 'sta-doa-sammanfattning'];

/** @type {Record<string, (data: any) => any>} */
const PROMPTS = {};
for (const namn of ORDNING) {
  const doman = domaner.find((d) => Object.prototype.hasOwnProperty.call(d, namn));
  if (!doman) throw new Error(`Prompt saknas i _prompts/: ${namn}`);
  PROMPTS[namn] = doman[namn];
}
for (const d of domaner) for (const namn of Object.keys(d)) {
  if (!ORDNING.includes(namn)) throw new Error(`Prompt utan plats i ORDNING: ${namn}`);
}

// SA4 (2026-09-02): sanningsregeln lades tidigare in i enskilda promptar, en i
// taget, när ett fynd tvingade fram den (B14, B17, B22, B25, B26, G11, G15,
// AR4). Mätt om innan den här ändringen, genom att läsa varje funktion i
// PROMPTS: nästan alla tjugo hade redan NÅGON sanningsregel i egen
// ordalydelse, men bara fem (`karriarplan`, `chatbot`, `ai-team-chat` via
// REGELVERKSREGEL, och den SVENSKA grenen av `adaptation-recommendations`
// och `adaptation-conversation`) bar den specifika regeln om påhittade
// belopp/procentsatser/dagantal för svenska regelverk. Den ENGELSKA grenen
// av de två sista hade ingen sanningsregel alls — SA2, samma lucka som
// 2026-08-23 hittade i ai-team-chat men en nivå upp: en gren, inte en agent.
//
// Löst EN gång här, på sammansättningsstället för PROMPTS, i stället för
// prompt för prompt: varje funktion i objektet packas om så att den alltid
// lägger SANNINGSREGEL sist i sin systemprompt, oavsett vad funktionen redan
// skrivit själv. En framtida tjugoförsta funktion kan inte glömma bort den —
// den bor inte i den enskilda prompten, den bor i loopen. `SANNINGSREGEL` är
// dessutom tvåspråkig med flit: sammansättningsstället känner inte till
// vilket språk en enskild prompt valde (bara två av tjugo grenar på
// `data.language`), så konstanten bär båda språken i EN sträng hellre än
// att gissa fel — och sätts in EFTER att PROMPTS[fn](data) redan valt gren,
// aldrig före.
for (const namn of Object.keys(PROMPTS)) {
  const byggFunktion = PROMPTS[namn];
  PROMPTS[namn] = (data) => {
    const resultat = byggFunktion(data);
    if (resultat && typeof resultat.system === 'string') {
      resultat.system = `${resultat.system}\n\n${SANNINGSREGEL}`;
    }
    return resultat;
  };
}

module.exports = { PROMPTS };
