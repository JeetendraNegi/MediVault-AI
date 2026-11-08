import React from 'react';
import { Calendar, FileText, Pill, FileSpreadsheet, Download } from 'lucide-react';

const Timeline = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Calendar size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p>No timeline events recorded for this family profile.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '24px' }}>
      {/* Vertical Timeline Line */}
      <div style={{
        position: 'absolute',
        top: '10px',
        bottom: '10px',
        left: '7px',
        width: '2px',
        background: 'linear-gradient(to bottom, var(--accent-sky), var(--accent-violet))'
      }} />

      {events.map((evt, idx) => (
        <div key={idx} style={{ position: 'relative', marginBottom: '24px' }}>
          {/* Timeline Dot */}
          <div style={{
            position: 'absolute',
            left: '-24px',
            top: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: 'var(--bg-primary)',
            border: '3px solid var(--accent-sky)',
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
          }} />

          <div className="glass-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-normal" style={{ fontSize: '0.7rem' }}>
                  {evt.type}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {evt.date}
                </span>
              </div>

              {evt.file_url && (
                <a
                  href={evt.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  <Download size={12} /> View File
                </a>
              )}
            </div>

            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              {evt.title}
            </h4>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {evt.summary}
            </p>

            <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {evt.lab_count > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileSpreadsheet size={14} color="var(--accent-cyan)" /> {evt.lab_count} Lab Parameters Extracted
                </span>
              )}
              {evt.med_count > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Pill size={14} color="var(--accent-violet)" /> {evt.med_count} Prescribed Medications
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
