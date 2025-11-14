import fs from 'fs';
import path from 'path';

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'automation-errors.log');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Format log entry with timestamp and detailed context
 */
function formatLogEntry(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const date = new Date(timestamp);
  const humanTime = date.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  let formattedData = '';
  if (data) {
    formattedData = '\n\n📋 DETAILS:\n' + JSON.stringify(data, null, 2);
  }

  const levelEmoji = level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : '✅';
  return `\n${levelEmoji} [${humanTime}] [${level}]\n📝 ${message}${formattedData}\n${'='.repeat(100)}\n`;
}

/**
 * Write to log file
 */
function writeToFile(entry) {
  try {
    fs.appendFileSync(LOG_FILE, entry, 'utf8');
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Log info message
 */
export function logInfo(message, data = null) {
  const entry = formatLogEntry('INFO', message, data);
  writeToFile(entry);
  console.log(`📝 ${message}`);
}

/**
 * Log error message with safe property access
 */
export function logError(message, error = null) {
  let errorData = null;

  if (error) {
    // Handle error that might be an object, plain object, or string
    if (typeof error === 'string') {
      errorData = { errorString: error };
    } else if (typeof error === 'object') {
      // Safely extract all possible error properties
      errorData = {
        message: error?.message || undefined,
        stack: error?.stack || undefined,
        code: error?.code || undefined,
        name: error?.name || undefined,
        response: error?.response?.data || undefined,
        status: error?.response?.status || undefined,
        clientVersion: error?.clientVersion || undefined,
        meta: error?.meta || undefined,
        cause: error?.cause || undefined,
        // Include the error as a string
        errorString: String(error),
        // Include all keys
        allKeys: Object.keys(error),
      };
    } else {
      errorData = { value: String(error) };
    }
  }

  const entry = formatLogEntry('ERROR', message, errorData);
  writeToFile(entry);
  console.error(`❌ ${message}`, errorData);
}

/**
 * Log warning message
 */
export function logWarning(message, data = null) {
  const entry = formatLogEntry('WARN', message, data);
  writeToFile(entry);
  console.warn(`⚠️  ${message}`);
}

/**
 * Log automation execution start
 */
export function logAutomationStart(automationId, automationName, uniqueId, parameters) {
  const message = `🚀 AUTOMATION EXECUTION STARTED: "${automationName}"`;
  logInfo(message, {
    '🆔 Automation ID': automationId,
    '🎫 Unique Run ID': uniqueId,
    '📥 Input Parameters': parameters,
    '👤 Triggered By': 'User',
    '⏰ Started At': new Date().toISOString(),
  });
}

/**
 * Log automation execution success
 */
export function logAutomationSuccess(automationId, uniqueId, awxJobId, status) {
  const message = `✅ AUTOMATION EXECUTION COMPLETED SUCCESSFULLY`;
  logInfo(message, {
    '🆔 Automation ID': automationId,
    '🎫 Run ID': uniqueId,
    '🔧 AWX Job ID': awxJobId,
    '📊 Final Status': status,
    '⏰ Completed At': new Date().toISOString(),
  });
}

/**
 * Log automation execution failure
 */
export function logAutomationFailure(automationId, uniqueId, error, context = {}) {
  const message = `❌ AUTOMATION EXECUTION FAILED`;
  logError(message, {
    '🆔 Automation ID': automationId,
    '🎫 Run ID': uniqueId,
    '🚨 Error Message': error.message,
    '📍 Failure Point': context.phase || 'unknown',
    '🔧 AWX Job ID': context.awxJobId || 'Not created',
    '🔍 Additional Context': context,
    '📚 Stack Trace': error.stack,
  });
}

/**
 * Get log file path
 */
export function getLogFilePath() {
  return LOG_FILE;
}

/**
 * Clear log file
 */
export function clearLogs() {
  try {
    fs.writeFileSync(LOG_FILE, '', 'utf8');
    console.log('✅ Log file cleared');
  } catch (error) {
    console.error('Failed to clear log file:', error);
  }
}

export default {
  logInfo,
  logError,
  logWarning,
  logAutomationStart,
  logAutomationSuccess,
  logAutomationFailure,
  getLogFilePath,
  clearLogs,
};
