'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::application.application', ({ strapi }) => ({
  async create(ctx) {
    try {
      // Get data from request body
      const requestBody = ctx.request.body;
      console.log('=== DEBUG: Raw request body ===');
      console.log(JSON.stringify(requestBody, null, 2));
      
      // Check if the request body has the expected structure
      if (!requestBody || !requestBody.data) {
        console.log('=== DEBUG: Missing data in request body ===');
        return ctx.badRequest("Missing request data");
      }
      
      const { data } = requestBody;
      
      // Make sure we have the user ID
      const user = ctx.state.user;
      if (!user) {
        console.log('=== DEBUG: No authenticated user ===');
        return ctx.unauthorized("You must be logged in to apply");
      }
      console.log(`=== DEBUG: User ID: ${user.id} ===`);
      
      // Make sure we have a job ID
      if (!data.job) {
        console.log('=== DEBUG: Missing job ID ===');
        return ctx.badRequest("Missing job ID");
      }
      console.log(`=== DEBUG: Job ID: ${data.job} ===`);
      
      // Prepare the application data with user info
      const applicationData = {
        ...data,
        user: user.id,
      };
      
      console.log('=== DEBUG: Application data prepared ===');
      console.log(JSON.stringify(applicationData, null, 2));
      
      try {
        // Use the application service to process the application
        const application = await strapi.service('api::application.application')
          .processApplication(applicationData);
        
        if (!application) {
          console.log('=== DEBUG: Application returned null ===');
          return ctx.badRequest("Failed to create application: Response is null");
        }
        
        console.log('=== DEBUG: Application created successfully ===');
        console.log(JSON.stringify(application, null, 2));
        
        return { data: application };
      } catch (serviceError) {
        console.log('=== DEBUG: Service error ===');
        console.log(serviceError.message);
        console.log(serviceError.stack);
        return ctx.badRequest(`Failed to process application: ${serviceError.message}`);
      }
    } catch (error) {
      console.log('=== DEBUG: Controller error ===');
      console.log(error.message);
      console.log(error.stack);
      return ctx.badRequest(`Failed to create application: ${error.message}`);
    }
  },
  
  async myApplications(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) {
        console.log('=== DEBUG: No authenticated user for myApplications ===');
        return ctx.unauthorized("Login required");
      }
      
      console.log(`=== DEBUG: Fetching applications for user ${user.id} ===`);
      
      // Find applications where the user is linked
      const applications = await strapi.db.query('api::application.application').findMany({
        where: {
          users_permissions_users: {
            id: user.id
          }
        },
        populate: ['jobs', 'resume']
      });
      
      console.log(`=== DEBUG: Found ${applications.length} applications ===`);
      
      return { data: applications };
    } catch (error) {
      console.log('=== DEBUG: Error in myApplications ===');
      console.log(error.message);
      console.log(error.stack);
      return ctx.badRequest(`Error retrieving applications: ${error.message}`);
    }
  },

  // async delete(ctx) {
  //   const { id } = ctx.params;

  //   // Manually delete the entity to ensure it's gone
  //   const application = await strapi.entityService.delete('api::application.application', id);

  //   return ctx.send({ message: 'Application deleted', data: application });
  // },

async update(ctx) {
    const { id } = ctx.params;
    const requestBody = ctx.request.body;

    try {
      const existingService = await strapi.db.query('api::application.application').findOne({
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

      const updatedService = await strapi.db.query('api::application.application').update({
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
    const application = await strapi.entityService.delete('api::application.application', id);

    return ctx.send({ message: 'Application deleted', data: application });
  },
}))