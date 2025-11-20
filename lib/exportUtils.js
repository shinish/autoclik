/**
 * Utility functions for exporting activity data to Excel/CSV format
 */

/**
 * Flatten nested AWX artifacts into linear/tabular format
 * @param {Object} artifacts - AWX job artifacts (JSON)
 * @returns {Array} - Array of flat objects suitable for CSV
 */
export function flattenAWXArtifacts(artifacts) {
  if (!artifacts) return [];

  try {
    const parsed = typeof artifacts === 'string' ? JSON.parse(artifacts) : artifacts;
    const flattened = [];

    // Handle different artifact structures
    if (Array.isArray(parsed)) {
      // If it's already an array, flatten each item
      parsed.forEach((item, index) => {
        flattened.push(flattenObject(item, `item_${index}`));
      });
    } else if (typeof parsed === 'object') {
      // If it's an object, flatten it
      flattened.push(flattenObject(parsed));
    }

    return flattened;
  } catch (e) {
    console.error('Error flattening artifacts:', e);
    return [];
  }
}

/**
 * Recursively flatten a nested object
 * @param {Object} obj - Object to flatten
 * @param {string} prefix - Prefix for nested keys
 * @returns {Object} - Flattened object
 */
function flattenObject(obj, prefix = '') {
  const result = {};

  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue;

    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = '';
    } else if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length > 0) {
      // Recursively flatten nested objects
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      // Convert arrays to comma-separated strings
      result[newKey] = value.map(v =>
        typeof v === 'object' ? JSON.stringify(v) : v
      ).join(', ');
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Convert activity data to CSV format
 * @param {Array} activities - Array of activity objects
 * @returns {string} - CSV string
 */
export function convertToCSV(activities) {
  if (!activities || activities.length === 0) {
    return '';
  }

  const rows = [];

  // Extract all unique keys from all activities
  const allKeys = new Set();
  activities.forEach(activity => {
    Object.keys(activity).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);

  // Add header row
  rows.push(headers.map(header => `"${header}"`).join(','));

  // Add data rows
  activities.forEach(activity => {
    const row = headers.map(header => {
      const value = activity[header];
      if (value === null || value === undefined) return '""';

      // Escape quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    });
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * Prepare activity data for export
 * @param {Array} activities - Raw activity data from the database
 * @returns {Array} - Processed data ready for CSV export
 */
export function prepareActivityDataForExport(activities) {
  return activities.map(item => {
    const baseData = {
      'Execution ID': item.uniqueId || item.id?.substring(0, 12) || '',
      'Type': item.type || '',
      'Name': item.type === 'run' ? (item.automation?.name || '') : (item.entityName || ''),
      'Description': item.type === 'run' ? (item.automation?.description || '') : (item.description || ''),
      'Status': item.status || item.action || '',
      'Executed By': item.type === 'run' ? (item.executedBy || 'System') : (item.performedBy || ''),
      'Started At': item.startedAt ? new Date(item.startedAt).toLocaleString() : (item.createdAt ? new Date(item.createdAt).toLocaleString() : ''),
      'Completed At': item.completedAt ? new Date(item.completedAt).toLocaleString() : '',
      'Duration (seconds)': item.completedAt && item.startedAt ?
        Math.round((new Date(item.completedAt) - new Date(item.startedAt)) / 1000) : '',
      'AWX Job ID': item.awxJobId || '',
      'Namespace': item.automation?.namespace || '',
      'Error Message': item.errorMessage || '',
    };

    // Add parameters if available
    if (item.parameters) {
      try {
        const params = typeof item.parameters === 'string' ? JSON.parse(item.parameters) : item.parameters;
        Object.entries(params).forEach(([key, value]) => {
          baseData[`Parameter: ${key}`] = typeof value === 'object' ? JSON.stringify(value) : value;
        });
      } catch (e) {
        baseData['Parameters'] = item.parameters;
      }
    }

    // Add flattened artifacts if available
    if (item.artifacts) {
      try {
        const artifacts = typeof item.artifacts === 'string' ? JSON.parse(item.artifacts) : item.artifacts;
        const flattened = flattenObject(artifacts, 'Artifact');
        Object.assign(baseData, flattened);
      } catch (e) {
        baseData['Artifacts'] = item.artifacts;
      }
    }

    return baseData;
  });
}

/**
 * Trigger CSV download in the browser
 * @param {string} csvContent - CSV content string
 * @param {string} filename - Desired filename
 */
export function downloadCSV(csvContent, filename = 'activity-report.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generate filename with timestamp
 * @param {string} prefix - Filename prefix
 * @returns {string} - Filename with timestamp
 */
export function generateFilename(prefix = 'activity-report') {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}_${timestamp}.csv`;
}
