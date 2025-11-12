'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, ArrowLeft, Loader, CheckCircle2, XCircle, Copy, Terminal, FileJson, Settings2, Sparkles, Tag, User, ChevronDown, ChevronUp, Info, AlertCircle, Clock, Zap, Activity } from 'lucide-react';
import Button from '@/components/Button';

export default function RunAutomationPage() {
  const router = useRouter();
  const params = useParams();
  const [automation, setAutomation] = useState(null);
  const [formData, setFormData] = useState({});
  const [customBodyJson, setCustomBodyJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [reservedTaskId, setReservedTaskId] = useState(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    formSchema: false,
    customBodyTemplate: false,
    requestBody: false,
    extraVars: false,
    executionResult: false,
    artifacts: false,
    curlCommand: false,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    fetchAutomation();
    reserveTaskId();
  }, [params.id]);

  const fetchAutomation = async () => {
    try {
      const res = await fetch(`/api/automations/${params.id}`);
      const data = await res.json();
      setAutomation(data);

      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Pre-populate form with default values and predefined values
      const schema = parseSafeSchema(data.formSchema);
      const initialFormData = {};
      schema.forEach(field => {
        // First check for predefined values (like {{current_user.username}})
        if (field.predefinedValue) {
          let value = field.predefinedValue;

          // Replace {{current_user.username}} with actual username
          if (value.includes('{{current_user.username}}')) {
            value = value.replace('{{current_user.username}}', user.name || user.email || '');
          }
          // Replace {{current_user.email}} with actual email
          if (value.includes('{{current_user.email}}')) {
            value = value.replace('{{current_user.email}}', user.email || '');
          }
          // Replace {{current_user.id}} with actual id
          if (value.includes('{{current_user.id}}')) {
            value = value.replace('{{current_user.id}}', user.id || '');
          }

          initialFormData[field.key] = value;
        }
        // Then check for default values
        else if (field.defaultValue !== undefined && field.defaultValue !== '') {
          initialFormData[field.key] = field.defaultValue;
        }
      });
      setFormData(initialFormData);

      // Initialize customBodyJson if automation uses custom body mode
      if (data.customBody) {
        try {
          // Pretty-print the JSON for editing
          const parsed = JSON.parse(data.customBody);
          setCustomBodyJson(JSON.stringify(parsed, null, 2));

          // Extract template variables like {{form.fieldname}}
          const templateVarRegex = /\{\{form\.(\w+)\}\}/g;
          const matches = data.customBody.matchAll(templateVarRegex);
          const variables = new Set();
          for (const match of matches) {
            variables.add(match[1]);
          }

          // Convert to array and create field definitions
          const variableFields = Array.from(variables).map(varName => ({
            key: varName,
            label: varName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
            type: 'text',
            required: true
          }));

          setTemplateVariables(variableFields);

          // If there are template variables, default to form mode, otherwise JSON mode
          setShowJsonEditor(variableFields.length === 0);
        } catch (e) {
          setCustomBodyJson(data.customBody);
          setShowJsonEditor(true);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching automation:', error);
      setLoading(false);
    }
  };

  const parseSafeSchema = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const reserveTaskId = async () => {
    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const res = await fetch('/api/runs/reserve-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user }),
      });

      const data = await res.json();
      if (res.ok && data.taskId) {
        setReservedTaskId(data.taskId);
      } else {
        console.error('Failed to reserve Task ID:', data.error);
      }
    } catch (error) {
      console.error('Error reserving Task ID:', error);
    }
  };

  const generateRequestBody = () => {
    // Generate the JSON body that will be sent to AWX
    if (automation?.customBody) {
      // For JSON mode, use the template with variables replaced
      try {
        const template = JSON.parse(automation.customBody);
        // Simple variable replacement for preview
        const preview = JSON.stringify(template, null, 2).replace(
          /\{\{form\.(\w+)\}\}/g,
          (match, key) => {
            const value = formData[key];
            return value !== undefined ? JSON.stringify(value) : match;
          }
        );
        return JSON.parse(preview);
      } catch (e) {
        return {};
      }
    } else {
      // For form mode, generate from form data
      const body = {};
      if (automation?.inventoryId) {
        body.inventory = automation.inventoryId;
      }
      if (Object.keys(formData).length > 0) {
        body.extra_vars = { ...formData };
      }
      return body;
    }
  };

  const handleJsonChange = (e) => {
    const value = e.target.value;
    setCustomBodyJson(value);

    // Validate JSON syntax
    if (value.trim()) {
      try {
        JSON.parse(value);
        setJsonError('');
      } catch (error) {
        setJsonError(error.message);
      }
    } else {
      setJsonError('');
    }
  };

  const handleAdvancedToggle = () => {
    if (!showAdvancedMode) {
      // Switching to advanced mode - generate JSON from current form data
      const body = generateRequestBody();
      setCustomBodyJson(JSON.stringify(body, null, 2));
    }
    setShowAdvancedMode(!showAdvancedMode);
  };

  const handleRun = async () => {
    // Determine which mode we're in
    const isUsingJsonEditor = showAdvancedMode || showJsonEditor || (automation?.customBody && templateVariables.length === 0);

    // Validate JSON before running if using JSON editor mode
    if (isUsingJsonEditor && customBodyJson.trim()) {
      try {
        JSON.parse(customBodyJson);
      } catch (error) {
        setJsonError(`Invalid JSON: ${error.message}`);
        return;
      }
    }

    // Validate required fields if in form mode with template variables
    if (automation?.customBody && templateVariables.length > 0 && !showJsonEditor) {
      const missingFields = templateVariables
        .filter(v => v.required && !formData[v.key])
        .map(v => v.label);

      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
        return;
      }
    }

    setRunning(true);
    setResult(null);

    try {
      // Get current user from localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Prepare request payload
      let requestPayload = {
        user: user,
        reservedTaskId: reservedTaskId // Pass the pre-reserved Task ID
      };

      // If using JSON editor mode, send the edited JSON as customBodyOverride
      if (isUsingJsonEditor && customBodyJson.trim()) {
        requestPayload.customBodyOverride = customBodyJson;
        requestPayload.parameters = {}; // Empty parameters for JSON mode
      }
      // If using form mode with template variables, replace variables in template
      else if (automation?.customBody && templateVariables.length > 0) {
        let resolvedJson = automation.customBody;

        // Replace each {{form.variable}} with its value
        templateVariables.forEach(variable => {
          const value = formData[variable.key] || '';
          const regex = new RegExp(`"\\{\\{form\\.${variable.key}\\}\\}"`, 'g');
          // Try to parse as JSON value, if it fails use as string
          let jsonValue;
          try {
            jsonValue = JSON.parse(value);
            resolvedJson = resolvedJson.replace(regex, JSON.stringify(jsonValue));
          } catch (e) {
            // If not valid JSON, treat as string
            resolvedJson = resolvedJson.replace(regex, JSON.stringify(value));
          }
        });

        requestPayload.customBodyOverride = resolvedJson;
        requestPayload.parameters = formData; // Also send parameters for tracking
      }
      // Regular form mode (no custom body)
      else {
        requestPayload.parameters = formData;
      }

      const res = await fetch(`/api/automations/${params.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const data = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          message: data.message || 'Automation started successfully',
          data: data,
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to run automation',
          data: data,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error running automation',
        data: error,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Parse formSchema using useMemo
  const formSchema = useMemo(() => {
    if (!automation || !automation.formSchema) {
      return [];
    }

    try {
      if (Array.isArray(automation.formSchema)) {
        return automation.formSchema;
      }
      const parsed = JSON.parse(automation.formSchema);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [automation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]" style={{ backgroundColor: 'var(--bg)' }}>
        <Loader className="h-12 w-12 animate-spin mb-4" style={{ color: '#4C12A1' }} />
        <p style={{ color: 'var(--muted)' }}>Loading automation...</p>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]" style={{ backgroundColor: 'var(--bg)' }}>
        <XCircle className="h-16 w-16 mb-4" style={{ color: 'var(--muted)' }} />
        <p className="text-lg font-light mb-4" style={{ color: 'var(--text)' }}>Automation not found</p>
        <Button variant="primary" onClick={() => router.push('/catalog')}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto py-8 px-6 space-y-6">
        {/* Unified Header Card */}
        <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          {/* Top Section - Back Button, Title, and Metadata */}
          <div className="p-6 pb-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push('/catalog')}
                className="p-2 rounded-lg hover:opacity-80 transition-all mt-1"
                style={{ backgroundColor: 'var(--bg)' }}
              >
                <ArrowLeft className="h-5 w-5" style={{ color: 'var(--text)' }} />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-7 w-7" style={{ color: '#4C12A1' }} />
                  <h1 className="text-3xl font-light" style={{ color: 'var(--text)' }}>
                    {automation.name}
                  </h1>
                </div>
                <p className="text-base leading-relaxed mb-3" style={{ color: 'var(--muted)' }}>
                  {automation.description}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="px-3 py-1 text-xs font-normal rounded-full"
                    style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: '#4C12A1' }}
                  >
                    {automation.namespace}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>
                    {automation.runs || 0} runs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section - Task ID and User Info */}
          {reservedTaskId && (
            <div className="px-6 pb-6 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-light mb-1" style={{ color: 'var(--muted)' }}>
                      Task ID
                    </span>
                    <code className="text-xl font-light font-mono" style={{ color: '#4C12A1' }}>
                      {reservedTaskId}
                    </code>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)' }}>
                    <User className="h-5 w-5" style={{ color: '#4C12A1' }} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-light mb-0.5" style={{ color: 'var(--muted)' }}>
                      Executing as
                    </p>
                    <p className="text-base font-normal" style={{ color: '#4C12A1' }}>
                      {JSON.parse(localStorage.getItem('user') || '{}').name ||
                       JSON.parse(localStorage.getItem('user') || '{}').email ||
                       'Guest'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Parameters Form OR JSON Editor */}
        <div className="rounded-lg p-6 shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" style={{ color: '#4C12A1' }} />
              <h2 className="text-xl font-light" style={{ color: 'var(--text)' }}>Configuration</h2>
              {(automation?.customBody && (showJsonEditor || templateVariables.length === 0)) && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                >
                  JSON Mode
                </span>
              )}
              {automation?.customBody && templateVariables.length > 0 && !showJsonEditor && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: '#4C12A1' }}
                >
                  Form Mode
                </span>
              )}
              {showAdvancedMode && (
                <span
                  className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}
                >
                  Advanced Mode
                </span>
              )}
            </div>

            {/* Advanced Mode Toggle (only for form-based automations) */}
            {!automation?.customBody && formSchema.length > 0 && (
              <button
                onClick={handleAdvancedToggle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-sm font-normal hover:opacity-90"
                style={{
                  backgroundColor: showAdvancedMode ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg)',
                  border: showAdvancedMode ? '1px solid #3b82f6' : '1px solid var(--border)',
                  color: showAdvancedMode ? '#3b82f6' : 'var(--text)'
                }}
              >
                <FileJson className="h-4 w-4" />
                {showAdvancedMode ? 'Switch to Form View' : 'Advanced Mode (JSON)'}
              </button>
            )}
          </div>

          {/* Toggle button for JSON-based automations with template variables */}
          {automation?.customBody && templateVariables.length > 0 && (
            <div className="flex items-center justify-center mb-4">
              <button
                onClick={() => setShowJsonEditor(!showJsonEditor)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium hover:opacity-90"
                style={{
                  backgroundColor: showJsonEditor ? 'rgba(59, 130, 246, 0.1)' : 'rgba(76, 18, 161, 0.1)',
                  border: showJsonEditor ? '1px solid #3b82f6' : '1px solid #4C12A1',
                  color: showJsonEditor ? '#3b82f6' : '#4C12A1'
                }}
              >
                <FileJson className="h-4 w-4" />
                {showJsonEditor ? 'Switch to Form Mode' : 'Switch to JSON Editor'}
              </button>
            </div>
          )}

          {/* Show JSON Editor when: customBody exists AND (no template vars OR json editor mode selected OR advanced mode) */}
          {automation?.customBody && (showJsonEditor || showAdvancedMode || templateVariables.length === 0) ? (
            // JSON Editor Mode
            <div className="space-y-4">
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  <strong>{showAdvancedMode ? 'Advanced Mode:' : 'Edit JSON Body:'}</strong> {showAdvancedMode
                    ? 'The JSON below has been generated from your form data. You can modify it before execution.'
                    : templateVariables.length > 0
                      ? 'The request body below shows the configured template. You can modify any values (including replacing {{form.fieldname}} placeholders) before running the automation.'
                      : 'Edit the JSON request body below. The request will be sent to AWX exactly as specified.'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-normal mb-2" style={{ color: 'var(--text)' }}>
                  Request Body (JSON)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={customBodyJson}
                  onChange={handleJsonChange}
                  rows={15}
                  className="w-full rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    border: jsonError ? '2px solid #ef4444' : '1px solid var(--border)',
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    color: 'var(--text)',
                    focusRing: '#4C12A1'
                  }}
                  placeholder='{\n  "instance_groups": [298],\n  "extra_vars": {\n    "key": "value"\n  }\n}'
                />
                {jsonError && (
                  <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {jsonError}
                  </p>
                )}
                <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  {showAdvancedMode
                    ? 'Edit the JSON configuration above. You can switch back to Form View anytime using the toggle button.'
                    : templateVariables.length > 0
                      ? 'Edit the JSON configuration above. You can switch to Form Mode using the toggle button to fill in template variables.'
                      : 'Edit the JSON configuration above. The request will be sent to AWX exactly as specified.'}
                </p>
              </div>
            </div>
          ) : automation?.customBody && templateVariables.length > 0 && !showJsonEditor ? (
            // Form Mode for template variables
            <div className="space-y-4">
              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', border: '1px solid rgba(76, 18, 161, 0.2)' }}>
                <p className="text-sm" style={{ color: 'var(--text)' }}>
                  <strong>Fill in Parameters:</strong> Provide values for the following parameters. These will be used to populate the JSON request body.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {templateVariables.map((variable) => (
                  <div key={variable.key}>
                    <label className="block text-sm font-normal mb-2" style={{ color: 'var(--text)' }}>
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <input
                      type={variable.type}
                      name={variable.key}
                      value={formData[variable.key] || ''}
                      onChange={handleInputChange}
                      required={variable.required}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                      }}
                      placeholder={`Enter ${variable.label.toLowerCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-lg p-3" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  <strong>Note:</strong> You can switch to JSON Editor mode if you need more control over the request body structure.
                </p>
              </div>
            </div>
          ) : formSchema.length === 0 ? (
            <div className="text-center py-8 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
              <p style={{ color: 'var(--muted)' }}>No parameters required for this automation</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {formSchema.map((field) => (
                <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-sm font-normal mb-2" style={{ color: 'var(--text)' }}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      name={field.key}
                      value={formData[field.key] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || field.defaultValue || ''}
                      required={field.required}
                      disabled={field.disabled || false}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: field.disabled ? 'var(--bg)' : 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  )}

                  {field.type === 'password' && (
                    <input
                      type="password"
                      name={field.key}
                      value={formData[field.key] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || field.defaultValue || ''}
                      required={field.required}
                      disabled={field.disabled || false}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: field.disabled ? 'var(--bg)' : 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      name={field.key}
                      value={formData[field.key] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || field.defaultValue || ''}
                      required={field.required}
                      disabled={field.disabled || false}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: field.disabled ? 'var(--bg)' : 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  )}

                  {field.type === 'select' && (
                    <select
                      name={field.key}
                      value={formData[field.key] || ''}
                      onChange={handleInputChange}
                      required={field.required}
                      disabled={field.disabled || false}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all appearance-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: field.disabled ? 'var(--bg)' : 'var(--surface)',
                        color: 'var(--text)',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.75rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Select an option...</option>
                      {field.options?.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      name={field.key}
                      value={formData[field.key] || ''}
                      onChange={handleInputChange}
                      placeholder={field.placeholder || field.defaultValue || ''}
                      required={field.required}
                      disabled={field.disabled || false}
                      rows={4}
                      className="w-full rounded-lg px-4 py-3 text-sm transition-all resize-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: field.disabled ? 'var(--bg)' : 'var(--surface)',
                        color: 'var(--text)',
                      }}
                    />
                  )}

                  {field.helpText && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-6 z-10">
          <Button
            variant="primary"
            icon={running ? Loader : Play}
            onClick={handleRun}
            disabled={running || (showJsonEditor && jsonError)}
            className="flex-1 shadow-lg"
          >
            {running ? (
              <span className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Executing Automation...
              </span>
            ) : jsonError && showJsonEditor ? (
              'Fix JSON Errors to Run'
            ) : (
              'Run Automation'
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push('/catalog')}
            disabled={running}
          >
            Cancel
          </Button>
        </div>

        {/* Result Section */}
        {result && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Status Card */}
            <div
              className="rounded-lg p-6 shadow-md"
              style={{
                border: result.success ? '1px solid #22c55e' : '1px solid #ef4444',
                backgroundColor: result.success ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'
              }}
            >
              <div className="flex items-start gap-4">
                {result.success ? (
                  <CheckCircle2 className="h-8 w-8 flex-shrink-0" style={{ color: '#22c55e' }} />
                ) : (
                  <XCircle className="h-8 w-8 flex-shrink-0" style={{ color: '#ef4444' }} />
                )}
                <div className="flex-1">
                  <h3
                    className="text-xl font-light mb-2"
                    style={{ color: result.success ? '#15803d' : '#b91c1c' }}
                  >
                    {result.success ? 'Execution Successful' : 'Execution Failed'}
                  </h3>
                  <p
                    className="text-sm mb-4"
                    style={{ color: result.success ? '#16a34a' : '#dc2626' }}
                  >
                    {result.message}
                  </p>

                  {result.data?.uniqueId && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg"
                      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <span className="text-sm font-normal" style={{ color: 'var(--text)' }}>
                        Run ID:
                      </span>
                      <code className="text-sm font-mono" style={{ color: '#4C12A1' }}>
                        {result.data.uniqueId}
                      </code>
                      <button
                        onClick={() => handleCopy(result.data.uniqueId)}
                        className="p-1 rounded hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--muted)' }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {result.data?.awxJobId && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      AWX Job ID: {result.data.awxJobId}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Show More Information Button */}
            {result.success && (result.data?.extraVars || result.data?.curlCommand || result.data?.requestBody) && (
              <button
                onClick={() => setShowMoreInfo(!showMoreInfo)}
                className="w-full rounded-lg p-4 shadow-sm transition-all hover:opacity-90 flex items-center justify-between"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5" style={{ color: '#4C12A1' }} />
                  <span className="text-base font-normal" style={{ color: 'var(--text)' }}>
                    {showMoreInfo ? 'Hide' : 'Show'} More Information
                  </span>
                </div>
                {showMoreInfo ? (
                  <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                ) : (
                  <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                )}
              </button>
            )}

            {/* Quick Actions */}
            {result.success && result.data?.uniqueId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/activity')}
                  className="w-full rounded-lg p-4 shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <Activity className="h-5 w-5" style={{ color: '#4C12A1' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    View in Execution History
                  </span>
                </button>
                <button
                  onClick={() => router.push(`/catalog/${params.id}`)}
                  className="w-full rounded-lg p-4 shadow-sm transition-all hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <Info className="h-5 w-5" style={{ color: '#4C12A1' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    View Automation Details
                  </span>
                </button>
              </div>
            )}

            {/* More Information Details */}
            {showMoreInfo && result.success && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* Form Schema Used */}
                {formSchema && formSchema.length > 0 && !automation?.customBody && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('formSchema')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Form Schema Used</h3>
                      </div>
                      {expandedSections.formSchema ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.formSchema && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <div className="space-y-3">
                          {formSchema.map((field, index) => (
                            <div key={index} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                      {field.label}
                                    </span>
                                    {field.required && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                        Required
                                      </span>
                                    )}
                                  </div>
                                  <code className="text-xs" style={{ color: 'var(--muted)' }}>
                                    {field.key}
                                  </code>
                                </div>
                                <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: '#4C12A1' }}>
                                  {field.type}
                                </span>
                              </div>
                              {field.helpText && (
                                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                                  {field.helpText}
                                </p>
                              )}
                              {formData[field.key] && (
                                <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Value used: </span>
                                  <code className="text-xs" style={{ color: 'var(--text)' }}>
                                    {field.type === 'password' ? '••••••••' : formData[field.key]}
                                  </code>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          The form fields that were configured for this automation.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom Request Body Template */}
                {automation?.customBody && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('customBodyTemplate')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Custom Request Body Template</h3>
                      </div>
                      {expandedSections.customBodyTemplate ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.customBodyTemplate && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        >
                          <code>{(() => {
                            try {
                              return JSON.stringify(JSON.parse(automation.customBody), null, 2);
                            } catch (e) {
                              return automation.customBody;
                            }
                          })()}</code>
                        </pre>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          The original custom request body template configured for this automation.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Request Body */}
                {result.data?.requestBody && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('requestBody')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Actual Request Body Sent</h3>
                      </div>
                      {expandedSections.requestBody ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.requestBody && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        >
                          <code>{JSON.stringify(result.data.requestBody, null, 2)}</code>
                        </pre>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          The complete request body that was actually sent to AWX (with all variables resolved).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Extra Variables */}
                {result.data?.extraVars && Object.keys(result.data.extraVars).length > 0 && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('extraVars')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Extra Variables (AWX)</h3>
                      </div>
                      {expandedSections.extraVars ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.extraVars && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        >
                          <code>{JSON.stringify(result.data.extraVars, null, 2)}</code>
                        </pre>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          The transformed variables sent to AWX.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* AWX Job Response */}
                {result.data?.status && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('executionResult')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <Zap className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Execution Result</h3>
                      </div>
                      {expandedSections.executionResult ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.executionResult && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <div className="space-y-3">
                          {/* Status Badge */}
                          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                            <span className="text-sm font-normal min-w-[140px]" style={{ color: 'var(--text)' }}>
                              Status:
                            </span>
                            <span
                              className="px-3 py-1 text-xs font-normal rounded-full"
                              style={{
                                backgroundColor: result.data.status === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: result.data.status === 'success' ? '#22c55e' : '#ef4444'
                              }}
                            >
                              {result.data.status.toUpperCase()}
                            </span>
                          </div>

                          {/* AWX Job ID */}
                          {result.data.awxJobId && (
                            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                              <span className="text-sm font-normal min-w-[140px]" style={{ color: 'var(--text)' }}>
                                AWX Job ID:
                              </span>
                              <code className="text-sm font-mono" style={{ color: 'var(--muted)' }}>
                                {result.data.awxJobId}
                              </code>
                            </div>
                          )}

                          {/* Run ID */}
                          {result.data.uniqueId && (
                            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                              <span className="text-sm font-normal min-w-[140px]" style={{ color: 'var(--text)' }}>
                                Run ID:
                              </span>
                              <code className="text-sm font-mono" style={{ color: '#4C12A1' }}>
                                {result.data.uniqueId}
                              </code>
                            </div>
                          )}
                        </div>

                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          Execution validation and status from AWX.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Artifacts */}
                {result.data?.artifacts && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('artifacts')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <FileJson className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>Job Artifacts</h3>
                      </div>
                      {expandedSections.artifacts ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.artifacts && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        >
                          <code>{JSON.stringify(result.data.artifacts, null, 2)}</code>
                        </pre>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          Output artifacts and data returned from the AWX job execution.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Curl Command */}
                {result.data?.curlCommand && (
                  <div className="rounded-lg shadow-sm" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => toggleSection('curlCommand')}
                      className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5" style={{ color: '#4C12A1' }} />
                        <h3 className="text-lg font-light" style={{ color: 'var(--text)' }}>cURL Command</h3>
                      </div>
                      {expandedSections.curlCommand ? (
                        <ChevronUp className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      ) : (
                        <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                      )}
                    </button>
                    {expandedSections.curlCommand && (
                      <div className="px-6 pb-6 animate-in fade-in duration-200">
                        <div className="flex items-center justify-end mb-3">
                          <button
                            onClick={() => handleCopy(result.data.curlCommand)}
                            className="px-4 py-2 text-xs font-normal rounded-lg transition-all hover:opacity-90 flex items-center gap-2"
                            style={{ backgroundColor: '#4C12A1', color: 'white' }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </button>
                        </div>
                        <pre
                          className="text-xs p-4 rounded-lg overflow-x-auto font-mono"
                          style={{ backgroundColor: '#1e1e1e', color: '#22c55e' }}
                        >
                          <code>{result.data.curlCommand}</code>
                        </pre>
                        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
                          The equivalent cURL command that was executed to trigger the automation in AWX.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
