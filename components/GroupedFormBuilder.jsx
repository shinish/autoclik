'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Code, FormInput } from 'lucide-react';

export default function GroupedFormBuilder({ value, onChange }) {
  const [mode, setMode] = useState('visual'); // 'visual' or 'json'
  const [jsonValue, setJsonValue] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Initialize with default structure
  const [formGroups, setFormGroups] = useState(value || {
    instance_groups: {
      label: 'Instance Groups',
      type: 'array',
      items: []
    },
    extra_vars: {
      label: 'Extra Variables',
      type: 'group',
      fields: []
    }
  });

  // Add instance group
  const addInstanceGroup = () => {
    setFormGroups(prev => ({
      ...prev,
      instance_groups: {
        ...prev.instance_groups,
        items: [...(prev.instance_groups.items || []), '']
      }
    }));
  };

  // Remove instance group
  const removeInstanceGroup = (index) => {
    setFormGroups(prev => ({
      ...prev,
      instance_groups: {
        ...prev.instance_groups,
        items: prev.instance_groups.items.filter((_, i) => i !== index)
      }
    }));
  };

  // Update instance group value
  const updateInstanceGroup = (index, value) => {
    setFormGroups(prev => ({
      ...prev,
      instance_groups: {
        ...prev.instance_groups,
        items: prev.instance_groups.items.map((item, i) => i === index ? value : item)
      }
    }));
  };

  // Add field to extra_vars
  const addExtraVarField = () => {
    setFormGroups(prev => ({
      ...prev,
      extra_vars: {
        ...prev.extra_vars,
        fields: [...(prev.extra_vars.fields || []), {
          key: '',
          label: '',
          type: 'text',
          required: false,
          defaultValue: '',
          isArray: false
        }]
      }
    }));
  };

  // Remove field from extra_vars
  const removeExtraVarField = (index) => {
    setFormGroups(prev => ({
      ...prev,
      extra_vars: {
        ...prev.extra_vars,
        fields: prev.extra_vars.fields.filter((_, i) => i !== index)
      }
    }));
  };

  // Update extra_vars field
  const updateExtraVarField = (index, field, value) => {
    setFormGroups(prev => ({
      ...prev,
      extra_vars: {
        ...prev.extra_vars,
        fields: prev.extra_vars.fields.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      }
    }));
  };

  // Generate custom body from form groups
  const generateCustomBody = () => {
    const customBody = {};

    // Add instance_groups
    if (formGroups.instance_groups?.items?.length > 0) {
      customBody.instance_groups = formGroups.instance_groups.items
        .filter(item => item !== '')
        .map(item => parseInt(item) || item);
    }

    // Add extra_vars
    if (formGroups.extra_vars?.fields?.length > 0) {
      customBody.extra_vars = {};
      formGroups.extra_vars.fields.forEach(field => {
        if (field.key) {
          let value = field.defaultValue || `{{form.${field.key}}}`;
          if (field.isArray) {
            value = [value];
          }
          customBody.extra_vars[field.key] = value;
        }
      });
    }

    return customBody;
  };

  // Update parent component
  const notifyChange = (groups) => {
    const customBody = generateCustomBody();
    onChange(customBody, groups);
  };

  // Switch to JSON mode
  const switchToJson = () => {
    const customBody = generateCustomBody();
    setJsonValue(JSON.stringify(customBody, null, 2));
    setMode('json');
  };

  // Switch to visual mode
  const switchToVisual = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      // TODO: Convert JSON back to form groups
      setJsonError('');
      setMode('visual');
      onChange(parsed, formGroups);
    } catch (error) {
      setJsonError('Invalid JSON: ' + error.message);
    }
  };

  // Update JSON value
  const updateJson = (value) => {
    setJsonValue(value);
    try {
      JSON.parse(value);
      setJsonError('');
    } catch (error) {
      setJsonError('Invalid JSON: ' + error.message);
    }
  };

  // Apply JSON changes
  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      onChange(parsed, formGroups);
      setJsonError('');
      setMode('visual');
    } catch (error) {
      setJsonError('Invalid JSON: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => mode === 'json' ? switchToVisual() : setMode('visual')}
          className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
            mode === 'visual'
              ? 'text-white'
              : 'hover:bg-opacity-50'
          }`}
          style={{
            backgroundColor: mode === 'visual' ? 'var(--primary)' : 'transparent',
            color: mode === 'visual' ? 'white' : 'var(--text)'
          }}
        >
          <FormInput className="h-4 w-4" />
          Visual Form Builder
        </button>
        <button
          onClick={switchToJson}
          className={`flex-1 px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors ${
            mode === 'json'
              ? 'text-white'
              : 'hover:bg-opacity-50'
          }`}
          style={{
            backgroundColor: mode === 'json' ? 'var(--primary)' : 'transparent',
            color: mode === 'json' ? 'white' : 'var(--text)'
          }}
        >
          <Code className="h-4 w-4" />
          JSON Editor
        </button>
      </div>

      {mode === 'visual' ? (
        // Visual Form Builder
        <div className="space-y-6">
          {/* Instance Groups Section */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Instance Groups
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Configure AWX instance groups for job execution
                </p>
              </div>
              <button
                onClick={addInstanceGroup}
                className="px-3 py-2 rounded-lg text-white flex items-center gap-2"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Plus className="h-4 w-4" />
                Add Group
              </button>
            </div>

            <div className="space-y-3">
              {formGroups.instance_groups?.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={item}
                      onChange={(e) => updateInstanceGroup(index, e.target.value)}
                      placeholder="Enter instance group ID (e.g., 298)"
                      className="w-full px-4 py-2 rounded-lg"
                      style={{
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text)'
                      }}
                    />
                  </div>
                  <button
                    onClick={() => removeInstanceGroup(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {(!formGroups.instance_groups?.items || formGroups.instance_groups.items.length === 0) && (
                <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
                  No instance groups configured. Click "Add Group" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Extra Vars Section */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Extra Variables (Form Fields)
                </h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Define form fields that users will fill in. Values become template variables.
                </p>
              </div>
              <button
                onClick={addExtraVarField}
                className="px-3 py-2 rounded-lg text-white flex items-center gap-2"
                style={{ backgroundColor: 'var(--primary)' }}
              >
                <Plus className="h-4 w-4" />
                Add Field
              </button>
            </div>

            <div className="space-y-4">
              {formGroups.extra_vars?.fields?.map((field, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg space-y-3"
                  style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                      <span className="font-medium" style={{ color: 'var(--text)' }}>
                        Field {index + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removeExtraVarField(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Field Key <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) => updateExtraVarField(index, 'key', e.target.value)}
                        placeholder="e.g., source_system"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)'
                        }}
                      />
                      <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                        Variable: {`{{form.${field.key || 'key'}}}`}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Label <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateExtraVarField(index, 'label', e.target.value)}
                        placeholder="e.g., Source System"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)'
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Field Type
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => updateExtraVarField(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)'
                        }}
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Text Area</option>
                        <option value="number">Number</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                        Default/Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.defaultValue}
                        onChange={(e) => updateExtraVarField(index, 'defaultValue', e.target.value)}
                        placeholder="e.g., VRT-PDC"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateExtraVarField(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>Required</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={field.isArray}
                        onChange={(e) => updateExtraVarField(index, 'isArray', e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm" style={{ color: 'var(--text)' }}>Is Array</span>
                    </label>
                  </div>
                </div>
              ))}

              {(!formGroups.extra_vars?.fields || formGroups.extra_vars.fields.length === 0) && (
                <div className="text-center py-8" style={{ color: 'var(--muted)' }}>
                  No fields configured. Click "Add Field" to create form fields.
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Generated Custom Body Preview
            </h3>
            <pre
              className="p-4 rounded-lg overflow-auto text-sm"
              style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
            >
              {JSON.stringify(generateCustomBody(), null, 2)}
            </pre>
            <button
              onClick={() => notifyChange(formGroups)}
              className="mt-4 px-4 py-2 rounded-lg text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Apply Changes
            </button>
          </div>
        </div>
      ) : (
        // JSON Editor Mode
        <div className="space-y-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
            <p className="text-sm" style={{ color: '#92400e' }}>
              <strong>JSON Mode:</strong> Edit the custom body directly as JSON. Switch back to Visual mode to use the form builder.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
              Custom Body JSON
            </label>
            <textarea
              value={jsonValue}
              onChange={(e) => updateJson(e.target.value)}
              rows={20}
              className="w-full px-4 py-3 rounded-lg font-mono text-sm"
              style={{
                backgroundColor: 'var(--surface)',
                border: `1px solid ${jsonError ? '#ef4444' : 'var(--border)'}`,
                color: 'var(--text)'
              }}
              placeholder={`{
  "instance_groups": [298],
  "extra_vars": {
    "source_system": ["{{form.source_system}}"],
    "destn_ip": "{{form.destn_ip}}",
    "ports_input": "{{form.ports_input}}"
  }
}`}
            />
            {jsonError && (
              <p className="mt-2 text-sm text-red-500">{jsonError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyJson}
              disabled={!!jsonError}
              className="px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Apply JSON
            </button>
            <button
              onClick={() => setMode('visual')}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
