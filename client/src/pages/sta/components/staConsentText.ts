/**
 * Samtyckes-text och datadelnings-omfång för STA-koppling till konsulent.
 *
 * Denna text visas till deltagaren i InviteHandler vid registrering, sparas
 * i consultant_consents.granted_text som juridiskt bevis, och visas också för
 * konsulenten i BulkInviteParticipantsModal som förhandsvisning.
 *
 * VID ÄNDRING: tänk på att tidigare samtyckes-rader behåller den ursprungliga
 * texten i granted_text — vilket är medvetet (du ska kunna se exakt vad deltagaren
 * godkände när de godkände det).
 */

export const STA_CONSENT_TEXT = `Genom att fortsätta samtycker du till att din konsulent får tillgång till följande information för att kunna stödja dig i Steg till arbete:

• Din STA-aktivitet (genomförda dagar, reflektioner, närvaro)
• Skattningar enligt arbetsterapeutiska instrument (DOA, WRI, MOHOST, AWP, AWC)
• Ditt CV och din ATS-poäng
• Mående- och energi-checkar du gör i Jobin
• Dokumentutkast som din konsulent skapar tillsammans med dig

Syftet är att din konsulent ska kunna planera ditt stöd, signera dina skattningar och skicka rapporter (delredovisning, slutredovisning, anmälan om arbetsprövning) till Arbetsförmedlingen för din räkning.

Du kan när som helst säga upp kopplingen från "Min konsulent"-sidan. Då slutar din konsulent se ny aktivitet. Dokument som redan skickats till Arbetsförmedlingen behålls i ditt arkiv enligt myndighetens krav.

Den rättsliga grunden för behandlingen är ditt samtycke (GDPR art. 6.1.a).`

export const STA_CONSENT_SCOPE = {
  program: 'steg_till_arbete',
  data_categories: [
    'sta_activities',
    'sta_assessments',
    'cv',
    'wellness',
    'sta_documents',
  ],
  purposes: [
    'support_planning',
    'assessment_signature',
    'af_reporting',
  ],
  legal_basis: 'GDPR_6_1_a_consent',
  revocable: true,
} as const
