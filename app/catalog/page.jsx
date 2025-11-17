'use client';

import { Search, X, Play, ChevronLeft, ChevronRight, Eye, Trash2, Plus } from 'lucide-react';
import Button from '@/components/Button';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();
  const [automations, setAutomations] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ID of automation to delete
  const [isAdmin, setIsAdmin] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAutomations();
    // Check if user is admin from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'admin');
  }, []);

  const fetchAutomations = async () => {
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      setAutomations(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching automations:', error);
      setAutomations([]);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Remove from list and close confirmation
        setAutomations(automations.filter(a => a.id !== id));
        setDeleteConfirm(null);
      } else {
        console.error('Failed to delete automation');
      }
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const filteredAutomations = automations
    .filter((auto) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = !search ||
        auto.name.toLowerCase().includes(searchLower) ||
        auto.description?.toLowerCase().includes(searchLower) ||
        auto.namespace.toLowerCase().includes(searchLower);

      const matchesCategory = selectedCategory === 'All' || auto.namespace === selectedCategory;

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // Featured/pinned items come first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredAutomations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAutomations = filteredAutomations.slice(startIndex, endIndex);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory]);

  const categories = ['All', ...new Set(Array.isArray(automations) ? automations.map(a => a.namespace) : [])];

  const handleViewDetails = (automation) => {
    router.push(`/catalog/${automation.id}`);
  };

  const handleRun = (automation) => {
    router.push(`/catalog/${automation.id}/run`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Catalog</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Browse and run automations from across your organization
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => router.push('/catalog/new')}
          >
            Add New Catalog Item
          </Button>
        )}
      </div>

      {/* Search Bar and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search automations..."
            className="w-full rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              focusRing: 'var(--primary)'
            }}
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            focusRing: 'var(--primary)'
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAutomations.length)} of {filteredAutomations.length} automations
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--muted)' }}>Loading automations...</p>
        </div>
      ) : filteredAutomations.length === 0 ? (
        <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--muted)' }}>No automations found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg)' }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Namespace
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Runs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {currentAutomations.map((automation) => {
                  return (
                    <tr
                      key={automation.id}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                      onClick={() => handleViewDetails(automation)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {automation.name}
                          </span>
                          {automation.pinned && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded" style={{ backgroundColor: 'rgba(251, 191, 36, 0.12)', color: '#f59e0b' }}>
                              Featured
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 text-xs font-medium rounded-md"
                          style={{ backgroundColor: 'rgba(76, 18, 161, 0.12)', color: 'var(--primary)' }}
                        >
                          {automation.namespace}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm line-clamp-2 max-w-md" style={{ color: 'var(--muted)' }}>
                          {automation.description || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                          {automation.executionCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: 'var(--muted)' }}>
                          {automation.lastExecutedAt
                            ? new Date(automation.lastExecutedAt).toLocaleDateString()
                            : 'Never'
                          }
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(automation);
                            }}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              backgroundColor: 'var(--bg)',
                              color: 'var(--primary)'
                            }}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRun(automation);
                            }}
                            className="p-2 rounded-lg transition-all hover:scale-110"
                            style={{
                              backgroundColor: 'var(--primary)',
                              color: 'white'
                            }}
                            title="Run Automation"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirm(automation.id);
                              }}
                              className="p-2 rounded-lg transition-all hover:scale-110"
                              style={{
                                backgroundColor: '#ef4444',
                                color: 'white'
                              }}
                              title="Delete Automation"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)'
                  }}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                          style={{
                            backgroundColor: currentPage === page ? 'var(--primary)' : 'var(--surface)',
                            color: currentPage === page ? 'white' : 'var(--text)',
                            border: `1px solid ${currentPage === page ? 'var(--primary)' : 'var(--border)'}`
                          }}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} style={{ color: 'var(--muted)' }}>...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)'
                  }}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          automation={automations.find(a => a.id === deleteConfirm)}
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}

function DeleteConfirmModal({ automation, onConfirm, onCancel }) {
  if (!automation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="p-6 flex items-start gap-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="p-3 rounded-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <Trash2 className="h-6 w-6" style={{ color: '#ef4444' }} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Delete Automation
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            Are you sure you want to delete the automation <span className="font-semibold">"{automation.name}"</span>?
          </p>
          <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
              This will also delete:
            </p>
            <ul className="text-xs space-y-1" style={{ color: 'var(--text)' }}>
              <li>• All execution history ({automation.executionCount || 0} runs)</li>
              <li>• All scheduled runs</li>
              <li>• All associated data</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
            style={{ backgroundColor: '#ef4444', color: 'white' }}
          >
            Delete Automation
          </button>
        </div>
      </div>
    </div>
  );
}
