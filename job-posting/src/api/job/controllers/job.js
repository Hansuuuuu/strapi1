'use strict';

/**
 * job controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::job.job', ({ strapi }) => ({
async update(ctx) {
    const { id } = ctx.params;
    const requestBody = ctx.request.body;

    try {
      const existingService = await strapi.db.query('api::job.job').findOne({
        where: { id: id }
      });

      if (!existingService) {
        return ctx.notFound('Service not found');
      }

      let updateData;
      if (requestBody.data) {
        updateData = requestBody.data;
      } else {
        updateData = requestBody;
      }

      if (updateData.id) {
        delete updateData.id;
      }

      const updatedService = await strapi.db.query('api::job.job').update({
        where: { id: id },
        data: updateData
      });

      const sanitizedEntity = await this.sanitizeOutput(updatedService, ctx);
      return this.transformResponse(sanitizedEntity);
    } catch (error) {
      console.error('Update Error:', error);
      return ctx.badRequest(`Error updating service: ${error.message}`);
    }
  },

  
  // New custom delete method
async delete(ctx) {
    const { id } = ctx.params;

    // Manually delete the entity to ensure it's gone
    const job = await strapi.entityService.delete('api::job.job', id);

    return ctx.send({ message: 'Application deleted', data: job });
  },

}))