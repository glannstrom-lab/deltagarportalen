module.exports = async (p, h) => {
  await h.go('/oversikt');
  console.log((await h.shot('00-oversikt')).slice(0, 2500));
  await h.go('/min-vecka');
  console.log((await h.shot('00-min-vecka')).slice(0, 4000));
  await h.go('/my-consultant');
  console.log((await h.shot('00-my-consultant')).slice(0, 4000));
  await h.go('/job-search');
  console.log((await h.shot('00-job-search')).slice(0, 3000));
  await h.go('/cv');
  console.log((await h.shot('00-cv')).slice(0, 3000));
  await h.go('/knowledge-base');
  console.log((await h.shot('00-knowledge-base')).slice(0, 3000));
  await h.go('/settings');
  console.log((await h.shot('00-settings')).slice(0, 3000));
};
