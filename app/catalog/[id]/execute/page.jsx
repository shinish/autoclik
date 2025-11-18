'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, ArrowLeft, Terminal, CheckCircle, XCircle, Clock, Loader, AlertCircle, Download } from 'lucide-react';
import Button from '@/components/Button';

export default function CatalogExecutePage() {
  const router = useRouter();
  const params = useParams();
  const catalogId = params.id;

  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [execution, setExecution] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formSchema, setFormSchema] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [pollingInterval, setPollingInterval] = useState(null);
  const [customBody, setCustomBody] = useState('');
  const [showBodyEditor, setShowBodyEditor] = useState(false);
  const [bodyError, setBodyError] = useState('');

  const consoleRef = useRef(null);

  useEffect(() => {
    fetchCatalog();

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [catalogId]);

  // Auto-scroll console to bottom
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/catalog/${catalogId}`);

      if (!res.ok) {
        throw new Error('Failed to fetch catalog');
      }

      const data = await res.json();
      setCatalog(data);

      // Set custom body (if available)
      if (data.customBody) {
        setCustomBody(data.customBody);
      }

      // Parse form schema
      if (data.formSchema) {
        try {
          const schema = JSON.parse(data.formSchema);
          // Ensure schema is an array
          const schemaArray = Array.isArray(schema) ? schema : [];
          setFormSchema(schemaArray);

          // Initialize form values
          const initialValues = {};
          schemaArray.forEach(field => {
            initialValues[field.name] = field.default || '';
          });
          setFormValues(initialValues);
        } catch (e) {
          console.error('Error parsing form schema:', e);
          setFormSchema([]);
        }
      }
    } catch (error) {
      console.error('Error fetching catalog:', error);
      alert('Failed to load catalog');
      router.push('/catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleBodyChange = (value) => {
    setCustomBody(value);
    setBodyError('');

    // Validate JSON
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (e) {
        setBodyError('Invalid JSON format');
      }
    }
  };

  const handleExecute = async (e) => {
    e.preventDefault();

    // Validate body if editing
    if (showBodyEditor && customBody.trim()) {
      try {
        JSON.parse(customBody);
      } catch (e) {
        alert('Invalid JSON in request body. Please fix the syntax.');
        return;
      }
    }

    try {
      setExecuting(true);
      setConsoleOutput('Initializing job execution...\n');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const res = await fetch(`/api/catalog/${catalogId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: formValues,
          customBody: showBodyEditor ? customBody : undefined,
          executedBy: currentUser.email || 'system',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to execute catalog');
      }

      setExecution(data.execution);
      setConsoleOutput(prev => prev + `Job launched successfully!\nAWX Job ID: ${data.awxJob.id}\n\nWaiting for job to start...\n`);

      // Start polling for updates
      startPolling(data.execution.id);
    } catch (error) {
      console.error('Error executing catalog:', error);
      setConsoleOutput(prev => prev + `\nERROR: ${error.message}\n`);
      setExecuting(false);
    }
  };

  const startPolling = (executionId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/catalog/executions/${executionId}`);

        if (res.ok) {
          const data = await res.json();
          setExecution(data);

          // Update console output
          if (data.consoleOutput) {
            setConsoleOutput(data.consoleOutput);
          }

          // Stop polling if execution is complete
          if (data.status === 'success' || data.status === 'failed' || data.status === 'canceled') {
            clearInterval(interval);
            setExecuting(false);

            if (data.status === 'success') {
              setConsoleOutput(prev => prev + '\n\n✓ Job completed successfully!');
            } else if (data.status === 'failed') {
              setConsoleOutput(prev => prev + `\n\n✗ Job failed: ${data.errorMessage || 'Unknown error'}`);
            } else if (data.status === 'canceled') {
              setConsoleOutput(prev => prev + '\n\n⚠ Job was canceled');
            }
          }
        }
      } catch (error) {
        console.error('Error polling execution status:', error);
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
  };

  const handleCancel = async () => {
    if (!execution || !confirm('Are you sure you want to cancel this execution?')) return;

    try {
      const res = await fetch(`/api/catalog/executions/${execution.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setConsoleOutput(prev => prev + '\n\nCanceling job...');
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
      }
    } catch (error) {
      console.error('Error canceling execution:', error);
    }
  };

  const downloadArtifacts = () => {
    if (!execution?.artifacts) return;

    const dataStr = JSON.stringify(JSON.parse(execution.artifacts), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalog-execution-${execution.id}-artifacts.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderFormField = (field) => {
    const commonStyles = {
      border: '1px solid var(--border)',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
    };

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            required={field.required}
            value={formValues[field.name] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
            placeholder={field.placeholder || ''}
            rows={field.rows || 4}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
            style={commonStyles}
          />
        );

      case 'select':
        return (
          <select
            required={field.required}
            value={formValues[field.name] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ ...commonStyles, height: '42px' }}
          >
            <option value="">Select {field.label.toLowerCase()}...</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option.value || option}>
                {option.label || option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formValues[field.name] || false}
              onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.checked })}
              className="rounded focus:ring-2 focus:ring-offset-2"
              style={{ accentColor: 'var(--primary)' }}
            />
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              {field.description || field.label}
            </span>
          </label>
        );

      default: // text, number, email, password, etc.
        return (
          <input
            type={field.type || 'text'}
            required={field.required}
            value={formValues[field.name] || ''}
            onChange={(e) => setFormValues({ ...formValues, [field.name]: e.target.value })}
            placeholder={field.placeholder || ''}
            className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={commonStyles}
          />
        );
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
      case 'canceled':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
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
      case 'canceled':
        return '#f59e0b';
      default:
        return 'var(--muted)';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent)' }}></div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="text-center py-12">
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Catalog not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          icon={ArrowLeft}
          onClick={() => router.push('/catalog')}
        >
          Back to Catalog
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{catalog.name}</h1>
          {catalog.description && (
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              {catalog.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Form */}
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Execution Parameters
          </h2>

          <form onSubmit={handleExecute} className="space-y-4">
            {formSchema.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No parameters required for this catalog item.
              </p>
            ) : (
              formSchema.map((field, idx) => (
                <div key={idx}>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFormField(field)}
                  {field.description && field.type !== 'checkbox' && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                      {field.description}
                    </p>
                  )}
                </div>
              ))
            )}

            {/* Request Body Editor */}
            {customBody && (
              <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Request Body {showBodyEditor && <span className="text-xs" style={{ color: 'var(--muted)' }}>(JSON)</span>}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowBodyEditor(!showBodyEditor)}
                    className="text-xs px-2 py-1 rounded hover:bg-opacity-10"
                    style={{ color: 'var(--primary)', backgroundColor: showBodyEditor ? 'var(--primary)' : 'transparent' }}
                  >
                    {showBodyEditor ? 'Hide Editor' : 'Show Editor'}
                  </button>
                </div>

                {showBodyEditor ? (
                  <div>
                    <textarea
                      value={customBody}
                      onChange={(e) => handleBodyChange(e.target.value)}
                      rows={12}
                      className="w-full rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderColor: bodyError ? '#ef4444' : 'var(--border)',
                        color: 'var(--text)',
                        border: '1px solid',
                      }}
                      placeholder='{"key": "value"}'
                    />
                    {bodyError && (
                      <p className="mt-1 text-xs text-red-500">{bodyError}</p>
                    )}
                    <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      Tip: Use <code className="px-1 rounded" style={{ backgroundColor: 'var(--background)' }}>{'{{form.fieldName}}'}</code> to insert form values
                    </p>
                  </div>
                ) : (
                  <div
                    className="rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto"
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      color: 'var(--muted)',
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    <pre>{customBody}</pre>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                variant="primary"
                icon={executing ? Loader : Play}
                disabled={executing || (showBodyEditor && bodyError)}
                className="flex-1"
              >
                {executing ? 'Executing...' : 'Execute'}
              </Button>
              {execution && execution.status === 'running' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>

          {/* Execution Status */}
          {execution && (
            <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
              <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Execution Status
              </h3>
              <div className="flex items-center gap-3">
                {getStatusIcon(execution.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize" style={{ color: getStatusColor(execution.status) }}>
                    {execution.status}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Started: {new Date(execution.startedAt).toLocaleString()}
                  </p>
                  {execution.completedAt && (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Completed: {new Date(execution.completedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {execution.artifacts && execution.status === 'success' && (
                  <Button
                    variant="outline"
                    icon={Download}
                    onClick={downloadArtifacts}
                    size="sm"
                  >
                    Artifacts
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Console Output */}
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="h-5 w-5" style={{ color: 'var(--text)' }} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Console Output
            </h2>
          </div>

          <div
            ref={consoleRef}
            className="rounded-lg p-4 font-mono text-xs overflow-y-auto"
            style={{
              backgroundColor: '#1a1a1a',
              color: '#00ff00',
              height: '500px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}
          >
            {consoleOutput || 'No output yet. Execute the catalog to see results.'}
          </div>
        </div>
      </div>

      {/* Recent Executions */}
      {catalog.executions && catalog.executions.length > 0 && (
        <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Recent Executions
          </h2>
          <div className="space-y-3">
            {catalog.executions.slice(0, 5).map((exec) => (
              <div
                key={exec.id}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(exec.status)}
                  <div>
                    <p className="text-sm font-medium capitalize" style={{ color: getStatusColor(exec.status) }}>
                      {exec.status}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {new Date(exec.startedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  by {exec.executedBy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
