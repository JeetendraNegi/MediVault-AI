import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import ProfileSwitcher from '../components/ProfileSwitcher';
import Timeline from '../components/Timeline';

const TimelinePage = ({ onOpenAddProfile, onOpenEditProfile }) => {
  const { activeProfile } = useProfile();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) return;
    analyticsAPI.getTimeline(activeProfile.id)
      .then(res => setTimeline(res.data))
      .catch(err => console.error("Error fetching timeline:", err))
      .finally(() => setLoading(false));
  }, [activeProfile]);

  return (
    <div>
      <ProfileSwitcher onOpenAddProfile={onOpenAddProfile} onOpenEditProfile={onOpenEditProfile} />
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Chronological Health Timeline</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Complete medical record history for <strong style={{ color: 'var(--accent-sky)' }}>{activeProfile?.name}</strong>
        </p>
      </div>
      <Timeline events={timeline} />
    </div>
  );
};

export default TimelinePage;
