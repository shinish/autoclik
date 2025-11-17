'use client';
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Info, RefreshCw, Trash2, Filter } from 'lucide-react';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'ERROR', 'WARN', 'INFO'
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    try {
      const levelParam = filter !== 'all' ? `&level=${filter}` : '';
      const response = await fetch(`/api/logs?limit=100${levelParam}`);
      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, filter]);

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />;
      case 'WARN':
        return <AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />;
      case 'INFO':
        return <Info className="h-5 w-5" style={{ color: '#3b82f6' }} />;
      default:
        return <CheckCircle className="h-5 w-5" style={{ color: 'var(--success)' }} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#dc2626' };
      case 'WARN':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#d97706' };
      case 'INFO':
        return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#2563eb' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'var(--success)', text: '#059669' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <RefreshCw className="h-12 w-12 animate-spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light mb-2" style={{ color: 'var(--text)' }}>
              System Logs
            </h1>
            <p style={{ color: 'var(--muted)' }}>
              Monitor automation execution errors and system events
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              style={{
                backgroundColor: autoRefresh ? 'var(--primary)' : 'var(--surface)',
                color: autoRefresh ? 'white' : 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto Refresh
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80"
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: '1px solid #dc2626',
              }}
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="h-5 w-5" style={{ color: 'var(--muted)' }} />
          <div className="flex gap-2">
            {['all', 'ERROR', 'WARN', 'INFO'].map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className="px-4 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: filter === level ? 'var(--primary)' : 'var(--surface)',
                  color: filter === level ? 'white' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {level === 'all' ? 'All Logs' : level}
              </button>
            ))}
          </div>
          <span className="ml-auto" style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            Showing {logs.length} of {total} logs
          </span>
        </div>

        {/* Logs List */}
        {logs.length === 0 ? (
          <div
            className="p-12 rounded-lg text-center"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <Info className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
            <h3 className="text-xl font-light mb-2" style={{ color: 'var(--text)' }}>
              No logs found
            </h3>
            <p style={{ color: 'var(--muted)' }}>
              {filter === 'all'
                ? 'No logs have been recorded yet. Try running an automation.'
                : `No ${filter} logs found. Try a different filter.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, index) => {
              const colors = getLevelColor(log.level);
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getLevelIcon(log.level)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="font-medium text-sm"
                          style={{ color: colors.text }}
                        >
                          {log.message}
                        </h3>
                        <span
                          className="text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      {log.data && (
                        <pre
                          className="text-xs p-3 rounded overflow-x-auto"
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            color: colors.text,
                            fontFamily: 'monospace',
                          }}
                        >
                          {typeof log.data === 'string'
                            ? log.data
                            : JSON.stringify(log.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
