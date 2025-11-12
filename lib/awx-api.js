import axios from 'axios';
import prisma from './prisma';

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

  // Log configuration for debugging
  console.log('🚀 Attempting to launch AWX job...');
  console.log('  - Template ID:', templateId);
  console.log('  - Base URL:', baseUrl);
  console.log('  - Has Token:', !!token);
  console.log('  - Token Length:', token?.length || 0);

  // Demo mode: Only if truly not configured (no token OR placeholder URL)
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    console.log('🎭 Demo Mode: AWX not properly configured');
    console.log('  - Has Token:', !!token);
    console.log('  - Is Placeholder URL:', isPlaceholder);
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

  console.log('✅ Configuration valid, launching REAL AWX job to:', baseUrl);

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.post(`/job_templates/${templateId}/launch/`, customBody);
    console.log('✅ AWX job launched successfully! Job ID:', response.data.id);
    return response.data;
  } catch (error) {
    console.error('❌ Error launching AWX job:', error.response?.data || error.message);
    throw new Error(`Failed to launch AWX job: ${error.response?.data?.detail || error.message}`);
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

  // Demo mode
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return {
      id: jobId,
      status: 'successful',
      failed: false,
      started: new Date().toISOString(),
      finished: new Date().toISOString(),
      elapsed: 5.234,
    };
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get(`/jobs/${jobId}/`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job status:', error.response?.data || error.message);
    throw new Error(`Failed to fetch job status: ${error.response?.data?.detail || error.message}`);
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

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return { content: 'Demo mode - no output available' };
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get(`/jobs/${jobId}/stdout/?format=json`);
    return response.data;
  } catch (error) {
    console.error('Error fetching job output:', error.response?.data || error.message);
    throw new Error(`Failed to fetch job output: ${error.response?.data?.detail || error.message}`);
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

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return { status: 'Demo mode - cannot cancel' };
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

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return [];
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get('/job_templates/');
    return response.data.results;
  } catch (error) {
    console.error('Error listing job templates:', error.response?.data || error.message);
    throw new Error(`Failed to list job templates: ${error.response?.data?.detail || error.message}`);
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

  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return [];
  }

  try {
    const client = createAwxClient(baseUrl, token);
    const response = await client.get('/inventories/');
    return response.data.results;
  } catch (error) {
    console.error('Error listing inventories:', error.response?.data || error.message);
    throw new Error(`Failed to list inventories: ${error.response?.data?.detail || error.message}`);
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

  // Demo mode
  const isPlaceholder = !baseUrl || baseUrl === 'https://awx.example.com/api/v2' || baseUrl.includes('example.com');

  if (!token || isPlaceholder) {
    return {
      artifacts: {
        demo: true,
        message: 'Demo mode - no real artifacts available',
        sampleData: { result: 'success' }
      }
    };
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
