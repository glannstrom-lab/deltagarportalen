/**
 * FN11 — skapa organisation och bjud in första chef i ett steg (superadmin).
 *
 * Ingen ny databasmekanism behövs. Premissgranskningen 2026-10-31 (prod):
 *   · invitations_kollega_guard (BEFORE INSERT) släpper igenom SUPERADMIN utan
 *     medlemskap i organisationen, tar emot org_role 'chef', och skriver om raden
 *     (role CONSULTANT, token, 14 dagar).
 *   · INSERT-policyn på invitations har redan grenen role = 'CONSULTANT' för
 *     ADMIN/SUPERADMIN.
 *   · trg_kollega_inbjudan_medlemskap (AFTER INSERT på profiles) lägger
 *     organization_members-raden med rollen när kontot skapas, och prövar om att
 *     inbjudaren är chef/admin eller superadmin.
 *   · send-invite-email godkänner anroparen som invited_by och har kollegamallen.
 * Alltså: orgApi.inviteColleagueByEmail bär rollen chef rakt av. Ingen RPC, ingen
 * migration, ingen flagga.
 *
 * Det som INTE går att göra atomärt utan en RPC är "organisation + inbjudan":
 * två anrop. Faller det andra efter det första finns organisationen kvar utan
 * chef — utfallet säger det uttryckligen i stället för att låtsas att allt gick.
 */

import {
  orgAdminApi,
  orgApi,
  type KollegaInbjudanUtfall,
  type Organization,
  type OrgKind,
  type OrgRole,
} from './orgApi'

export interface KontoUppgift {
  id: string
  email: string
  role: string
}

/** Konton som redan är personal och därför kan läggas till direkt som medlem. */
const PERSONALROLLER = ['CONSULTANT', 'ADMIN', 'SUPERADMIN']

const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export interface NyOrgIndata {
  name: string
  kind: OrgKind
  orgNumber: string
  /** Tom = bara organisationen skapas, som förut. */
  chefEpost: string
}

/** Returnerar ett felmeddelande (svenska, visas rakt av) eller null. */
export function valideraNyOrg(i: NyOrgIndata): string | null {
  if (!i.name.trim()) return 'Organisationen behöver ett namn'
  const epost = i.chefEpost.trim()
  if (!epost) return null
  if (!EPOST.test(epost)) return 'Ange en giltig e-postadress till chefen'
  if (i.kind === 'arbetsgivare') {
    return 'Företag får sin kontaktperson på annat sätt än via chefsinbjudan. Lämna e-posten tom.'
  }
  return null
}

export type MedlemUtfall =
  | { status: 'inbjuden'; email: string; mejl: KollegaInbjudanUtfall['mejl']; detalj?: string }
  | { status: 'tillagd'; email: string }
  | { status: 'misslyckades'; email: string; fel: string }

export interface NyOrgUtfall {
  org: Organization
  /** null = ingen e-post angavs, bara organisationen skapades. */
  chef: MedlemUtfall | null
}

function felText(e: unknown): string {
  return e instanceof Error && e.message.trim() ? e.message : 'Okänt fel'
}

/** Triggerns "Det finns redan ett konto med e-posten …" (23505). */
export function harRedanKonto(felmeddelande: string): boolean {
  return /^Det finns redan ett konto med e-posten/.test(felmeddelande.trim())
}

/**
 * Bjuder in en person till en organisation med given roll. Saknas kontot går
 * inbjudan via mejl (medlemskapet läggs när kontot skapas). Finns kontot redan
 * läggs personen till direkt — men bara om det är ett personalkonto; en
 * deltagare görs aldrig till chef av misstag.
 */
export async function bjudInMedlem(
  orgId: string,
  email: string,
  roll: OrgRole,
  konton: readonly KontoUppgift[],
): Promise<MedlemUtfall> {
  const adress = email.trim().toLowerCase()
  try {
    const u = await orgApi.inviteColleagueByEmail(orgId, adress, roll)
    return { status: 'inbjuden', email: u.email, mejl: u.mejl, detalj: u.detalj }
  } catch (e) {
    const fel = felText(e)
    if (!harRedanKonto(fel)) return { status: 'misslyckades', email: adress, fel }
    const konto = konton.find((k) => k.email.trim().toLowerCase() === adress)
    if (!konto) {
      return { status: 'misslyckades', email: adress, fel: `${fel} Sök upp kontot under Lägg till medlem.` }
    }
    if (!PERSONALROLLER.includes(konto.role)) {
      return {
        status: 'misslyckades',
        email: adress,
        fel: 'Kontot är en deltagare och görs inte till personal automatiskt. Använd en annan e-post.',
      }
    }
    try {
      await orgAdminApi.addMember(orgId, konto.id, roll)
      return { status: 'tillagd', email: adress }
    } catch (e2) {
      return { status: 'misslyckades', email: adress, fel: felText(e2) }
    }
  }
}

/**
 * Skapar organisationen och, om e-post angivits, bjuder in första chefen.
 * Kastar bara om organisationen inte kunde skapas. Valideringen körs först så
 * att en felaktig adress inte lämnar en organisation utan chef efter sig.
 */
export async function skapaOrgMedChef(
  indata: NyOrgIndata,
  konton: readonly KontoUppgift[],
): Promise<NyOrgUtfall> {
  const valFel = valideraNyOrg(indata)
  if (valFel) throw new Error(valFel)
  const org = await orgAdminApi.createOrganization({
    name: indata.name,
    kind: indata.kind,
    org_number: indata.orgNumber || null,
  })
  const epost = indata.chefEpost.trim()
  if (!epost) return { org, chef: null }
  return { org, chef: await bjudInMedlem(org.id, epost, 'chef', konton) }
}

/** En mening att visa efter utfallet. Säger alltid vad som återstår. */
export function utfallText(u: NyOrgUtfall): { ton: 'ok' | 'varning'; text: string } {
  const namn = u.org.name
  if (!u.chef) return { ton: 'ok', text: `${namn} är skapad.` }
  const c = u.chef
  if (c.status === 'tillagd') {
    return { ton: 'ok', text: `${namn} är skapad och ${c.email} är tillagd som chef. Kontot fanns redan.` }
  }
  if (c.status === 'misslyckades') {
    return {
      ton: 'varning',
      text: `${namn} är skapad, men ${c.email} blev ingen chef: ${c.fel} Organisationen står utan chef tills du bjuder in någon under Medlemmar.`,
    }
  }
  if (c.mejl === 'skickat') {
    return {
      ton: 'ok',
      text: `${namn} är skapad. Inbjudan till ${c.email} är skickad. Chefen blir medlem när hen skapat sitt konto via länken i mejlet och valt lösenord — då tar Kom igång-guiden över.`,
    }
  }
  return {
    ton: 'varning',
    text: `${namn} är skapad och inbjudan till ${c.email} finns, men mejlet ${c.mejl === 'obekraftat' ? 'kunde inte bekräftas som skickat' : 'gick inte iväg'}${c.detalj ? ` (${c.detalj})` : ''}. Chefen är ingen medlem förrän hen skapat sitt konto. Försök skicka igen under Medlemmar.`,
  }
}
