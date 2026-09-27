module.exports = async (p, h) => {
  await h.go('/oversikt');
  console.log((await h.shot('01-oversikt')).slice(0, 3000));
  await h.go('/min-vecka');
  console.log((await h.shot('02-min-vecka')).slice(0, 5000));
};
