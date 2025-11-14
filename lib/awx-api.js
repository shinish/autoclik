import axios from 'axios';
import prisma from './prisma';
import { logError, logWarning, logInfo } from './logger';

/**
 * Get AWX configuration from database or environment variables
 * Priority: Database settings > Environment variables > Defaults
 */
async function getAwxConfig() {
  let baseUrl = '';
  let token = '';

  // Always try to fetch from database first
  try {
    const [urlSetting, tokenSetting] = await Promise.all([
      prisma.setting.findUnique({ where: { key: 'default_api_endpoint' } }),
      prisma.setting.findUnique({ where: { key: 'awx_token' } }),
    ]);

    if (urlSetting?.value) {
      baseUrl = urlSetting.value;
      console.log('✅ Loaded base URL from database:', baseUrl);
    }
    if (tokenSetting?.value) {
      token = tokenSetting.value;
      console.log('✅ Loaded token from database (length:', token.length, ')');
    }
  } catch (error) {
    console.error('❌ Error fetching AWX config from database:', error);
  }

  // Fallback to environment variables if database is empty
  if (!baseUrl) {
    const envUrl = process.env.AWX_BASE_URL;
    if (envUrl && !envUrl.includes('example.com')) {
      baseUrl = envUrl;
      console.log('⚠️  Using environment variable for base URL:', baseUrl);
    }
  }
  if (!token) {
    const envToken = process.env.AWX_TOKEN;
    if (envToken) {
      token = envToken;
      console.log('⚠️  Using environment variable for token (length:', token.length, ')');
    }
  }

  // Log final configuration status
  console.log('📊 Final AWX Config:', {
    hasBaseUrl: !!baseUrl,
    hasToken: !!token,
    baseUrl: baseUrl || 'NOT SET',
    isPlaceholder: baseUrl === 'https://awx.example.com/api/v2' || !baseUrl
  });

  return { baseUrl, token };
}

/**
 * Create an axios client with the provided configuration
 */
function createAwxClient(baseUrl, token) {
  return axios.create({
    baseURL: baseUrl,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Launch a job template in Ansible AWX with custom body
 * @param {string} templateId - The ID or name of the job template
 * @param {object} customBody - Complete request body (can include inventory, extra_vars, instance_groups, etc.)
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Job launch response
 */
export async function launchJobTemplate(templateId, customBody = {}, customBaseUrl = null, customToken = null) {
  // Get AWX configuration (from database or use provided custom values)
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  // Log configuration for debugging
  console.log('🚀 Attempting to launch AWX job...');
  console.log('  - Template ID:', templateId);
  console.log('  - Base URL:', baseUrl || '(not set)');
  console.log('  - Has Token:', !!token);
  console.log('  - Token Length:', token?.length || 0);

  // Demo mode: ONLY if URL is placeholder or not set (not just missing token)
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    console.log('🎭 Demo Mode: AWX not configured (placeholder URL)');
    console.log('  - Base URL value:', baseUrl || '(empty)');
    console.log('  - Request Body:', JSON.stringify(customBody, null, 2));

    // Return a mock successful response
    const mockJobId = Math.floor(Math.random() * 10000) + 1000;
    return {
      id: mockJobId,
      name: `Job ${mockJobId}`,
      status: 'successful',
      type: 'job',
      url: `/api/v2/jobs/${mockJobId}/`,
      created: new Date().toISOString(),
      started: new Date().toISOString(),
      finished: new Date(Date.now() + 5000).toISOString(),
      elapsed: 5.234,
      job_explanation: 'Demo mode - AWX not configured. This is a simulated successful execution.',
      execution_environment: null,
      job_template: templateId,
      ...customBody,
    };
  }

  // If we have a real URL but no token, fail with error
  if (!token) {
    const error = new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
    logError('🔐 AWX Authentication Token Missing', {
      '⚠️ Issue': 'No AWX token configured',
      '🌐 AWX Base URL': baseUrl,
      '🔧 Template ID': templateId,
      '💡 Solution': 'Go to Settings page and configure your AWX authentication token',
      '📍 Where to Fix': 'Settings > AWX Configuration > Authentication Token',
    });
    throw error;
  }

  logInfo('🚀 Preparing to launch REAL AWX job (not demo mode)', {
    '🌐 AWX Server': baseUrl,
    '🔧 Template ID': templateId,
    '🔑 Token': 'Configured ✓',
    '📤 Payload': customBody,
    '⏰ Request Time': new Date().toISOString(),
  });

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.post(`/job_templates/${templateId}/launch/`, customBody);
    console.log('✅ AWX job launched successfully! Job ID:', response.data.id);
    return response.data;
  } catch (error) {
    // Extract detailed error message from AWX response
    let errorMessage = 'Failed to launch AWX job';
    let errorType = 'unknown';

    // Check for authentication failure (401)
    if (error.response?.status === 401) {
      errorMessage = 'AWX token is not matching. Please check your authentication token in Settings.';
      errorType = 'authentication';
      logError('🔐 AWX Authentication Failed - Invalid Token (HTTP 401)', {
        '⚠️ Issue': 'The AWX token is invalid or expired',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '📡 HTTP Status': 401,
        '🔑 Token Length': token?.length || 0,
        '💡 Solution': 'Verify your AWX token is correct and has not expired',
        '📍 Where to Fix': 'Settings > AWX Configuration > Generate a new token from AWX',
        '🔗 Endpoint Tried': `${baseUrl}/job_templates/${templateId}/launch/`,
      });
    } else if (error.response?.status === 403) {
      errorMessage = 'AWX access denied. You do not have permission to launch this job template.';
      errorType = 'authorization';
      logError('🚫 AWX Authorization Failed - Permission Denied (HTTP 403)', {
        '⚠️ Issue': 'User does not have permission to launch this job template',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '📡 HTTP Status': 403,
        '💡 Solution': 'The AWX user associated with the token needs "Execute" permission on this template',
        '📍 Where to Fix': 'AWX Server > Job Templates > Permissions',
      });
    } else if (error.response?.status === 404) {
      errorMessage = `Job template '${templateId}' not found on AWX server.`;
      errorType = 'not_found';
      logError('❓ AWX Template Not Found (HTTP 404)', {
        '⚠️ Issue': 'The job template does not exist on AWX server',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '📡 HTTP Status': 404,
        '💡 Solution': 'Verify the Template ID is correct or create the template on AWX',
        '📍 Where to Fix': 'Check template ID in automation settings or create template on AWX',
      });
    } else if (error.response?.data) {
      const awxError = error.response.data;
      // Check if there's a detail field
      if (awxError.detail) {
        errorMessage = awxError.detail;
      } else {
        // Otherwise, combine all validation errors
        const validationErrors = Object.entries(awxError)
          .map(([field, messages]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          })
          .join('; ');
        errorMessage = validationErrors || error.message;
      }
      errorType = 'validation';
      logError('📝 AWX Validation Error - Invalid Request Data', {
        '⚠️ Issue': 'AWX rejected the request due to validation errors',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '❌ Validation Errors': error.response?.data,
        '💡 Solution': 'Check the request body and ensure all required fields are provided with correct values',
        '📍 Where to Fix': 'Review automation configuration and form parameters',
      });
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `Cannot connect to AWX server at ${baseUrl}. Please check if the server is running and accessible.`;
      errorType = 'connection';
      logError('🔌 AWX Connection Refused - Server Not Reachable (ECONNREFUSED)', {
        '⚠️ Issue': 'Cannot establish connection to AWX server',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '🔌 Error Code': error.code,
        '💡 Possible Causes': [
          '1. AWX server is not running',
          '2. Wrong IP address or port',
          '3. Firewall blocking the connection',
          '4. Network connectivity issue'
        ],
        '📍 Where to Fix': 'Check AWX server status and verify the base URL in Settings',
      });
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = `Cannot resolve AWX server hostname at ${baseUrl}. Please check the URL.`;
      errorType = 'dns';
      logError('🌐 AWX DNS Error - Hostname Not Found (ENOTFOUND)', {
        '⚠️ Issue': 'Cannot resolve the AWX server hostname',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '🔌 Error Code': error.code,
        '💡 Possible Causes': [
          '1. Incorrect hostname or domain name',
          '2. DNS server not responding',
          '3. Typo in the base URL'
        ],
        '📍 Where to Fix': 'Check the AWX base URL in Settings and verify it\'s correct',
      });
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = `Connection to AWX server at ${baseUrl} timed out. Please check network connectivity.`;
      errorType = 'timeout';
      logError('⏱️ AWX Connection Timeout - Server Not Responding (ETIMEDOUT)', {
        '⚠️ Issue': 'Connection to AWX server timed out',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '🔌 Error Code': error.code,
        '💡 Possible Causes': [
          '1. AWX server is slow or overloaded',
          '2. Network latency or connectivity issues',
          '3. Firewall causing delays'
        ],
        '📍 Where to Fix': 'Check network connectivity and AWX server performance',
      });
    } else if (error.message) {
      errorMessage = error.message;
      logError('⚠️ AWX Generic Error', {
        '⚠️ Issue': error.message,
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '🔌 Error Code': error.code || 'N/A',
        '📚 Stack Trace': error.stack,
      });
    } else {
      errorMessage = 'Unknown error occurred while launching AWX job';
      logError('❓ AWX Unknown Error', {
        '⚠️ Issue': 'Unknown error with no details',
        '🌐 AWX Server': baseUrl,
        '🔧 Template ID': templateId,
        '📊 Error Object': error,
      });
    }

    throw new Error(errorMessage);
  }
}

/**
 * Get job status from Ansible AWX
 * @param {string} jobId - The job ID
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Job status response
 */
export async function getJobStatus(jobId, customBaseUrl = null, customToken = null) {
  // Get AWX configuration
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  // Demo mode: ONLY if URL is placeholder or not set
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return {
      id: jobId,
      status: 'successful',
      failed: false,
      started: new Date().toISOString(),
      finished: new Date().toISOString(),
      elapsed: 5.234,
    };
  }

  // If we have a real URL but no token, fail with error
  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get(`/jobs/${jobId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job status:', error.response?.data || error.message);

    let errorMessage = 'Failed to fetch job status';
    if (error.response?.status === 401) {
      errorMessage = 'AWX token is not matching. Please check your authentication token in Settings.';
    } else if (error.response?.status === 403) {
      errorMessage = 'AWX access denied. You do not have permission to view this job.';
    } else if (error.response?.status === 404) {
      errorMessage = `Job ${jobId} not found on AWX server.`;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Get job output/logs from Ansible AWX
 * @param {string} jobId - The job ID
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Job output response
 */
export async function getJobOutput(jobId, customBaseUrl = null, customToken = null) {
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return { content: 'Demo mode - no output available' };
  }

  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get(`/jobs/${jobId}/stdout/?format=json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job output:', error.response?.data || error.message);

    let errorMessage = 'Failed to fetch job output';
    if (error.response?.status === 401) {
      errorMessage = 'AWX token is not matching. Please check your authentication token in Settings.';
    } else if (error.response?.status === 403) {
      errorMessage = 'AWX access denied. You do not have permission to view this job output.';
    } else if (error.response?.status === 404) {
      errorMessage = `Job output for ${jobId} not found.`;
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Cancel a running job in Ansible AWX
 * @param {string} jobId - The job ID
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Cancel response
 */
export async function cancelJob(jobId, customBaseUrl = null, customToken = null) {
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return { status: 'Demo mode - cannot cancel' };
  }

  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.post(`/jobs/${jobId}/cancel/`);
    return response.data;
  } catch (error) {
    console.error('Error canceling job:', error.response?.data || error.message);
    throw new Error(`Failed to cancel job: ${error.response?.data?.detail || error.message}`);
  }
}

/**
 * List job templates from Ansible AWX
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - List of job templates
 */
export async function listJobTemplates(customBaseUrl = null, customToken = null) {
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return [];
  }

  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get('/job_templates/');
    return response.data.results;
  } catch (error) {
    console.error('Error listing job templates:', error.response?.data || error.message);

    let errorMessage = 'Failed to list job templates';
    if (error.response?.status === 401) {
      errorMessage = 'AWX token is not matching. Please check your authentication token in Settings.';
    } else if (error.response?.status === 403) {
      errorMessage = 'AWX access denied. You do not have permission to list job templates.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * List inventories from Ansible AWX
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - List of inventories
 */
export async function listInventories(customBaseUrl = null, customToken = null) {
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return [];
  }

  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get('/inventories/');
    return response.data.results;
  } catch (error) {
    console.error('Error listing inventories:', error.response?.data || error.message);

    let errorMessage = 'Failed to list inventories';
    if (error.response?.status === 401) {
      errorMessage = 'AWX token is not matching. Please check your authentication token in Settings.';
    } else if (error.response?.status === 403) {
      errorMessage = 'AWX access denied. You do not have permission to list inventories.';
    } else if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    throw new Error(errorMessage);
  }
}

/**
 * Poll job until completion
 * @param {string} jobId - The job ID
 * @param {number} maxWaitSeconds - Maximum time to wait (default: 300 seconds = 5 minutes)
 * @param {number} pollIntervalSeconds - Interval between polls (default: 5 seconds)
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Final job status
 */
export async function pollJobUntilComplete(jobId, maxWaitSeconds = 300, pollIntervalSeconds = 5, customBaseUrl = null, customToken = null) {
  const startTime = Date.now();
  const maxWaitMs = maxWaitSeconds * 1000;
  const pollIntervalMs = pollIntervalSeconds * 1000;

  while (Date.now() - startTime < maxWaitMs) {
    const jobStatus = await getJobStatus(jobId, customBaseUrl, customToken);

    // Check if job is complete (successful, failed, error, or canceled)
    const finalStatuses = ['successful', 'failed', 'error', 'canceled'];
    if (finalStatuses.includes(jobStatus.status)) {
      return jobStatus;
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Timeout reached
  throw new Error(`Job ${jobId} did not complete within ${maxWaitSeconds} seconds`);
}

/**
 * Get job artifacts from AWX
 * @param {string} jobId - The job ID
 * @param {string} customBaseUrl - Optional custom AWX base URL
 * @param {string} customToken - Optional custom AWX token
 * @returns {Promise} - Job artifacts
 */
export async function getJobArtifacts(jobId, customBaseUrl = null, customToken = null) {
  // Get AWX configuration
  let baseUrl = customBaseUrl;
  let token = customToken;

  if (!customBaseUrl || !customToken) {
    const config = await getAwxConfig();
    baseUrl = baseUrl || config.baseUrl;
    token = token || config.token;
  }

  // Normalize empty strings to null/undefined for proper checks
  if (baseUrl === '') baseUrl = null;
  if (token === '') token = null;

  // Demo mode
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (isPlaceholder) {
    return {
      artifacts: {
        demo: true,
        message: 'Demo mode - no real artifacts available',
        sampleData: { result: 'success' }
      }
    };
  }

  if (!token) {
    throw new Error('AWX token is not configured. Please set your AWX authentication token in Settings.');
  }

  try {
    const client = createAwxClient(baseUrl, token);

    // Get job details which includes artifacts
    const response = await client.get(`/jobs/${jobId}/`);
    return {
      artifacts: response.data.artifacts || {},
      result_traceback: response.data.result_traceback,
      job_explanation: response.data.job_explanation,
    };
  } catch (error) {
    console.error('Error fetching job artifacts:', error.response?.data || error.message);
    // Don't throw error for artifacts - just return empty
    return { artifacts: {}, error: error.message };
  }
}

export default {
  launchJobTemplate,
  getJobStatus,
  getJobOutput,
  cancelJob,
  listJobTemplates,
  listInventories,
  pollJobUntilComplete,
  getJobArtifacts,
};
