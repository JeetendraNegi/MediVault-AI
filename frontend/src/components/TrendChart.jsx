import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const parseReferenceRange = (refStr) => {
  if (!refStr) return { min: null, max: null };
  const str = String(refStr).trim();

  // Range like "70 - 99", "70-99", "0.4 - 4.2", "12 to 55", "20-40"
  const rangeMatch = str.match(/([\d.]+)\s*(?:[\-–—]|to)\s*([\d.]+)/i);
  if (rangeMatch) {
    const p1 = parseFloat(rangeMatch[1]);
    const p2 = parseFloat(rangeMatch[2]);
    if (!isNaN(p1) && !isNaN(p2)) {
      return { min: Math.min(p1, p2), max: Math.max(p1, p2) };
    }
  }

  // Upper bound like "< 200", "<= 199.9", "<150"
  const maxMatch = str.match(/(?:<=?|<)\s*([\d.]+)/);
  if (maxMatch) {
    const val = parseFloat(maxMatch[1]);
    if (!isNaN(val)) return { min: null, max: val };
  }

  // Lower bound like "> 39.5", ">= 40"
  const minMatch = str.match(/(?:>=?|>)\s*([\d.]+)/);
  if (minMatch) {
    const val = parseFloat(minMatch[1]);
    if (!isNaN(val)) return { min: val, max: null };
  }

  return { min: null, max: null };
};

const getStatusColor = (status, value, minRef, maxRef) => {
  if (status === 'Low' || (minRef !== null && value < minRef)) {
    return '#eab308'; // Yellow for Less than range
  }
  if (status === 'High' || (maxRef !== null && value > maxRef)) {
    return '#ef4444'; // Red for More than range
  }
  return '#10b981'; // Green for In Range
};

const CustomTooltip = ({ active, payload, label, minRef, maxRef, unit }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = getStatusColor(data.status, data.value, minRef, maxRef);
    const statusLabel = data.status || (color === '#eab308' ? 'Low' : color === '#ef4444' ? 'High' : 'Normal');

    return (
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: `1px solid ${color}`,
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          color: '#fff',
          fontSize: '12px'
        }}
      >
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '11px' }}>
          Date: {data.date}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: color }}>
          {data.value} {unit}
        </div>
        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: color,
              display: 'inline-block'
            }}
          />
          <span style={{ fontWeight: 600, color: color }}>
            {statusLabel}
          </span>
          {data.reference_range && (
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '4px' }}>
              (Ref: {data.reference_range})
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ trendData }) => {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <TrendingUp size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <p>No historical lab trends available yet for this profile.</p>
        <p style={{ fontSize: '0.8rem' }}>Upload blood test reports to generate automatic visual trend graphs.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
      {trendData.map((trend, idx) => {
        const sortedHistory = [...(trend.history || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        const refRangeStr = sortedHistory[0]?.reference_range || trend.reference_range || '';
        const { min: minRef, max: maxRef } = parseReferenceRange(refRangeStr);

        const latestColor = getStatusColor(trend.latest_status, trend.latest_value, minRef, maxRef);

        // Compute Y-Axis Domain dynamically so reference lines are clearly visible
        const values = sortedHistory.map(h => h.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const valDelta = maxVal - minVal;

        let yMin = minVal;
        let yMax = maxVal;
        if (minRef !== null) yMin = Math.min(yMin, minRef);
        if (maxRef !== null) yMax = Math.max(yMax, maxRef);

        const padding = (yMax - yMin) * 0.25 || 5;
        const domainMin = Math.max(0, Math.floor((yMin - padding) * 10) / 10);
        const domainMax = Math.ceil((yMax + padding) * 10) / 10;

        // Compute Linear Gradient Stop Percentages along the single continuous line (from bottom to top)
        let minPct = 0;
        let maxPct = 100;

        if (valDelta > 0) {
          if (minRef !== null) {
            minPct = Math.max(0, Math.min(100, ((minRef - minVal) / valDelta) * 100));
          } else {
            minPct = 0;
          }

          if (maxRef !== null) {
            maxPct = Math.max(0, Math.min(100, ((maxRef - minVal) / valDelta) * 100));
          } else {
            maxPct = 100;
          }
        } else {
          // If all values are identical (flat line)
          if (minRef !== null && minVal < minRef) {
            minPct = 100;
            maxPct = 100;
          } else if (maxRef !== null && maxVal > maxRef) {
            minPct = 0;
            maxPct = 0;
          } else {
            minPct = 0;
            maxPct = 100;
          }
        }

        const gradientId = `multicolor-line-gradient-${idx}-${trend.parameter_name.replace(/[^a-zA-Z0-9]/g, '')}`;

        return (
          <div key={idx} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            {/* Card Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {trend.parameter_name}
                </h4>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ref Range: <strong style={{ color: '#cbd5e1' }}>{refRangeStr || 'Standard Range'}</strong> {trend.unit}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: latestColor }}>
                  {trend.latest_value} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{trend.unit}</span>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    backgroundColor: latestColor === '#eab308' ? 'rgba(234, 179, 8, 0.15)' : latestColor === '#ef4444' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: latestColor,
                    border: `1px solid ${latestColor === '#eab308' ? 'rgba(234, 179, 8, 0.3)' : latestColor === '#ef4444' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                  }}
                >
                  {latestColor === '#eab308' ? '🟡 Low' : latestColor === '#ef4444' ? '🔴 High' : '🟢 Normal'}
                </span>
              </div>
            </div>

            {/* Recharts Visual Trend Graph with Single Multi-Color Line */}
            <div style={{ width: '100%', height: '190px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sortedHistory} margin={{ top: 14, right: 14, left: -16, bottom: 0 }}>
                  <defs>
                    {/* SVG Linear Gradient for Single Continuous Line: Yellow (< minRef), Green (in range), Red (> maxRef) */}
                    <linearGradient id={gradientId} x1="0" y1="100%" x2="0" y2="0%">
                      {/* Below minRef: Yellow */}
                      <stop offset="0%" stopColor="#eab308" />
                      <stop offset={`${minPct}%`} stopColor="#eab308" />

                      {/* Transition to Green for range [minRef, maxRef] */}
                      <stop offset={`${minPct}%`} stopColor="#10b981" />
                      <stop offset={`${maxPct}%`} stopColor="#10b981" />

                      {/* Transition to Red for above maxRef */}
                      <stop offset={`${maxPct}%`} stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} domain={[domainMin, domainMax]} tickLine={false} />

                  <Tooltip content={<CustomTooltip minRef={minRef} maxRef={maxRef} unit={trend.unit} />} />

                  {/* Dotted Reference Range Corridor */}
                  {minRef !== null && maxRef !== null && minRef < maxRef && (
                    <ReferenceArea
                      y1={minRef}
                      y2={maxRef}
                      fill="rgba(16, 185, 129, 0.05)"
                      stroke="none"
                    />
                  )}

                  {/* Dotted Min Threshold Line (Yellow) */}
                  {minRef !== null && (
                    <ReferenceLine
                      y={minRef}
                      stroke="#eab308"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Min (${minRef})`,
                        fill: '#eab308',
                        fontSize: 10,
                        position: 'insideBottomLeft',
                        offset: 4
                      }}
                    />
                  )}

                  {/* Dotted Max Threshold Line (Red) */}
                  {maxRef !== null && (
                    <ReferenceLine
                      y={maxRef}
                      stroke="#ef4444"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      label={{
                        value: `Max (${maxRef})`,
                        fill: '#ef4444',
                        fontSize: 10,
                        position: 'insideTopLeft',
                        offset: 4
                      }}
                    />
                  )}

                  {/* Single Continuous Multi-Color Line */}
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={3.5}
                    dot={(dotProps) => {
                      const { cx, cy, payload } = dotProps;
                      if (!cx || !cy) return null;
                      const dotColor = getStatusColor(payload.status, payload.value, minRef, maxRef);
                      return (
                        <circle
                          key={`dot-${payload.date}-${cx}`}
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={dotColor}
                          stroke="#0f172a"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 7, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Range & Color Legend Footer */}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: 'var(--text-muted)'
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#eab308' }} /> Low (&lt; Min)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} /> Normal (In Range)
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} /> High (&gt; Max)
                </span>
              </div>
              <div style={{ fontStyle: 'italic', fontSize: '0.7rem' }}>
                ┈ Dotted Range Lines
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TrendChart;
