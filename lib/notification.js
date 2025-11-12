import prisma from './prisma';

/**
 * Create a notification
 * @param {Object} params
 * @param {string} params.type - error, warning, info, success
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 */
export async function createNotification({ type, title, message }) {
  try {
    await prisma.notification.create({
      data: {
        type,
        title,
        message,
        read: false,
      },
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - creating notification should not break the main operation
  }
}
