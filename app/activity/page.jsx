'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Info, Clock, Play, Plus, Trash2, Edit, FileText, StopCircle, ChevronDown, ChevronUp, Calendar, User, ExternalLink, Download, FileSpreadsheet } from 'lucide-react';
import { prepareActivityDataForExport, convertToCSV, downloadCSV, generateFilename, exportAPIResultToExcel } from '@/lib/exportUtils';

export default function ActivityPage() {
  const [runs, setRuns] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [search, statusFilter, userFilter, dateFrom, dateTo, runs]);

  const fetchAllData = async () => {
    try {
      // Fetch only runs (automation executions)
      const runsRes = await fetch('/api/runs');
      const runsData = await runsRes.json();

      // Ensure data is array and sort by startedAt descending
      const runsArray = Array.isArray(runsData) ? runsData : [];
      runsArray.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

      setRuns(runsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching runs:', error);
      setLoading(false);
    }
  };

  const handleStopExecution = async (item) => {
    if (!item.awxJobId || (item.status !== 'running' && item.status !== 'pending')) {
      return;
    }

    if (!confirm('Are you sure you want to stop this automation execution?')) {
      return;
    }

    try {
      let endpoint;
      let method;
      let body;

      // Determine the correct endpoint based on execution type
      if (item.type === 'catalog') {
        // For catalog executions, use DELETE on the execution endpoint
        endpoint = `/api/catalog/executions/${item.id}`;
        method = 'DELETE';
        body = null;
      } else {
        // For automation runs, use the automation cancel endpoint
        endpoint = `/api/automations/${item.automationId}/cancel`;
        method = 'POST';
        body = JSON.stringify({ awxJobId: item.awxJobId });
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        ...(body && { body })
      });

      if (!res.ok) {
        let errorMessage = 'Failed to cancel execution';
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
          if (error.details) {
            console.error('Cancel error details:', error.details);
          }
        } catch (parseError) {
          const errorText = await res.text();
          console.error('Cancel error (non-JSON):', errorText);
          errorMessage = `Failed to cancel execution (HTTP ${res.status})`;
        }
        throw new Error(errorMessage);
      }

      alert('Execution cancelled successfully');
      fetchAllData();
    } catch (error) {
      console.error('Error cancelling execution:', error);
      alert(`Failed to cancel execution: ${error.message}`);
    }
  };

  const filterActivities = () => {
    let filtered = runs;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by user
    if (userFilter) {
      const userLower = userFilter.toLowerCase();
      filtered = filtered.filter(item => item.executedBy?.toLowerCase().includes(userLower));
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startedAt);
        return itemDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.startedAt);
        return itemDate <= toDate;
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.automation?.name?.toLowerCase().includes(searchLower) ||
        item.id?.toLowerCase().includes(searchLower) ||
        item.uniqueId?.toLowerCase().includes(searchLower) ||
        item.awxJobId?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />;
      case 'failed':
        return <XCircle className="h-5 w-5" style={{ color: '#ef4444' }} />;
      case 'running':
        return <Clock className="h-5 w-5 animate-spin" style={{ color: '#3b82f6' }} />;
      case 'pending':
        return <AlertCircle className="h-5 w-5" style={{ color: '#f59e0b' }} />;
      default:
        return <Play className="h-5 w-5" style={{ color: 'var(--muted)' }} />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' },
      failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
      running: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
      pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
    };

    const style = styles[status] || { bg: 'var(--surface)', color: 'var(--muted)' };

    return (
      <span
        className="px-3 py-1 text-xs font-semibold rounded-full capitalize"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {status}
      </span>
    );
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return 'In progress';
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end - start;
    const minutes = (durationMs / 1000 / 60).toFixed(1);
    return `${minutes} min`;
  };

  const getAWXJobUrl = (awxJobId) => {
    // Get AWX URL from environment or use default
    const awxBaseUrl = process.env.NEXT_PUBLIC_AWX_URL || 'http://127.0.0.1:59809';
    return `${awxBaseUrl}/#/jobs/playbook/${awxJobId}`;
  };

  const handleDownloadReport = () => {
    try {
      // Prepare the data for export
      const preparedData = prepareActivityDataForExport(filteredActivities);

      // Convert to CSV
      const csvContent = convertToCSV(preparedData);

      // Generate filename with timestamp
      const filename = generateFilename('activity-report');

      // Trigger download
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Execution History</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            View and analyze automation execution logs with detailed parameters and results
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
            <Info className="h-4 w-4" />
            <span>{filteredActivities.length} of {runs.length} executions</span>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={filteredActivities.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'white',
            }}
            title="Download execution report as CSV"
          >
            <Download className="h-4 w-4" />
            Download Report
          </button>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by execution ID (WSRPT00-00001), automation name, AWX Job ID..."
            className="w-full rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              focusRing: 'var(--primary)'
            }}
          />
        </div>

        {/* Quick Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Status:</span>
            {['all', 'success', 'failed', 'running', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-2.5 py-1 rounded text-xs font-medium transition-all capitalize"
                style={{
                  backgroundColor: statusFilter === status ? 'var(--primary)' : 'var(--bg)',
                  color: statusFilter === status ? 'white' : 'var(--text)',
                  border: `1px solid ${statusFilter === status ? 'var(--primary)' : 'var(--border)'}`
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all"
            style={{
              backgroundColor: showAdvancedFilters ? 'var(--primary)' : 'var(--bg)',
              color: showAdvancedFilters ? 'white' : 'var(--text)',
              border: `1px solid ${showAdvancedFilters ? 'var(--primary)' : 'var(--border)'}`
            }}
          >
            <Filter className="h-3 w-3" />
            Advanced
            {showAdvancedFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  <User className="h-3.5 w-3.5 inline mr-1" />
                  Executed By
                </label>
                <input
                  type="text"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  placeholder="Filter by user..."
                  className="w-full rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  <Calendar className="h-3.5 w-3.5 inline mr-1" />
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  <Calendar className="h-3.5 w-3.5 inline mr-1" />
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setUserFilter('');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-4 py-2 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)'
                }}
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Execution List */}
      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted)' }}>Loading executions...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)' }}>No executions found</p>
            </div>
          ) : (
            filteredActivities.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-6 hover:shadow-md transition-shadow"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(item.status)}
                    </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                            {item.automation?.name || 'Unknown Automation'}
                          </h3>
                          {getStatusBadge(item.status)}
                          {item.status === 'success' && item.result && (
                            <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                              ✓ Validated
                            </span>
                          )}
                          {(item.status === 'running' || item.status === 'pending') && item.awxJobId && (
                            <button
                              onClick={() => handleStopExecution(item)}
                              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium hover:opacity-80 transition-opacity"
                              style={{ backgroundColor: '#DC2626', color: 'white' }}
                              title="Stop execution"
                            >
                              <StopCircle className="h-3 w-3" />
                              Stop
                            </button>
                          )}
                        </div>
                        {/* Description */}
                        {item.automation?.description && (
                          <p className="text-sm mb-3 italic" style={{ color: 'var(--muted)' }}>
                            {item.automation.description}
                          </p>
                        )}
                        {/* Execution Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Execution ID</span>
                            <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>{item.uniqueId || item.id.substring(0, 12)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Executed By</span>
                            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text)' }}>
                              <User className="h-3.5 w-3.5" />
                              {item.executedBy || 'System'}
                            </span>
                          </div>
                          {item.awxJobId && (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>AWX Job ID</span>
                              <a
                                href={getAWXJobUrl(item.awxJobId)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono flex items-center gap-1 hover:underline transition-all"
                                style={{ color: 'var(--primary)' }}
                                title="Open job in AWX"
                              >
                                {item.awxJobId}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Started At</span>
                            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text)' }}>
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(item.startedAt).toLocaleString('en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
                              {item.completedAt ? 'Completed At' : 'Status'}
                            </span>
                            <span className="text-sm flex items-center gap-1" style={{ color: 'var(--text)' }}>
                              {item.completedAt ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {new Date(item.completedAt).toLocaleString('en-US', {
                                    dateStyle: 'medium',
                                    timeStyle: 'short'
                                  })}
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3.5 w-3.5 animate-spin" />
                                  In progress...
                                </>
                              )}
                            </span>
                          </div>
                          {item.completedAt && item.startedAt && (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Total Duration</span>
                              <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                                {(() => {
                                  const durationSec = Math.round((new Date(item.completedAt) - new Date(item.startedAt)) / 1000);
                                  if (durationSec < 60) return `${durationSec}s`;
                                  const minutes = Math.floor(durationSec / 60);
                                  const seconds = durationSec % 60;
                                  return `${minutes}m ${seconds}s`;
                                })()}
                              </span>
                            </div>
                          )}
                          {item.automation?.namespace && (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>Namespace</span>
                              <span className="text-sm px-2 py-1 rounded-md inline-block" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}>
                                {item.automation.namespace}
                              </span>
                            </div>
                          )}
                        </div>
                        {item.errorMessage && (
                          <div
                            className="mt-3 p-3 rounded-lg text-sm"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                          >
                            <strong>Error:</strong> {item.errorMessage}
                          </div>
                        )}
                        {item.parameters && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>
                              Parameters
                            </summary>
                            <pre
                              className="mt-2 p-3 rounded-lg text-xs overflow-x-auto"
                              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                            >
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(item.parameters || '{}'), null, 2);
                                } catch (e) {
                                  return item.parameters;
                                }
                              })()}
                            </pre>
                          </details>
                        )}
                        {item.artifacts && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                                API Result
                              </span>
                              <button
                                onClick={() => exportAPIResultToExcel(item.artifacts, item.automation?.name || 'automation', item.uniqueId || item.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80"
                                style={{
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                }}
                                title="Export API result to Excel"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                Export to Excel
                              </button>
                            </div>
                            <details>
                              <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>
                                View JSON Output
                              </summary>
                              <pre
                                className="mt-2 p-3 rounded-lg text-xs overflow-x-auto"
                                style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                              >
                                {(() => {
                                  try {
                                    return JSON.stringify(JSON.parse(item.artifacts || '{}'), null, 2);
                                  } catch (e) {
                                    return item.artifacts;
                                  }
                                })()}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
