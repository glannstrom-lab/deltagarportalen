// Fatima 06 — skickar ett riktigt meddelande till konsulenten (rollens uppgift: fråga konsulenten).
module.exports = async (p, h) => {
  await h.go('/my-consultant');
  const falt = p.getByPlaceholder(/./).last();
  if (await falt.count()) {
    await falt.click().catch(() => {});
    await falt.fill('Hej! Jag undrar vad jag behöver göra den här veckan. Jag har inte fått något schema än. Kan du hjälpa mig?').catch(() => {});
    await h.shot('60-meddelande-ifyllt');
    const skicka = p.getByRole('button', { name: /Skicka|Send/ }).last();
    if (await skicka.count()) {
      await skicka.click().catch(() => {});
      await p.waitForTimeout(1500);
    }
  }
  await h.shot('61-meddelande-skickat');
};
