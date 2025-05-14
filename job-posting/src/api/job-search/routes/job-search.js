module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/job-search/search',
      handler: 'job-search.search',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};