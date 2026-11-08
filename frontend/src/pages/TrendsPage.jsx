import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import ProfileSwitcher from '../components/ProfileSwitcher';
import TrendChart from '../components/TrendChart';

const TrendsPage = ({ onOpenAddProfile, onOpenEditProfile }) => {
  const { activeProfile } = useProfile();
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) return;
    analyticsAPI.getTrends(activeProfile.id)
      .then(res => setTrends(res.data))
      .catch(err => console.error("Error fetching trends:", err))
      .finally(() => setLoading(false));
  }, [activeProfile]);

  return (
    <div>
      <ProfileSwitcher onOpenAddProfile={onOpenAddProfile} onOpenEditProfile={onOpenEditProfile} />
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Longitudinal Health Trends</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Historical lab metrics tracking for <strong style={{ color: 'var(--accent-sky)' }}>{activeProfile?.name}</strong>
        </p>
      </div>
      <TrendChart trendData={trends} />
    </div>
  );
};

export default TrendsPage;
