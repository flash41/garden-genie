import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import InviteManager from '@/app/admin/InviteManager';

interface QuoteRow {
  id: string;
  email: string;
  postcode: string;
  quotes_requested: number;
  created_at: string;
  design_records: {
    design_style: string | null;
    pdf_url: string | null;
    reference_number: string | null;
  } | null;
}

export default async function AdminLeadsPage() {
  const cookieStore = await cookies();
  const adminAuth = cookieStore.get('admin_auth');

  if (!adminAuth || adminAuth.value !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  const { data: rows, error } = await supabaseAdmin
    .from('quote_requests')
    .select(`
      id,
      email,
      postcode,
      quotes_requested,
      created_at,
      design_records (
        design_style,
        pdf_url,
        reference_number
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Leads fetch error:', error);
  }

  const leads = (rows as QuoteRow[] | null) || [];

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0a3d2b', padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/dd_logo.png" alt="Dedrab" style={{ height: 36, width: 'auto', display: 'block' }} />
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Quote Leads</span>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        <InviteManager />

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: '#0a3d2b', marginBottom: 8 }}>Quote Requests</h1>
        <p style={{ fontSize: 14, color: '#8a7e6e', marginBottom: 32 }}>{leads.length} total {leads.length === 1 ? 'lead' : 'leads'}</p>

        {leads.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, padding: '40px', textAlign: 'center', color: '#8a7e6e', fontSize: 15 }}>
            No quote requests yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, overflow: 'hidden', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#0a3d2b' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Reference</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Postcode</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Quotes</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>Design Style</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', color: '#b8962e', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>PDF</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={lead.id} style={{ borderTop: '1px solid #e5ddd0', background: i % 2 === 0 ? '#fff' : '#faf8f4' }}>
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
                        <a href={lead.design_records.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#b8962e', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>Download</a>
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
      </div>
    </div>
  );
}
