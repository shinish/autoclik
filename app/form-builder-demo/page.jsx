'use client';

import { useState } from 'react';
import GroupedFormBuilder from '@/components/GroupedFormBuilder';

export default function FormBuilderDemo() {
  const [customBody, setCustomBody] = useState(null);
  const [formGroups, setFormGroups] = useState(null);

  const handleChange = (body, groups) => {
    setCustomBody(body);
    setFormGroups(groups);
    console.log('Custom Body:', body);
    console.log('Form Groups:', groups);
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            Grouped Form Builder Demo
          </h1>
          <p className="mt-2" style={{ color: 'var(--muted)' }}>
            Build your automation request body with grouped sections. Toggle between Visual Builder and JSON Editor.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#4C12A1' }}>
                1
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Configure Groups</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Add instance groups and define extra variable fields
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#4C12A1' }}>
                2
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Preview Output</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              See the generated JSON custom body in real-time
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#4C12A1' }}>
                3
              </div>
              <h3 className="font-semibold" style={{ color: 'var(--text)' }}>Switch Modes</h3>
            </div>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Toggle between Visual Builder and JSON Editor
            </p>
          </div>
        </div>

        {/* Form Builder */}
        <GroupedFormBuilder
          value={formGroups}
          onChange={handleChange}
        />

        {/* Example Usage */}
        <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Example: Your PowerShell Test Structure
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Here's how to recreate your test.txt structure:
          </p>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text)' }}>
                1. Add Instance Group
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                <li>Click "Add Group" in Instance Groups section</li>
                <li>Enter: <code className="px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)' }}>298</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text)' }}>
                2. Add Extra Var Fields
              </h4>
              <ul className="list-disc list-inside text-sm space-y-1" style={{ color: 'var(--muted)' }}>
                <li>Click "Add Field" 3 times</li>
                <li>Field 1: Key = <code>source_system</code>, Label = "Source System", Check "Is Array"</li>
                <li>Field 2: Key = <code>destn_ip</code>, Label = "Destination IP"</li>
                <li>Field 3: Key = <code>ports_input</code>, Label = "Ports"</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2" style={{ color: 'var(--text)' }}>
                3. Result
              </h4>
              <pre className="p-3 rounded-lg text-sm overflow-auto" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
{`{
  "instance_groups": [298],
  "extra_vars": {
    "source_system": ["{{form.source_system}}"],
    "destn_ip": "{{form.destn_ip}}",
    "ports_input": "{{form.ports_input}}"
  }
}`}
              </pre>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: '#dbeafe', border: '1px solid #3b82f6' }}>
              <p className="text-sm" style={{ color: '#1e40af' }}>
                <strong>💡 Pro Tip:</strong> Switch to JSON Editor mode to paste your entire custom body at once, then switch back to Visual mode to edit it!
              </p>
            </div>
          </div>
        </div>

        {/* Current State Display */}
        {customBody && (
          <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '2px solid #4C12A1' }}>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              ✅ Current Custom Body
            </h3>
            <pre className="p-4 rounded-lg text-sm overflow-auto" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
              {JSON.stringify(customBody, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
