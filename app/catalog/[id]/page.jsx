'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, Calendar, User, Tag, FileText, Settings, Code, Loader, Clock, CheckCircle, XCircle, AlertCircle, History, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/Button';

export default function CatalogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [automation, setAutomation] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextTaskId, setNextTaskId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [requestBodyWhiteBg, setRequestBodyWhiteBg] = useState(false);

  useEffect(() => {
    fetchAutomation();
    fetchRuns();
    fetchNextTaskId();
  }, [params.id]);

  const fetchAutomation = async () => {
    try {
      const res = await fetch(`/api/automations/${params.id}`);
      const data = await res.json();
      setAutomation(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching automation:', error);
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    try {
      const res = await fetch(`/api/runs?automationId=${params.id}`);
      const data = await res.json();
      setRuns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching runs:', error);
      setRuns([]);
    }
  };

  const fetchNextTaskId = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params = new URLSearchParams();
      if (user.email) params.append('userEmail', user.email);
      if (user.id) params.append('userId', user.id);

      const res = await fetch(`/api/runs/next-id?${params.toString()}`);
      const data = await res.json();
      setNextTaskId(data.nextTaskId);
    } catch (error) {
      console.error('Error fetching next task ID:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" style={{ color: 'var(--success)' }} />;
      case 'failed':
        return <XCircle className="h-4 w-4" style={{ color: '#ef4444' }} />;
      case 'running':
        return <Clock className="h-4 w-4 animate-spin" style={{ color: '#3b82f6' }} />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" style={{ color: '#f59e0b' }} />;
      default:
        return <Clock className="h-4 w-4" style={{ color: 'var(--muted)' }} />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      success: { bg: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', border: 'var(--success)' },
      failed: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '#ef4444' },
      running: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '#3b82f6' },
      pending: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '#f59e0b' },
    };

    const style = styles[status] || { bg: 'var(--surface)', color: 'var(--muted)', border: 'var(--border)' };

    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full"
        style={{
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`
        }}
      >
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDuration = (startedAt, completedAt) => {
    if (!completedAt) return '-';

    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end - start;

    // Handle invalid durations (negative or zero)
    if (durationMs <= 0) return '< 0.1 min';

    // Convert to minutes with 1 decimal place
    const minutes = (durationMs / 1000 / 60).toFixed(1);
    return `${minutes} min`;
  };

  // Pagination logic
  const totalPages = Math.ceil(runs.length / itemsPerPage);
  const indexOfLastRun = currentPage * itemsPerPage;
  const indexOfFirstRun = indexOfLastRun - itemsPerPage;
  const currentRuns = runs.slice(indexOfFirstRun, indexOfLastRun);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader className="h-12 w-12 animate-spin mb-4" style={{ color: 'var(--primary)' }} />
        <p style={{ color: 'var(--muted)' }}>Loading automation...</p>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]" style={{ backgroundColor: 'var(--bg)' }}>
        <p className="text-lg font-medium mb-4" style={{ color: 'var(--text)' }}>Automation not found</p>
        <Button variant="primary" onClick={() => router.push('/catalog')}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/catalog')}
              className="p-2 rounded-lg hover:opacity-80 transition-all"
              style={{ backgroundColor: 'var(--surface)' }}
            >
              <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text)' }} />
            </button>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{automation.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className="px-3 py-1 text-sm font-semibold rounded-full"
                  style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                >
                  {automation.namespace}
                </span>
                <span className="text-sm" style={{ color: 'var(--muted)' }}>
                  {automation.runs || 0} total runs
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            icon={Play}
            onClick={() => router.push(`/catalog/${params.id}/run`)}
          >
            Run Automation
          </Button>
        </div>

        {/* Description and Tags - Only show if there's content */}
        {(automation.description ||
          (automation.tags && JSON.parse(automation.tags).length > 0) ||
          (automation.keywords && JSON.parse(automation.keywords).length > 0)) && (
          <div className="rounded-lg p-6 shadow-sm space-y-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            {automation.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                {automation.description}
              </p>
            )}

            {/* Tags and Keywords */}
            <div className="flex flex-wrap gap-4">
              {automation.tags && JSON.parse(automation.tags).length > 0 && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(automation.tags).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {automation.keywords && JSON.parse(automation.keywords).length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Keywords:</span>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(automation.keywords).map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-1 text-xs rounded"
                        style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information - Only show if there's meaningful data */}
        {(automation.templateId || automation.inventoryId || automation.customBody || automation.createdBy || automation.createdAt) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backend Configuration - Only show if there's AWX data */}
            {(automation.templateId || automation.inventoryId) && (
              <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>AWX Configuration</h2>
                </div>
                <div className="space-y-3">
                  {automation.templateId && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Template ID</p>
                      <code className="block text-sm font-mono px-3 py-2 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {automation.templateId}
                      </code>
                    </div>
                  )}
                  {automation.inventoryId && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Inventory ID</p>
                      <code className="block text-sm font-mono px-3 py-2 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
                        {automation.inventoryId}
                      </code>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Configuration Mode</p>
                    <span
                      className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: automation.customBody ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                        color: automation.customBody ? '#3b82f6' : 'var(--success)',
                        border: `1px solid ${automation.customBody ? '#3b82f6' : 'var(--success)'}`
                      }}
                    >
                      {automation.customBody ? 'JSON Body' : 'Form Builder'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata - Only show if there's metadata */}
            {(automation.createdBy || automation.createdAt) && (
              <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Metadata</h2>
                </div>
                <div className="space-y-3">
                  {automation.createdBy && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Created By</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{automation.createdBy}</p>
                      </div>
                    </div>
                  )}
                  {automation.createdAt && (
                    <div>
                      <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Created On</p>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>
                        {new Date(automation.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Complete Settings Display */}
        {(automation.formSchema || automation.customBody || automation.extraVars) && (
          <div className="space-y-6">
            {/* Form Schema Section */}
            {automation.formSchema && JSON.parse(automation.formSchema).length > 0 && (
              <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Form Schema</h2>
                  <span
                    className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                    style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                  >
                    {JSON.parse(automation.formSchema).length} fields
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Label</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Field Key</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Type</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Required</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {JSON.parse(automation.formSchema).map((field, index) => (
                        <tr
                          key={index}
                          style={{ borderBottom: '1px solid var(--border)' }}
                          className="hover:bg-opacity-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>{field.label}</td>
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--primary)' }}>
                              {field.key}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded"
                              style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                            >
                              {field.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--text)' }}>
                            {field.required ? (
                              <span className="text-red-500 font-semibold">Yes</span>
                            ) : (
                              <span style={{ color: 'var(--muted)' }}>No</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                            {field.defaultValue || field.predefinedValue || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Custom Body Section */}
            {automation.customBody && (
              <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Code className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Custom Request Body (JSON)</h2>
                </div>
                <pre
                  onClick={() => setRequestBodyWhiteBg(!requestBodyWhiteBg)}
                  className="text-xs p-4 rounded-lg overflow-x-auto font-mono cursor-pointer transition-colors"
                  style={{
                    backgroundColor: requestBodyWhiteBg ? '#ffffff' : '#1e1e1e',
                    color: requestBodyWhiteBg ? '#1e1e1e' : '#d4d4d4'
                  }}
                >
                  <code>{JSON.stringify(JSON.parse(automation.customBody), null, 2)}</code>
                </pre>
              </div>
            )}

            {/* Extra Variables Section */}
            {automation.extraVars && automation.extraVars.trim() && (
              <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Extra Variables (AWX)</h2>
                </div>
                <pre
                  className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                  style={{ backgroundColor: '#1e1e1e', color: 'var(--success)' }}
                >
                  <code>{automation.extraVars}</code>
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Execution History - ServiceNow Style Table */}
        <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Execution History</h2>
              <span
                className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
              >
                {runs.length}
              </span>
            </div>
          </div>

          {runs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted)', opacity: 0.5 }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>No executions yet</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Run this automation to see execution history
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '2px solid var(--border)' }}>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Run ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Executed By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Start Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      End Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                      AWX Job ID
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentRuns.map((run, index) => (
                    <tr
                      key={run.id}
                      className="transition-colors hover:bg-opacity-50"
                      style={{
                        borderBottom: index !== currentRuns.length - 1 ? '1px solid var(--border)' : 'none',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code
                          className="text-sm font-mono font-semibold"
                          style={{ color: 'var(--primary)' }}
                        >
                          {run.uniqueId || run.id.substring(0, 8)}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(run.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                          <span className="text-sm" style={{ color: 'var(--text)' }}>
                            {run.executedBy || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: 'var(--text)' }}>
                          {new Date(run.startedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(run.startedAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {run.completedAt ? (
                          <>
                            <div className="text-sm" style={{ color: 'var(--text)' }}>
                              {new Date(run.completedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--muted)' }}>
                              {new Date(run.completedAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--muted)' }}>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                          {formatDuration(run.startedAt, run.completedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {run.awxJobId ? (
                          <code className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                            {run.awxJobId}
                          </code>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--muted)' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {runs.length > itemsPerPage && (
            <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                {/* Showing X-Y of Z */}
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Showing {indexOfFirstRun + 1} - {Math.min(indexOfLastRun, runs.length)} of {runs.length} executions
                </div>

                {/* Pagination Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)'
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage =
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1);

                      if (!showPage && pageNum === 2 && currentPage > 3) {
                        return <span key={pageNum} className="px-2" style={{ color: 'var(--muted)' }}>...</span>;
                      }

                      if (!showPage && pageNum === totalPages - 1 && currentPage < totalPages - 2) {
                        return <span key={pageNum} className="px-2" style={{ color: 'var(--muted)' }}>...</span>;
                      }

                      if (!showPage) {
                        return null;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className="px-3 py-2 rounded-lg transition-all min-w-[40px]"
                          style={{
                            backgroundColor: currentPage === pageNum ? 'var(--primary)' : 'var(--surface)',
                            border: `1px solid ${currentPage === pageNum ? 'var(--primary)' : 'var(--border)'}`,
                            color: currentPage === pageNum ? 'white' : 'var(--text)',
                            fontWeight: currentPage === pageNum ? '600' : '400'
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)'
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
