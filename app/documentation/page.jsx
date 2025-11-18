'use client';

import { useState } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen, Zap, Clock, Settings as SettingsIcon, Play, FileText } from 'lucide-react';

export default function DocumentationPage() {
  const [search, setSearch] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    gettingStarted: true,
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const sections = [
    {
      id: 'gettingStarted',
      title: 'Getting Started',
      icon: BookOpen,
      items: [
        {
          title: 'Welcome to Autoclik Automation Platform',
          content: (
            <div className="space-y-3">
              <p>Autoclik is an enterprise automation platform that helps you create, manage, and execute automated workflows across your organization.</p>
              <h4 className="font-light mt-4">Key Features:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Schedule recurring tasks</li>
                <li>User and group management</li>
                <li>Namespace organization</li>
                <li>Activity monitoring and audit logs</li>
              </ul>
            </div>
          )
        },
        {
          title: 'Quick Start Guide',
          content: (
            <div className="space-y-3">
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li><strong>Create a Schedule:</strong> Go to Schedules to set up recurring tasks.</li>
                <li><strong>Monitor Activity:</strong> View execution logs and track automation runs.</li>
                <li><strong>Manage Settings:</strong> Configure users, groups, namespaces, and credentials in Settings.</li>
                <li><strong>Review Audit Reports:</strong> Analyze execution trends and statistics.</li>
              </ol>
            </div>
          )
        }
      ]
    },
    {
      id: 'schedules',
      title: 'Schedules',
      icon: Clock,
      items: [
        {
          title: 'Creating Schedules',
          content: (
            <div className="space-y-3">
              <p>Schedules allow you to run automations automatically at specified intervals.</p>
              <h4 className="font-semibold mt-4">To create a schedule:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click "Create New Schedule"</li>
                <li>Enter a descriptive name</li>
                <li>Select the automation to run</li>
                <li>Define the frequency (e.g., "Every day at 3:00 AM")</li>
                <li>Provide a cron expression</li>
                <li>Click "Create Schedule"</li>
              </ol>
            </div>
          )
        },
        {
          title: 'Cron Expressions',
          content: (
            <div className="space-y-3">
              <p>Cron expressions define when your automation runs. Format: <code className="px-2 py-1 rounded text-sm" style={{ backgroundColor: 'var(--bg)' }}>minute hour day month weekday</code></p>
              <h4 className="font-semibold mt-4">Common Patterns:</h4>
              <div className="space-y-2">
                <div className="flex justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <code className="text-sm" style={{ color: 'var(--primary)' }}>0 * * * *</code>
                  <span className="text-sm">Every hour at minute 0</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <code className="text-sm" style={{ color: 'var(--primary)' }}>0 0 * * *</code>
                  <span className="text-sm">Daily at midnight</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <code className="text-sm" style={{ color: 'var(--primary)' }}>0 9 * * 1-5</code>
                  <span className="text-sm">Weekdays at 9:00 AM</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <code className="text-sm" style={{ color: 'var(--primary)' }}>*/15 * * * *</code>
                  <span className="text-sm">Every 15 minutes</span>
                </div>
                <div className="flex justify-between p-2 rounded" style={{ backgroundColor: 'var(--bg)' }}>
                  <code className="text-sm" style={{ color: 'var(--primary)' }}>0 0 1 * *</code>
                  <span className="text-sm">First day of month at midnight</span>
                </div>
              </div>
            </div>
          )
        },
        {
          title: 'Managing Schedules',
          content: (
            <div className="space-y-3">
              <p>You can manage your schedules with the following actions:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Pause:</strong> Temporarily disable a schedule (green → yellow badge)</li>
                <li><strong>Resume:</strong> Re-enable a paused schedule (yellow → green badge)</li>
                <li><strong>Run Now:</strong> Execute the schedule immediately without waiting</li>
                <li><strong>Delete:</strong> Permanently remove a schedule</li>
              </ul>
              <p className="mt-4"><strong>Status Badges:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="text-green-600">Active:</span> Schedule is running and will execute at the next scheduled time</li>
                <li><span className="text-yellow-600">Paused:</span> Schedule is temporarily disabled</li>
              </ul>
            </div>
          )
        }
      ]
    },
    {
      id: 'monitoring',
      title: 'Activity & Audit',
      icon: FileText,
      items: [
        {
          title: 'Activity Logs',
          content: (
            <div className="space-y-3">
              <p>The Activity page shows execution logs for all automation runs, helping you track and troubleshoot executions.</p>
              <h4 className="font-semibold mt-4">Features:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Search:</strong> Find runs by automation name or run ID</li>
                <li><strong>Status Filters:</strong> Filter by All, Success, Failed, Running, or Pending status</li>
                <li><strong>Execution Details:</strong> View parameters, results, and error messages for each run</li>
                <li><strong>Real-time Updates:</strong> See the current status of running automations</li>
              </ul>
              <h4 className="font-semibold mt-4">Status Indicators:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><span className="text-green-600">● Success:</span> Automation completed successfully</li>
                <li><span className="text-red-600">● Failed:</span> Automation encountered an error</li>
                <li><span className="text-blue-600">● Running:</span> Automation is currently executing</li>
                <li><span className="text-yellow-600">● Pending:</span> Automation is queued for execution</li>
              </ul>
            </div>
          )
        },
        {
          title: 'Audit Report',
          content: (
            <div className="space-y-3">
              <p>The Audit Report provides visual analytics and statistics about automation execution trends.</p>
              <h4 className="font-semibold mt-4">Time Range Views:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Daily:</strong> View execution data for the last 7 days</li>
                <li><strong>Weekly:</strong> See trends over the past 8 weeks</li>
                <li><strong>Monthly:</strong> Analyze data for the last 6 months</li>
              </ul>
              <h4 className="font-semibold mt-4">Visualizations:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Status Distribution (Pie Chart):</strong> Shows the breakdown of runs by status</li>
                <li><strong>Execution Trend (Bar Graph):</strong> Displays execution history over time
                  <ul className="list-disc list-inside ml-6 mt-1">
                    <li>Click status buttons in the legend to show/hide specific statuses</li>
                    <li>Each bar shows counts for Success (green), Failed (red), Running (blue), and Pending (yellow)</li>
                    <li>Hover over bars to see exact counts</li>
                  </ul>
                </li>
                <li><strong>Summary Cards:</strong> Quick stats showing Total, Success, Failed, Running, and Pending counts</li>
              </ul>
              <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
                💡 Use the interactive legend on the execution trend graph to toggle visibility of each status type for focused analysis.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: SettingsIcon,
      items: [
        {
          title: 'User Management',
          content: (
            <div className="space-y-3">
              <p>Manage users who have access to the automation platform.</p>
              <h4 className="font-semibold mt-4">Creating Users:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to Settings → Users tab</li>
                <li>Click "Create New User"</li>
                <li>Fill in name, email, and username</li>
                <li>Select a manager (optional)</li>
                <li>Choose a role (User or Admin)</li>
                <li>Set enabled/locked status</li>
              </ol>
              <h4 className="font-semibold mt-4">User Roles:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>User:</strong> Can browse and run automations</li>
                <li><strong>Admin:</strong> Full access including user management and settings</li>
              </ul>
            </div>
          )
        },
        {
          title: 'Groups',
          content: (
            <div className="space-y-3">
              <p>Organize users into groups for easier permission management.</p>
              <h4 className="font-semibold mt-4">Creating Groups:</h4>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Go to Settings → Groups tab</li>
                <li>Click "Create New Group"</li>
                <li>Enter a group name and description</li>
                <li>Add members from the user list</li>
              </ol>
            </div>
          )
        },
        {
          title: 'Namespaces',
          content: (
            <div className="space-y-3">
              <p>Namespaces help organize automations by category or team.</p>
              <h4 className="font-semibold mt-4">Managing Namespaces:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>View all namespaces in Settings → Namespaces tab</li>
                <li>Create new namespaces for different teams or projects</li>
                <li>Assign automations to namespaces when creating them</li>
                <li>Organize workflows by department or function</li>
              </ul>
            </div>
          )
        },
        {
          title: 'Credentials',
          content: (
            <div className="space-y-3">
              <p>Store and manage secure credentials used by automations.</p>
              <h4 className="font-semibold mt-4">Credential Types:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Ansible Vault:</strong> For Ansible playbooks</li>
                <li><strong>Machine (SSH):</strong> SSH credentials for remote machines</li>
                <li><strong>Network:</strong> Network device credentials</li>
                <li><strong>Cloud:</strong> Cloud provider credentials</li>
              </ul>
              <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>
                💡 Credentials are encrypted and securely stored. Never share credential values directly.
              </p>
            </div>
          )
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Topics',
      icon: Zap,
      items: [
        {
          title: 'Theme Customization',
          content: (
            <div className="space-y-3">
              <p>Toggle between light and dark themes using the theme switcher in the top-right corner.</p>
              <p>The platform automatically saves your preference.</p>
            </div>
          )
        },
        {
          title: 'Best Practices',
          content: (
            <div className="space-y-3">
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Use descriptive names for automations and schedules</li>
                <li>Test automations manually before scheduling them</li>
                <li>Organize automations with appropriate namespaces</li>
                <li>Review schedule execution logs regularly</li>
                <li>Keep credentials up to date</li>
                <li>Use groups to manage permissions efficiently</li>
              </ul>
            </div>
          )
        }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      section.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Documentation</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          Everything you need to know about using the Autoclik Automation Platform
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documentation..."
          className="w-full rounded-lg py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            focusRing: 'var(--primary)'
          }}
        />
      </div>

      {/* Documentation Sections */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--muted)' }}>No documentation found matching your search.</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const Icon = section.icon;
            const isExpanded = expandedSections[section.id];

            return (
              <div
                key={section.id}
                className="rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 flex items-center justify-between hover:opacity-80 transition-opacity"
                  style={{ borderBottom: isExpanded ? '1px solid var(--border)' : 'none' }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      {section.title}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}>
                      {section.items.length} {section.items.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                  ) : (
                    <ChevronRight className="h-5 w-5" style={{ color: 'var(--muted)' }} />
                  )}
                </button>

                {/* Section Content */}
                {isExpanded && (
                  <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                    {section.items.map((item, index) => (
                      <div key={index} className="p-6">
                        <h3 className="text-base font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                          <FileText className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                          {item.title}
                        </h3>
                        <div className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                          {item.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
