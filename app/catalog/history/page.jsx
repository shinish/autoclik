'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, CheckCircle, XCircle, Loader, Eye, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button';

export default function CatalogHistoryPage() {
  const router = useRouter();
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, success, failed, running

  useEffect(() => {
    fetchExecutions();
  }, []);

  const fetchExecutions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/catalog/executions');

      if (!res.ok) {
        throw new Error('Failed to fetch executions');
      }

      const data = await res.json();
      setExecutions(data);
    } catch (error) {
      console.error('Error fetching executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader className="h-5 w-5 animate-spin" style={{ color: 'var(--primary)' }} />;
      default:
        return <Clock className="h-5 w-5" style={{ color: 'var(--muted)' }} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return '#00A859';
      case 'failed':
        return '#ef4444';
      case 'running':
        return 'var(--primary)';
      default:
        return 'var(--muted)';
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(parseInt(dateStr));
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredExecutions = executions.filter(exec => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/catalog')}
            className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              Execution History
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              View all catalog execution logs and results
            </p>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          {['all', 'success', 'failed', 'running'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
              style={{
                backgroundColor: filter === status ? 'var(--primary)' : 'var(--surface)',
                color: filter === status ? '#fff' : 'var(--text)',
                border: `1px solid ${filter === status ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Executions Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Status
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Catalog
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Namespace
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                AWX Job ID
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Started
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Duration
              </th>
              <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Executed By
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredExecutions.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No executions found
                  </p>
                </td>
              </tr>
            ) : (
              filteredExecutions.map((execution, idx) => (
                <tr
                  key={execution.id}
                  style={{
                    borderBottom: idx < filteredExecutions.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  className="hover:bg-opacity-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(execution.status)}
                      <span
                        className="text-sm font-medium capitalize"
                        style={{ color: getStatusColor(execution.status) }}
                      >
                        {execution.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {execution.catalogName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
                      {execution.namespaceName}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                      {execution.awxJobId || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {formatDate(execution.startedAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {formatDuration(execution.duration)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      {execution.executedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => router.push(`/catalog/${execution.catalogId}/execute?executionId=${execution.id}`)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{
                        backgroundColor: 'var(--primary)',
                        color: '#fff',
                      }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Logs
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
