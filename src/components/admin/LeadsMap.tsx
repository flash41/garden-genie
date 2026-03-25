'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import InviteManager from '@/app/admin/InviteManager';

export interface LeadRow {
  id: string;
  email: string;
  postcode: string;
  quotes_requested: number;
  created_at: string;
  actioned: boolean;
  actioned_at: string | null;
  latitude: number | null;
  longitude: number | null;
  design_records: {
    design_style: string | null;
    pdf_url: string | null;
    reference_number: string | null;
  } | null;
}

// ── Leaflet map (dynamically imported — no top-level leaflet in this file) ─────
// dynamic() with ssr: false is allowed here because this file is 'use client'

const LeafletMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');

    function LeafletMapImpl({ leads }: { leads: LeadRow[] }) {
      useEffect(() => {
        // Inject Leaflet CSS once
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        // Fix default icon paths
        const L = require('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      }, []);

      const mappable = leads.filter(l => l.latitude !== null && l.longitude !== null);
      const missing = leads.length - mappable.length;

      return (
        <div>
          <p style={{ fontSize: 14, color: '#8a7e6e', marginBottom: 16 }}>
            {'Showing ' + mappable.length + ' location' + (mappable.length !== 1 ? 's' : '')}
            {missing > 0
              ? ' (' + missing + ' lead' + (missing !== 1 ? 's' : '') + ' have no location data)'
              : ''}
          </p>
          <MapContainer
            center={[54, -4]}
            zoom={6}
            style={{ height: 600, borderRadius: 8, border: '1px solid #e5ddd0' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="Map data from OpenStreetMap contributors"
            />
            {mappable.map(lead => {
              const greyIcon = lead.actioned
                ? (require('leaflet') as typeof import('leaflet')).divIcon({
                    className: '',
                    html: '<div style="width:12px;height:12px;background:#888;border-radius:50%;border:2px solid #555;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                  })
                : undefined;

              return (
                <Marker
                  key={lead.id}
                  position={[lead.latitude as number, lead.longitude as number]}
                  icon={greyIcon}
                >
                  <Popup>
                    <div style={{ fontSize: 13, lineHeight: 1.7, minWidth: 160 }}>
                      <strong>{lead.email}</strong><br />
                      {lead.postcode}<br />
                      {new Date(lead.created_at).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}<br />
                      {'Quotes: ' + lead.quotes_requested}<br />
                      {lead.actioned ? 'Actioned' : 'Pending'}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      );
    }

    return { default: LeafletMapImpl };
  },
  { ssr: false }
);

// ── Table header cell style ───────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'left',
  color: '#b8962e',
  fontSize: 11,
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontWeight: 600,
};

// ── Main export — full interactive page content ───────────────────────────────

export default function AdminLeadsContent({ initialLeads }: { initialLeads: LeadRow[] }) {
  const [activeTab, setActiveTab] = useState<'leads' | 'map'>('leads');
  const [leads, setLeads] = useState<LeadRow[]>(initialLeads);

  async function handleActionToggle(id: string, newValue: boolean) {
    try {
      const res = await fetch('/api/admin/action-lead', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, actioned: newValue }),
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === id ? { ...l, actioned: newValue } : l));
      }
    } catch {
      // silent — state reverts on next page load
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 48px' }}>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e5ddd0', marginBottom: 32 }}>
        {(['leads', 'map'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '10px 28px',
              fontSize: 14,
              fontFamily: 'inherit',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 500 : 400,
              color: activeTab === tab ? '#0a3d2b' : '#8a7e6e',
              borderBottom: activeTab === tab ? '2px solid #b8962e' : '2px solid transparent',
              marginBottom: -2,
            }}
          >
            {tab === 'leads' ? 'Leads' : 'Map'}
          </button>
        ))}
      </div>

      {/* ── Leads tab ───────────────────────────────────────────────────────── */}
      {activeTab === 'leads' && (
        <>
          <InviteManager />

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#0a3d2b', marginBottom: 8 }}>
            Quote Requests
          </h1>
          <p style={{ fontSize: 14, color: '#8a7e6e', marginBottom: 32 }}>
            {leads.length + ' total ' + (leads.length === 1 ? 'lead' : 'leads')}
          </p>

          {leads.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '40px', textAlign: 'center', color: '#8a7e6e', fontSize: 15 }}>
              No quote requests yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, overflow: 'hidden', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#0a3d2b' }}>
                    <th style={{ ...thStyle, textAlign: 'center', width: 52 }}>Done</th>
                    <th style={thStyle}>Reference</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Postcode</th>
                    <th style={thStyle}>Quotes</th>
                    <th style={thStyle}>Design Style</th>
                    <th style={thStyle}>PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <tr
                      key={lead.id}
                      style={{
                        borderTop: '1px solid #e5ddd0',
                        background: i % 2 === 0 ? '#fff' : '#faf8f4',
                        opacity: lead.actioned ? 0.45 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!!lead.actioned}
                          onChange={e => handleActionToggle(lead.id, e.target.checked)}
                          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0a3d2b' }}
                        />
                      </td>
                      <td style={{ padding: '13px 16px', color: '#0a3d2b', fontFamily: 'monospace', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {lead.design_records?.reference_number || '—'}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#4a3f32', whiteSpace: 'nowrap' }}>
                        {new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#2d2520' }}>{lead.email}</td>
                      <td style={{ padding: '13px 16px', color: '#4a3f32' }}>{lead.postcode}</td>
                      <td style={{ padding: '13px 16px', color: '#4a3f32' }}>{lead.quotes_requested}</td>
                      <td style={{ padding: '13px 16px', color: '#4a3f32' }}>{lead.design_records?.design_style || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>
                        {lead.design_records?.pdf_url ? (
                          <a
                            href={lead.design_records.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#b8962e', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}
                          >
                            Download
                          </a>
                        ) : (
                          <span style={{ color: '#c4b8a8', fontSize: 13 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Map tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'map' && (
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#0a3d2b', marginBottom: 24, marginTop: 0 }}>
            Lead Locations
          </h1>
          <LeafletMap leads={leads} />
        </div>
      )}

    </div>
  );
}
