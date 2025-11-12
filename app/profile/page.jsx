'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, X, Save, Lock, Key } from 'lucide-react';
import Button from '@/components/Button';
import { compressImageToBase64, getBase64Size, formatBytes } from '@/lib/imageCompression';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    location: '',
    department: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
        location: parsedUser.location || '',
        department: parsedUser.department || '',
      });

      // Fetch full profile data from API
      fetchProfile(parsedUser.id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProfile = async (userId) => {
    try {
      const res = await fetch(`/api/profile?userId=${userId}`);
      const data = await res.json();

      if (res.ok) {
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          location: data.location || '',
          department: data.department || '',
        });

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Compress image to base64 (max 200x200, quality 0.6)
      const base64 = await compressImageToBase64(file, 200, 200, 0.6);
      const size = getBase64Size(base64);

      console.log(`Compressed image size: ${formatBytes(size)}`);

      // Upload to API
      const res = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          photoBase64: base64,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Reload to update sidebar
        window.location.reload();
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm('Remove profile photo?')) return;

    try {
      setUploading(true);

      const res = await fetch(`/api/profile/photo?userId=${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Reload to update sidebar
        window.location.reload();
      } else {
        alert(data.error || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      alert('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setEditing(false);
        alert('Profile updated successfully');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true);

      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          ...passwordData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setChangingPassword(false);
        alert('Password changed successfully');
      } else {
        alert(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#4C12A1' }}></div>
          <p style={{ color: 'var(--muted)' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Profile
          </h1>
          <p style={{ color: 'var(--muted)' }}>
            Manage your profile information and photo
          </p>
        </div>

        {/* Profile Photo Section */}
        <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Profile Photo
          </h2>

          <div className="flex items-center gap-6">
            {/* Photo Preview */}
            <div className="relative">
              {user.profilePhoto ? (
                <img
                  src={user.profilePhoto}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                  style={{ border: '3px solid var(--border)' }}
                />
              ) : (
                <div
                  className="h-24 w-24 rounded-full flex items-center justify-center bg-orange-200"
                  style={{ border: '3px solid var(--border)' }}
                >
                  <User className="h-12 w-12 text-orange-700" />
                </div>
              )}

              {/* Upload Button Overlay */}
              <button
                onClick={handlePhotoClick}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 rounded-full shadow-lg hover:opacity-80 transition-opacity"
                style={{ backgroundColor: '#4C12A1' }}
              >
                <Camera className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Photo Actions */}
            <div className="flex-1">
              <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                Upload a new profile photo. Image will be compressed to 200x200px.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Camera}
                  onClick={handlePhotoClick}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Change Photo'}
                </Button>

                {user.profilePhoto && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Profile Information
            </h2>

            {!editing && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.firstName}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.lastName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.email}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Location
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.location || 'Not specified'}
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Department
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                />
              ) : (
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.department || 'Not specified'}
                </p>
              )}
            </div>

            {/* Read-only fields */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                Role
              </label>
              <p className="text-sm py-2 capitalize" style={{ color: 'var(--text)' }}>
                {user.role}
              </p>
            </div>

            {user.samAccountName && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Username
                </label>
                <p className="text-sm py-2" style={{ color: 'var(--text)' }}>
                  {user.samAccountName}
                </p>
              </div>
            )}

            {editing && (
              <div className="md:col-span-2 flex gap-3 pt-4">
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      firstName: user.firstName || '',
                      lastName: user.lastName || '',
                      email: user.email || '',
                      location: user.location || '',
                      department: user.department || '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" style={{ color: '#4C12A1' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Change Password
              </h2>
            </div>

            {!changingPassword && (
              <Button
                variant="primary"
                size="sm"
                icon={Key}
                onClick={() => setChangingPassword(true)}
              >
                Change Password
              </Button>
            )}
          </div>

          {changingPassword ? (
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Current Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword || ''}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  placeholder="Enter your current password"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  New Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword || ''}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  placeholder="Enter new password (minimum 6 characters)"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  Confirm New Password
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword || ''}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                  }}
                  placeholder="Re-enter new password"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Click "Change Password" to update your password. You'll need to provide your current password for security.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
