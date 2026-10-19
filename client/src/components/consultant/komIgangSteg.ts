/**
 * Kom igång — stegen i konsulentens guide (beställning Mikael 2026-10-11:
 * "så fort ett motstånd eller okunskap finns så kommer de lägga bort sina
 * telefoner och datorer").
 *
 * Ren logik, inga anrop. Två regler som bär hela guiden:
 *   1. Ett steg är klart när DATAN säger det (en deltagare finns, ett pass är
 *      markerat, en journalrad finns …) — aldrig för att någon klickat i guiden.
 *   2. Varianten följer samma regel som resten av konsulentvyn:
 *      `regelverk()` i orgTypVisning.ts för kommun/leverantör, och rollen ur
 *      organization_members för konsulent/handläggare/chef.
 *
 * Konsulentvyn är svensk med flit (DESIGN.md §2) — texterna står här, inte i
 * locale-filerna. Varje text pekar på något som finns; källan står vid steget.
 */

import type { OrgRole } from '@/services/orgApi'
import type { Regelverk } from './orgTypVisning'

export type GuideRoll = 'konsulent' | 'handlaggare' | 'chef'

/**
 * Chef/admin går före: hens första arbete är organisationen. En handläggare
 * som inte också är konsulent får handläggarens steg. Allt annat — även den
 * som saknar organisation — är konsulent, som i resten av vyn.
 */
export function guideRoll(roller: readonly OrgRole[]): GuideRoll {
  if (roller.includes('chef') || roller.includes('admin')) return 'chef'
  if (roller.includes('handlaggare') && !roller.includes('konsulent')) return 'handlaggare'
  return 'konsulent'
}

/** Det som räknats ur databasen för konsulenten/coachen. */
export interface KonsulentLage {
  deltagare: number
  /** Första kopplade deltagaren — dit stegen om plan och journal leder. */
  forstaDeltagare: string | null
  planer: number
  /** En deltagare som har en plan hos mig — där underlag och avvikelser lämnas. */
  forstaPlanDeltagare: string | null
  /** Pass där jag satt närvaro (activity_sessions.marked_by). */
  narvaro: number
  journal: number
  /** Underlag jag lämnat till handläggaren, ej ångrade (activity_plan_handovers). */
  underlag: number
  /** Pass där jag antecknat att Arbetsförmedlingen fått veta (af_notified_by). */
  avvikelser: number
  placeringar: number
}

export interface HandlaggareLage {
  mottagna: number
  kvitterade: number
}

export interface ChefLage {
  /** Kollegor i mina organisationer, utom jag själv. */
  kollegor: number
  /** Schemamallar jag äger eller som hör till min organisation. */
  mallar: number
  /** Kollegor med rollen handläggare (bara kommunen har sådana). */
  handlaggare: number
}

export type GuideLage =
  | { roll: 'konsulent'; data: KonsulentLage }
  | { roll: 'handlaggare'; data: HandlaggareLage }
  | { roll: 'chef'; data: ChefLage }

export type GuideHandling = { typ: 'lank'; till: string } | { typ: 'bjudIn' }

export interface GuideSteg {
  id: string
  rubrik: string
  text: string
  /** null = okänt (laddar eller fel). Guiden påstår då ingenting. */
  klar: boolean | null
  knapp: { etikett: string; handling: GuideHandling }
}

/** Deltagarsidans flik — `?flik=` läses av ParticipantDetailPage. */
function deltagarFlik(id: string | null, flik: 'aktivitet' | 'journal' | null): GuideHandling {
  if (!id) return { typ: 'lank', till: '/consultant/participants' }
  const bas = `/consultant/participants/${id}`
  return { typ: 'lank', till: flik ? `${bas}?flik=${flik}` : bas }
}

/** Rubriken ovanför stegen. */
export function guideRubrik(roll: GuideRoll, rv: Regelverk): string {
  if (roll === 'handlaggare') return 'Så tar du emot underlag i Jobin'
  if (roll === 'chef') return 'Så kommer din organisation igång'
  return rv === 'leverantor' ? 'Så kommer du igång som coach' : 'Så kommer du igång'
}

/**
 * Stegen för en roll och ett regelverk. `lage` = null medan datan hämtas eller
 * om den inte gick att hämta — då är varje steg `klar: null`, aldrig false.
 */
export function guideSteg(roll: GuideRoll, rv: Regelverk, lage: GuideLage | null): GuideSteg[] {
  const d = lage && lage.roll === roll ? lage.data : null

  if (roll === 'handlaggare') {
    const h = d as HandlaggareLage | null
    return [
      {
        // MottagnaUnderlag.tsx — konsulenten väljer dig som mottagare (UnderlagDialog.tsx)
        id: 'mottagna',
        rubrik: 'Få ditt första underlag',
        text: 'När en konsulent lämnar underlag och väljer dig som mottagare får du en notis. Underlaget visas överst på Översikt.',
        klar: h ? h.mottagna > 0 : null,
        knapp: { etikett: 'Visa underlag till dig', handling: { typ: 'lank', till: '/consultant' } },
      },
      {
        // MottagnaUnderlag.tsx: "Kvittera mottaget", received_at
        id: 'kvittera',
        rubrik: 'Kvittera att du tagit emot det',
        text: 'Tryck på Kvittera mottaget. Då ser konsulenten att underlaget kommit fram. Du kan ladda ner det som PDF till akten.',
        klar: h ? h.kvitterade > 0 : null,
        knapp: { etikett: 'Visa underlag till dig', handling: { typ: 'lank', till: '/consultant' } },
      },
    ]
  }

  if (roll === 'chef') {
    const c = d as ChefLage | null
    const steg: GuideSteg[] = [
      {
        // OrganisationSektion.tsx — lägg till kollega på e-post (INSTEAD OF-trigger, orgApi.ts)
        id: 'kollegor',
        rubrik: 'Lägg till dina kollegor',
        // RK18: saknar adressen konto erbjuder formuläret "Skicka inbjudan via mejl" (DL5, 2026-10-19)
        text: 'Under Inställningar → Din organisation lägger du till kollegor med deras e-post. Har de inget konto än kan du skicka en inbjudan via mejl.',
        klar: c ? c.kollegor > 0 : null,
        knapp: { etikett: 'Öppna Din organisation', handling: { typ: 'lank', till: '/consultant/settings' } },
      },
      {
        // ResourcesTab.tsx → Schemamallar (SchemamallSektion.tsx)
        id: 'mall',
        rubrik: 'Gör en schemamall',
        text: 'En schemamall är veckans pass. Konsulenterna använder den när de lägger upp en plan. Du hittar den under Resurser → Schemamallar.',
        klar: c ? c.mallar > 0 : null,
        knapp: { etikett: 'Öppna Resurser', handling: { typ: 'lank', till: '/consultant/resources' } },
      },
    ]
    if (rv === 'kommun') {
      steg.push({
        // rollerForOrg i orgTypVisning.ts: rollen handläggare finns bara i kommunen
        id: 'handlaggare',
        rubrik: 'Ge handläggaren ett konto',
        text: 'Lägg till handläggaren för ekonomiskt bistånd med rollen Handläggare. Då kan konsulenterna lämna underlag direkt till hen.',
        klar: c ? c.handlaggare > 0 : null,
        knapp: { etikett: 'Öppna Din organisation', handling: { typ: 'lank', till: '/consultant/settings' } },
      })
    }
    return steg
  }

  // Konsulent / coach
  const k = d as KonsulentLage | null
  const steg: GuideSteg[] = [
    {
      // InviteParticipantDialog.tsx — mejl med länk; raden i consultant_participants finns när hen tackat ja
      id: 'bjudIn',
      rubrik: 'Bjud in en deltagare',
      text: 'Skriv deltagarens e-post. Hen får ett mejl med en länk. Steget är klart när hen tackat ja och syns i din lista.',
      klar: k ? k.deltagare > 0 : null,
      knapp: { etikett: 'Bjud in deltagare', handling: { typ: 'bjudIn' } },
    },
    {
      // AktivitetsplanSektion.tsx — "Tillämpa schemamall" på fliken Aktivitet
      id: 'plan',
      rubrik: 'Lägg upp en aktivitetsplan',
      text: 'Öppna deltagaren, välj Aktivitet och Tillämpa schemamall. Välj mall, period och veckomål. Då får deltagaren sina pass i Min vecka.',
      klar: k ? k.planer > 0 : null,
      knapp: { etikett: 'Öppna Aktivitet', handling: deltagarFlik(k?.forstaDeltagare ?? null, 'aktivitet') },
    },
    {
      // DagensPass.tsx / GruppnarvaroPage.tsx — närvaro per pass
      id: 'narvaro',
      rubrik: 'Markera närvaro',
      text: 'Under Dagens pass på Översikt sätter du närvaro för varje deltagare. Närvaro per pass markerar hela gruppen på en gång.',
      klar: k ? k.narvaro > 0 : null,
      knapp: { etikett: 'Öppna Närvaro per pass', handling: { typ: 'lank', till: '/consultant/pass/grupp' } },
    },
    {
      // ParticipantJournal.tsx — "Ny anteckning"
      id: 'journal',
      rubrik: 'Skriv i journalen',
      text: 'Öppna deltagaren och välj Journal. Klicka på Ny anteckning, skriv och spara. En anteckning räknas också som kontakt.',
      klar: k ? k.journal > 0 : null,
      knapp: { etikett: 'Öppna Journal', handling: deltagarFlik(k?.forstaDeltagare ?? null, 'journal') },
    },
  ]

  if (rv === 'leverantor') {
    steg.push(
      {
        // AvvikelserapportKort.tsx — bara hos leverantören; "underrättad" är konsulentens anteckning (af_notified_at)
        id: 'avvikelse',
        rubrik: 'Rapportera en avvikelse',
        text: 'Uteblir deltagaren från ett pass ser du det i Avvikelser på fliken Aktivitet. Anteckna där när Arbetsförmedlingen fått veta. Jobin skickar inget själv.',
        klar: k ? k.avvikelser > 0 : null,
        knapp: { etikett: 'Öppna Aktivitet', handling: deltagarFlik(k?.forstaPlanDeltagare ?? k?.forstaDeltagare ?? null, 'aktivitet') },
      },
      {
        // ParticipantDetailPage.tsx — "Registrera placering" (PlacementDialog); uppföljning 3/6 mån i Platser
        id: 'placering',
        rubrik: 'Registrera en placering',
        text: 'När deltagaren får jobb eller praktik: öppna deltagaren och välj Registrera placering. Uppföljningen efter 3 och 6 månader gör du sedan i samma placering.',
        klar: k ? k.placeringar > 0 : null,
        knapp: { etikett: 'Öppna deltagaren', handling: deltagarFlik(k?.forstaDeltagare ?? null, null) },
      },
    )
  } else {
    steg.push({
      // UnderlagDialog.tsx — "Lämna underlag" på Aktivitet; PDF:en skickas inte av Jobin
      id: 'underlag',
      rubrik: 'Lämna underlag till handläggaren',
      text: 'På fliken Aktivitet väljer du Lämna underlag och vem som ska få det. Du kan ladda ner det som PDF. Jobin skickar inte PDF:en åt dig.',
      klar: k ? k.underlag > 0 : null,
      knapp: { etikett: 'Öppna Aktivitet', handling: deltagarFlik(k?.forstaPlanDeltagare ?? k?.forstaDeltagare ?? null, 'aktivitet') },
    })
  }
  return steg
}

/** Alla steg klara. Okänt (null) räknas aldrig som klart. */
export function allaKlara(steg: readonly GuideSteg[]): boolean {
  return steg.length > 0 && steg.every((s) => s.klar === true)
}
