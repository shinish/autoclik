'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, Shield, X, Search, Eye, EyeOff, User, FileText, AlertCircle, AlertTriangle, Info, RefreshCw, Filter } from 'lucide-react';
import Button from '@/components/Button';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [namespaces, setNamespaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'namespace', 'user', 'group', 'permission', 'credential'
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // General settings state
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [proxyTestStatus, setProxyTestStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [proxyTestMessage, setProxyTestMessage] = useState('');
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [isEditingProxy, setIsEditingProxy] = useState(false);
  const [tempProxyEnabled, setTempProxyEnabled] = useState(false);
  const [tempProxyUrl, setTempProxyUrl] = useState('');
  const [tempProxyPort, setTempProxyPort] = useState('');
  const [tempProxyAuthEnabled, setTempProxyAuthEnabled] = useState(false);
  const [tempProxyUsername, setTempProxyUsername] = useState('');
  const [tempProxyPassword, setTempProxyPassword] = useState('');
  const [showProxyPassword, setShowProxyPassword] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [emailUsername, setEmailUsername] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [tempEmailEnabled, setTempEmailEnabled] = useState(false);
  const [tempSmtpHost, setTempSmtpHost] = useState('');
  const [tempSmtpPort, setTempSmtpPort] = useState('');
  const [tempEmailFrom, setTempEmailFrom] = useState('');
  const [tempEmailUsername, setTempEmailUsername] = useState('');
  const [tempEmailPassword, setTempEmailPassword] = useState('');
  const [emailTestStatus, setEmailTestStatus] = useState(null); // null, 'testing', 'success', 'error'
  const [emailTestMessage, setEmailTestMessage] = useState('');

  // Logs states
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logsAutoRefresh, setLogsAutoRefresh] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);

  // Search states
  const [namespaceSearch, setNamespaceSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);

  // Pagination states
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 20;

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    color: '#546aff',
    firstName: '',
    lastName: '',
    samAccountName: '',
    email: '',
    role: 'user',
    location: '',
    department: '',
    managerId: '',
    enabled: true,
    locked: false,
    isPredefined: false,
    modulePermissions: [],
    // Credential fields
    credentialType: 'vault',
    username: '',
    password: '',
    sshPrivateKey: '',
    vaultPassword: '',
  });

  const modules = [
    { name: 'dashboard', label: 'Dashboard' },
    { name: 'schedules', label: 'Schedules' },
    { name: 'settings', label: 'Settings' },
  ];

  useEffect(() => {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    fetchProxySettings();
    fetchEmailSettings();
    fetchNamespaces();
    fetchUsers();
    fetchGroups();
    fetchCredentials();
  }, []);

  // Close manager dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showManagerDropdown && !event.target.closest('.manager-dropdown-container')) {
        setShowManagerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManagerDropdown]);

  const testProxyConnection = async () => {
    setProxyTestStatus('testing');
    setProxyTestMessage('Testing proxy connection...');

    try {
      const testUrl = tempProxyUrl || proxyUrl;
      const testPort = tempProxyPort || proxyPort;

      if (!testUrl) {
        setProxyTestStatus('error');
        setProxyTestMessage('Proxy URL is required');
        return;
      }

      if (!testPort) {
        setProxyTestStatus('error');
        setProxyTestMessage('Proxy Port is required');
        return;
      }

      // Test if proxy is reachable by making a test request
      const response = await fetch('/api/proxy/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxyUrl: testUrl,
          proxyPort: testPort,
          proxyAuthEnabled: tempProxyAuthEnabled,
          proxyUsername: tempProxyUsername,
          proxyPassword: tempProxyPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProxyTestStatus('success');
        setProxyTestMessage('Proxy is reachable and working correctly');
      } else {
        setProxyTestStatus('error');
        setProxyTestMessage(data.message || 'Proxy connection failed');
      }
    } catch (error) {
      setProxyTestStatus('error');
      setProxyTestMessage(`Connection error: ${error.message}`);
    }

    // Clear status after 5 seconds
    setTimeout(() => {
      setProxyTestStatus(null);
      setProxyTestMessage('');
    }, 5000);
  };

  const fetchProxySettings = async () => {
    try {
      const [enabledRes, urlRes, portRes] = await Promise.all([
        fetch('/api/settings?key=proxy_enabled'),
        fetch('/api/settings?key=proxy_url'),
        fetch('/api/settings?key=proxy_port')
      ]);

      if (enabledRes.ok) {
        const data = await enabledRes.json();
        const enabled = data.value === 'true';
        setProxyEnabled(enabled);
        setTempProxyEnabled(enabled);
      }

      if (urlRes.ok) {
        const data = await urlRes.json();
        setProxyUrl(data.value || '');
        setTempProxyUrl(data.value || '');
      }

      if (portRes.ok) {
        const data = await portRes.json();
        setProxyPort(data.value || '');
        setTempProxyPort(data.value || '');
      }
    } catch (error) {
      console.error('Error fetching proxy settings:', error);
    }
  };

  const handleSaveProxy = async () => {
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_enabled',
            value: String(tempProxyEnabled),
            description: 'Enable or disable proxy for API requests',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_url',
            value: tempProxyUrl,
            description: 'Proxy server URL',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_port',
            value: tempProxyPort,
            description: 'Proxy server port',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_auth_enabled',
            value: String(tempProxyAuthEnabled),
            description: 'Enable proxy authentication',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_username',
            value: tempProxyUsername,
            description: 'Proxy authentication username',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'proxy_password',
            value: tempProxyPassword,
            description: 'Proxy authentication password',
          }),
        }),
      ]);

      setProxyEnabled(tempProxyEnabled);
      setProxyUrl(tempProxyUrl);
      setProxyPort(tempProxyPort);
      setIsEditingProxy(false);
    } catch (error) {
      console.error('Error saving proxy settings:', error);
    }
  };

  const handleCancelProxy = () => {
    setTempProxyEnabled(proxyEnabled);
    setTempProxyUrl(proxyUrl);
    setTempProxyPort(proxyPort);
    setTempProxyAuthEnabled(false);
    setTempProxyUsername('');
    setTempProxyPassword('');
    setShowProxyPassword(false);
    setIsEditingProxy(false);
  };

  const fetchEmailSettings = async () => {
    try {
      const [enabledRes, hostRes, portRes, fromRes, usernameRes, passwordRes] = await Promise.all([
        fetch('/api/settings?key=email_enabled'),
        fetch('/api/settings?key=smtp_host'),
        fetch('/api/settings?key=smtp_port'),
        fetch('/api/settings?key=email_from'),
        fetch('/api/settings?key=email_username'),
        fetch('/api/settings?key=email_password')
      ]);

      if (enabledRes.ok) {
        const data = await enabledRes.json();
        const enabled = data.value === 'true';
        setEmailEnabled(enabled);
        setTempEmailEnabled(enabled);
      }

      if (hostRes.ok) {
        const data = await hostRes.json();
        setSmtpHost(data.value || '');
        setTempSmtpHost(data.value || '');
      }

      if (portRes.ok) {
        const data = await portRes.json();
        setSmtpPort(data.value || '');
        setTempSmtpPort(data.value || '');
      }

      if (fromRes.ok) {
        const data = await fromRes.json();
        setEmailFrom(data.value || '');
        setTempEmailFrom(data.value || '');
      }

      if (usernameRes.ok) {
        const data = await usernameRes.json();
        setEmailUsername(data.value || '');
        setTempEmailUsername(data.value || '');
      }

      if (passwordRes.ok) {
        const data = await passwordRes.json();
        setEmailPassword(data.value || '');
        setTempEmailPassword(data.value || '');
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
    }
  };

  const handleSaveEmail = async () => {
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'email_enabled',
            value: String(tempEmailEnabled),
            description: 'Enable or disable email notifications',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'smtp_host',
            value: tempSmtpHost,
            description: 'SMTP server hostname',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'smtp_port',
            value: tempSmtpPort,
            description: 'SMTP server port',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'email_from',
            value: tempEmailFrom,
            description: 'Email sender address',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'email_username',
            value: tempEmailUsername,
            description: 'SMTP authentication username',
          }),
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'email_password',
            value: tempEmailPassword,
            description: 'SMTP authentication password',
          }),
        }),
      ]);

      setEmailEnabled(tempEmailEnabled);
      setSmtpHost(tempSmtpHost);
      setSmtpPort(tempSmtpPort);
      setEmailFrom(tempEmailFrom);
      setEmailUsername(tempEmailUsername);
      setEmailPassword(tempEmailPassword);
      setIsEditingEmail(false);
    } catch (error) {
      console.error('Error saving email settings:', error);
    }
  };

  const handleCancelEmail = () => {
    setTempEmailEnabled(emailEnabled);
    setTempSmtpHost(smtpHost);
    setTempSmtpPort(smtpPort);
    setTempEmailFrom(emailFrom);
    setTempEmailUsername(emailUsername);
    setTempEmailPassword(emailPassword);
    setIsEditingEmail(false);
  };

  const handleTestEmail = async () => {
    setEmailTestStatus('testing');
    setEmailTestMessage('');

    try {
      const testEmailAddress = currentUser?.email || 'admin@example.com';
      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpHost: tempSmtpHost,
          smtpPort: tempSmtpPort,
          emailFrom: tempEmailFrom,
          emailUsername: tempEmailUsername,
          emailPassword: tempEmailPassword,
          testRecipient: testEmailAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailTestStatus('success');
        setEmailTestMessage(data.message || `Test email sent successfully to ${testEmailAddress}`);
      } else {
        setEmailTestStatus('error');
        setEmailTestMessage(data.error || 'Failed to send test email');
      }
    } catch (error) {
      setEmailTestStatus('error');
      setEmailTestMessage(error.message || 'Error testing email configuration');
    }

    // Reset status after 5 seconds
    setTimeout(() => {
      setEmailTestStatus(null);
      setEmailTestMessage('');
    }, 5000);
  };

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/namespaces');
      const data = await res.json();
      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setNamespaces(data);
      } else {
        setNamespaces([]);
      }
    } catch (error) {
      console.error('Error fetching namespaces:', error);
      setNamespaces([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/groups');
      const data = await res.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchCredentials = async () => {
    try {
      const res = await fetch('/api/credentials');
      const data = await res.json();
      setCredentials(data);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const handleCreateNamespace = async () => {
    try {
      const res = await fetch('/api/namespaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchNamespaces();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating namespace:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        fetchUsers();
        setShowModal(false);
        resetForm();

        // Show default password if one was generated
        if (data.defaultPassword) {
          alert(`User created successfully!\n\nDefault Password: ${data.defaultPassword}\n\nPlease save this password and share it with the user. They should change it on first login.`);
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Failed to create user');
    }
  };

  const handleCreateGroup = async () => {
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchGroups();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const openEditUserModal = (user) => {
    setSelectedItem(user);
    setFormData({
      ...formData,
      firstName: user.firstName,
      lastName: user.lastName,
      samAccountName: user.samAccountName || '',
      email: user.email,
      role: user.role,
      location: user.location || '',
      department: user.department || '',
      managerId: user.managerId || '',
      enabled: user.enabled,
      locked: user.locked,
    });
    setModalType('edit-user');
    setShowModal(true);
  };

  const openResetPasswordModal = (user) => {
    setSelectedItem(user);
    setModalType('reset-password');
    setShowModal(true);
  };

  const openEditGroupModal = (group) => {
    setSelectedItem(group);
    setFormData({
      ...formData,
      name: group.name,
      description: group.description || '',
      groupMembers: group.members?.map(m => m.userId) || [],
      modulePermissions: group.modulePermissions || [],
    });
    setModalType('edit-group');
    setShowModal(true);
  };

  const handleResetPassword = async () => {
    // Validation
    if (!formData.password || !formData.confirmPassword) {
      alert('Please fill in both password fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/users/${selectedItem.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: formData.password,
          performedBy: currentUser.email || 'admin',
        }),
      });

      if (res.ok) {
        alert(`Password successfully reset for ${selectedItem.firstName} ${selectedItem.lastName}`);
        setShowModal(false);
        resetForm();
        setSelectedItem(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('An error occurred while resetting password');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/users/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          performedBy: currentUser.email || 'admin',
        }),
      });

      if (res.ok) {
        fetchUsers();
        setShowModal(false);
        resetForm();
        setSelectedItem(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };


  const handleUpdateGroup = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Update group basic info and permissions
      const res = await fetch(`/api/groups/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          modulePermissions: formData.modulePermissions,
          performedBy: currentUser.email || 'admin',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update group');
        return;
      }

      // Update group members
      const currentMembers = selectedItem.members?.map(m => m.userId) || [];
      const newMembers = formData.groupMembers || [];

      // Find members to add (in newMembers but not in currentMembers)
      const membersToAdd = newMembers.filter(userId => !currentMembers.includes(userId));

      // Find members to remove (in currentMembers but not in newMembers)
      const membersToRemove = currentMembers.filter(userId => !newMembers.includes(userId));

      // Add new members
      for (const userId of membersToAdd) {
        await fetch(`/api/groups/${selectedItem.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            performedBy: currentUser.email || 'admin',
          }),
        });
      }

      // Remove old members
      for (const userId of membersToRemove) {
        await fetch(`/api/groups/${selectedItem.id}/members?userId=${userId}&performedBy=${currentUser.email || 'admin'}`, {
          method: 'DELETE',
        });
      }

      // Refresh groups and close modal
      fetchGroups();
      setShowModal(false);
      resetForm();
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating group:', error);
      alert('Failed to update group');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/users/${userId}?performedBy=${currentUser.email || 'admin'}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const res = await fetch(`/api/groups/${groupId}?performedBy=${currentUser.email || 'admin'}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchGroups();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group');
    }
  };

  const handleCreateCredential = async () => {
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchCredentials();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating credential:', error);
    }
  };

  const handleDeleteNamespace = async (id) => {
    if (!confirm('Are you sure you want to delete this namespace?')) return;

    try {
      const res = await fetch(`/api/namespaces/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchNamespaces();
      }
    } catch (error) {
      console.error('Error deleting namespace:', error);
    }
  };

  const handleDeleteCredential = async (id) => {
    if (!confirm('Are you sure you want to delete this credential?')) return;

    try {
      const res = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchCredentials();
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    if (item) {
      setFormData({
        name: item.name || '',
        displayName: item.displayName || '',
        description: item.description || '',
        color: item.color || '#546aff',
        email: item.email || '',
        role: item.role || 'user',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      displayName: '',
      description: '',
      color: '#546aff',
      firstName: '',
      lastName: '',
      samAccountName: '',
      email: '',
      role: 'user',
      location: '',
      department: '',
      managerId: '',
      enabled: true,
      locked: false,
      isPredefined: false,
      modulePermissions: [],
      credentialType: 'vault',
      username: '',
      password: '',
      sshPrivateKey: '',
      vaultPassword: '',
    });
  };

  const handleSubmit = () => {
    if (modalType === 'namespace') {
      handleCreateNamespace();
    } else if (modalType === 'user') {
      handleCreateUser();
    } else if (modalType === 'edit-user') {
      handleUpdateUser();
    } else if (modalType === 'reset-password') {
      handleResetPassword();
    } else if (modalType === 'group') {
      handleCreateGroup();
    } else if (modalType === 'edit-group') {
      handleUpdateGroup();
    } else if (modalType === 'credential') {
      handleCreateCredential();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-light" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Manage namespaces, users, and access permissions</p>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80`}
            style={{
              borderColor: activeTab === 'general' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'general' ? 'var(--accent)' : 'var(--muted)'
            }}
          >
            General
          </button>
          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('namespaces')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80`}
                style={{
                  borderColor: activeTab === 'namespaces' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'namespaces' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                Namespaces
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80`}
                style={{
                  borderColor: activeTab === 'users' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'users' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('groups')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80`}
                style={{
                  borderColor: activeTab === 'groups' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'groups' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                Groups
              </button>
              <button
                onClick={() => setActiveTab('credentials')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80`}
                style={{
                  borderColor: activeTab === 'credentials' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'credentials' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                Credentials
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`border-b-2 pb-3 text-sm font-medium transition-colors hover:opacity-80 flex items-center gap-2`}
                style={{
                  borderColor: activeTab === 'logs' ? 'var(--accent)' : 'transparent',
                  color: activeTab === 'logs' ? 'var(--accent)' : 'var(--muted)'
                }}
              >
                <FileText className="h-4 w-4" />
                Logs
              </button>
            </>
          )}
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-light mb-2" style={{ color: 'var(--text)' }}>General Settings</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Configure {currentUser?.role === 'admin' ? 'general application' : 'your'} settings
            </p>
          </div>

          {/* Single Card for All Settings */}
          <div className="rounded-lg p-6" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            {/* Proxy Settings */}
            <div className={currentUser?.role === 'admin' ? 'py-6' : 'pb-6'} style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-light" style={{ color: 'var(--text)' }}>Proxy Configuration</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Configure proxy server for external API requests
                </p>
              </div>
              {!isEditingProxy && (
                <Button variant="outline" icon={Edit} onClick={() => setIsEditingProxy(true)}>
                  Edit
                </Button>
              )}
            </div>

            {isEditingProxy ? (
              <div className="space-y-4">
                {/* Proxy Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Enable Proxy</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      Use proxy server for API connections
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempProxyEnabled}
                      onChange={(e) => setTempProxyEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Proxy URL */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    Proxy URL
                  </label>
                  <input
                    type="text"
                    value={tempProxyUrl}
                    onChange={(e) => setTempProxyUrl(e.target.value)}
                    placeholder="http://proxy.example.com"
                    disabled={!tempProxyEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* Proxy Port */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    Proxy Port
                  </label>
                  <input
                    type="text"
                    value={tempProxyPort}
                    onChange={(e) => setTempProxyPort(e.target.value)}
                    placeholder="8080"
                    disabled={!tempProxyEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* Proxy Authentication Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)', opacity: !tempProxyEnabled ? 0.5 : 1 }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Proxy Authentication</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      Enable if proxy requires username and password
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempProxyAuthEnabled}
                      onChange={(e) => setTempProxyAuthEnabled(e.target.checked)}
                      disabled={!tempProxyEnabled}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                  </label>
                </div>

                {/* Proxy Username */}
                {tempProxyAuthEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Proxy Username
                    </label>
                    <input
                      type="text"
                      value={tempProxyUsername}
                      onChange={(e) => setTempProxyUsername(e.target.value)}
                      placeholder="Enter proxy username"
                      disabled={!tempProxyEnabled}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: '#00A859'
                      }}
                    />
                  </div>
                )}

                {/* Proxy Password */}
                {tempProxyAuthEnabled && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Proxy Password
                    </label>
                    <div className="relative">
                      <input
                        type={showProxyPassword ? "text" : "password"}
                        value={tempProxyPassword}
                        onChange={(e) => setTempProxyPassword(e.target.value)}
                        placeholder="Enter proxy password"
                        disabled={!tempProxyEnabled}
                        className="w-full rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: '#00A859'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowProxyPassword(!showProxyPassword)}
                        disabled={!tempProxyEnabled}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70 transition-opacity disabled:opacity-30"
                        style={{ color: 'var(--muted)' }}
                        title={showProxyPassword ? "Hide password" : "Show password"}
                      >
                        {showProxyPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Test Proxy Button */}
                {tempProxyEnabled && tempProxyUrl && tempProxyPort && (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={testProxyConnection}
                      disabled={proxyTestStatus === 'testing'}
                    >
                      {proxyTestStatus === 'testing' ? 'Testing...' : 'Test Proxy Connection'}
                    </Button>

                    {/* Test Status Message */}
                    {proxyTestMessage && (
                      <div
                        className="rounded-lg px-4 py-3 text-sm flex items-start gap-3"
                        style={{
                          backgroundColor: proxyTestStatus === 'success' ? '#e6f7ed' : proxyTestStatus === 'error' ? '#fef2f2' : 'var(--bg)',
                          border: `1px solid ${proxyTestStatus === 'success' ? '#00A859' : proxyTestStatus === 'error' ? '#dc2626' : 'var(--border)'}`,
                          color: proxyTestStatus === 'success' ? '#065f46' : proxyTestStatus === 'error' ? '#991b1b' : 'var(--text)'
                        }}
                      >
                        {proxyTestStatus === 'success' && (
                          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {proxyTestStatus === 'error' && (
                          <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                        <span>{proxyTestMessage}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="primary" onClick={handleSaveProxy}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={handleCancelProxy}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Proxy Status</p>
                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: proxyEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: proxyEnabled ? 'var(--success)' : '#6b7280'
                    }}
                  >
                    {proxyEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {proxyEnabled && (
                  <>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Proxy URL</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {proxyUrl || 'Not configured'}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Proxy Port</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {proxyPort || 'Not configured'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>

            {/* Email Settings */}
            <div className="py-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-light" style={{ color: 'var(--text)' }}>Email Configuration</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                  Configure SMTP settings for sending email notifications
                </p>
              </div>
              {!isEditingEmail && (
                <Button variant="outline" icon={Edit} onClick={() => setIsEditingEmail(true)}>
                  Edit
                </Button>
              )}
            </div>

            {isEditingEmail ? (
              <div className="space-y-4">
                {/* Email Enabled Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Enable Email Notifications</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                      Send email notifications for automation events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tempEmailEnabled}
                      onChange={(e) => setTempEmailEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-offset-2 peer-focus:ring-indigo-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* SMTP Host */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={tempSmtpHost}
                    onChange={(e) => setTempSmtpHost(e.target.value)}
                    placeholder="smtp.example.com"
                    disabled={!tempEmailEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* SMTP Port */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    SMTP Port
                  </label>
                  <input
                    type="text"
                    value={tempSmtpPort}
                    onChange={(e) => setTempSmtpPort(e.target.value)}
                    placeholder="587"
                    disabled={!tempEmailEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* Email From */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    From Email Address
                  </label>
                  <input
                    type="email"
                    value={tempEmailFrom}
                    onChange={(e) => setTempEmailFrom(e.target.value)}
                    placeholder="noreply@example.com"
                    disabled={!tempEmailEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* Email Username */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    SMTP Username
                  </label>
                  <input
                    type="text"
                    value={tempEmailUsername}
                    onChange={(e) => setTempEmailUsername(e.target.value)}
                    placeholder="smtp_user"
                    disabled={!tempEmailEnabled}
                    className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      focusRing: '#00A859'
                    }}
                  />
                </div>

                {/* Email Password */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                    SMTP Password
                  </label>
                  <div className="relative">
                    <input
                      type={showEmailPassword ? "text" : "password"}
                      value={tempEmailPassword}
                      onChange={(e) => setTempEmailPassword(e.target.value)}
                      placeholder="Enter SMTP password"
                      disabled={!tempEmailEnabled}
                      className="w-full rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: '#00A859'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword(!showEmailPassword)}
                      disabled={!tempEmailEnabled}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ color: 'var(--muted)' }}
                      title={showEmailPassword ? "Hide password" : "Show password"}
                    >
                      {showEmailPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Test Email Status Message */}
                {emailTestStatus && (
                  <div
                    className="rounded-lg p-4 flex items-start gap-3"
                    style={{
                      backgroundColor: emailTestStatus === 'success' ? 'rgba(34, 197, 94, 0.1)' : emailTestStatus === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                      border: `1px solid ${emailTestStatus === 'success' ? 'var(--success)' : emailTestStatus === 'error' ? 'var(--error)' : '#3b82f6'}`
                    }}
                  >
                    {emailTestStatus === 'testing' && (
                      <RefreshCw className="h-5 w-5 animate-spin" style={{ color: '#3b82f6' }} />
                    )}
                    {emailTestStatus === 'success' && (
                      <svg className="h-5 w-5" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {emailTestStatus === 'error' && (
                      <AlertCircle className="h-5 w-5" style={{ color: 'var(--error)' }} />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: emailTestStatus === 'success' ? 'var(--success)' : emailTestStatus === 'error' ? 'var(--error)' : '#3b82f6' }}>
                        {emailTestStatus === 'testing' ? 'Testing email configuration...' : emailTestMessage}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  <Button variant="primary" onClick={handleSaveEmail}>
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestEmail}
                    disabled={!tempEmailEnabled || emailTestStatus === 'testing' || !tempSmtpHost || !tempSmtpPort}
                  >
                    {emailTestStatus === 'testing' ? 'Testing...' : 'Test Email'}
                  </Button>
                  <Button variant="outline" onClick={handleCancelEmail}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'var(--bg)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Email Status</p>
                  <span
                    className="px-3 py-1 text-xs font-semibold rounded-full"
                    style={{
                      backgroundColor: emailEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(156, 163, 175, 0.1)',
                      color: emailEnabled ? 'var(--success)' : '#6b7280'
                    }}
                  >
                    {emailEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {emailEnabled && (
                  <>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>SMTP Host</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {smtpHost || 'Not configured'}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>SMTP Port</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {smtpPort || 'Not configured'}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>From Email</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {emailFrom || 'Not configured'}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>SMTP Username</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {emailUsername || 'Not configured'}
                      </p>
                    </div>
                    <div className="rounded-lg px-4 py-3" style={{ backgroundColor: 'var(--bg)' }}>
                      <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>SMTP Password</p>
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                        {emailPassword ? '••••••••••••••••' : 'Not configured'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            </div>

            {/* Info Box */}
            <div className="pt-6 rounded-lg p-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#3b82f6' }}>
                    <span className="text-white text-xs font-bold">ℹ</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-light mb-1" style={{ color: 'var(--muted)' }}>Configuration Priority</h4>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Settings saved here will be used for all catalog items. AWX Base URL and Token must be configured for automations to execute.
                    You can also override these settings per catalog item by specifying an API endpoint. Email notifications will be sent when enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Namespaces Tab */}
      {activeTab === 'namespaces' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Create and manage namespaces to organize your catalog items
            </p>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={namespaceSearch}
                  onChange={(e) => setNamespaceSearch(e.target.value)}
                  placeholder="Search namespaces..."
                  className="rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    minWidth: '250px',
                    focusRing: 'var(--accent)'
                  }}
                />
              </div>
              <Button variant="primary" icon={Plus} onClick={() => openModal('namespace')}>
                Create Namespace
              </Button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg)' }}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Namespace Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {namespaces.filter(namespace =>
                  namespace.name.toLowerCase().includes(namespaceSearch.toLowerCase()) ||
                  namespace.displayName.toLowerCase().includes(namespaceSearch.toLowerCase()) ||
                  (namespace.description && namespace.description.toLowerCase().includes(namespaceSearch.toLowerCase()))
                ).map((namespace) => (
                  <tr
                    key={namespace.id}
                    className="hover:bg-opacity-50 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: namespace.color + '20' }}
                        >
                          <span className="text-sm font-bold" style={{ color: namespace.color }}>
                            {namespace.displayName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{namespace.displayName}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{namespace.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {namespace.description || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {namespace.permissions?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal('permission', namespace)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            backgroundColor: 'var(--bg)',
                            color: 'var(--accent)'
                          }}
                          title="Manage Permissions"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteNamespace(namespace.id)}
                          className="p-2 rounded-lg transition-all hover:scale-110"
                          style={{
                            backgroundColor: 'var(--bg)',
                            color: '#ef4444'
                          }}
                          title="Delete Namespace"
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
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage users and their roles</p>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    minWidth: '250px',
                    focusRing: 'var(--accent)'
                  }}
                />
              </div>
              <Button variant="primary" icon={Plus} onClick={() => openModal('user')}>
                Add User
              </Button>
            </div>
          </div>

          {/* Calculate filtered and paginated users */}
          {(() => {
            const filteredUsers = users.filter(user =>
              user.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.samAccountName?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.department?.toLowerCase().includes(userSearch.toLowerCase()) ||
              user.location?.toLowerCase().includes(userSearch.toLowerCase())
            );

            const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
            const indexOfLastUser = userCurrentPage * usersPerPage;
            const indexOfFirstUser = indexOfLastUser - usersPerPage;
            const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

            return (
              <>
                {/* Users Table */}
                <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Username
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Location
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Department
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                      {currentUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-opacity-50 transition-colors"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)' }}>
                                <User className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                              </div>
                              <div>
                                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--muted)' }}>{user.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm" style={{ color: 'var(--text)' }}>
                              {user.samAccountName || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm" style={{ color: 'var(--text)' }}>
                              {user.email}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.enabled && !user.locked ? (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Active
                              </span>
                            ) : user.locked ? (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm" style={{ color: 'var(--text)' }}>
                              {user.location || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm" style={{ color: 'var(--text)' }}>
                              {user.department || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditUserModal(user)}
                                className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                              </button>
                              <button
                                onClick={() => openResetPasswordModal(user)}
                                className="p-1.5 rounded hover:bg-blue-100 transition-colors"
                                title="Reset password"
                              >
                                <Shield className="h-4 w-4" style={{ color: '#3b82f6' }} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-1.5 rounded hover:bg-red-100 transition-colors"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* No Results Message */}
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Users className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>No users found</p>
                  </div>
                )}

                {/* Pagination Controls */}
                {filteredUsers.length > usersPerPage && (
                  <div className="flex items-center justify-between mt-4 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                    {/* Showing X-Y of Z */}
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      Showing {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
                    </div>

                    {/* Pagination Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setUserCurrentPage(userCurrentPage - 1)}
                        disabled={userCurrentPage === 1}
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
                            (pageNum >= userCurrentPage - 1 && pageNum <= userCurrentPage + 1);

                          if (!showPage && pageNum === 2 && userCurrentPage > 3) {
                            return <span key={pageNum} className="px-2" style={{ color: 'var(--muted)' }}>...</span>;
                          }

                          if (!showPage && pageNum === totalPages - 1 && userCurrentPage < totalPages - 2) {
                            return <span key={pageNum} className="px-2" style={{ color: 'var(--muted)' }}>...</span>;
                          }

                          if (!showPage) {
                            return null;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setUserCurrentPage(pageNum)}
                              className="px-3 py-2 rounded-lg transition-all min-w-[40px]"
                              style={{
                                backgroundColor: userCurrentPage === pageNum ? 'var(--primary)' : 'var(--surface)',
                                border: `1px solid ${userCurrentPage === pageNum ? 'var(--primary)' : 'var(--border)'}`,
                                color: userCurrentPage === pageNum ? 'white' : 'var(--text)',
                                fontWeight: userCurrentPage === pageNum ? '600' : '400'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setUserCurrentPage(userCurrentPage + 1)}
                        disabled={userCurrentPage === totalPages}
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
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Create and manage user groups</p>
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups..."
                  className="rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    minWidth: '250px',
                    focusRing: 'var(--accent)'
                  }}
                />
              </div>
              <Button variant="primary" icon={Plus} onClick={() => openModal('group')}>
                Create Group
              </Button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Members
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {groups.filter(group =>
                  group.name?.toLowerCase().includes(groupSearch.toLowerCase()) ||
                  group.description?.toLowerCase().includes(groupSearch.toLowerCase())
                ).map((group) => (
                  <tr
                    key={group.id}
                    className="hover:bg-opacity-50 transition-colors"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
                          <Users className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{group.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        {group.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        {group.members?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditGroupModal(group)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Edit group"
                        >
                          <Edit className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                        </button>
                        {!group.isPredefined && (
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="p-1.5 rounded hover:bg-red-100 transition-colors"
                            title="Delete group"
                          >
                            <Trash2 className="h-4 w-4" style={{ color: '#ef4444' }} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Manage Ansible Vault and other credentials for catalog executions
            </p>
            <Button variant="primary" icon={Plus} onClick={() => openModal('credential')}>
              Add Credential
            </Button>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
            <table className="w-full">
              <thead style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase" style={{ color: 'var(--muted)' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {credentials.map((credential) => (
                  <tr key={credential.id} className="hover:opacity-90 transition-opacity">
                    <td className="px-6 py-4 text-sm font-medium" style={{ color: 'var(--text)' }}>
                      {credential.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          credential.credentialType === 'vault'
                            ? 'bg-purple-100 text-purple-700'
                            : credential.credentialType === 'machine'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {credential.credentialType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                      {credential.username || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'var(--muted)' }}>
                      {credential.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteCredential(credential.id)}
                        className="p-2 rounded-lg transition-all hover:scale-110"
                        style={{
                          backgroundColor: 'var(--bg)',
                          color: '#ef4444'
                        }}
                        title="Delete Credential"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <LogsTabContent
          logs={logs}
          setLogs={setLogs}
          logsLoading={logsLoading}
          setLogsLoading={setLogsLoading}
          logFilter={logFilter}
          setLogFilter={setLogFilter}
          logsAutoRefresh={logsAutoRefresh}
          setLogsAutoRefresh={setLogsAutoRefresh}
          logsTotal={logsTotal}
          setLogsTotal={setLogsTotal}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`rounded-lg shadow-xl w-full mx-4 max-h-[90vh] overflow-y-auto ${modalType === 'group' ? 'max-w-2xl' : 'max-w-md'}`} style={{ backgroundColor: 'var(--surface)' }}>
            <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                {modalType === 'namespace' && 'Create Namespace'}
                {modalType === 'user' && 'Add User'}
                {modalType === 'edit-user' && 'Edit User'}
                {modalType === 'reset-password' && 'Reset Password'}
                {modalType === 'group' && 'Create Group'}
                {modalType === 'edit-group' && 'Edit Group'}
                {modalType === 'credential' && 'Add Credential'}
                {modalType === 'permission' && `Manage Permissions: ${selectedItem?.displayName}`}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="hover:opacity-70 transition-opacity"
                style={{ color: 'var(--muted)' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {modalType === 'namespace' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Name (Identifier)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="infra"
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
                      Display Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="Infrastructure"
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
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Automations related to infrastructure management"
                      rows={3}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                      style={{ border: '1px solid var(--border)' }}
                    />
                  </div>
                </>
              )}

              {(modalType === 'user' || modalType === 'edit-user') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      First Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="John"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Last Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Username (SAM)<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.samAccountName}
                      onChange={(e) => setFormData({ ...formData, samAccountName: e.target.value })}
                      placeholder="jdoe"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Email<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="New York Office"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Engineering"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Manager - Searchable Dropdown */}
                  <div className="relative manager-dropdown-container">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Manager</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={managerSearch}
                        onChange={(e) => {
                          setManagerSearch(e.target.value);
                          setShowManagerDropdown(true);
                        }}
                        onFocus={() => setShowManagerDropdown(true)}
                        placeholder={
                          formData.managerId
                            ? users.find(u => u.id === formData.managerId)?.name || 'Search managers...'
                            : 'Search managers...'
                        }
                        className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: 'var(--accent)'
                        }}
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted)' }} />
                    </div>

                    {/* Selected Manager Display */}
                    {formData.managerId && !showManagerDropdown && (
                      <div className="mt-2 p-2 rounded-lg flex items-center justify-between" style={{ backgroundColor: 'rgba(76, 18, 161, 0.1)', border: '1px solid rgba(76, 18, 161, 0.2)' }}>
                        <span className="text-sm" style={{ color: 'var(--text)' }}>
                          {users.find(u => u.id === formData.managerId)?.firstName} {users.find(u => u.id === formData.managerId)?.lastName}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, managerId: '' });
                            setManagerSearch('');
                          }}
                          className="text-xs hover:opacity-70"
                          style={{ color: 'var(--muted)' }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Dropdown List */}
                    {showManagerDropdown && (
                      <div
                        className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-lg shadow-lg"
                        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, managerId: '' });
                            setManagerSearch('');
                            setShowManagerDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-opacity"
                          style={{ borderBottom: '1px solid var(--border)' }}
                        >
                          <span style={{ color: 'var(--muted)' }}>No Manager</span>
                        </button>
                        {users
                          .filter(user =>
                            user.firstName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                            user.lastName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                            user.name?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                            user.email?.toLowerCase().includes(managerSearch.toLowerCase())
                          )
                          .map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, managerId: user.id });
                                setManagerSearch('');
                                setShowManagerDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm hover:opacity-80 transition-opacity"
                              style={{
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: formData.managerId === user.id ? 'rgba(76, 18, 161, 0.1)' : 'transparent'
                              }}
                            >
                              <div>
                                <div className="font-medium" style={{ color: 'var(--text)' }}>
                                  {user.firstName} {user.lastName}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                                  {user.email}
                                </div>
                              </div>
                            </button>
                          ))}
                        {users.filter(user =>
                          user.firstName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                          user.lastName?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                          user.name?.toLowerCase().includes(managerSearch.toLowerCase()) ||
                          user.email?.toLowerCase().includes(managerSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                            No managers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {/* Password - Only for Add User */}
                  {modalType === 'user' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                        Password<span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Enter password"
                          className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text)',
                            focusRing: 'var(--accent)'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            // Generate a random strong password
                            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                            const length = 12;
                            let password = '';
                            for (let i = 0; i < length; i++) {
                              password += chars.charAt(Math.floor(Math.random() * chars.length));
                            }
                            setFormData({ ...formData, password });
                          }}
                          className="px-4 py-2.5 text-sm font-medium rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                          style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                        >
                          Generate
                        </button>
                      </div>
                      <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                        Minimum 8 characters required. Click "Generate" for a secure password.
                      </p>
                    </div>
                  )}

                  {/* Enabled */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Enabled</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabled}
                        onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>

                  {/* Locked */}
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                    <label className="text-sm font-medium" style={{ color: 'var(--text)' }}>Locked</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.locked}
                        onChange={(e) => setFormData({ ...formData, locked: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {modalType === 'group' && (
                <>
                  {/* Row 1 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Group Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="DevOps Team"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Team responsible for DevOps operations"
                      rows={2}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                    <input
                      type="checkbox"
                      id="isPredefined"
                      checked={formData.isPredefined}
                      onChange={(e) => setFormData({ ...formData, isPredefined: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="isPredefined" className="text-sm font-medium cursor-pointer" style={{ color: 'var(--text)' }}>
                      Predefined System Group
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                      Module Permissions
                    </label>
                    <div className="space-y-3 p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                      {modules.map((module) => {
                        const perms = formData.modulePermissions.find(p => p.module === module.name) || {
                          module: module.name,
                          canRead: true,
                          canWrite: false,
                          canDelete: false
                        };

                        const updateModulePermission = (permission, value) => {
                          const updated = formData.modulePermissions.filter(p => p.module !== module.name);
                          updated.push({ ...perms, [permission]: value });
                          setFormData({ ...formData, modulePermissions: updated });
                        };

                        return (
                          <div key={module.name} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>{module.label}</p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canRead}
                                  onChange={(e) => updateModulePermission('canRead', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Read</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canWrite}
                                  onChange={(e) => updateModulePermission('canWrite', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Write</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canDelete}
                                  onChange={(e) => updateModulePermission('canDelete', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'edit-group' && (
                <>
                  {/* Row 1 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Group Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="DevOps Team"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Team responsible for DevOps operations"
                      rows={2}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {/* Group Members Section */}
                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                      Group Members
                    </label>
                    <div className="space-y-3 p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                      {/* Add Member Dropdown */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                          Add Member
                        </label>
                        <select
                          value=""
                          onChange={(e) => {
                            const userId = e.target.value;
                            if (userId && !formData.groupMembers?.includes(userId)) {
                              setFormData({
                                ...formData,
                                groupMembers: [...(formData.groupMembers || []), userId]
                              });
                            }
                          }}
                          className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                          style={{
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--bg)',
                            color: 'var(--text)',
                            focusRing: 'var(--accent)',
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: 'right 0.5rem center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: '1.5em 1.5em',
                            paddingRight: '2.5rem'
                          }}
                        >
                          <option value="">Select a user to add...</option>
                          {users
                            .filter(u => !formData.groupMembers?.includes(u.id))
                            .map(user => (
                              <option key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </option>
                            ))
                          }
                        </select>
                      </div>

                      {/* Current Members List */}
                      <div>
                        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
                          Current Members ({formData.groupMembers?.length || 0})
                        </label>
                        {formData.groupMembers && formData.groupMembers.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {formData.groupMembers.map(userId => {
                              const user = users.find(u => u.id === userId);
                              if (!user) return null;
                              return (
                                <div
                                  key={userId}
                                  className="flex items-center justify-between p-2 rounded"
                                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                                >
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" style={{ color: 'var(--muted)' }} />
                                    <div>
                                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                        {user.name}
                                      </p>
                                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        {user.email}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        groupMembers: formData.groupMembers.filter(id => id !== userId)
                                      });
                                    }}
                                    className="p-1.5 rounded hover:bg-red-50 transition-colors"
                                    title="Remove member"
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
                            No members in this group yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                      Module Permissions
                    </label>
                    <div className="space-y-3 p-4 rounded-lg" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg)' }}>
                      {modules.map((module) => {
                        const perms = formData.modulePermissions?.find(p => p.module === module.name) || {
                          module: module.name,
                          canRead: true,
                          canWrite: false,
                          canDelete: false
                        };

                        const updateModulePermission = (permission, value) => {
                          const updated = (formData.modulePermissions || []).filter(p => p.module !== module.name);
                          updated.push({ ...perms, [permission]: value });
                          setFormData({ ...formData, modulePermissions: updated });
                        };

                        return (
                          <div key={module.name} className="p-3 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
                            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>{module.label}</p>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canRead}
                                  onChange={(e) => updateModulePermission('canRead', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Read</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canWrite}
                                  onChange={(e) => updateModulePermission('canWrite', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Write</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={perms.canDelete}
                                  onChange={(e) => updateModulePermission('canDelete', e.target.checked)}
                                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                />
                                <span className="text-xs" style={{ color: 'var(--muted)' }}>Delete</span>
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {modalType === 'credential' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Name<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ansible Vault Password"
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description of credential"
                      rows={2}
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
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Credential Type<span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.credentialType}
                      onChange={(e) => setFormData({ ...formData, credentialType: e.target.value })}
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 appearance-none"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)',
                        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                        backgroundPosition: 'right 0.5rem center',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="vault">Ansible Vault</option>
                      <option value="machine">Machine (SSH)</option>
                      <option value="network">Network</option>
                      <option value="cloud">Cloud</option>
                    </select>
                  </div>
                  {formData.credentialType === 'machine' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="ansible"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: 'var(--accent)'
                        }}
                      />
                    </div>
                  )}
                  {formData.credentialType === 'vault' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                        Vault Password<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={formData.vaultPassword}
                        onChange={(e) => setFormData({ ...formData, vaultPassword: e.target.value })}
                        placeholder="Enter vault password"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: 'var(--accent)'
                        }}
                      />
                      <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                        This password will be encrypted and stored securely
                      </p>
                    </div>
                  )}
                  {formData.credentialType === 'machine' && (
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Password</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: 'var(--accent)'
                        }}
                      />
                    </div>
                  )}
                </>
              )}

              {modalType === 'reset-password' && (
                <>
                  <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <p className="text-sm" style={{ color: 'var(--text)' }}>
                      <strong>User:</strong> {selectedItem?.firstName} {selectedItem?.lastName} ({selectedItem?.email})
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      New Password<span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter new password"
                        className="flex-1 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                        style={{
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--text)',
                          focusRing: 'var(--accent)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          // Generate a random strong password
                          const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
                          const length = 12;
                          let password = '';
                          for (let i = 0; i < length; i++) {
                            password += chars.charAt(Math.floor(Math.random() * chars.length));
                          }
                          setFormData({ ...formData, password });
                        }}
                        className="px-4 py-2.5 text-sm font-medium rounded-lg hover:opacity-90 transition-all whitespace-nowrap"
                        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                      >
                        Suggest Password
                      </button>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                      Click "Suggest Password" to generate a secure random password
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                      Confirm New Password<span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword || ''}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="w-full rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        color: 'var(--text)',
                        focusRing: 'var(--accent)'
                      }}
                    />
                  </div>

                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600">Passwords do not match</p>
                    </div>
                  )}
                </>
              )}

              {modalType === 'permission' && (
                <PermissionManager namespace={selectedItem} users={users} groups={groups} />
              )}
            </div>

            {modalType !== 'permission' && (
              <div className="p-6 flex justify-end gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                <Button
                  variant="danger"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                  {modalType === 'namespace' && 'Create Namespace'}
                  {modalType === 'user' && 'Add User'}
                  {modalType === 'edit-user' && 'Update User'}
                  {modalType === 'reset-password' && 'Reset Password'}
                  {modalType === 'group' && 'Create Group'}
                  {modalType === 'edit-group' && 'Update Group'}
                  {modalType === 'credential' && 'Add Credential'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionManager({ namespace, users, groups }) {
  const [permissions, setPermissions] = useState([]);
  const [selectedType, setSelectedType] = useState('user');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [permissionSettings, setPermissionSettings] = useState({
    canRead: true,
    canWrite: false,
    canExecute: false,
    canAdmin: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (namespace) {
      setPermissions(namespace.permissions || []);
    }
  }, [namespace]);

  const handleAddPermission = async () => {
    // Clear previous messages
    setError('');
    setSuccess('');

    // Validation
    if (!selectedEntity) {
      setError('Please select a user or group');
      return;
    }

    setLoading(true);

    try {
      const body = {
        ...permissionSettings,
        [selectedType === 'user' ? 'userId' : 'groupId']: selectedEntity,
      };

      const res = await fetch(`/api/namespaces/${namespace.id}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const newPermission = await res.json();
        setPermissions([...permissions, newPermission]);
        setSelectedEntity('');
        setPermissionSettings({
          canRead: true,
          canWrite: false,
          canExecute: false,
          canAdmin: false,
        });
        setSuccess('Permission added successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add permission');
      }
    } catch (error) {
      console.error('Error adding permission:', error);
      setError('An error occurred while adding permission');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId) => {
    try {
      const res = await fetch(
        `/api/namespaces/${namespace.id}/permissions?permissionId=${permissionId}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        setPermissions(permissions.filter((p) => p.id !== permissionId));
      }
    } catch (error) {
      console.error('Error removing permission:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Permission Form */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Add Permission</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedType('user')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium ${
                selectedType === 'user'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              User
            </button>
            <button
              onClick={() => setSelectedType('group')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 text-sm font-medium ${
                selectedType === 'group'
                  ? 'border-primary-600 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300'
              }`}
            >
              Group
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select {selectedType === 'user' ? 'User' : 'Group'}
          </label>
          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="">Choose...</option>
            {selectedType === 'user'
              ? users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))
              : groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissionSettings.canRead}
                onChange={(e) =>
                  setPermissionSettings({ ...permissionSettings, canRead: e.target.checked })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Read - View automations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissionSettings.canWrite}
                onChange={(e) =>
                  setPermissionSettings({ ...permissionSettings, canWrite: e.target.checked })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Write - Create/edit automations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissionSettings.canExecute}
                onChange={(e) =>
                  setPermissionSettings({ ...permissionSettings, canExecute: e.target.checked })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Execute - Run automations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissionSettings.canAdmin}
                onChange={(e) =>
                  setPermissionSettings({ ...permissionSettings, canAdmin: e.target.checked })
                }
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Admin - Full control</span>
            </label>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <Button
          variant="primary"
          onClick={handleAddPermission}
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Permission'}
        </Button>
      </div>

      {/* Existing Permissions */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="font-medium text-gray-900 mb-3">Current Permissions</h3>
        <div className="space-y-2">
          {permissions.length === 0 ? (
            <p className="text-sm text-gray-500">No permissions set</p>
          ) : (
            permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center justify-between p-3 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {perm.user ? perm.user.name : perm.group?.name}
                    <span className="ml-2 text-xs text-gray-500">
                      ({perm.user ? 'User' : 'Group'})
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      perm.canRead && 'Read',
                      perm.canWrite && 'Write',
                      perm.canExecute && 'Execute',
                      perm.canAdmin && 'Admin',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleRemovePermission(perm.id)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Logs Tab Component
function LogsTabContent({
  logs,
  setLogs,
  logsLoading,
  setLogsLoading,
  logFilter,
  setLogFilter,
  logsAutoRefresh,
  setLogsAutoRefresh,
  logsTotal,
  setLogsTotal
}) {
  useEffect(() => {
    fetchLogs();
  }, [logFilter]);

  useEffect(() => {
    if (logsAutoRefresh) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [logsAutoRefresh, logFilter]);

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const levelParam = logFilter !== 'all' ? `&level=${logFilter}` : '';
      const response = await fetch(`/api/logs?limit=100${levelParam}`);
      const data = await response.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
        setLogsTotal(0);
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="h-5 w-5" style={{ color: '#ef4444' }} />;
      case 'WARN':
        return <AlertTriangle className="h-5 w-5" style={{ color: '#f59e0b' }} />;
      case 'INFO':
        return <Info className="h-5 w-5" style={{ color: '#3b82f6' }} />;
      default:
        return <Info className="h-5 w-5" style={{ color: 'var(--success)' }} />;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR':
        return { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#dc2626' };
      case 'WARN':
        return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#d97706' };
      case 'INFO':
        return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#2563eb' };
      default:
        return { bg: 'rgba(16, 185, 129, 0.1)', border: 'var(--success)', text: '#059669' };
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (logsLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-light mb-2" style={{ color: 'var(--text)' }}>
          System Logs
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Monitor automation execution errors and system events
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" style={{ color: 'var(--muted)' }} />
          <div className="flex gap-2">
            {['all', 'ERROR', 'WARN', 'INFO'].map((level) => (
              <button
                key={level}
                onClick={() => setLogFilter(level)}
                className="px-4 py-2 rounded-lg transition-all text-sm"
                style={{
                  backgroundColor: logFilter === level ? 'var(--accent)' : 'var(--surface)',
                  color: logFilter === level ? 'white' : 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                {level === 'all' ? 'All Logs' : level}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {logs.length} of {logsTotal} logs
          </span>
          <button
            onClick={() => setLogsAutoRefresh(!logsAutoRefresh)}
            className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all text-sm"
            style={{
              backgroundColor: logsAutoRefresh ? 'var(--accent)' : 'var(--surface)',
              color: logsAutoRefresh ? 'white' : 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            <RefreshCw className={`h-4 w-4 ${logsAutoRefresh ? 'animate-spin' : ''}`} />
            Auto
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 text-sm"
            style={{
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-2 rounded-lg flex items-center gap-2 transition-all hover:opacity-80 text-sm"
            style={{
              backgroundColor: '#ef4444',
              color: 'white',
              border: '1px solid #dc2626',
            }}
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div
          className="p-12 rounded-lg text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Info className="h-16 w-16 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
          <h3 className="text-xl font-light mb-2" style={{ color: 'var(--text)' }}>
            No logs found
          </h3>
          <p style={{ color: 'var(--muted)' }}>
            {logFilter === 'all'
              ? 'No logs have been recorded yet. Try running an automation.'
              : `No ${logFilter} logs found. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {logs.map((log, index) => {
            const colors = getLevelColor(log.level);
            return (
              <div
                key={index}
                className="p-4 rounded-lg"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <div className="flex items-start gap-3">
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="font-medium text-sm"
                        style={{ color: colors.text }}
                      >
                        {log.message}
                      </h3>
                      <span
                        className="text-xs whitespace-nowrap ml-2"
                        style={{ color: 'var(--muted)' }}
                      >
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.data && (
                      <pre
                        className="text-xs p-3 rounded overflow-x-auto"
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          color: colors.text,
                          fontFamily: 'monospace',
                        }}
                      >
                        {typeof log.data === 'string'
                          ? log.data
                          : JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
