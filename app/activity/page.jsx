'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Info, Clock, Play, Plus, Trash2, Edit, FileText, StopCircle, ChevronDown, ChevronUp, Calendar, User, ExternalLink } from 'lucide-react';

export default function ActivityPage() {
  const [runs, setRuns] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, runs, activities
  const [actionFilter, setActionFilter] = useState('all'); // for activity actions
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
  }, [search, statusFilter, typeFilter, actionFilter, userFilter, dateFrom, dateTo, allActivities]);

  const fetchAllData = async () => {
    try {
      // Get user data from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userEmail = user.email || '';
      const userRole = user.role || 'user';

      // Build query parameters for activity API
      const activityParams = new URLSearchParams();
      if (userEmail) activityParams.append('userEmail', userEmail);
      if (userRole) activityParams.append('userRole', userRole);

      // Fetch both runs and activities in parallel
      const [runsRes, activitiesRes] = await Promise.all([
        fetch('/api/runs'),
        fetch(`/api/activity?${activityParams.toString()}`)
      ]);

      const runsData = await runsRes.json();
      const activitiesData = await activitiesRes.json();

      // Ensure data is arrays
      const runsArray = Array.isArray(runsData) ? runsData : [];
      const activitiesArray = Array.isArray(activitiesData) ? activitiesData : [];

      setRuns(runsArray);
      setActivities(activitiesArray);

      // Merge both types of activities
      const merged = [
        ...runsArray.map(run => ({
          ...run,
          type: 'run',
          timestamp: run.startedAt,
        })),
        ...activitiesArray.map(activity => ({
          ...activity,
          type: 'activity',
          timestamp: activity.createdAt,
        }))
      ];

      // Sort by timestamp descending
      merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAllActivities(merged);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
    }
  };

  const handleStopExecution = async (item) => {
    if (!item.awxJobId || (item.status !== 'running' && item.status !== 'pending')) {
      return;
    }

    if (!confirm(`Are you sure you want to stop this ${item.type === 'run' ? 'automation' : 'catalog'} execution?`)) {
      return;
    }

    try {
      const endpoint = item.type === 'run'
        ? `/api/automations/${item.automationId}/cancel`
        : `/api/catalog/${item.automationId || item.catalogId}/cancel`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ awxJobId: item.awxJobId })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to cancel execution');
      }

      alert('Execution cancelled successfully');
      fetchAllData(); // Refresh data
    } catch (error) {
      console.error('Error cancelling execution:', error);
      alert(`Failed to cancel execution: ${error.message}`);
    }
  };

  const filterActivities = () => {
    let filtered = allActivities;

    // Filter by type (all, runs, activities)
    if (typeFilter === 'runs') {
      filtered = filtered.filter(item => item.type === 'run');
    } else if (typeFilter === 'activities') {
      filtered = filtered.filter(item => item.type === 'activity');
    }

    // Filter by status (only show runs when status filter is active)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        // Only show runs that match the status filter
        return item.type === 'run' && item.status === statusFilter;
      });
    }

    // Filter by action (for activities)
    if (actionFilter !== 'all') {
      filtered = filtered.filter(item => {
        return item.type === 'activity' && item.action === actionFilter;
      });
    }

    // Filter by user
    if (userFilter) {
      const userLower = userFilter.toLowerCase();
      filtered = filtered.filter(item => {
        const user = item.type === 'run' ? item.executedBy : item.performedBy;
        return user?.toLowerCase().includes(userLower);
      });
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.timestamp);
        return itemDate <= toDate;
      });
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.type === 'run') {
          return item.automation?.name?.toLowerCase().includes(searchLower) ||
                 item.id?.toLowerCase().includes(searchLower) ||
                 item.uniqueId?.toLowerCase().includes(searchLower) ||
                 item.awxJobId?.toLowerCase().includes(searchLower);
        } else {
          return item.entityName?.toLowerCase().includes(searchLower) ||
                 item.description?.toLowerCase().includes(searchLower) ||
                 item.action?.toLowerCase().includes(searchLower);
        }
      });
    }

    setFilteredActivities(filtered);
  };

  const getActivityIcon = (item) => {
    if (item.type === 'run') {
      switch (item.status) {
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
    } else {
      switch (item.action) {
        case 'login':
          return <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />;
        case 'logout':
          return <XCircle className="h-5 w-5" style={{ color: '#6b7280' }} />;
        case 'created':
          return <Plus className="h-5 w-5" style={{ color: 'var(--success)' }} />;
        case 'updated':
          return <Edit className="h-5 w-5" style={{ color: '#3b82f6' }} />;
        case 'deleted':
          return <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />;
        case 'executed':
          return <Play className="h-5 w-5" style={{ color: 'var(--primary)' }} />;
        default:
          return <FileText className="h-5 w-5" style={{ color: 'var(--muted)' }} />;
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Activity Dashboard</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Comprehensive execution logs, activity history, and audit trails for all automations and catalog items
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--muted)' }}>
          <Info className="h-4 w-4" />
          <span>{filteredActivities.length} of {allActivities.length} activities</span>
        </div>
      </div>

      {/* Search and Filters Card */}
      <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        {/* Main Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, AWX Job ID, action, user, or description..."
            className="w-full rounded-lg py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              focusRing: 'var(--primary)'
            }}
          />
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Type:</span>
            {['all', 'runs', 'activities'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
                style={{
                  backgroundColor: typeFilter === type ? 'var(--primary)' : 'var(--bg)',
                  color: typeFilter === type ? 'white' : 'var(--text)',
                  border: `1px solid ${typeFilter === type ? 'var(--primary)' : 'var(--border)'}`
                }}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filter (for runs) */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Status:</span>
            {['all', 'success', 'failed', 'running', 'pending'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize"
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
            className="ml-auto flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{
              backgroundColor: showAdvancedFilters ? 'var(--primary)' : 'var(--bg)',
              color: showAdvancedFilters ? 'white' : 'var(--text)',
              border: `1px solid ${showAdvancedFilters ? 'var(--primary)' : 'var(--border)'}`
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            Advanced Filters
            {showAdvancedFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mt-4 pt-4 border-t space-y-4" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Action Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  <FileText className="h-3.5 w-3.5 inline mr-1" />
                  Action Type
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="created">Created</option>
                  <option value="updated">Updated</option>
                  <option value="deleted">Deleted</option>
                  <option value="executed">Executed</option>
                </select>
              </div>

              {/* User Filter */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                  <User className="h-3.5 w-3.5 inline mr-1" />
                  User
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
                  setTypeFilter('all');
                  setActionFilter('all');
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

      {/* Activity List */}
      {loading ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--muted)' }}>Loading activity...</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--muted)' }}>No activity found</p>
            </div>
          ) : (
            filteredActivities.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-6 hover:shadow-md transition-shadow"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
              >
                {item.type === 'run' ? (
                  // Render Run Activity
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(item)}
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
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>
                              Job Output
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
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Render General Activity
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(item)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                            {item.entityName}
                          </h3>
                          <span
                            className="px-3 py-1 text-xs font-semibold rounded-full capitalize"
                            style={{
                              backgroundColor: item.action === 'login' ? 'rgba(34, 197, 94, 0.1)' :
                                             item.action === 'logout' ? 'rgba(107, 114, 128, 0.1)' :
                                             item.action === 'created' ? 'rgba(34, 197, 94, 0.1)' :
                                             item.action === 'updated' ? 'rgba(59, 130, 246, 0.1)' :
                                             item.action === 'deleted' ? 'rgba(239, 68, 68, 0.1)' :
                                             'rgba(76, 18, 161, 0.1)',
                              color: item.action === 'login' ? 'var(--success)' :
                                    item.action === 'logout' ? '#6b7280' :
                                    item.action === 'created' ? 'var(--success)' :
                                    item.action === 'updated' ? '#3b82f6' :
                                    item.action === 'deleted' ? '#ef4444' :
                                    'var(--primary)'
                            }}
                          >
                            {item.action}
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm flex-wrap" style={{ color: 'var(--muted)' }}>
                          <span>
                            {new Date(item.createdAt).toLocaleString()}
                          </span>
                          <span>
                            By: {item.performedBy}
                          </span>
                          <span className="px-2 py-0.5 text-xs rounded-md" style={{ backgroundColor: 'var(--bg)' }}>
                            {item.entityType}
                          </span>
                          {/* Show department and location for login/logout events */}
                          {(item.action === 'login' || item.action === 'logout') && item.metadata && (() => {
                            try {
                              const metadata = JSON.parse(item.metadata);
                              return (
                                <>
                                  {metadata.department && metadata.department !== 'N/A' && (
                                    <span className="px-2 py-0.5 text-xs rounded-md" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}>
                                      {metadata.department}
                                    </span>
                                  )}
                                  {metadata.location && metadata.location !== 'N/A' && (
                                    <span className="px-2 py-0.5 text-xs rounded-md" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                      {metadata.location}
                                    </span>
                                  )}
                                </>
                              );
                            } catch (e) {
                              return null;
                            }
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
