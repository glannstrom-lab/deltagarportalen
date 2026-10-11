/**
 * Ritningarna till ikonsetet "Kvarter" — GENERERAD ur designförslaget
 * "Jobin i lugnare form" (2026-10-11), avsnitt 3. Ändra inte koordinaterna
 * för hand; rita om i förslaget och generera på nytt.
 *
 * Varje ritning får två färger:
 *   d — den fyllda detaljen som bär betydelsen (färgas av `ton`)
 *   y — ytan som "stansas ur" detaljen (bocken i närvaro, strecket i frånvaro)
 * Linjerna ärver currentColor och förblir bläck.
 */
/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'

export const KVARTER_NAMN = ["narvaro","franvaro","sjuk","mote","fysiskt","digitalt","plan","underlag","avvikelse","meddelande","samtal","jobb","uppfoljning","deltagare","grupp","varning","klart","nasta","kalender","dokument","tid","handlaggare","hem","lykta","sok","pil","tillbaka","mer","kopiera","bock","kryss","streck"] as const
export type KvarterNamn = (typeof KVARTER_NAMN)[number]

/** Svensk beskrivning per ikon — för katalog och tester, inte som skärmläsartext. */
export const KVARTER_ETIKETT: Record<KvarterNamn, string> = {
  "narvaro": "Närvaro",
  "franvaro": "Frånvaro",
  "sjuk": "Sjuk",
  "mote": "Möte",
  "fysiskt": "Fysiskt möte",
  "digitalt": "Digitalt möte",
  "plan": "Plan",
  "underlag": "Underlag",
  "avvikelse": "Avvikelse",
  "meddelande": "Meddelande",
  "samtal": "Samtal",
  "jobb": "Jobb, placering",
  "uppfoljning": "Uppföljning",
  "deltagare": "Deltagare",
  "grupp": "Grupp",
  "varning": "Varning",
  "klart": "Klart",
  "nasta": "Nästa steg",
  "kalender": "Kalender",
  "dokument": "Dokument",
  "tid": "Tid, pass",
  "handlaggare": "Handläggare",
  "hem": "Hemma",
  "lykta": "Lykta",
  "sok": "Sök",
  "kopiera": "Kopiera",
  "mer": "Mer",
  "pil": "Framåt",
  "tillbaka": "Tillbaka",
  "bock": "Bock",
  "kryss": "Kryss",
  "streck": "Streck"
}

export const RITNINGAR: Record<KvarterNamn, (d: string, y: string) => ReactNode> = {
  narvaro: (d, y) => (<><circle cx="10" cy="7.5" r="3.5" /><path d="M3.5 20c.6-3.8 3.3-6 6.5-6 1.4 0 2.6.4 3.6 1" /><circle fill={d} stroke="none" cx="17.5" cy="17.5" r="4.5" /><path d="M15.6 17.6l1.3 1.3 2.5-2.6" stroke={y} strokeWidth={1.6} /></>),
  franvaro: (d, y) => (<><circle cx="10" cy="7.5" r="3.5" strokeDasharray="2.6 2.4" /><path d="M3.5 20c.6-3.8 3.3-6 6.5-6 1.4 0 2.6.4 3.6 1" strokeDasharray="2.6 2.4" /><circle fill={d} stroke="none" cx="17.5" cy="17.5" r="4.5" /><path d="M15.7 17.5h3.6" stroke={y} strokeWidth={1.6} /></>),
  sjuk: (d) => (<><path d="M5 15V8M5 13h14a2 2 0 0 1 2 2v3M5 18v-3M21 18v-1" /><path d="M9 13v-2.5A1.5 1.5 0 0 1 10.5 9H17a3 3 0 0 1 3 3v1" /><circle fill={d} stroke="none" cx="7" cy="10.5" r="1.8" /></>),
  mote: (d) => (<><circle cx="7" cy="7" r="2.6" /><circle cx="17" cy="7" r="2.6" /><path d="M2.5 15.5c.4-2.4 2.2-3.8 4.5-3.8M21.5 15.5c-.4-2.4-2.2-3.8-4.5-3.8" /><path d="M4 19h16" /><rect fill={d} stroke="none" x="9" y="14" width="6" height="3" rx="1" /></>),
  fysiskt: (d) => (<><path d="M12 21.5s-6.5-5.4-6.5-11a6.5 6.5 0 0 1 13 0c0 5.6-6.5 11-6.5 11z" /><circle fill={d} stroke="none" cx="12" cy="9" r="2.2" /><path d="M8.8 14.2c.7-1.4 1.9-2.2 3.2-2.2s2.5.8 3.2 2.2" /></>),
  digitalt: (d) => (<><rect x="2.5" y="4" width="19" height="13" rx="2.5" /><path d="M9 21h6M12 17v4" /><circle fill={d} stroke="none" cx="12" cy="9" r="2" /><path d="M8.6 14c.6-1.2 1.9-1.9 3.4-1.9s2.8.7 3.4 1.9" /></>),
  plan: (d) => (<><rect x="4.5" y="4" width="15" height="17.5" rx="2.5" /><path d="M9 4V2.8h6V4" /><path d="M8 10h3M8 14h3M8 18h3" /><path d="M14 10.2l1.1 1.1 2-2.1M14 14.2l1.1 1.1 2-2.1" /><rect fill={d} stroke="none" x="14" y="17" width="3" height="2" rx=".8" /></>),
  underlag: (d) => (<><path d="M13.5 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h5" /><path d="M13.5 2.5l5 5h-5z" /><path d="M8 11h6M8 14.5h3" /><path d="M15 18.5h6M18.5 16l2.5 2.5-2.5 2.5" /><circle fill={d} stroke="none" cx="8" cy="7.5" r="1.1" /></>),
  avvikelse: (d) => (<><path d="M5 21.5V3" /><path d="M5 4h11.5l-2.2 3.8 2.2 3.8H5" /><path fill={d} stroke="none" opacity={0.16} d="M5 4h11.5l-2.2 3.8 2.2 3.8H5z" /><circle fill={d} stroke="none" cx="5" cy="21.2" r="1.2" /></>),
  meddelande: (d) => (<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" /><circle fill={d} stroke="none" cx="8.5" cy="9.5" r="1.1" /><circle fill={d} stroke="none" cx="12" cy="9.5" r="1.1" /><circle fill={d} stroke="none" cx="15.5" cy="9.5" r="1.1" /></>),
  samtal: (d) => (<><path d="M6.5 3.5h2.6l1.4 4.2-2 1.5a12 12 0 0 0 6.3 6.3l1.5-2 4.2 1.4v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" /><path d="M15 3.5a5.5 5.5 0 0 1 5.5 5.5" /><circle fill={d} stroke="none" cx="15.2" cy="8.8" r="1.2" /></>),
  jobb: (d) => (<><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8.5 7V5.5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7" /><path d="M3 12.5h18" /><rect fill={d} stroke="none" x="10" y="11" width="4" height="3.4" rx="1" /></>),
  uppfoljning: (d) => (<><path d="M20 12a8 8 0 1 1-2.4-5.7" /><path d="M20 4v3.6h-3.6" /><path d="M12 8v4.2l2.6 1.6" /><circle fill={d} stroke="none" cx="12" cy="12" r="1.4" /></>),
  deltagare: (d) => (<><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4.2 3.8-6.6 7.5-6.6s6.8 2.4 7.5 6.6" /><path fill={d} stroke="none" opacity={0.16} d="M4.5 21c.7-4.2 3.8-6.6 7.5-6.6s6.8 2.4 7.5 6.6z" /></>),
  grupp: (d) => (<><circle cx="12" cy="7.5" r="3.2" /><circle cx="5" cy="9.5" r="2.4" /><circle cx="19" cy="9.5" r="2.4" /><path d="M6.5 20c.4-3.4 2.6-5.4 5.5-5.4s5.1 2 5.5 5.4" /><path d="M1.5 18c.3-2.2 1.6-3.6 3.5-3.6M22.5 18c-.3-2.2-1.6-3.6-3.5-3.6" /><circle fill={d} stroke="none" cx="12" cy="7.5" r="1.3" /></>),
  varning: (d) => (<><path d="M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" /><path d="M12 9v5" /><circle fill={d} stroke="none" cx="12" cy="17.3" r="1.2" /></>),
  klart: (d) => (<><circle cx="12" cy="12" r="9" /><path fill={d} stroke="none" opacity={0.16} d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z" /><path d="M8 12.3l2.7 2.7L16.2 9.5" /></>),
  nasta: (d) => (<><path d="M12 21.5V3" /><path d="M12 5h6.5l2.5 2.5-2.5 2.5H12" /><path d="M12 11.5H5.5L3 14l2.5 2.5H12" /><path fill={d} stroke="none" opacity={0.16} d="M12 5h6.5l2.5 2.5-2.5 2.5H12z" /><circle fill={d} stroke="none" cx="12" cy="21.3" r="1.2" /></>),
  kalender: (d) => (<><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /><rect fill={d} stroke="none" x="13.5" y="13" width="4" height="4" rx="1" /></>),
  dokument: (d) => (<><path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5z" /><path d="M14 2.5v5h5" /><path d="M8.5 12.5h7M8.5 16h5" /><path fill={d} stroke="none" opacity={0.16} d="M14 2.5v5h5z" /></>),
  tid: (d) => (<><circle cx="12" cy="12" r="9" /><path d="M12 6.5V12l3.5 2" /><circle fill={d} stroke="none" cx="12" cy="12" r="1.4" /></>),
  handlaggare: (d) => (<><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="9" cy="11" r="2.4" /><path d="M5.6 16.2c.6-1.6 1.8-2.4 3.4-2.4s2.8.8 3.4 2.4" /><path d="M15 10h3.5M15 13.5h2.5" /><rect fill={d} stroke="none" x="10" y="3" width="4" height="3" rx="1" /></>),
  hem: (d) => (<><path d="M3.5 11L12 4l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /><rect fill={d} stroke="none" x="10" y="14" width="4" height="6" rx="1" /></>),
  lykta: (d) => (<><path d="M9.5 4.5h5M12 2v2.5" /><path d="M8 7h8l-1 11H9z" /><path d="M7 21h10M9 18l-.5 3M15 18l.5 3" /><path fill={d} stroke="none" d="M12 10.5c1.3 1.4 1.3 3 0 4.5-1.3-1.5-1.3-3.1 0-4.5z" /></>),
  sok: () => (<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>),
  pil: () => (<><path d="M9 5.5l6.5 6.5L9 18.5" /></>),
  tillbaka: () => (<><path d="M15 5.5L8.5 12l6.5 6.5" /></>),
  mer: (d) => (<><circle fill={d} stroke="none" cx="5.5" cy="12" r="1.6" /><circle fill={d} stroke="none" cx="12" cy="12" r="1.6" /><circle fill={d} stroke="none" cx="18.5" cy="12" r="1.6" /></>),
  kopiera: () => (<><rect x="8" y="8" width="12.5" height="12.5" rx="2.5" /><path d="M16 8V5.5A2 2 0 0 0 14 3.5H5.5a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2H8" /></>),
  bock: () => (<><path d="M5 12.5l4.5 4.5L19 7.5" /></>),
  kryss: () => (<><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" /></>),
  streck: () => (<><path d="M6 12h12" /></>),
}
