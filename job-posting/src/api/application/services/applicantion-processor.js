'use strict';

/**
 * application-processor service
 */

module.exports = {
  async processApplication(applicationData) {
    const { job, user } = applicationData;

    if (!job || !user) {
      throw new Error('Missing required fields: job and user are required');
    }

    // Prevent duplicate applications
    const existing = await strapi.entityService.findMany('api::application.application', {
      filters: {
        job: { id: job },
        user: { id: user },
      },
    });

    if (existing.length > 0) {
      throw new Error('You have already applied to this job.');
    }

    // Validate job
    const jobEntry = await strapi.entityService.findOne('api::job.job', job, {
      populate: { company: true },
    });

    if (
      !jobEntry ||
      jobEntry.status !== 'Published' ||
      (jobEntry.expiresAt && new Date(jobEntry.expiresAt) < new Date())
    ) {
      throw new Error('This job is no longer accepting applications');
    }

    // Create application
    const application = await strapi.entityService.create('api::application.application', {
      data: {
        ...applicationData,
        status: 'Pending',
        publishedAt: new Date(),
      },
    });

    // Optional: Send email to employer
    const email = jobEntry.company?.contactEmail;
    if (email) {
      try {
        await strapi.plugins['email'].services.email.send({
          to: email,
          subject: `New Application: ${jobEntry.title}`,
          text: `A new application has been submitted for "${jobEntry.title}".`,
        });
      } catch (err) {
        strapi.log.warn('Email failed to send:', err.message);
      }
    }

    return application;
  },
};