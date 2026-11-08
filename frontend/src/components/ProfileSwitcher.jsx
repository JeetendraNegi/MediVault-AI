import React from 'react';
import { useProfile } from '../context/ProfileContext';
import { UserPlus, Users, HeartPulse } from 'lucide-react';

const ProfileSwitcher = ({ onOpenAddProfile, onOpenEditProfile }) => {
  const { profiles, activeProfile, selectProfile } = useProfile();

  return (
    <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--accent-sky)" />
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Family Profiles ({profiles.length}/15)
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {activeProfile && (
            <button
              onClick={() => onOpenEditProfile && onOpenEditProfile(activeProfile)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Edit Active Profile Details"
            >
              ✏️ Edit Member Profile
            </button>
          )}
          <button
            onClick={onOpenAddProfile}
            disabled={profiles.length >= 15}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            <UserPlus size={14} /> Add Profile
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        overflowX: 'auto',
        paddingBottom: '6px'
      }}>
        {profiles.map((p) => {
          const isSelected = activeProfile?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => selectProfile(p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: isSelected ? '2px solid var(--accent-sky)' : '1px solid var(--border-color)',
                background: isSelected ? 'rgba(2, 132, 199, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                boxShadow: isSelected ? '0 0 15px rgba(2, 132, 199, 0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              <img
                src={p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                alt={p.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  border: '1px solid var(--border-color)'
                }}
              />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#ffffff' : 'var(--text-secondary)' }}>
                  {p.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: isSelected ? 'var(--accent-sky)' : 'var(--text-muted)' }}>
                  {p.relationship} {p.blood_group ? `• ${p.blood_group}` : ''}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


export default ProfileSwitcher;
