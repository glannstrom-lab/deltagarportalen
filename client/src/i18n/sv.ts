// Svenska texter - Icke-skuldbeläggande språk
// Advisory Board-rekommendationer implementerade

export const sv = {
  // Transformeringar: Skuldbeläggande → Stödjande
  transformations: {
    'Du måste': 'Du kan välja att',
    'Det är obligatoriskt': 'Detta hjälper dig att',
    'Det krävs': 'Det rekommenderas',
    'Du har inte slutfört': 'Du är på väg med',
    'Du är inte klar': 'Du har kommit igång',
    'Felaktig inmatning': 'Kan du dubbelkolla detta',
    'Ogiltigt': 'Kan du kontrollera',
    'Fältet får inte vara tomt': 'Vill du dela med dig av detta',
    'Du har redan ett konto': 'Välkommen tillbaka! Logga in här',
    'Timeout': 'Det tog längre tid än väntat',
    'Inkomplett': 'Påbörjad',
    'Ofullständig': 'Under utveckling',
    'Svagt': 'Har potential att växa',
    'Dåligt': 'Kan förbättras',
    'Du behöver göra mer': 'Nästa steg kan vara',
    'Bara': 'Redan',
    'Endast': 'Hela',
  },

  // Felmeddelanden - Icke-skuldbeläggande
  errors: {
    password: 'Lösenordet matchar inte. Prova igen eller återställ det.',
    email: 'Vi kunde inte hitta detta. Dubbelkolla eller skapa ett nytt konto.',
    connection: 'Vi har problem med uppkopplingen. Ditt arbete sparas lokalt.',
    timeout: 'Det tog längre tid än väntat. Vi försöker igen...',
    generic: 'Något gick inte som planerat. Vi hjälper dig att komma vidare.',
  },

  // Tomma tillstånd - Uppmuntrande
  emptyStates: {
    noJobs: 'Inga jobb hittades just nu. Nya möjligheter kommer!',
    noApplications: 'Du har inte sökt några jobb ännu. När du är redo finns vi här.',
    noCV: 'Ditt CV väntar på att bli skapat. Ta det i din takt.',
    noResults: 'Vi hittade inget denna gång. Låt oss justera sökningen tillsammans.',
  },

  // Hälsningar
  greetings: {
    morning: [
      'God morgon{name}! ☀️',
      'Välkommen in{name}! 🌅',
      'Hoppas dagen börjar bra{name}! ✨',
    ],
    afternoon: [
      'Hej{name}! 👋',
      'Hoppas dagen har varit bra{name}! 🌤️',
      'Välkommen tillbaka{name}! 💚',
    ],
    evening: [
      'God kväll{name}! 🌙',
      'Skönt att se dig{name}! ⭐',
      'Hoppas kvällen är lugn{name}! 🌛',
    ],
  },

  // Framsteg - Fokus på det positiva
  progress: {
    beginning: [
      'Du har tagit det första steget! Det är ofta det svåraste.',
      'Bra start! Varje resa börjar med ett enda steg.',
      'Du är igång! Det är något att vara stolt över.',
    ],
    progressing: [
      'Du bygger något bra här!',
      'Det går framåt - bra jobbat!',
      'Du utvecklas hela tiden!',
    ],
    building: [
      'Du har kommit en bra bit nu!',
      'Ditt arbete börjar synas!',
      'Bra momentum - fortsätt i din takt!',
    ],
    halfway: [
      'Halvvägs! Du gör fantastiska framsteg!',
      'Du är halvvägs - vilken resa!',
      'Bra jobbat hittills!',
    ],
    almostDone: [
      'Snart i mål! Du har gjort det svåraste!',
      'Sista biten nu - du klarar det!',
      'Du är nästan klar. Vilken insats!',
    ],
    complete: [
      'Bra jobbat! Du tog dig i mål!',
      'Du gjorde det! En milstolpe avklarad!',
      'Fantastiskt arbete! Du ska vara stolt!',
    ],
  },

  // Stödjande meddelanden baserat på emotionellt tillstånd
  supportiveMessages: {
    encouragement: {
      tired: [
        'Det är okej att ta det lugnt idag. Du behöver inte prestera.',
        'Lyssna på kroppen. Vila är också produktivt.',
        'Du har gjort nog idag. Det är okej att pausa.',
      ],
      stressed: [
        'Ta en djup andetag. Du har tid.',
        'Det är okej att känna sig överväldigad. En sak i taget.',
        'Du behöver inte göra allt idag. Vad känns viktigast just nu?',
      ],
      anxious: [
        'Det är normalt att känna oro inför förändring.',
        'Du är inte ensam i detta. Vi finns här för dig.',
        'En sak i taget. Du behöver inte ha alla svar nu.',
      ],
      frustrated: [
        'Det är förståeligt att känna frustration. Det är tufft ibland.',
        'Det är okej att det känns svårt. Ge dig själv tid.',
        'Frustration är ett tecken på att du bryr dig. Det är starkt.',
      ],
      proud: [
        'Du ska vara stolt över vad du åstadkommit!',
        'Dina framsteg är imponerande!',
        'Bra jobbat! Du är på väg mot något stort!',
      ],
      confident: [
        'Du gör bra ifrån dig! Fortsätt i samma takt.',
        'Dina styrker lyser igenom!',
        'Du hanterar detta på ett bra sätt!',
      ],
    },

    break: {
      default: [
        'Det är okej att ta en paus. Allt sparas automatiskt.',
        'Din hjärna behöver vila för att prestera.',
        'En kort paus nu ger energi senare.',
        'Det är inte slöseri med tid att vila.',
      ],
    },

    energy: {
      high: [
        'Du verkar ha mycket energi idag! Passa på att göra det som känns viktigt.',
        'Bra energi! Kom ihåg att ta pauser ändå.',
        'Du är på topp! Använd energin till det som betyder mest.',
      ],
      medium: [
        'Du har lagom med energi idag. Välj uppgifter med omsorg.',
        'Bra balans! Gör det du hinner utan att stressa.',
        'Medelenergi är perfekt för stadigt arbete.',
      ],
      low: [
        'Det är okej att ha låg energi. Fokusera på det enklaste.',
        'Idag är en dag för att vara snäll mot dig själv.',
        'Låg energi är tillfälligt. Gör bara det nödvändigaste.',
      ],
      veryLow: [
        'Det verkar vara en tuff dag. Var extra snäll mot dig själv.',
        'Prioritera vila idag. Jobb kan vänta.',
        'Det är okej att inte göra något alls idag.',
      ],
      exhausted: [
        'Du verkar vara helt slut. Vila är det enda som behövs nu.',
        'Inga krav idag. Bara vila och återhämtning.',
        'Allt kan vänta. Din hälsa är viktigast.',
      ],
    },

    stressSupport: [
      'Det är okej att känna sig överväldigad. Arbetslöshet är en stor förändring.',
      'Dina känslor är giltiga. Det är tufft att söka jobb.',
      'Kom ihåg: Ditt värde kommer inte från din anställning.',
      'Det är normalt att ha bra och dåliga dagar.',
      'Du är mer än ditt CV. Du är hela människan.',
      'Om det känns för tufft, prata med någon. Du behöver inte bära detta ensam.',
    ],

    progress: {
      beginning: [
        'Bra början! Det första steget är ofta det svåraste.',
        'Du är igång! Det är något att fira.',
      ],
      progressing: [
        'Du bygger något bra! Fortsätt i din takt.',
        'Det går framåt! Du ska vara stolt.',
      ],
      halfway: [
        'Halvvägs! Vilken resa du gjort!',
        'Du är halvvägs - fantastiskt arbete!',
      ],
      almostDone: [
        'Snart i mål! Du har gjort det svåraste!',
        'Sista biten nu - du klarar det!',
      ],
      complete: [
        'Du gjorde det! En milstolpe avklarad!',
        'Bra jobbat! Du ska vara stolt!',
      ],
    },
  },

  // Normalisering - Motgångar är normala
  normalization: {
    setbacks: [
      'Motgångar är en del av processen. Det betyder inte att du misslyckats.',
      'Det är normalt att inte få varje jobb man söker.',
      'Ett nej är inte ett personligt misslyckande.',
      'Varje nej tar dig närmare ett ja.',
      'Arbetsmarknaden är tuff just nu. Det är inte ditt fel.',
    ],
    unemployment: [
      'Arbetslöshet är en fas, inte en identitet.',
      'Många har varit arbetslösa. Du är inte ensam.',
      'Det tar tid att hitta rätt jobb. Det är normalt.',
      'Din situation är tillfällig.',
    ],
  },

  // Paus och återkomst
  breaks: {
    takeBreak: [
      'Det är okej att ta en paus. Allt sparas automatiskt.',
      'Vila är viktigt. Din hjärna behöver återhämtning.',
      'En paus nu ger energi senare.',
    ],
    welcomeBack: [
      'Välkommen tillbaka! Fortsätt där du slutade.',
      'Skönt att se dig igen! Allt är sparat.',
      'Där var du! Redo att fortsätta?',
    ],
  },

  // Prestationer - Utan att vara barnsliga
  achievements: {
    small: [
      'Bra jobbat! Ett steg i taget.',
      'Du gör framsteg!',
      'Det där gjorde du bra!',
    ],
    medium: [
      'Vilken insats! Du ska vara stolt.',
      'Bra jobbat! Det märks att du lägger ner tid.',
      'Imponerande framsteg!',
    ],
    large: [
      'Fantastiskt! En stor milstolpe!',
      'Du gjorde det! Detta är något att fira!',
      'Otroligt arbete! Du är på väg mot något stort!',
    ],
  },
}

export default sv
