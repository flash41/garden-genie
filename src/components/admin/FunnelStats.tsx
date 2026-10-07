import { supabaseAdmin } from '@/lib/supabase-server';

type Window = { label: string; since: string };

const WINDOWS: Window[] = [
  { label: 'Last 7 days',  since: new Date(Date.now() - 7  * 86400_000).toISOString() },
  { label: 'Last 30 days', since: new Date(Date.now() - 30 * 86400_000).toISOString() },
  { label: 'All time',     since: '1970-01-01T00:00:00.000Z' },
];

async function countEvent(event: string, path: string | null, since: string): Promise<number> {
  try {
    let q = supabaseAdmin
      .from('site_events')
      .select('*', { count: 'exact', head: true })
      .eq('event', event)
      .gte('created_at', since);
    if (path) q = q.eq('path', path);
    const { count } = await q;
    return count ?? 0;
  } catch { return 0; }
}

async function countWaitlist(since: string): Promise<number> {
  try {
    const { count } = await supabaseAdmin
      .from('waitlist_signups')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    return count ?? 0;
  } catch { return 0; }
}

type SourceRow = { referrer_host: string | null; utm_source: string | null };

async function topSources(): Promise<{ label: string; count: number }[]> {
  try {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from('site_events')
      .select('referrer_host, utm_source')
      .eq('event', 'pageview')
      .gte('created_at', since)
      .neq('referrer_host', 'internal')
      .limit(5000);

    if (!data) return [];

    const counts: Record<string, number> = {};
    for (const row of data as SourceRow[]) {
      const label = row.utm_source?.trim() || row.referrer_host || 'Direct / unknown';
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));
  } catch { return []; }
}

type PathRow = { referrer_path: string | null; referrer_host: string | null };

async function nextPageSources(): Promise<{ label: string; count: number }[]> {
  try {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabaseAdmin
      .from('site_events')
      .select('referrer_path, referrer_host')
      .eq('event', 'pageview')
      .eq('path', '/next')
      .gte('created_at', since)
      .limit(5000);

    if (!data) return [];

    const counts: Record<string, number> = {};
    for (const row of data as PathRow[]) {
      const label =
        row.referrer_host === 'internal' && row.referrer_path
          ? row.referrer_path
          : 'External / direct';
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, count]) => ({ label, count }));
  } catch { return []; }
}

export default async function FunnelStats() {
  // Fetch all windows in parallel
  const results = await Promise.all(
    WINDOWS.map(async (w) => {
      const [siteViews, designViews, ctaClicks, nextViews, signups] = await Promise.all([
        countEvent('pageview',       null,      w.since),
        countEvent('pageview',       '/design', w.since),
        countEvent('cta_build_plan', null,      w.since),
        countEvent('pageview',       '/next',   w.since),
        countWaitlist(w.since),
      ]);
      return { w, siteViews, designViews, ctaClicks, nextViews, signups };
    })
  );

  const [sources, nextSources] = await Promise.all([topSources(), nextPageSources()]);

  const rows: { label: string; key: keyof typeof results[0] | 'conversion' }[] = [
    { label: 'Site page views',                   key: 'siteViews'   },
    { label: '/design views',                     key: 'designViews' },
    { label: '"Build my Garden Plan" clicks',     key: 'ctaClicks'   },
    { label: '/next views',                       key: 'nextViews'   },
    { label: 'Waitlist signups',                  key: 'signups'     },
    { label: 'Conversion: /next → signup',        key: 'conversion'  },
  ];

  const cell = (s: typeof results[0], key: string, isLast: boolean): string => {
    if (key === 'conversion') {
      if (isLast) return '—'; // All time skewed
      if (s.nextViews === 0) return '—';
      return `${Math.round((s.signups / s.nextViews) * 100)}%`;
    }
    return String((s as unknown as Record<string, number>)[key] ?? 0);
  };

  return (
    <div style={{ padding: '24px 40px 0', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Funnel table */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5ddd0',
          borderTop: '3px solid #0a3d2b',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #e5ddd0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0a3d2b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Funnel Overview
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9f5ee' }}>
                <th style={{ textAlign: 'left',  padding: '10px 20px', color: '#4a3f32', fontWeight: 600 }}>Step</th>
                {results.map(({ w }) => (
                  <th key={w.label} style={{ textAlign: 'right', padding: '10px 20px', color: '#4a3f32', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {w.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.label} style={{ borderTop: '1px solid #f0e8dc', background: i % 2 === 0 ? '#fff' : '#fdfaf6' }}>
                  <td style={{ padding: '10px 20px', color: '#0a3d2b' }}>{row.label}</td>
                  {results.map(({ w }, wi) => (
                    <td key={w.label} style={{ textAlign: 'right', padding: '10px 20px', color: '#0a3d2b', fontWeight: row.key === 'conversion' ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
                      {cell(results[wi], row.key, wi === results.length - 1)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top sources + /next sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Top sources */}
        <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #e5ddd0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0a3d2b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Top sources · last 30 days
            </span>
          </div>
          {sources.length === 0 ? (
            <p style={{ padding: '14px 18px', fontSize: 13, color: '#8a7e6e', margin: 0 }}>No data yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.label} style={{ borderTop: '1px solid #f0e8dc' }}>
                    <td style={{ padding: '8px 18px', color: '#0a3d2b' }}>{s.label}</td>
                    <td style={{ padding: '8px 18px', color: '#b8962e', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* How people reach /next */}
        <div style={{ background: '#fff', border: '1px solid #e5ddd0', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #e5ddd0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0a3d2b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              How people reach /next · last 30 days
            </span>
          </div>
          {nextSources.length === 0 ? (
            <p style={{ padding: '14px 18px', fontSize: 13, color: '#8a7e6e', margin: 0 }}>No data yet</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {nextSources.map((s) => (
                  <tr key={s.label} style={{ borderTop: '1px solid #f0e8dc' }}>
                    <td style={{ padding: '8px 18px', color: '#0a3d2b' }}>{s.label}</td>
                    <td style={{ padding: '8px 18px', color: '#b8962e', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#b0a898', marginBottom: 24, lineHeight: 1.5 }}>
        Cookie-free page view counts (not unique visitors). Bots and admin visits excluded. Tracking started 7 Oct 2026.
      </p>
    </div>
  );
}
