// Delad hjälpfunktion för skarpt-vardag-stegfilerna.
// SV-ONB: onboarding-turen kan dyka upp oanmäld när som helst (bekräftat, se rapport).
// stangOnboardingOmSynlig() ska anropas innan varje viktig interaktion.
async function stangOnboardingOmSynlig(p, h, var_) {
  // Sök bland ALLA dialog-roller efter den som faktiskt har "Hoppa över" —
  // sidan har flera role="dialog"-element samtidigt (bekräftat, se rapport)
  // och onboardingens modal är inte alltid den första i DOM-ordning.
  const knapp = p.getByRole('dialog').getByRole('button', { name: /Hoppa över/ });
  const synlig = await knapp.first().isVisible().catch(() => false);
  if (synlig) {
    h.log('ONBOARDING_DYKER_UPP_IGEN', var_, p.url());
    await knapp.first().click({ force: true, timeout: 5000 }).catch((e) => h.log('SKIP_FEL', var_, e.message));
    await p.waitForTimeout(1000);
  }
  return synlig;
}

async function klickaSakert(p, h, locator, namn, forsok = 3) {
  for (let i = 0; i < forsok; i++) {
    await stangOnboardingOmSynlig(p, h, `fore-${namn}`);
    try {
      await locator.click({ timeout: 8000 });
      return true;
    } catch (e) {
      h.log('KLICK_RETRY', namn, i, e.message.slice(0, 150));
      await p.waitForTimeout(800);
    }
  }
  h.log('KLICK_MISSLYCKADES', namn);
  return false;
}

module.exports = { stangOnboardingOmSynlig, klickaSakert };
