import React, { useState, useEffect } from 'react';
import { useProfile } from '../context/ProfileContext';
import { documentAPI } from '../services/api';
import ProfileSwitcher from '../components/ProfileSwitcher';
import { FileText, Download, Trash2, Sparkles, FileSpreadsheet, Pill, Eye, X } from 'lucide-react';

const Documents = ({ onOpenAddProfile, onOpenEditProfile }) => {
  const { activeProfile } = useProfile();
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDocs = async () => {
    if (!activeProfile) return;
    setLoading(true);
    try {
      const res = await documentAPI.getByProfile(activeProfile.id);
      setDocuments(res.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeProfile]);

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document record?")) return;
    try {
      await documentAPI.delete(docId);
      fetchDocs();
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  return (
    <div>
      <ProfileSwitcher onOpenAddProfile={onOpenAddProfile} onOpenEditProfile={onOpenEditProfile} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Medical Vault</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Digitized records for <strong style={{ color: 'var(--accent-sky)' }}>{activeProfile?.name}</strong>
          </p>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <h3>No Documents Stored Yet</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>Upload a lab report or prescription to start organizing records.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {documents.map((doc) => (
            <div key={doc.id} className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span className="badge badge-normal">{doc.document_type}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="btn btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Inspect OCR & AI Data"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="btn btn-danger"
                    style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                    title="Delete Record"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                {doc.file_name}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Date: {doc.document_date || 'N/A'}
              </p>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                {doc.ai_summary}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{doc.lab_results?.length || 0} Parameters Extracted</span>
                <a
                  href={doc.file_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-sky)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Download size={13} /> Original
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
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
          <div className="glass-card" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedDoc.file_name}</h3>
                <span className="badge badge-normal">{selectedDoc.document_type}</span>
              </div>
              <button onClick={() => setSelectedDoc(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '18px', background: 'rgba(2, 132, 199, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-accent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--accent-sky)', marginBottom: '4px' }}>
                <Sparkles size={16} /> Clinical Summary
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{selectedDoc.ai_summary}</p>
            </div>

            {selectedDoc.lab_results?.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px' }}>Extracted Lab Parameters</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedDoc.lab_results.map((lab, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.88rem' }}>{lab.parameter_name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong style={{ fontSize: '0.9rem' }}>{lab.value} {lab.unit}</strong>
                        <span className={`badge ${lab.status !== 'Normal' ? 'badge-high' : 'badge-normal'}`} style={{ fontSize: '0.65rem' }}>
                          {lab.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>Raw OCR Extracted Text</h4>
              <pre style={{
                background: '#090d16',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                color: '#94a3b8',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto'
              }}>
                {selectedDoc.raw_ocr_text || "No OCR text extracted."}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
