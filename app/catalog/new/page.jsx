'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Moon, Type, Lock, Hash, AlignLeft, Circle, CheckSquare, ChevronDown, ToggleLeft, Calendar, Upload, FileJson, Plus } from 'lucide-react';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

export default function NewAutomationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);
  const [namespaces, setNamespaces] = useState([]);
  const [instanceGroups, setInstanceGroups] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    namespace: '',
    description: '',
    keywords: [],
    tags: [],
    inputMode: 'form', // 'form' or 'json'
    formSchema: [],
    customBody: '',
    templateId: '',
    inventoryId: '',
    instanceGroupId: '',
    pinned: false,
    featured: false,
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});
  const [nameSuggestions, setNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedTags, setSavedTags] = useState([]);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(null);

  // Dictionary of common automation name patterns
  const nameDictionary = [
    // Connectivity & Network Testing
    'Test Connectivity',
    'Ping Test',
    'Port Scan',
    'Network Discovery',
    'Bandwidth Test',
    'DNS Lookup',
    'Traceroute',
    'Speed Test',
    'Latency Check',
    'Connection Test',
    'Network Diagnostics',

    // Infrastructure Provisioning
    'Provision VM',
    'Provision Server',
    'Create Virtual Machine',
    'Deploy Infrastructure',
    'Provision Cloud Resources',
    'Setup Environment',
    'Initialize Cluster',
    'Provision Database',
    'Create Storage Volume',
    'Allocate Resources',

    // Application Deployment
    'Deploy Application',
    'Deploy Microservice',
    'Deploy Web Application',
    'Deploy API',
    'Release Software',
    'Rollout Update',
    'Deploy Build',
    'Publish Release',
    'Deploy Container',
    'Deploy to Production',

    // Backup & Recovery
    'Backup Database',
    'Backup Files',
    'Backup Configuration',
    'Create Snapshot',
    'Snapshot Creation',
    'Restore Backup',
    'Disaster Recovery',
    'Data Backup',
    'System Backup',
    'Incremental Backup',

    // Security & Compliance
    'Security Scan',
    'Vulnerability Assessment',
    'Compliance Check',
    'Security Audit',
    'Penetration Test',
    'Certificate Renewal',
    'Rotate Keys',
    'Rotate Credentials',
    'Update Certificates',
    'Access Review',
    'Permission Audit',
    'Firewall Update',
    'Security Patch',

    // Monitoring & Health Checks
    'Health Check',
    'Monitor Resources',
    'System Monitoring',
    'Performance Check',
    'Service Health Check',
    'Uptime Monitor',
    'Resource Monitor',
    'Availability Check',
    'Status Check',
    'Alert Check',

    // Maintenance & Updates
    'Server Maintenance',
    'System Maintenance',
    'Patch System',
    'Update Software',
    'Update Configuration',
    'Upgrade System',
    'Apply Patches',
    'Install Updates',
    'System Update',
    'Package Update',

    // User Management
    'User Onboarding',
    'User Offboarding',
    'Create User Account',
    'Disable User',
    'Reset Password',
    'Provision User',
    'Grant Access',
    'Revoke Access',
    'User Sync',
    'Account Setup',

    // Database Operations
    'Database Migration',
    'Database Backup',
    'Database Cleanup',
    'Optimize Database',
    'Database Replication',
    'Run SQL Script',
    'Database Export',
    'Database Import',
    'Schema Update',
    'Index Optimization',

    // File & Data Operations
    'File Sync',
    'Data Export',
    'Data Import',
    'File Transfer',
    'Data Migration',
    'File Cleanup',
    'Archive Files',
    'Archive Logs',
    'Log Cleanup',
    'Compress Files',

    // Service Management
    'Restart Service',
    'Stop Service',
    'Start Service',
    'Service Restart',
    'Reload Configuration',
    'Service Health Check',
    'Process Restart',
    'Application Restart',
    'Graceful Restart',
    'Force Restart',

    // Cloud Operations
    'Scale Infrastructure',
    'Auto Scale',
    'Scale Up',
    'Scale Down',
    'Resize Instance',
    'Change Instance Type',
    'Manage Cloud Resources',
    'Cloud Backup',
    'Cloud Migration',
    'Multi-Cloud Sync',

    // Container & Kubernetes
    'Build Docker Image',
    'Deploy Container',
    'Container Restart',
    'Pod Restart',
    'Scale Pods',
    'Update Deployment',
    'Rollback Deployment',
    'Container Cleanup',
    'Image Pull',
    'Registry Push',

    // CI/CD Operations
    'Clone Repository',
    'Build Application',
    'Run Tests',
    'Code Deploy',
    'Run Pipeline',
    'Trigger Build',
    'Deploy Pipeline',
    'Release Management',
    'Build and Deploy',
    'Continuous Integration',

    // Network Configuration
    'Network Configuration',
    'Configure Firewall',
    'Update DNS Records',
    'Configure VPN',
    'Setup Load Balancer',
    'Load Balancer Setup',
    'Configure Routes',
    'Network Setup',
    'VLAN Configuration',
    'Subnet Configuration',

    // Reporting & Notifications
    'Generate Report',
    'Send Notification',
    'Send Email',
    'Send Alert',
    'Create Report',
    'Daily Report',
    'Weekly Report',
    'Audit Report',
    'Status Report',
    'Performance Report',

    // Resource Cleanup
    'Cleanup Resources',
    'Delete Old Files',
    'Purge Logs',
    'Remove Snapshots',
    'Clean Temp Files',
    'Resource Cleanup',
    'Disk Cleanup',
    'Cache Cleanup',
    'Remove Unused',
    'Garbage Collection',

    // Configuration Management
    'Update Configuration',
    'Deploy Config',
    'Configuration Sync',
    'Template Update',
    'Config Backup',
    'Rollback Config',
    'Validate Config',
    'Config Audit',
    'Settings Update',
    'Environment Config',
  ];

  useEffect(() => {
    fetchNamespaces();
    fetchSavedTags();
    fetchInstanceGroups();
  }, []);

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/namespaces');
      const data = await res.json();
      setNamespaces(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, namespace: data[0].name }));
      }
    } catch (error) {
      console.error('Error fetching namespaces:', error);
    }
  };

  const fetchSavedTags = async () => {
    try {
      const res = await fetch('/api/tags');
      const data = await res.json();
      setSavedTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const fetchInstanceGroups = async () => {
    try {
      const res = await fetch('/api/instance-groups');
      const data = await res.json();
      setInstanceGroups(data);
      // Set default instance group if available
      if (data.length > 0) {
        const defaultGroup = data.find(g => g.name === 'default') || data[0];
        setFormData((prev) => ({ ...prev, instanceGroupId: defaultGroup.id }));
      }
    } catch (error) {
      console.error('Error fetching instance groups:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;

    // Convert to sentence case (first letter uppercase, rest lowercase)
    const sentenceCase = value.length > 0
      ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      : value;

    setFormData((prev) => ({ ...prev, name: sentenceCase }));

    // Filter suggestions based on input
    if (value.length > 0) {
      const filtered = nameDictionary.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setNameSuggestions(filtered.slice(0, 5)); // Show max 5 suggestions
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion) => {
    setFormData((prev) => ({ ...prev, name: suggestion }));
    setShowSuggestions(false);
  };

  const addKeyword = (keyword) => {
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keyword],
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== keyword),
    }));
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      // Validate Step 1 mandatory fields
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
      if (!formData.namespace) {
        newErrors.namespace = 'Namespace is required';
      }
    }

    if (currentStep === 2) {
      if (formData.inputMode === 'json') {
        // Validate JSON body
        if (!formData.customBody || !formData.customBody.trim()) {
          newErrors.customBody = 'Custom request body is required';
          setToast({
            message: 'Please provide a custom request body in JSON format.',
            type: 'error'
          });
        } else {
          // Validate JSON syntax
          try {
            JSON.parse(formData.customBody);
          } catch (e) {
            newErrors.customBody = 'Invalid JSON syntax';
            setToast({
              message: `Invalid JSON syntax: ${e.message}`,
              type: 'error'
            });
          }
        }
      } else {
        // Validate form schema (existing validation)
        const fieldsWithoutLabel = formData.formSchema.filter(field => !field.label || !field.label.trim());
        const fieldsWithoutKey = formData.formSchema.filter(field => !field.key || !field.key.trim());

        if (fieldsWithoutLabel.length > 0) {
          newErrors.formSchema = 'All form fields must have a Label';
          setToast({
            message: 'All form fields must have a Label. Please check your form fields.',
            type: 'error'
          });
        } else if (fieldsWithoutKey.length > 0) {
          newErrors.formSchema = 'All form fields must have a Field Key';
          setToast({
            message: 'All form fields must have a Field Key. Please check your form fields.',
            type: 'error'
          });
        } else {
          // Validate no duplicate field keys in form schema
          const fieldKeys = formData.formSchema.map(field => field.key).filter(key => key && key.trim());
          const duplicateKeys = fieldKeys.filter((key, index) => fieldKeys.indexOf(key) !== index);

          if (duplicateKeys.length > 0) {
            newErrors.formSchema = `Duplicate field keys found: ${[...new Set(duplicateKeys)].join(', ')}`;
            setToast({
              message: `Duplicate field keys found: ${[...new Set(duplicateKeys)].join(', ')}. Please ensure all field keys are unique.`,
              type: 'error'
            });
          }
        }
      }
    }

    if (currentStep === 3) {
      // Validate Step 3 mandatory fields
      if (!formData.templateId || !formData.templateId.trim()) {
        newErrors.templateId = 'Template ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) {
      return; // Don't proceed if validation fails
    }

    if (step < 4) {
      setStep(step + 1);
      setErrors({}); // Clear errors when moving to next step
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({}); // Clear errors when going back
    }
  };

  const handleCreate = async () => {
    // Validate step 1 fields before creating
    if (!validateStep(1)) {
      setStep(1); // Go back to step 1 if validation fails
      return;
    }

    // Validate step 2 for duplicate field keys
    if (!validateStep(2)) {
      setStep(2); // Go back to step 2 if validation fails
      return;
    }

    // Validate step 3 for template ID
    if (!validateStep(3)) {
      setStep(3); // Go back to step 3 if validation fails
      return;
    }

    // Prepare request body based on input mode
    let requestData = {
      name: formData.name,
      namespace: formData.namespace,
      description: formData.description,
      keywords: JSON.stringify(formData.keywords),
      tags: JSON.stringify(formData.tags),
      templateId: formData.templateId,
      inventoryId: formData.inventoryId || null,
      instanceGroupId: formData.instanceGroupId || null,
      pinned: formData.pinned,
      featured: formData.featured,
    };

    if (formData.inputMode === 'json') {
      // JSON mode - send customBody
      requestData.customBody = formData.customBody;
      requestData.formSchema = JSON.stringify([]); // Empty form schema
      requestData.extraVars = ''; // No extraVars
    } else {
      // Form mode - send formSchema and auto-generate extraVars
      const extraVars = formData.formSchema
        .filter(field => field.key && field.key.trim())
        .map(field => `${field.key}: "{{form.${field.key}}}"`)
        .join('\n');

      requestData.formSchema = JSON.stringify(formData.formSchema);
      requestData.extraVars = extraVars;
      requestData.customBody = null;
    }

    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setToast({ message: 'Catalog item created successfully!', type: 'success' });
        setTimeout(() => {
          router.push('/catalog');
        }, 2000);
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Failed to create catalog item', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      setToast({ message: 'Failed to create catalog item. Please try again.', type: 'error' });
    }
  };

  // Form designer functions
  const addFormField = (type) => {
    const newField = {
      type,
      label: '',
      key: '',
      placeholder: '',
      defaultValue: '',
      required: false,
      helpText: '',
      ...(type === 'select' || type === 'radio' ? { options: [] } : {}),
    };

    setFormData((prev) => ({
      ...prev,
      formSchema: [...prev.formSchema, newField],
    }));

    // Auto-select the newly added field
    setSelectedFieldIndex(formData.formSchema.length);
  };

  const removeFormField = (index) => {
    setFormData((prev) => ({
      ...prev,
      formSchema: prev.formSchema.filter((_, i) => i !== index),
    }));

    // Reset selection if removed field was selected
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const updateFieldProperty = (index, property, value) => {
    // Convert spaces to underscores and lowercase for field keys
    if (property === 'key') {
      value = value.toLowerCase().replace(/\s+/g, '_');
    }

    // Check for duplicate field keys
    if (property === 'key' && value.trim()) {
      const isDuplicate = formData.formSchema.some((field, idx) =>
        idx !== index && field.key === value.trim()
      );

      if (isDuplicate) {
        setToast({
          message: `Field key "${value}" already exists. Please use a unique name.`,
          type: 'error'
        });
        return;
      }
    }

    setFormData((prev) => {
      const updatedSchema = [...prev.formSchema];
      updatedSchema[index] = {
        ...updatedSchema[index],
        [property]: value,
      };

      // Auto-populate field key when label changes
      if (property === 'label') {
        const currentLabel = prev.formSchema[index]?.label || '';
        const currentKey = prev.formSchema[index]?.key || '';

        // Generate the expected key from the previous label
        const expectedKeyFromPrevLabel = currentLabel
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim()
          .replace(/\s+/g, '_');

        // Only auto-update if:
        // 1. Key is empty, OR
        // 2. Key matches what would be auto-generated from the previous label (hasn't been manually edited)
        if (!currentKey || currentKey === expectedKeyFromPrevLabel) {
          // Generate new key from the new label value
          const autoKey = value
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .trim()
            .replace(/\s+/g, '_'); // Replace spaces with underscores

          updatedSchema[index].key = autoKey;
        }
      }

      return {
        ...prev,
        formSchema: updatedSchema,
      };
    });
  };

  const renderStepIndicator = () => {
    // Dynamically determine step 2 name based on selected mode
    const step2Name = formData.inputMode === 'json' ? 'JSON Body' : 'Form Design';

    const steps = [
      { num: 1, name: 'Details' },
      { num: 2, name: step2Name },
      { num: 3, name: 'Backend' },
      { num: 4, name: 'Review' },
    ];

    return (
      <div className="mb-8" key={`step-${step}-${formData.inputMode}`}>
        <p className="mb-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
          Step {step} of 4: {steps[step - 1].name}
        </p>
        <div className="flex items-center gap-2">
          {steps.map((s, index) => (
            <div key={s.num} className="flex-1">
              <div
                className="h-1.5 rounded-full transition-colors"
                style={{
                  backgroundColor: s.num <= step ? 'var(--primary)' : 'var(--border)'
                }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-6xl pb-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Add New Catalog Item</h1>
      </div>

      <div className="rounded-lg p-6 flex flex-col h-[calc(100vh-180px)]" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        {renderStepIndicator()}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2">
          {/* Step 1: Main Details */}
          {step === 1 && (
            <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                onFocus={() => formData.name && setShowSuggestions(nameSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Start typing... (e.g., Provision, Deploy, Backup)"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: errors.name ? '1px solid #ef4444' : '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--primary)'
                }}
                autoComplete="off"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name}</p>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && nameSuggestions.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-lg shadow-lg overflow-hidden"
                  style={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {nameSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        borderBottom: index < nameSuggestions.length - 1 ? '1px solid var(--border)' : 'none'
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Namespace<span className="text-red-500">*</span>
              </label>
              <select
                name="namespace"
                value={formData.namespace}
                onChange={handleInputChange}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                style={{
                  border: errors.namespace ? '1px solid #ef4444' : '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--primary)',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem',
                  minHeight: '42px'
                }}
              >
                {namespaces.length === 0 && <option value="">No namespaces available</option>}
                {namespaces.map((ns) => (
                  <option key={ns.id} value={ns.name}>
                    {ns.displayName} ({ns.name})
                  </option>
                ))}
              </select>
              {errors.namespace && (
                <p className="mt-1 text-xs text-red-500">{errors.namespace}</p>
              )}
              {namespaces.length === 0 && !errors.namespace && (
                <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                  No namespaces found. Create one in{' '}
                  <button
                    onClick={() => router.push('/settings')}
                    className="font-medium hover:opacity-80"
                    style={{ color: 'var(--primary)' }}
                  >
                    Settings
                  </button>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Creates a VM with selected image, size, and tags."
                rows={4}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--accent)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Keywords</label>
              <div className="flex flex-wrap gap-2 rounded-lg px-3 py-2 min-h-[42px]" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                {formData.keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm bg-gray-100 text-gray-700"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:opacity-70"
                      style={{ color: 'var(--muted)' }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addKeyword(keywordInput);
                    }
                  }}
                  onBlur={() => {
                    if (keywordInput.trim()) {
                      addKeyword(keywordInput);
                    }
                  }}
                  placeholder="Add a keyword..."
                  className="flex-1 min-w-[120px] border-none outline-none focus:ring-0 text-sm"
                  style={{ backgroundColor: 'transparent', color: 'var(--text)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Tags</label>
              <div className="flex flex-wrap gap-2 rounded-lg px-3 py-2 min-h-[42px]" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm"
                    style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:opacity-70"
                      style={{ color: 'var(--primary)' }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  onBlur={() => {
                    if (tagInput.trim()) {
                      addTag(tagInput);
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 min-w-[120px] border-none outline-none focus:ring-0 text-sm"
                  style={{ backgroundColor: 'transparent', color: 'var(--text)' }}
                />
              </div>

              {/* Saved Tags for Reuse */}
              {savedTags.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Previously used tags (click to add):</p>
                  <div className="flex flex-wrap gap-2">
                    {savedTags.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="inline-flex items-center rounded px-2 py-1 text-xs hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: 'rgba(76, 18, 161, 0.05)',
                          color: 'var(--primary)',
                          border: '1px solid rgba(76, 18, 161, 0.2)'
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input Mode Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Configuration Mode <span className="text-red-500">*</span>
              </label>
              <div className="rounded-lg px-4 py-3 space-y-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputMode"
                      value="form"
                      checked={formData.inputMode === 'form'}
                      onChange={(e) => setFormData({
                        ...formData,
                        inputMode: e.target.value,
                        customBody: '' // Clear JSON body when switching to form mode
                      })}
                      className="h-4 w-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        Form Builder
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Create input form with drag-and-drop fields
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inputMode"
                      value="json"
                      checked={formData.inputMode === 'json'}
                      onChange={(e) => setFormData({
                        ...formData,
                        inputMode: e.target.value,
                        formSchema: [] // Clear form schema when switching to JSON mode
                      })}
                      className="h-4 w-4"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        JSON Body
                      </p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        Provide custom JSON request body directly
                      </p>
                    </div>
                  </label>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    <strong>Note:</strong> Choose one mode only. Form Builder creates a user-friendly input form, while JSON Body allows advanced custom request configuration.
                  </p>
                </div>
              </div>
            </div>

            {/* Pinned and Featured Options */}
            <div className="space-y-3">
              <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Display Options
              </label>
              <div className="space-y-3 rounded-lg px-4 py-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="pinned"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 transition"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Pin to Dashboard
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Display this catalog item in the pinned section on the dashboard
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 transition"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                      Mark as Featured
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      Highlight this catalog item as featured in the catalog view
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Form Design OR JSON Body */}
        {step === 2 && formData.inputMode === 'json' && (
          <div className="space-y-6">
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(76, 18, 161, 0.05)', border: '1px solid rgba(76, 18, 161, 0.2)' }}>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <span className="font-medium">Custom Request Body:</span> This is the <strong>exact JSON body</strong> that will be sent to the AWX API call. You can use template variables like{' '}
                <code className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>{"{{form.fieldname}}"}</code>{' '}
                which will be replaced with user-entered values at runtime.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                API Request Body (JSON)<span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.customBody}
                onChange={(e) => setFormData({ ...formData, customBody: e.target.value })}
                placeholder={`{\n  "instance_groups": [298],\n  "extra_vars": {\n    "field1": "{{form.field1}}",\n    "field2": "{{form.field2}}"\n  }\n}`}
                rows={20}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                style={{
                  border: errors.customBody ? '1px solid #ef4444' : '1px solid var(--border)',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  color: 'var(--text)',
                  focusRing: 'var(--primary)'
                }}
              />
              {errors.customBody && (
                <p className="mt-1 text-xs text-red-500">{errors.customBody}</p>
              )}
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                <strong>Important:</strong> This JSON is the exact body sent to the AWX API call. Any template variables (e.g., {"{{form.field}}"}) will be replaced with actual values when users run the automation.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Form Design */}
        {step === 2 && formData.inputMode === 'form' && (
          <div className="flex flex-col flex-1">
            {/* Top Panel - Components Palette (Horizontal) */}
            <div className="p-4 -mx-6 -mt-6 overflow-x-auto" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>Components</h3>
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => addFormField('text')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <Type className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Text</h2>
                </button>

                <button
                  onClick={() => addFormField('password')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <Lock className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Password</h2>
                </button>

                <button
                  onClick={() => addFormField('number')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <Hash className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Number</h2>
                </button>

                <button
                  onClick={() => addFormField('textarea')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <AlignLeft className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Textarea</h2>
                </button>

                <button
                  onClick={() => addFormField('radio')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <Circle className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Radio Group</h2>
                </button>

                <button
                  onClick={() => addFormField('checkbox')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <CheckSquare className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Checkbox</h2>
                </button>

                <button
                  onClick={() => addFormField('select')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Select</h2>
                </button>

                <button
                  onClick={() => addFormField('toggle')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <ToggleLeft className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Toggle</h2>
                </button>

                <button
                  onClick={() => addFormField('date')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>Date/Time</h2>
                </button>

                <button
                  onClick={() => addFormField('json')}
                  className="flex flex-col items-center gap-2 rounded-lg p-3 text-center cursor-pointer transition-all hover:opacity-80 flex-shrink-0"
                  style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', minWidth: '100px' }}
                >
                  <FileJson className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                  <h2 className="text-xs font-medium" style={{ color: 'var(--text)' }}>JSON Editor</h2>
                </button>
              </div>
            </div>

            {/* Bottom Panel - Canvas and Properties Side by Side */}
            <div className="flex flex-1 overflow-hidden">
              {/* Center Canvas - Form Preview */}
              <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: 'var(--bg)' }}>
                <div className="mx-auto max-w-2xl rounded-lg p-6 space-y-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                {formData.formSchema.length === 0 ? (
                  <div className="flex items-center justify-center h-[400px] rounded-lg" style={{ border: '2px dashed var(--border)' }}>
                    <div className="text-center">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>No fields added yet</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Click a component on the left to add it</p>
                    </div>
                  </div>
                ) : (
                  formData.formSchema.map((field, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedFieldIndex(index)}
                      className="space-y-2 p-4 rounded-lg cursor-pointer transition-all"
                      style={{
                        border: selectedFieldIndex === index ? '2px solid var(--primary)' : '2px solid transparent',
                        backgroundColor: selectedFieldIndex === index ? 'rgba(76, 18, 161, 0.05)' : 'transparent'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
                          {field.label || 'Untitled Field'}
                          {field.required && <span className="text-red-500">*</span>}
                          {field.predefinedValue && (
                            <span className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', color: 'var(--primary)' }}>
                              Auto
                            </span>
                          )}
                        </label>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFormField(index);
                          }}
                          className="p-1 hover:opacity-70"
                          style={{ color: 'var(--muted)' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Field Preview */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.predefinedValue ? `Auto: ${field.predefinedValue}` : (field.placeholder || 'Enter text...')}
                          defaultValue={field.defaultValue}
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        />
                      )}
                      {field.type === 'password' && (
                        <input
                          type="password"
                          placeholder={field.placeholder || 'Enter password...'}
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        />
                      )}
                      {field.type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder || 'Enter number...'}
                          defaultValue={field.defaultValue}
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        />
                      )}
                      {field.type === 'textarea' && (
                        <textarea
                          placeholder={field.placeholder || 'Enter text...'}
                          defaultValue={field.defaultValue}
                          rows={4}
                          className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        />
                      )}
                      {field.type === 'select' && (
                        <select
                          className="w-full rounded-lg px-3 py-2 text-sm appearance-none"
                          style={{
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text)',
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="">{field.placeholder || 'Select an option...'}</option>
                          {field.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <input type="radio" name={field.key} value={opt} className="rounded-full" />
                              <span className="text-sm" style={{ color: 'var(--text)' }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      {field.type === 'checkbox' && (
                        <label className="flex items-center gap-2">
                          <input type="checkbox" className="rounded" />
                          <span className="text-sm" style={{ color: 'var(--text)' }}>{field.helpText || 'Check this option'}</span>
                        </label>
                      )}
                      {field.type === 'toggle' && (
                        <label className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--text)' }}>{field.helpText || 'Toggle option'}</span>
                          <div className="relative inline-block w-11 h-6">
                            <input type="checkbox" className="sr-only peer" />
                            <div className="w-11 h-6 rounded-full peer peer-checked:bg-purple-600 transition-colors" style={{ backgroundColor: 'var(--border)' }}></div>
                            <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
                          </div>
                        </label>
                      )}
                      {field.type === 'date' && (
                        <input
                          type="date"
                          defaultValue={field.defaultValue}
                          className="w-full rounded-lg px-3 py-2 text-sm"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                        />
                      )}
                      {field.type === 'json' && (
                        <textarea
                          placeholder={field.placeholder || '{\n  "key": "value"\n}'}
                          defaultValue={field.defaultValue}
                          rows={6}
                          className="w-full rounded-lg px-3 py-2 text-sm font-mono resize-none"
                          style={{ border: '1px solid var(--border)', backgroundColor: 'rgba(0, 0, 0, 0.05)', color: 'var(--text)' }}
                        />
                      )}

                      {field.helpText && (
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{field.helpText}</p>
                      )}
                    </div>
                  ))
                )}
                </div>
              </div>

              {/* Right Panel - Properties */}
              <div className="w-80 flex flex-col" style={{ borderLeft: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {selectedFieldIndex !== null && formData.formSchema[selectedFieldIndex]
                      ? `Properties: ${formData.formSchema[selectedFieldIndex].label || 'Untitled Field'}`
                      : 'Field Properties'}
                  </h3>
                </div>

                <div className="flex-1 p-4 space-y-6 overflow-y-auto">
                  {selectedFieldIndex === null ? (
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>Select a field to edit its properties</p>
                    </div>
                  ) : (
                    <>
                      {/* Basic Info */}
                      <div>
                        <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)' }}>Basic Info</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                              Label <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.formSchema[selectedFieldIndex]?.label || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'label', e.target.value)}
                              placeholder="Field Label"
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                              required
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                              Field Key <span style={{ color: '#DC2626' }}>*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.formSchema[selectedFieldIndex]?.key || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'key', e.target.value)}
                              onBlur={(e) => {
                                // Trim whitespace, convert to lowercase, and convert spaces to underscores on blur
                                const cleaned = e.target.value.trim().toLowerCase().replace(/\s+/g, '_');
                                if (cleaned !== e.target.value) {
                                  updateFieldProperty(selectedFieldIndex, 'key', cleaned);
                                }
                              }}
                              placeholder="field_key"
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2 font-mono"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Configuration */}
                      <div>
                        <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)' }}>Configuration</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Placeholder</label>
                            <input
                              type="text"
                              value={formData.formSchema[selectedFieldIndex]?.placeholder || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'placeholder', e.target.value)}
                              placeholder="Enter placeholder text"
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Default Value</label>
                            <input
                              type="text"
                              value={formData.formSchema[selectedFieldIndex]?.defaultValue || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'defaultValue', e.target.value)}
                              placeholder="Default value"
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Predefined Value</label>
                            <select
                              value={formData.formSchema[selectedFieldIndex]?.predefinedValue || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'predefinedValue', e.target.value)}
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2.5 appearance-none"
                              style={{
                                border: '1px solid var(--border)',
                                backgroundColor: 'var(--bg)',
                                color: 'var(--text)',
                                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.5em 1.5em',
                                paddingRight: '2.5rem'
                              }}
                            >
                              <option value="">None</option>
                              <option value="{{current_user.username}}">Current User - Username</option>
                              <option value="{{current_user.email}}">Current User - Email</option>
                              <option value="{{current_user.fullName}}">Current User - Full Name</option>
                              <option value="{{current_user.department}}">Current User - Department</option>
                              <option value="{{current_user.role}}">Current User - Role</option>
                              <option value="{{current_date}}">Current Date</option>
                              <option value="{{current_time}}">Current Time</option>
                              <option value="{{current_datetime}}">Current Date & Time</option>
                            </select>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                              Auto-populate this field with predefined values at runtime
                            </p>
                          </div>

                          <div>
                            <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Help Text</label>
                            <textarea
                              value={formData.formSchema[selectedFieldIndex]?.helpText || ''}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'helpText', e.target.value)}
                              placeholder="Provide helpful context"
                              rows={2}
                              className="mt-1 block w-full text-sm rounded-lg px-3 py-2 resize-none"
                              style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                            />
                          </div>

                          {(formData.formSchema[selectedFieldIndex]?.type === 'select' || formData.formSchema[selectedFieldIndex]?.type === 'radio') && (
                            <div>
                              <label className="text-xs font-medium" style={{ color: 'var(--text)' }}>Options (one per line)</label>
                              <textarea
                                value={formData.formSchema[selectedFieldIndex]?.options?.join('\n') || ''}
                                onChange={(e) => updateFieldProperty(selectedFieldIndex, 'options', e.target.value.split('\n').filter(o => o.trim()))}
                                placeholder="Option 1&#10;Option 2&#10;Option 3"
                                rows={4}
                                className="mt-1 block w-full text-sm rounded-lg px-3 py-2 resize-none"
                                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Validation */}
                      <div>
                        <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--muted)' }}>Validation</h4>
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Required</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.formSchema[selectedFieldIndex]?.required || false}
                              onChange={(e) => updateFieldProperty(selectedFieldIndex, 'required', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: formData.formSchema[selectedFieldIndex]?.required ? 'var(--primary)' : 'var(--border)' }}></div>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Backend Integration */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'rgba(76, 18, 161, 0.05)', border: '1px solid rgba(76, 18, 161, 0.2)' }}>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                <span className="font-medium">Note:</span> The AWX Base URL is configured globally in{' '}
                <button
                  type="button"
                  onClick={() => router.push('/settings')}
                  className="font-medium hover:opacity-80"
                  style={{ color: 'var(--primary)' }}
                >
                  Settings
                </button>
                {' '}and applies to all automations automatically.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Template ID<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="templateId"
                value={formData.templateId}
                onChange={handleInputChange}
                placeholder="tmpl-provision-vm"
                required
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: errors.templateId ? '1px solid #ef4444' : '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--accent)'
                }}
              />
              {errors.templateId && (
                <p className="mt-1 text-xs text-red-500">{errors.templateId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Inventory ID</label>
              <input
                type="text"
                name="inventoryId"
                value={formData.inventoryId}
                onChange={handleInputChange}
                placeholder="inv-global-01"
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--accent)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Instance Group<span className="text-red-500">*</span>
              </label>
              <select
                name="instanceGroupId"
                value={formData.instanceGroupId}
                onChange={handleInputChange}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--accent)'
                }}
                required
              >
                <option value="">Select instance group</option>
                {instanceGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} {group.description && `- ${group.description}`}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                Select which instance group should execute this automation
              </p>
            </div>

            {/* Extra Vars Section */}
            <div className="mt-6 rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    Extra Variables for Playbook
                  </h3>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                    Add form fields that will be passed as extra_vars to AWX (e.g., server_name, emailid, ritm)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addFormField('text')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Field
                </Button>
              </div>

              {formData.formSchema.length === 0 ? (
                <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
                  <p className="text-sm">No extra vars fields added yet.</p>
                  <p className="text-xs mt-2">Click "Add Field" to create form fields for your playbook variables.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.formSchema.map((field, index) => (
                    <div
                      key={index}
                      className="rounded-lg p-3 flex items-center justify-between"
                      style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {field.label || 'Untitled Field'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--border)', color: 'var(--muted)' }}>
                            {field.type}
                          </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Key: <code className="px-1 rounded" style={{ backgroundColor: 'var(--border)' }}>{field.key || 'not set'}</code>
                          {field.required && <span className="ml-2 text-red-500">Required</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSchema = formData.formSchema.filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, formSchema: updatedSchema }));
                        }}
                        className="ml-3 p-1.5 rounded hover:bg-red-50 transition-colors"
                        style={{ color: '#ef4444' }}
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {formData.formSchema.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => {
                      // Go to Step 2 to edit fields
                      setStep(2);
                    }}
                    className="text-sm hover:opacity-80"
                    style={{ color: 'var(--primary)' }}
                  >
                    ← Edit fields in Form Design (Step 2)
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6">
            <p style={{ color: 'var(--muted)' }}>Review your automation configuration before creating it.</p>
            <div className="rounded-lg p-4 space-y-3" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Name</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{formData.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Namespace</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{formData.namespace}</p>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Description</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{formData.description || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Fixed Navigation Buttons */}
        <div className="mt-6 pt-4 pb-2 flex justify-between flex-shrink-0" style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <Button variant="outline" onClick={handleBack} disabled={step === 1}>
            Back
          </Button>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => router.push('/')}>
              Cancel
            </Button>
            {step < 4 ? (
              <Button variant="primary" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreate}>
                Create Automation
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
