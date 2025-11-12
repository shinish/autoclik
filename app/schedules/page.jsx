'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronDown, Plus, Edit, Pause, Trash2, RotateCcw, Play, X } from 'lucide-react';
import Button from '@/components/Button';
import Toast from '@/components/Toast';

export default function SchedulesPage() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    automationId: '',
    frequency: 'Every day at 3:00 AM',
    cron: '0 3 * * *',
    status: 'active',
  });

  useEffect(() => {
    fetchSchedules();
    fetchAutomations();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setLoading(false);
    }
  };

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      setAutomations(data);
    } catch (error) {
      console.error('Error fetching automations:', error);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (res.ok) {
        fetchSchedules();
        setShowModal(false);
        setFormData({
          name: '',
          automationId: '',
          frequency: 'Every day at 3:00 AM',
          cron: '0 3 * * *',
          status: 'active',
        });
        setToast({ message: 'Schedule created successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleToggleStatus = async (schedule) => {
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...schedule,
          status: schedule.status === 'active' ? 'paused' : 'active',
        }),
      });

      if (res.ok) {
        fetchSchedules();
        const status = schedule.status === 'active' ? 'paused' : 'active';
        setToast({ message: `Schedule ${status === 'active' ? 'resumed' : 'paused'} successfully!`, type: 'success' });
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;

    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchSchedules();
        setToast({ message: 'Schedule deleted successfully!', type: 'success' });
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleRunNow = async (schedule) => {
    try {
      const res = await fetch(`/api/automations/${schedule.automationId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: JSON.parse(schedule.parameters || '{}'),
        }),
      });

      if (res.ok) {
        setToast({ message: 'Schedule executed successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to execute schedule', type: 'error' });
      }
    } catch (error) {
      console.error('Error running schedule:', error);
      setToast({ message: 'Error running schedule', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
          Active
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-600"></span>
        Paused
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Automation Schedules</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Manage your recurring automation tasks and their schedules.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
          Create New Schedule
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            placeholder="Search schedules..."
            className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              focusRing: 'var(--fis-green)'
            }}
          />
        </div>
      </div>

      {/* Schedules Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        {loading ? (
          <div className="p-12 text-center" style={{ color: 'var(--muted)' }}>Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center">
            <p className="mb-4" style={{ color: 'var(--muted)' }}>No schedules created yet</p>
            <Button variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
              Create Your First Schedule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Schedule Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Automation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody style={{ borderColor: 'var(--border)' }} className="divide-y">
                {schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:opacity-90" style={{ borderColor: 'var(--border)' }}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{schedule.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>{schedule.automation?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--muted)' }}>{schedule.frequency}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: 'var(--text)' }}>
                        {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(schedule.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {schedule.status === 'active' ? (
                          <button
                            onClick={() => handleToggleStatus(schedule)}
                            className="p-1.5 rounded transition-opacity hover:opacity-70"
                            style={{ color: 'var(--muted)' }}
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(schedule)}
                            className="p-1.5 rounded transition-opacity hover:opacity-70"
                            style={{ color: 'var(--muted)' }}
                            title="Resume"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRunNow(schedule)}
                          className="p-1.5 rounded transition-opacity hover:opacity-70"
                          style={{ color: 'var(--muted)' }}
                          title="Run Now"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-1.5 rounded transition-opacity hover:opacity-70"
                          style={{ color: 'var(--muted)' }}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg shadow-xl max-w-3xl w-full mx-4" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-lg font-light" style={{ color: 'var(--text)' }}>Create New Schedule</h2>
              <button
                onClick={() => setShowModal(false)}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Schedule Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Daily Server Check"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    focusRing: 'var(--fis-green)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Automation<span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.automationId}
                  onChange={(e) => setFormData({ ...formData, automationId: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    focusRing: 'var(--fis-green)',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Select automation...</option>
                  {automations.map((auto) => (
                    <option key={auto.id} value={auto.id}>
                      {auto.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Frequency
                </label>
                <input
                  type="text"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="Every day at 3:00 AM"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    focusRing: 'var(--fis-green)'
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Cron Expression
                </label>
                <input
                  type="text"
                  value={formData.cron}
                  onChange={(e) => setFormData({ ...formData, cron: e.target.value })}
                  placeholder="0 3 * * *"
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    focusRing: 'var(--fis-green)'
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>Use cron syntax (minute hour day month weekday)</p>
              </div>
              </div>

              {/* Cron Tips Section */}
              <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
                <h3 className="text-sm font-light mb-3" style={{ color: 'var(--text)' }}>Common Cron Patterns</h3>
                <div className="space-y-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <div className="flex justify-between">
                    <code className="font-mono" style={{ color: '#4C12A1' }}>0 * * * *</code>
                    <span>Every hour at minute 0</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-mono" style={{ color: '#4C12A1' }}>0 0 * * *</code>
                    <span>Daily at midnight (12:00 AM)</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-mono" style={{ color: '#4C12A1' }}>0 9 * * 1-5</code>
                    <span>Weekdays at 9:00 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-mono" style={{ color: '#4C12A1' }}>*/15 * * * *</code>
                    <span>Every 15 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <code className="font-mono" style={{ color: '#4C12A1' }}>0 0 1 * *</code>
                    <span>First day of month at midnight</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              <Button variant="danger" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={!formData.name || !formData.automationId}
              >
                Create Schedule
              </Button>
            </div>
          </div>
        </div>
      )}

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
