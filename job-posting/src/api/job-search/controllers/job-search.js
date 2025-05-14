'use strict';

/**
 * Job search controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::job-search.job-search', ({ strapi }) => ({
  async search(ctx) {
    try {
      const { query } = ctx.request;

      // Pagination
      const page = parseInt(query.page) || 1;
      const pageSize = parseInt(query.pageSize) || 10;
      const start = (page - 1) * pageSize;

      // Sorting
      const sort = query.sort ? [query.sort] : ['postedAt:desc'];

      // Fetch all jobs (no filters)
      const jobs = await strapi.entityService.findMany('api::job.job', {
        sort,
        start,
        limit: pageSize,
        populate: ['company'],
      });

      // Count total jobs
      const count = await strapi.entityService.count('api::job.job');

      return {
        data: jobs,
        meta: {
          pagination: {
            page,
            pageSize,
            pageCount: Math.ceil(count / pageSize),
            total: count,
          }
        }
      };

    } catch (err) {
      ctx.throw(500, 'Internal server error: ' + err.message);
    }
  },
}));