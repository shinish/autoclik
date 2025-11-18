'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Play, Search, Tag, Server, Clock, Filter, ChevronLeft, ChevronRight, FolderPlus, X } from 'lucide-react';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();
  const [catalogs, setCatalogs] = useState([]);
  const [allCatalogs, setAllCatalogs] = useState([]);
  const [namespaces, setNamespaces] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNamespaceModal, setShowNamespaceModal] = useState(false);
  const [namespaceFormData, setNamespaceFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#546aff',
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    namespaceId: '',
    environmentId: '',
    templateId: '',
    customBody: '',
    formSchema: '',
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(user);
    fetchData(user);
  }, []);

  const fetchData = async (user) => {
    try {
      setLoading(true);

      // Fetch catalogs (filtered by user permissions)
      const catalogsRes = await fetch(`/api/catalog?userEmail=${user.email || ''}`);
      const catalogsData = await catalogsRes.json();
      setCatalogs(Array.isArray(catalogsData) ? catalogsData : []);
      setAllCatalogs(Array.isArray(catalogsData) ? catalogsData : []);

      // Fetch namespaces
      const namespacesRes = await fetch('/api/namespaces');
      const namespacesData = await namespacesRes.json();
      setNamespaces(Array.isArray(namespacesData) ? namespacesData : []);

      // Fetch environments
      const environmentsRes = await fetch('/api/settings/environments');
      const environmentsData = await environmentsRes.json();
      setEnvironments(Array.isArray(environmentsData) ? environmentsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setCatalogs([]);
      setAllCatalogs([]);
      setNamespaces([]);
      setEnvironments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter catalogs
  useEffect(() => {
    let filtered = allCatalogs;

    // Search filter
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(catalog =>
        catalog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        catalog.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (catalog.tags && JSON.parse(catalog.tags).some(tag =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        ))
      );
    }

    // Namespace filter
    if (selectedNamespace !== 'all') {
      filtered = filtered.filter(catalog => catalog.namespaceId === selectedNamespace);
    }

    setCatalogs(filtered);
    setCurrentPage(1);
  }, [searchTerm, selectedNamespace, allCatalogs]);

  // Pagination
  const totalPages = Math.ceil(catalogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCatalogs = catalogs.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  const openAddModal = () => {
    setEditingCatalog(null);
    setFormData({
      name: '',
      description: '',
      tags: [],
      namespaceId: '',
      environmentId: '',
      templateId: '',
      customBody: '',
      formSchema: '',
    });
    setShowModal(true);
  };

  const openEditModal = (catalog) => {
    setEditingCatalog(catalog);
    setFormData({
      name: catalog.name,
      description: catalog.description || '',
      tags: catalog.tags ? JSON.parse(catalog.tags) : [],
      namespaceId: catalog.namespaceId,
      environmentId: catalog.environmentId,
      templateId: catalog.templateId,
      customBody: catalog.customBody || '',
      formSchema: catalog.formSchema || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        createdBy: currentUser?.email || 'system',
        performedBy: currentUser?.email || 'system',
      };

      if (editingCatalog) {
        // Update existing catalog
        const res = await fetch(`/api/catalog/${editingCatalog.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to update catalog');
        }
      } else {
        // Create new catalog
        const res = await fetch('/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || 'Failed to create catalog');
        }
      }

      setShowModal(false);
      fetchData(currentUser);
    } catch (error) {
      console.error('Error saving catalog:', error);
      alert(error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this catalog?')) return;

    try {
      const res = await fetch(`/api/catalog/${id}?performedBy=${currentUser?.email || 'system'}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete catalog');

      fetchData(currentUser);
    } catch (error) {
      console.error('Error deleting catalog:', error);
      alert('Failed to delete catalog');
    }
  };

  const handleExecute = (catalogId) => {
    router.push(`/catalog/${catalogId}/execute`);
  };

  const handleCreateNamespace = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/namespaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...namespaceFormData,
          createdBy: currentUser?.email || 'system',
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create namespace');
      }

      const newNamespace = await res.json();

      // Refresh namespaces list
      const namespacesRes = await fetch('/api/namespaces');
      const namespacesData = await namespacesRes.json();
      const updatedNamespaces = Array.isArray(namespacesData) ? namespacesData : [];
      setNamespaces(updatedNamespaces);

      // Auto-select the newly created namespace in the catalog form
      setFormData({ ...formData, namespaceId: newNamespace.id });

      // Reset form and close modal
      setNamespaceFormData({
        name: '',
        displayName: '',
        description: '',
        color: '#546aff',
      });
      setShowNamespaceModal(false);

      // Show success message
      alert(`Namespace "${newNamespace.displayName}" created successfully!`);
    } catch (error) {
      console.error('Error creating namespace:', error);
      alert(error.message);
    }
  };

  const getNamespaceName = (namespaceId) => {
    const namespace = namespaces.find(ns => ns.id === namespaceId);
    return namespace?.displayName || namespace?.name || 'Unknown';
  };

  const getNamespaceColor = (namespaceId) => {
    const namespace = namespaces.find(ns => ns.id === namespaceId);
    return namespace?.color || '#546aff';
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Catalog</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Browse and execute automation templates
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={Filter} onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          {currentUser?.role === 'admin' && (
            <Button variant="primary" icon={Plus} onClick={openAddModal}>
              Add Catalog Item
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, description, or tags..."
                  className="w-full rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    focusRing: 'var(--primary)'
                  }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Namespace
              </label>
              <select
                value={selectedNamespace}
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--primary)',
                  height: '42px'
                }}
              >
                <option value="all">All Namespaces</option>
                {namespaces.map(ns => (
                  <option key={ns.id} value={ns.id}>{ns.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Items Per Page
              </label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  focusRing: 'var(--primary)',
                  height: '42px'
                }}
              >
                <option value="5">5 per page</option>
                <option value="10">10 per page</option>
                <option value="25">25 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
          <div className="mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            Showing {catalogs.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, catalogs.length)} of {catalogs.length} catalog item{catalogs.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Catalog Table */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        <table className="w-full">
          <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Namespace
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                Environment
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
            {paginatedCatalogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
                  No catalog items found
                </td>
              </tr>
            ) : (
              paginatedCatalogs.map((catalog) => (
                <tr key={catalog.id} className="hover:opacity-90 transition-opacity">
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {catalog.name}
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    {catalog.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {catalog.tags && JSON.parse(catalog.tags).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: 'var(--bg)', color: 'var(--muted)' }}
                        >
                          <Tag className="h-3 w-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getNamespaceColor(catalog.namespaceId)}20`,
                        color: getNamespaceColor(catalog.namespaceId)
                      }}
                    >
                      {getNamespaceName(catalog.namespaceId)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    <div className="flex items-center gap-1">
                      <Server className="h-3 w-3" />
                      {catalog.environment?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                    {catalog.executions?.[0] ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(catalog.executions[0].startedAt).toLocaleDateString()}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button
                      onClick={() => handleExecute(catalog.id)}
                      className="p-2 rounded-lg transition-all hover:scale-110"
                      style={{
                        backgroundColor: 'var(--bg)',
                        color: 'var(--accent)'
                      }}
                      title="Execute"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => openEditModal(catalog)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                          backgroundColor: 'var(--bg)',
                          color: 'var(--accent)'
                        }}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: currentPage === pageNum ? 'var(--primary)' : 'var(--bg)',
                      color: currentPage === pageNum ? '#FFFFFF' : 'var(--text)'
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
              className="p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)'
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                {editingCatalog ? 'Edit Catalog Item' : 'Add Catalog Item'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingCatalog(null);
                  setFormData({
                    name: '',
                    description: '',
                    tags: [],
                    namespaceId: '',
                    environmentId: '',
                    templateId: '',
                    customBody: '',
                    formSchema: ''
                  });
                }}
                className="p-2 rounded-lg hover:bg-opacity-10 transition-colors"
                style={{ color: 'var(--muted)', backgroundColor: 'transparent' }}
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:opacity-70"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                    Namespace<span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNamespaceModal(true)}
                    className="text-xs flex items-center gap-1 px-2 py-1 rounded hover:opacity-80"
                    style={{ color: 'var(--primary)', backgroundColor: 'var(--bg)' }}
                  >
                    <FolderPlus className="h-3 w-3" />
                    Add Namespace
                  </button>
                </div>
                <select
                  required
                  value={formData.namespaceId}
                  onChange={(e) => setFormData({ ...formData, namespaceId: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="">Select namespace...</option>
                  {namespaces.map(ns => (
                    <option key={ns.id} value={ns.id}>{ns.displayName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Environment<span className="text-red-500">*</span>
                  {editingCatalog?.isLocked && (
                    <span className="ml-2 text-xs text-amber-500">(Locked)</span>
                  )}
                </label>
                <select
                  required
                  disabled={editingCatalog?.isLocked}
                  value={formData.environmentId}
                  onChange={(e) => setFormData({ ...formData, environmentId: e.target.value })}
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                >
                  <option value="">Select environment...</option>
                  {environments.map(env => (
                    <option key={env.id} value={env.id}>{env.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Template ID<span className="text-red-500">*</span>
                  {editingCatalog?.isLocked && (
                    <span className="ml-2 text-xs text-amber-500">(Locked)</span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  disabled={editingCatalog?.isLocked}
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  placeholder="AWX Job Template ID"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  {editingCatalog?.isLocked
                    ? 'Template ID cannot be changed after creation'
                    : 'This will be locked after saving'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Custom Request Body (JSON)
                </label>
                <textarea
                  value={formData.customBody}
                  onChange={(e) => setFormData({ ...formData, customBody: e.target.value })}
                  rows={6}
                  placeholder='{"extra_vars": {"variable": "{{form.fieldname}}"}}'
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  Use {'{{form.fieldname}}'} to reference form fields
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Form Schema (JSON)
                </label>
                <textarea
                  value={formData.formSchema}
                  onChange={(e) => setFormData({ ...formData, formSchema: e.target.value })}
                  rows={6}
                  placeholder='[{"name": "fieldname", "type": "text", "label": "Field Label", "required": true}]'
                  className="w-full rounded-lg px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  Define form fields that users will fill when executing
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  {editingCatalog ? 'Update Catalog' : 'Create Catalog'}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCatalog(null);
                    setFormData({
                      name: '',
                      description: '',
                      tags: [],
                      namespaceId: '',
                      environmentId: '',
                      templateId: '',
                      customBody: '',
                      formSchema: ''
                    });
                  }}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                  style={{
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Namespace Modal */}
      {showNamespaceModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg p-6" style={{ backgroundColor: 'var(--surface)' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--text)' }}>
              Add Namespace
            </h2>

            <form onSubmit={handleCreateNamespace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namespaceFormData.name}
                  onChange={(e) => {
                    // Auto-convert to lowercase and remove spaces
                    const cleanedValue = e.target.value.toLowerCase().replace(/\s+/g, '-');
                    setNamespaceFormData({ ...namespaceFormData, name: cleanedValue });
                  }}
                  placeholder="e.g., network-ops"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
                  Auto-converted to lowercase with hyphens (used in URLs)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Display Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namespaceFormData.displayName}
                  onChange={(e) => setNamespaceFormData({ ...namespaceFormData, displayName: e.target.value })}
                  placeholder="e.g., Network Operations"
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Description
                </label>
                <textarea
                  value={namespaceFormData.description}
                  onChange={(e) => setNamespaceFormData({ ...namespaceFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of this namespace..."
                  className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                  Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={namespaceFormData.color}
                    onChange={(e) => setNamespaceFormData({ ...namespaceFormData, color: e.target.value })}
                    className="h-10 w-20 rounded cursor-pointer"
                    style={{
                      border: '1px solid var(--border)',
                    }}
                  />
                  <input
                    type="text"
                    value={namespaceFormData.color}
                    onChange={(e) => setNamespaceFormData({ ...namespaceFormData, color: e.target.value })}
                    placeholder="#546aff"
                    className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary" className="flex-1">
                  Create Namespace
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNamespaceModal(false);
                    setNamespaceFormData({
                      name: '',
                      displayName: '',
                      description: '',
                      color: '#546aff',
                    });
                  }}
                  className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-red-50"
                  style={{
                    border: '1px solid #ef4444',
                    color: '#ef4444',
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
