import { NextResponse } from 'next/server';
import { logError } from './logger';

/**
 * Safely extract all error properties without assuming structure
 * @param {any} error - The error object (could be Error, string, or plain object)
 * @returns {object} - Safe error details object
 */
export function extractErrorDetails(error) {
  if (!error) {
    return {
      '🚨 Error Type': 'null or undefined',
      '📋 Message': 'No error provided',
    };
  }

  const details = {
    '🚨 Error Type': typeof error,
    '📝 Error ToString': String(error),
    '🔍 Constructor': error?.constructor?.name || 'Unknown',
    '📋 Message': error?.message || (typeof error === 'string' ? error : 'No message'),
    '🔢 Code': error?.code !== undefined ? error.code : null,
    '📛 Name': error?.name || null,
    '🔄 Retryable': error?.retryable !== undefined ? error.retryable : null,
    '🗄️ Meta': error?.meta || null,
    '📍 Cause': error?.cause || null,
    '📚 Stack': error?.stack || null,
    '🔧 Client Version': error?.clientVersion || null,
    '📊 Response Status': error?.response?.status || null,
    '📦 Response Data': error?.response?.data || null,
  };

  // Only include non-null values in the details
  const cleanedDetails = {};
  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined) {
      cleanedDetails[key] = value;
    }
  }

  // Add all keys for debugging
  cleanedDetails['📊 All Properties'] = Object.keys(error);

  // Add full serialization attempt
  try {
    cleanedDetails['🔬 Full Error Object'] = JSON.stringify(error, Object.getOwnPropertyNames(error));
  } catch (e) {
    cleanedDetails['🔬 Full Error Object'] = 'Could not serialize';
  }

  return cleanedDetails;
}

/**
 * Create a safe API error response
 * @param {any} error - The error object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @returns {NextResponse} - Next.js response object
 */
export function createErrorResponse(error, message = 'An error occurred', statusCode = 500) {
  const details = extractErrorDetails(error);

  // Log the error with full details
  logError(message, details);

  // Return safe response
  return NextResponse.json(
    {
      error: message,
      details: error?.message || String(error) || 'Unknown error',
      errorType: error?.constructor?.name || 'Unknown',
      code: error?.code !== undefined ? error.code : null,
      name: error?.name || null,
      retryable: error?.retryable !== undefined ? error.retryable : null,
      clientVersion: error?.clientVersion || null,
      meta: error?.meta || null,
      allKeys: error ? Object.keys(error) : [],
    },
    { status: statusCode }
  );
}

/**
 * Wrap an async route handler with error handling
 * @param {Function} handler - The async route handler function
 * @param {string} errorMessage - Custom error message
 * @returns {Function} - Wrapped handler with error handling
 */
export function withErrorHandling(handler, errorMessage = 'Request failed') {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, errorMessage);
    }
  };
}

export default {
  extractErrorDetails,
  createErrorResponse,
  withErrorHandling,
};
