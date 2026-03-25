import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import AdminLeadsContent from '@/components/admin/LeadsMap';
import type { LeadRow } from '@/components/admin/LeadsMap';

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
      actioned,
      actioned_at,
      latitude,
      longitude,
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

  const leads = (rows as LeadRow[] | null) || [];

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

      <AdminLeadsContent initialLeads={leads} />
    </div>
  );
}
