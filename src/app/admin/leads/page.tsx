export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-server';
import { isAuthenticatedAdmin } from '@/lib/admin-session';
import AdminLeadsContent from '@/components/admin/LeadsMap';
import type { LeadRow, ErrorReport } from '@/components/admin/LeadsMap';

export default async function AdminLeadsPage() {
  if (!(await isAuthenticatedAdmin())) {
    redirect('/admin/login');
  }

  const { data: rows, error } = await supabaseAdmin
    .from('quote_requests')
    .select(`
      id,
      email,
      postcode,
      quotes_requested,
      actioned,
      actioned_at,
      submitted_at,
      created_at,
      latitude,
      longitude,
      country,
      confirmation_sent,
      design_record_id,
      design_records (
        reference_number,
        design_style,
        pdf_url
      )
    `)
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Leads fetch error:', JSON.stringify(error));
    // Return empty array — do not crash the page
  }

  const leads = (rows as LeadRow[] | null) || [];

  const { data: errorReportRows } = await supabaseAdmin
    .from('error_reports')
    .select('*')
    .order('submitted_at', { ascending: false });

  const errorReports = (errorReportRows as ErrorReport[] | null) ?? [];
  const newReportCount = errorReports.filter(r => r.status === 'new').length;

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

      <AdminLeadsContent initialLeads={leads} initialErrorReports={errorReports} newReportCount={newReportCount} />
    </div>
  );
}
