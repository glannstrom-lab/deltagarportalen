/** Innehållet i konsulentens Hjälp — källorna står vid varje post. Se KonsulentHjalp.tsx. */

interface Post {
  fraga: string
  svar: string
  /** Källan i koden — för den som ska kontrollera att svaret gäller. */
  lank?: { till: string; text: string }
}

export const KONSULENT_HJALP: { rubrik: string; poster: Post[] }[] = [
  {
    rubrik: 'Dagligt arbete',
    poster: [
      {
        // DagensPass.tsx (rubrik "Dagens pass", länk "Närvaro per pass" → /consultant/pass/grupp)
        fraga: 'Hur markerar jag närvaro på dagens pass?',
        svar: 'Under Översikt ligger Dagens pass. Där sätter du närvaro för varje deltagare på passet. Vill du markera flera på en gång öppnar du Närvaro per pass.',
        lank: { till: '/consultant', text: 'Gå till Översikt' },
      },
      {
        // ParticipantJournal.tsx — knappen "Ny anteckning", SoL-kolumner (RK38)
        fraga: 'Hur skriver jag en journalanteckning?',
        svar: 'Öppna deltagaren i fliken Deltagare och välj Journal. Klicka på Ny anteckning, skriv och spara. Journalen visar raderna enligt socialtjänstlagen (SoL).',
        lank: { till: '/consultant/participants', text: 'Gå till Deltagare' },
      },
    ],
  },
  {
    rubrik: 'Plan och underlag',
    poster: [
      {
        // AktivitetsplanSektion.tsx: action "Tillämpa schemamall"; TillampaMallDialog.tsx
        fraga: 'Hur skapar jag en plan åt en deltagare som saknar plan?',
        svar: 'Öppna deltagaren, välj Aktivitet och klicka på Tillämpa schemamall. Välj mall, period och veckomål. Lagens förslag är 40 timmar i veckan, 10 timmar mindre vid barn under 8 år. Avviker ditt mål från förslaget måste du skriva en motivering — den står med i planen. Fattas något får du en lista över fälten överst i dialogen.',
      },
      {
        // UnderlagDialog.tsx: "Ladda ner underlaget (PDF)" och "Jobin skickar det inte själv"
        fraga: 'Hur lämnar jag underlag till handläggaren?',
        svar: 'På deltagarens Aktivitet-sida väljer du Lämna underlag. Välj mottagare — en handläggare med konto i portalen eller ett namn du skriver in — och lämna underlaget. Du kan sedan ladda ner det som PDF. Jobin skickar inte PDF:en åt dig; du skickar den på det sätt ni brukar. Ett underlag kan bara ångras samma dag som det lämnades.',
      },
    ],
  },
  {
    rubrik: 'Organisation',
    poster: [
      {
        // OrganisationSektion.tsx: "Din organisation", "Caseload", "Överlämna deltagare…"; arLedning = chef/admin
        fraga: 'Hur ser jag caseload per konsulent, och hur lämnar jag över deltagare?',
        svar: 'Under Inställningar → Din organisation finns Caseload med antal deltagare, aktiva planer och frånvaro per konsulent. Chef och administratör kan där välja Överlämna deltagare… för att flytta hela en konsulents caseload till en kollega. Deltagarna får en notis och en ny samtyckesfråga. Journal, mål och möten stannar hos den tidigare konsulenten.',
        lank: { till: '/consultant/settings', text: 'Gå till Inställningar' },
      },
    ],
  },
]
