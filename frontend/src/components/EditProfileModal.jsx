import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { X, UserCheck, Trash2, AlertCircle } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const EditProfileModal = ({ isOpen, onClose, profileToEdit }) => {
  const { updateProfile, deleteProfile, profiles } = useProfile();
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Self',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profileToEdit) {
      setFormData({
        name: profileToEdit.name || '',
        relationship: profileToEdit.relationship || 'Self',
        date_of_birth: profileToEdit.date_of_birth || '',
        gender: profileToEdit.gender || 'Male',
        blood_group: profileToEdit.blood_group || 'O+'
      });
      setError('');
    }
  }, [profileToEdit, isOpen]);

  if (!isOpen || !profileToEdit) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Profile name is required');
      return;
    }

    setSubmitting(true);
    try {
      await updateProfile(profileToEdit.id, formData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrigger = () => {
    if (profiles.length <= 1) {
      setError("Cannot delete the primary profile when only 1 profile exists.");
      return;
    }
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteProfile(profileToEdit.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete profile");
      setShowConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '16px'
      }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck color="var(--accent-sky)" size={22} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Edit Member Profile</h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: 'var(--accent-rose)',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Negi"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#1e293b',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                >
                  {['Self', 'Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Grandparent', 'Sibling', 'Other'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#1e293b',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Blood Group</label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: '#1e293b',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {profiles.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteTrigger}
                  className="btn btn-danger"
                  style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Delete Profile
                </button>
              )}
              <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
                <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Custom Styled Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete Family Profile"
        message={`Are you sure you want to delete profile for "${profileToEdit?.name}"? All associated vaulted medical documents and lab trends will be permanently removed.`}
        confirmText="Delete Profile"
        cancelText="Cancel"
        danger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
};

export default EditProfileModal;
