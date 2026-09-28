// Ali — uppföljning: se Peters förslag landa efter att han sagt ja. Mobil.
module.exports = async (p, h) => {
  await h.go('/foretag/forslag');
  await h.shot('17-forslag-med-peter');

  const peterKnapp = p.getByRole('button', { name: /Peter/i }).first();
  if (await peterKnapp.count()) {
    await peterKnapp.click();
    await p.waitForTimeout(1200);
    await h.shot('18-peter-detalj');
  } else {
    h.log('Peters förslag syns inte i listan');
  }
};
