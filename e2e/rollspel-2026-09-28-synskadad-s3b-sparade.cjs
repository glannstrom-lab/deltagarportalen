module.exports = async (p, h) => {
  await h.go('/job-search/saved');
  const txt = await h.shot('07b-jobbsok-sparade');
  console.log(txt.slice(0, 1500));
};
