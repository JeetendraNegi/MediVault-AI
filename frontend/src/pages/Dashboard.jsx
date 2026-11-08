import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import ProfileSwitcher from '../components/ProfileSwitcher';
import TrendChart from '../components/TrendChart';
import Timeline from '../components/Timeline';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

const Dashboard = ({ onOpenUpload, onOpenAddProfile, onOpenEditProfile, onOpenAIAssistant, setActiveTab }) => {
  const { activeProfile } = useProfile();
  const [trends, setTrends] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeProfile) return;

    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendsRes, timelineRes] = await Promise.all([
          analyticsAPI.getTrends(activeProfile.id),
          analyticsAPI.getTimeline(activeProfile.id)
        ]);
        if (mounted) {
          setTrends(trendsRes.data);
          setTimeline(timelineRes.data);
        }
      } catch (err) {
        console.error("Dashboard profile load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [activeProfile]);

  return (
    <div>
      <ProfileSwitcher onOpenAddProfile={onOpenAddProfile} onOpenEditProfile={onOpenEditProfile} />

      {activeProfile && (
        <>
          <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src={activeProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeProfile?.name || 'User'}`}
                  alt={activeProfile?.name || 'User'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#1e293b',
                    border: '2px solid var(--accent-sky)'
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{activeProfile?.name || 'User'}</h2>
                    <span className="badge badge-normal">{activeProfile?.relationship || 'Member'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', gap: '14px' }}>
                    {activeProfile?.blood_group && <span>Blood Group: <strong style={{ color: '#fff' }}>{activeProfile.blood_group}</strong></span>}
                    {activeProfile?.gender && <span>Gender: <strong style={{ color: '#fff' }}>{activeProfile.gender}</strong></span>}
                    {activeProfile?.date_of_birth && <span>DOB: <strong style={{ color: '#fff' }}>{activeProfile.date_of_birth}</strong></span>}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={() => onOpenEditProfile && onOpenEditProfile(activeProfile)}>
                  ✏️ Edit Profile
                </button>
                <button className="btn btn-primary" onClick={onOpenUpload}>
                  Upload Report for {activeProfile?.name ? activeProfile.name.split(' ')[0] : 'Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{
            padding: '20px 24px',
            marginBottom: '24px',
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(139, 92, 246, 0.15))',
            borderColor: 'var(--border-accent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles color="var(--accent-sky)" size={20} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-sky)' }}>
                  Clinical Summary for {activeProfile?.name || 'Member'}
                </h3>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenAIAssistant && onOpenAIAssistant()}
                style={{ padding: '6px 12px', fontSize: '0.78rem', background: 'rgba(2, 132, 199, 0.2)', color: 'var(--accent-sky)', borderColor: 'var(--accent-sky)' }}
              >
                <Sparkles size={14} /> Ask AI Assistant
              </button>
            </div>

            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {timeline.length > 0
                ? (timeline[0].summary || "Recent medical evaluations processed. Select specific parameters below to view longitudinal health trends.")
                : "No medical documents uploaded yet. Upload a blood report or prescription to generate AI clinical insights."}
            </p>
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color="var(--accent-amber)" />
              MediVault AI insights are generated for informational purposes only. Consult a certified medical professional for diagnosis.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Key Health Indicators</h3>
            <button
              onClick={() => setActiveTab('trends')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-sky)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem' }}
            >
              View Full Analytics <ArrowRight size={16} />
            </button>
          </div>

          <div style={{ marginBottom: '28px' }}>
            <TrendChart trendData={trends} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Health History</h3>
            <button
              onClick={() => setActiveTab('timeline')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-sky)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem' }}
            >
              View Complete Timeline <ArrowRight size={16} />
            </button>
          </div>

          <Timeline events={timeline.slice(0, 3)} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
