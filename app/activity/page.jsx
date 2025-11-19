'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, XCircle, AlertCircle, Info, Clock, Play, Plus, Trash2, Edit, FileText } from 'lucide-react';

export default function ActivityPage() {
  const [runs, setRuns] = useState([]);
  const [activities, setActivities] = useState([]);
  const [allActivities, setAllActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, runs, activities
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [search, statusFilter, typeFilter, allActivities]);

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

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(item => {
        if (item.type === 'run') {
          return item.automation?.name?.toLowerCase().includes(searchLower) ||
                 item.id?.toLowerCase().includes(searchLower) ||
                 item.uniqueId?.toLowerCase().includes(searchLower);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Activity</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            View execution logs and activity history for all catalog items
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              focusRing: 'var(--primary)'
            }}
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Type:</span>
          {['all', 'runs', 'activities'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                backgroundColor: typeFilter === type ? 'var(--primary)' : 'var(--surface)',
                color: typeFilter === type ? 'white' : 'var(--text)',
                border: `1px solid ${typeFilter === type ? 'var(--primary)' : 'var(--border)'}`
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Status Filter (for runs) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Status:</span>
          {['all', 'success', 'failed', 'running', 'pending'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                backgroundColor: statusFilter === status ? 'var(--primary)' : 'var(--surface)',
                color: statusFilter === status ? 'white' : 'var(--text)',
                border: `1px solid ${statusFilter === status ? 'var(--primary)' : 'var(--border)'}`
              }}
            >
              {status}
            </button>
          ))}
        </div>
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
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                            {item.automation?.name || 'Unknown Automation'}
                          </h3>
                          {getStatusBadge(item.status)}
                          {item.status === 'success' && item.result && (
                            <span className="text-xs px-2 py-1 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
                              ✓ Validated
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm mt-3" style={{ color: 'var(--muted)' }}>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>Run ID:</span>
                            <span className="ml-2">{item.uniqueId || item.id.substring(0, 8)}</span>
                          </div>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>User:</span>
                            <span className="ml-2">{item.executedBy || 'System'}</span>
                          </div>
                          {item.awxJobId && (
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>AWX Job ID:</span>
                              <span className="ml-2">{item.awxJobId}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>Start Time:</span>
                            <span className="ml-2">{new Date(item.startedAt).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="font-medium" style={{ color: 'var(--text)' }}>End Time:</span>
                            <span className="ml-2">
                              {item.completedAt ? new Date(item.completedAt).toLocaleString() : 'In progress'}
                            </span>
                          </div>
                          {item.completedAt && item.startedAt && (
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text)' }}>Duration:</span>
                              <span className="ml-2">
                                {Math.round((new Date(item.completedAt) - new Date(item.startedAt)) / 1000)}s
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
                        {item.result && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>
                              AWX Job Response
                            </summary>
                            <pre
                              className="mt-2 p-3 rounded-lg text-xs overflow-x-auto"
                              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                            >
                              {(() => {
                                try {
                                  return JSON.stringify(JSON.parse(item.result || '{}'), null, 2);
                                } catch (e) {
                                  return item.result;
                                }
                              })()}
                            </pre>
                          </details>
                        )}
                        {item.artifacts && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium cursor-pointer" style={{ color: 'var(--muted)' }}>
                              Job Artifacts
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
                    {item.automation?.namespace && (
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-md flex-shrink-0"
                        style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                      >
                        {item.automation.namespace}
                      </span>
                    )}
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
