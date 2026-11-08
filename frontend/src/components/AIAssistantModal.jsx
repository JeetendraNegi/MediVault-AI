import React, { useState } from 'react';
import { useProfile } from '../context/ProfileContext';
import { analyticsAPI } from '../services/api';
import { X, Sparkles, Send, ShieldAlert, Activity } from 'lucide-react';

const SUGGESTED_QUERIES = [
  { label: '🩸 Latest Glucose Level', query: 'What is my latest Glucose level?' },
  { label: '🩺 Hemoglobin Level', query: 'What is my hemoglobin level?' },
  { label: '📈 Health Progress', query: 'Show my progress' },
  { label: '💡 Improve Health', query: 'How can I improve my health?' }
];

const AIAssistantModal = ({ isOpen, onClose }) => {
  const { activeProfile } = useProfile();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  if (!isOpen) return null;

  const handleAsk = async (textToAsk) => {
    const prompt = (textToAsk || query).trim();
    if (!prompt || !activeProfile) return;

    setLoading(true);
    setQuery(prompt);

    try {
      const res = await analyticsAPI.askAIAssistant(activeProfile.id, prompt);
      setResponse(res.data);
    } catch {
      setResponse({
        query: prompt,
        answer: "Unable to contact MediVault AI Assistant. Please ensure the backend server is active and try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const formatInlineText = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff">$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(2,132,199,0.2);color:#38bdf8;padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>');

  const renderContent = (content) => {
    if (!content) return null;
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-sky)', marginTop: '12px', marginBottom: '8px' }}>{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineText(line.replace(/^[•-]\s*/, '')) }} />
          </div>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent-sky)' }}>{line.substring(0, 3)}</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineText(line.substring(3)) }} />
          </div>
        );
      }
      if (!line.trim()) return <div key={idx} style={{ height: '8px' }} />;
      return <p key={idx} style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '8px', color: 'var(--text-primary)' }} dangerouslySetInnerHTML={{ __html: formatInlineText(line) }} />;
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
            }}>
              <Sparkles color="#ffffff" size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>MediVault AI Search Assistant</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Target Profile: <strong style={{ color: 'var(--accent-sky)' }}>{activeProfile?.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Suggested Health Queries:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SUGGESTED_QUERIES.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleAsk(p.query)}
                disabled={loading}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-accent)',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: 'var(--accent-sky)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          background: 'rgba(11, 15, 25, 0.7)',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid var(--border-color)',
          overflowY: 'auto',
          marginBottom: '16px',
          minHeight: '220px'
        }}>
          {loading ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-sky)', gap: '12px', padding: '40px 0' }}>
              <div className="animate-pulse-glow" style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 25px rgba(6, 182, 212, 0.5)'
              }}>
                <Sparkles size={28} color="#fff" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Analyzing health parameters for {activeProfile?.name}...
              </div>
            </div>
          ) : response ? (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={14} /> Query: "{response.query}"
              </div>
              <div>{renderContent(response.answer)}</div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 20px' }}>
              <Sparkles size={40} style={{ opacity: 0.4, marginBottom: '12px' }} color="var(--accent-sky)" />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Ask anything about your medical reports or parameters
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '6px', maxWidth: '400px' }}>
                Get instant numerical values, trend evaluations, and clinical advice extracted from your digitized health vault.
              </p>
            </div>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is my glucose level? or How to improve cholesterol?"
              style={{
                width: '100%',
                padding: '14px 50px 14px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border-accent)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#ffffff',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="btn btn-primary"
              style={{
                position: 'absolute',
                right: '8px',
                padding: '8px 12px',
                borderRadius: '8px'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </form>

        <div style={{ marginTop: '12px', fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={13} color="var(--accent-amber)" />
          MediVault AI response generated from your digitized health parameters. Consult a physician for medical advice.
        </div>
      </div>
    </div>
  );
};

export default AIAssistantModal;
