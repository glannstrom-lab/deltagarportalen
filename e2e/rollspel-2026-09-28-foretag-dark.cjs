// Ali — snabb koll av mörkt läge på Översikt och Förslag. Mobil.
module.exports = async (p, h) => {
  await h.go('/foretag');
  await h.shot('19-dark-oversikt');
  await h.go('/foretag/forslag?id=1e701f40-98c2-4f18-98fd-b71b45f10e73');
  await h.shot('20-dark-forslag-peter');
};
