import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { documentAPI } from '../services/api';
import { X, UploadCloud, Cpu, Sparkles, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

const UploadModal = ({ isOpen, onClose, onSuccess }) => {
  const { activeProfile } = useProfile();
  const [selectedFile, setSelectedFile] = useState(null);
  const [stage, setStage] = useState('idle'); // idle | uploading | ocr | ai_parsing | done | error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStage('idle');
      setSelectedFile(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  const handleClose = () => {
    setStage('idle');
    setSelectedFile(null);
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !activeProfile) return;

    setStage('uploading');
    setErrorMessage('');

    try {
      setTimeout(() => setStage('ocr'), 750);
      setTimeout(() => setStage('ai_parsing'), 1600);

      const res = await documentAPI.upload(activeProfile.id, selectedFile);
      setStage('done');
      setTimeout(() => {
        onSuccess(res.data);
        handleClose();
      }, 900);
    } catch (err) {
      setStage('error');
      setErrorMessage(err.response?.data?.detail || 'Document processing failed');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '16px'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Smart Medical Upload</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Target Profile: <strong style={{ color: 'var(--accent-sky)' }}>{activeProfile?.name}</strong>
            </p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {stage === 'idle' && (
          <div>
            <div style={{
              border: '2px dashed var(--border-accent)',
              borderRadius: '16px',
              padding: '36px 20px',
              textAlign: 'center',
              background: 'rgba(2, 132, 199, 0.05)',
              marginBottom: '20px',
              cursor: 'pointer'
            }}>
              <UploadCloud size={48} color="var(--accent-sky)" style={{ marginBottom: '12px' }} />
              <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '6px' }}>
                Drop medical report photo or PDF here
              </p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Supports Blood Reports, Prescriptions, Discharge Summaries (PDF, PNG, JPG)
              </p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <label htmlFor="file-upload-input" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Browse File
              </label>
            </div>

            {selectedFile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                marginBottom: '20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText color="var(--accent-sky)" size={20} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedFile.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleUpload}
                >
                  Start OCR & AI Parse
                </button>
              </div>
            )}
          </div>
        )}

        {stage !== 'idle' && stage !== 'error' && (
          <div style={{ padding: '20px 0', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
              <div className="animate-pulse-glow" style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-cyan))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.5)'
              }}>
                {stage === 'uploading' && <UploadCloud color="#fff" size={32} />}
                {stage === 'ocr' && <Cpu color="#fff" size={32} />}
                {stage === 'ai_parsing' && <Sparkles color="#fff" size={32} />}
                {stage === 'done' && <CheckCircle2 color="#fff" size={32} />}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', maxWidth: '360px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: stage === 'uploading' ? 1 : 0.6 }}>
                <CheckCircle2 size={18} color={stage !== 'uploading' ? 'var(--accent-emerald)' : 'var(--accent-sky)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Uploading file to secure vault...</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: ['ocr', 'ai_parsing', 'done'].includes(stage) ? 1 : 0.4 }}>
                <CheckCircle2 size={18} color={['ai_parsing', 'done'].includes(stage) ? 'var(--accent-emerald)' : 'var(--accent-sky)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Extracting OCR text blocks...</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: ['ai_parsing', 'done'].includes(stage) ? 1 : 0.4 }}>
                <CheckCircle2 size={18} color={stage === 'done' ? 'var(--accent-emerald)' : 'var(--accent-sky)'} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Gemini 1.5 Flash parsing lab parameters...</span>
              </div>
            </div>

            {stage !== 'done' && (
              <div style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 16px' }}
                >
                  Cancel / Reset
                </button>
              </div>
            )}
          </div>
        )}

        {stage === 'error' && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={48} color="var(--accent-rose)" style={{ marginBottom: '12px' }} />
            <h4 style={{ color: 'var(--accent-rose)', marginBottom: '8px' }}>Processing Failed</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{errorMessage}</p>
            <button className="btn btn-secondary" onClick={() => setStage('idle')}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadModal;
