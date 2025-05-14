'use strict';

/**
 * application service - fixed version
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::application.application', ({ strapi }) => ({
  async processApplication(applicationData) {
    // Full log of received data
    console.log('=== DEBUG: Application Data Received ===');
    console.log(JSON.stringify(applicationData, null, 2));
    
    try {
      // First check if the job exists
      if (applicationData.job) {
        const jobExists = await strapi.entityService.findOne('api::job.job', applicationData.job);
        if (!jobExists) {
          throw new Error(`Job with ID ${applicationData.job} does not exist`);
        }
      }
      
      // First, create the application with essential data
      console.log('=== DEBUG: Creating application ===');
      const createData = {
        data: {
          applicationStatus: 'Pending',
          coverLetter: applicationData.coverLetter || '',
          publishedAt: new Date(),
          appliedAt: new Date()
        }
      };
      
      // Log the create data
      console.log('Create data:', JSON.stringify(createData, null, 2));
      
      // Create the application
      const createdApp = await strapi.entityService.create('api::application.application', createData);
      console.log('=== DEBUG: Application created successfully ===');
      console.log(JSON.stringify(createdApp, null, 2));
      
      // Setup user relation (oneToMany from user perspective)
      if (applicationData.user) {
        console.log(`=== DEBUG: Setting up user relation (ID: ${applicationData.user}) ===`);
        
        // Get the user
        const user = await strapi.entityService.findOne('plugin::users-permissions.user', applicationData.user);
        
        if (user) {
          // Update the user to reference this application
          await strapi.entityService.update('plugin::users-permissions.user', applicationData.user, {
            data: {
              application: createdApp.id
            }
          });
          console.log('User relation updated successfully');
        } else {
          console.log(`User with ID ${applicationData.user} not found`);
        }
      }
      
      // Setup job relation (oneToMany from job perspective)
      if (applicationData.job) {
        console.log(`=== DEBUG: Setting up job relation (ID: ${applicationData.job}) ===`);
        
        // Update the job to reference this application
        await strapi.entityService.update('api::job.job', applicationData.job, {
          data: {
            application: createdApp.id
          }
        });
        console.log('Job relation updated successfully');
      }
      
      // Handle resume if present
      if (applicationData.resume) {
        console.log('=== DEBUG: Updating with resume file ===');
        await strapi.entityService.update('api::application.application', createdApp.id, {
          data: {
            resume: applicationData.resume
          }
        });
        console.log('Resume added successfully');
      }
      
      // Fetch the complete application
      const finalApp = await strapi.db.query('api::application.application').findOne({
        where: { id: createdApp.id },
        populate: {
          users_permissions_users: true,
          jobs: true,
          resume: true
        }
      });
      
      console.log('=== DEBUG: Final application ===');
      console.log(JSON.stringify(finalApp, null, 2));
      
      // Create a sanitized response object
      const responseObj = {
        id: createdApp.id,
        applicationStatus: finalApp.applicationStatus,
        coverLetter: finalApp.coverLetter,
        appliedAt: finalApp.appliedAt,
        createdAt: finalApp.createdAt,
        updatedAt: finalApp.updatedAt,
        publishedAt: finalApp.publishedAt,
        // Include populated relations
        users: finalApp.users_permissions_users,
        jobs: finalApp.jobs,
        resume: finalApp.resume
      };
      
      return responseObj;
    } catch (error) {
      console.log('=== DEBUG: Error creating application ===');
      console.log(error.message);
      console.log(error.stack);
      throw error;
    }
  }
}))