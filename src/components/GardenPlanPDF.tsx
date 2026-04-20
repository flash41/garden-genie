import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { getCurrencyFromPostcode, formatCurrency, type CurrencyConfig } from '@/lib/currencyFromPostcode';

// Logo is passed as a pre-fetched base64 data URL from the caller to avoid
// CORS failures when react-pdf's WASM renderer tries to fetch remote URLs.

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const T = {
  brand:    '#0a3d2b',
  brandDk:  '#072b1e',
  accent:   '#b8962e',
  accentLt: '#d4af37',
  white:    '#ffffff',
  ink:      '#111827',
  inkMid:   '#374151',
  inkLight: '#6b7280',
  rule:     '#e5e7eb',
  ruleDk:   '#d1d5db',
  surface:  '#f9fafb',
  red:      '#dc2626',
  amber:    '#d97706',
  green:    '#16a34a',
};

// ─── COLOUR MAP ───────────────────────────────────────────────────────────────
const COLOUR_HEX_MAP: Record<string, string> = {
  'terracotta': '#C1440E',
  'warm terracotta': '#C1440E',
  'warm grey': '#9E9E8E',
  'rich earth brown': '#6B4226',
  'vibrant green': '#4A7C3F',
  'herbal silver': '#A8B5A2',
  'seasonal pink': '#D4748A',
  'seasonal purple': '#7B5EA7',
  'seasonal yellow': '#D4A847',
  'lavender': '#967BB6',
  'sage': '#9CAF88',
  'sage green': '#87AE73',
  'slate': '#708090',
  'slate grey': '#708090',
  'slate gray': '#708090',
  'cream': '#FFFDD0',
  'stone': '#B0A090',
  'olive': '#808000',
  'olive green': '#808000',
  'charcoal': '#36454F',
  'rust': '#B7410E',
  'moss': '#8A9A5B',
  'moss green': '#8A9A5B',
  'bark': '#7B3F00',
  'flint': '#6E6E6E',
  'bronze': '#CD7F32',
  'forest green': '#228B22',
  'blush': '#DE5D83',
  'dusk': '#4E5B6E',
  'clay': '#B66A50',
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverPage:    { backgroundColor: T.brandDk, fontFamily: 'Helvetica', position: 'relative' },
  coverBg:      { position: 'absolute', top: 0, left: 0, right: 0, height: 500, objectFit: 'cover', opacity: 0.75 },
  coverOverlay: { position: 'absolute', top: 300, left: 0, right: 0, height: 140, backgroundColor: T.brandDk, opacity: 0.88 },
  coverTopRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: T.accent },
  coverContent: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: 44, justifyContent: 'space-between' },
  coverTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  coverBrand:   { fontSize: 8, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase' },
  coverDate:    { fontSize: 8, color: T.accentLt, letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'right' },
  coverMid:     { marginTop: 'auto', paddingTop: 260 },
  coverStyleTag:{ fontSize: 9, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 },
  coverTitle:   { fontSize: 32, color: T.white, fontFamily: 'Helvetica-Bold', letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6 },
  coverSubtitle:{ fontSize: 13, color: T.accentLt, letterSpacing: 0.5, marginBottom: 24 },
  coverRule:    { height: 1.5, backgroundColor: T.accent, width: 48, marginBottom: 20 },
  coverMetaRow: { flexDirection: 'row', gap: 40 },
  coverMetaLbl: { fontSize: 7, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  coverMetaVal: { fontSize: 11, color: T.white, fontFamily: 'Helvetica-Bold' },
  coverMetaSub: { fontSize: 9, color: '#c0c0c0', marginTop: 1 },
  coverBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#2d6b4a' },
  coverConf:    { fontSize: 7, color: '#5a8a6a', letterSpacing: 1.5, textTransform: 'uppercase' },
  coverPg:      { fontSize: 7, color: '#5a8a6a' },

  // ── Content pages ──────────────────────────────────────────────────────────
  page: { paddingTop: 44, paddingBottom: 60, paddingLeft: 44, paddingRight: 44, backgroundColor: T.white, fontFamily: 'Helvetica' },

  // Running header
  runHdr:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: T.brand },
  runBrand: { fontSize: 7, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase' },
  runRight: { fontSize: 8, color: T.inkLight },

  // Footer
  footer:      { position: 'absolute', bottom: 26, left: 44, right: 44, paddingTop: 6, borderTopWidth: 0.5, borderTopColor: T.rule, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerBrand: { fontSize: 7.5, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  footerMid:   { fontSize: 7.5, color: T.inkLight, textAlign: 'center' },
  footerPg:    { fontSize: 7.5, color: T.inkLight, textAlign: 'right' },

  // Section chrome
  sectionWrap:  { marginBottom: 24 },
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionNum:   { fontSize: 7, color: T.white, fontFamily: 'Helvetica-Bold', backgroundColor: T.brand, paddingLeft: 5, paddingRight: 5, paddingTop: 2, paddingBottom: 2, marginRight: 7, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 18, color: '#0a3d2b', fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  sectionRule:  { height: 2, backgroundColor: T.accent, marginBottom: 12 },

  // Text atoms
  body:      { fontSize: 10, color: '#1a1a1a', lineHeight: 1.6, marginBottom: 3 },
  bold:      { fontSize: 9.5, color: T.ink, fontFamily: 'Helvetica-Bold', lineHeight: 1.5 },
  label:     { fontSize: 7.5, color: T.inkLight, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  subHead:   { fontSize: 13, color: '#0a3d2b', fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 6 },
  italic:    { fontSize: 9, color: T.inkMid, lineHeight: 1.55 },
  small:     { fontSize: 8, color: T.inkLight, lineHeight: 1.4 },

  // Bullet
  bulletRow:  { flexDirection: 'row', marginBottom: 2 },
  bulletDot:  { fontSize: 9.5, color: T.accent, marginRight: 5, fontFamily: 'Helvetica-Bold' },
  bulletText: { fontSize: 9.5, color: T.inkMid, lineHeight: 1.55, flex: 1 },

  // Key-value pair
  kvRow:   { flexDirection: 'row', marginBottom: 3, flexWrap: 'wrap' },
  kvLabel: { fontSize: 8.5, color: T.inkLight, fontFamily: 'Helvetica-Bold', width: 130 },
  kvValue: { fontSize: 8.5, color: T.ink, flex: 1 },

  // Divider
  divider: { borderBottomWidth: 1, borderBottomColor: T.ruleDk, marginTop: 10, marginBottom: 10 },

  // Images
  imgRow:     { flexDirection: 'row', gap: 10, marginBottom: 14 },
  imgCol:     { flex: 1 },
  imgCap:     { fontSize: 7.5, color: T.inkLight, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  imgPhoto:   { width: '100%', height: 160, objectFit: 'cover', borderWidth: 1, borderColor: T.rule },
  imgSingle:  { width: '100%', height: 200, objectFit: 'cover', borderWidth: 1, borderColor: T.rule, marginBottom: 12 },

  // Table
  table:     { marginBottom: 8 },
  tableHdr:  { flexDirection: 'row', backgroundColor: T.brand, paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6 },
  tableHdrT: { fontSize: 7.5, color: T.white, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableRow:  { flexDirection: 'row', paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6, borderBottomWidth: 0.5, borderBottomColor: T.rule },
  tableRowAlt:{ flexDirection: 'row', paddingTop: 4, paddingBottom: 4, paddingLeft: 6, paddingRight: 6, borderBottomWidth: 0.5, borderBottomColor: T.rule, backgroundColor: T.surface },
  tableCell: { fontSize: 8, color: T.inkMid, flex: 1, lineHeight: 1.4 },
  tableCellB:{ fontSize: 8, color: T.ink, fontFamily: 'Helvetica-Bold', flex: 1 },

  // Cost row
  costTotal: { flexDirection: 'row', paddingTop: 5, paddingBottom: 5, paddingLeft: 6, paddingRight: 6, backgroundColor: T.brand, marginTop: 2 },
  costTotalT:{ fontSize: 8.5, color: T.white, fontFamily: 'Helvetica-Bold', flex: 1 },
  costTotalV:{ fontSize: 8.5, color: T.accentLt, fontFamily: 'Helvetica-Bold' },

  // Badge
  badge:      { paddingLeft: 5, paddingRight: 5, paddingTop: 1, paddingBottom: 1, marginRight: 4 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeAmber: { backgroundColor: '#fef9c3' },
  badgeRed:   { backgroundColor: '#fee2e2' },
  badgeText:  { fontSize: 7, fontFamily: 'Helvetica-Bold' },
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const safe = (v: any, fallback = '—') =>
  v !== null && v !== undefined && v !== '' ? String(v) : fallback;

const safeArr = (v: any): any[] =>
  Array.isArray(v) ? v : [];

const currency = (n: number, cur = 'USD') => {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(Math.round(Number(n)));
  } catch {
    const sym: Record<string, string> = { GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$', NZD: 'NZ$' };
    return `${sym[cur] || cur}${Math.round(Number(n)).toLocaleString()}`;
  }
};

function getSwatchHex(colStr: string, map: Record<string, string>, fallback: string): string {
  if (colStr.startsWith('#')) return colStr;
  const lower = colStr.toLowerCase();
  if (map[lower]) return map[lower];
  const found = Object.keys(map).find(key => {
    const pattern = new RegExp('\\b' + key + '\\b', 'i');
    return pattern.test(lower);
  });
  return found ? map[found] : fallback;
}

// Section wrapper component
const Section = ({ num, title, children }: { num: string; title: string; children: any }) => (
  <View style={S.sectionWrap}>
    <View style={S.sectionHdr} wrap={false}>
      <Text style={S.sectionNum}>{num}</Text>
      <Text style={S.sectionTitle}>{title}</Text>
    </View>
    <View style={S.sectionRule} />
    {children}
  </View>
);

const KV = ({ label, value }: { label: string; value: any }) => (
  <View style={S.kvRow}>
    <Text style={S.kvLabel}>{label}</Text>
    <Text style={S.kvValue}>{safe(value)}</Text>
  </View>
);

const Bullet = ({ text }: { text: string }) => (
  <View style={S.bulletRow}>
    <Text style={S.bulletDot}>·</Text>
    <Text style={S.bulletText}>{text}</Text>
  </View>
);

const SubHead = ({ text }: { text: string }) => (
  <Text style={S.subHead}>{text}</Text>
);

function getPlantCareStars(p: any): string {
  const text = [p.growthRate, p.waterRequirement, p.hardinessRating, p.commonName, p.botanicalName, p.layer]
    .filter(Boolean).join(' ').toLowerCase();
  if (/hardy|low.?maintenance|drought.?tolerant|evergreen/.test(text)) return '***';
  if (/specialist|tender|annual|exotic/.test(text)) return '*--';
  return '**-';
}

function getDurationLabel(days: number): string {
  if (days <= 2) return 'A weekend';
  if (days <= 5) return '2\u20133 weekends';
  if (days <= 8) return '3\u20134 weekends';
  return 'A few weeks';
}

// formatCost is currency-aware; populated from postcode prop inside the component
let _activeCurrency: CurrencyConfig = { code: 'EUR', symbol: '\u20ac', locale: 'en-IE' };
function formatCost(val: string | number | undefined): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'number') {
    return currency(val, _activeCurrency.code);
  }
  const str = String(val);
  // Replace $ (and optional trailing space) with currency symbol, preserving surrounding whitespace
  return str.replace(/\$\s*/g, _activeCurrency.symbol)
            .replace(/USD/g, _activeCurrency.code);
}

const KEY_CONSIDERATION_PREPEND: Record<string, string> = {
  'Underground Services': "Before you dig anything, know what\u2019s under your garden.",
  'Soil Assessment': 'Your soil is the foundation of everything.',
  'Measurements on Drawings': "The measurements here are a guide \u2014 always measure your actual space before ordering materials.",
  'Ground Stability': "Worth a professional check if you\u2019re building retaining walls or steps.",
  'Structural Integrity': 'Any load-bearing element should be signed off before you build it.',
};

// Running header + footer (fixed, repeats every page)
const PageChrome = ({ clientName, dateStr, style, referenceNumber, logoBase64 }: any) => (
  <>
    <View style={S.runHdr} fixed>
      <Text style={S.runBrand}>dedrab.com · Action Plan</Text>
      <Text style={S.runRight}>{clientName ? clientName + ' · ' : ''}{style}</Text>
    </View>
    <View style={S.footer} fixed>
      {logoBase64 ? <Image src={logoBase64} style={{ width: 60, height: 'auto' }} /> : <Text style={S.footerBrand}>Dedrab</Text>}
      <Text style={S.footerMid}>{'Dedrab Design Reference: ' + (referenceNumber || 'Pending')}</Text>
      <Text style={S.footerPg} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => 'Page ' + pageNumber + ' / ' + totalPages} />
    </View>
  </>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props {
  doc?: any;
  plan?: string;
  logoBase64?: string;
  imageBase64: string;
  imageDataUrl?: string;
  gridImageUrl?: string;
  aerialImageUrl?: string;
  style: string;
  clientName?: string;
  siteAddress?: string;
  gardenOrientation?: string;
  transformationLevel?: number;
  referenceNumber?: string;
  postcode?: string;
}

export const GardenPlanPDF = ({ doc, plan, logoBase64, imageBase64, imageDataUrl, gridImageUrl, aerialImageUrl, style, clientName, siteAddress, gardenOrientation, transformationLevel, referenceNumber, postcode }: Props) => {
  const d = doc || {};
  const hasBefore = !!imageDataUrl;
  const hasAfter  = !!imageBase64;
  _activeCurrency = getCurrencyFromPostcode(postcode || d.siteAddress);
  const cur = _activeCurrency.code;
  const coverImg = imageBase64 || null;

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  function getTransformationDisplay(level: number): string {
    const map: Record<number, string> = {
      1: '1 — Subtle: Light touch changes that refresh without altering the character',
      2: '2 — Considered: Builds on what is there with targeted improvements',
      3: '3 — Balanced: A meaningful redesign while keeping key existing features',
      4: '4 — Ambitious: A significant transformation with a clear new design direction',
      5: '5 — Full redesign: Start fresh with a completely new vision for the space',
    };
    return map[level] || `Level ${level}`;
  }
  const transformationLabel = transformationLevel ? getTransformationDisplay(transformationLevel) : '—';

  // Build cover title: "[Client] — [Orientation]-Facing Garden — [Style]"
  const orientationDoc = gardenOrientation || d.siteAnalysis?.sunProfile?.primaryOrientation || '';
  const formattedOrientation = orientationDoc
    ? orientationDoc.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-') + '-Facing'
    : '';
  const coverTitle = [
    clientName || null,
    formattedOrientation ? `${formattedOrientation} Garden` : null,
    style || null,
  ].filter(Boolean).join(' — ');

  // ── Plants table columns (abbreviated for space)
  const plants = safeArr(d.plantingSpecification?.plants);

  // ── Cost totals
  const costLines = safeArr(d.costEstimate?.lines);
  const totalLow  = costLines.reduce((s: number, l: any) => s + (Number(l.low) || 0), 0);
  const totalHigh = costLines.reduce((s: number, l: any) => s + (Number(l.high) || 0), 0);
  const contingencyPct = d.costEstimate?.contingencyPercent || 15;
  const grandLow  = Math.round(totalLow  * (1 + contingencyPct / 100));
  const grandHigh = Math.round(totalHigh * (1 + contingencyPct / 100));

  return (
    <Document>

      {/* ══════════════════════════════════════════════════════════
          COVER PAGE
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.coverPage}>
        {coverImg && <Image src={coverImg} style={S.coverBg} />}
        <View style={S.coverOverlay} />
        <View style={S.coverTopRule} />
        <View style={S.coverContent}>
          <View style={S.coverTopRow}>
            {logoBase64
              ? <Image src={logoBase64} style={{ width: 150, height: 'auto' }} />
              : <Text style={S.coverBrand}>Dedrab</Text>}
            <Text style={S.coverDate}>{dateStr}</Text>
          </View>
          <View style={S.coverMid}>
            <Text style={S.coverStyleTag}>{style}</Text>
            <Text style={S.coverTitle}>{coverTitle || 'Your Garden\nAction Plan'}</Text>
            <Text style={S.coverSubtitle}>Action Plan</Text>
            <View style={S.coverRule} />
            <View style={S.coverMetaRow}>
              {clientName ? (
                <View>
                  <Text style={S.coverMetaLbl}>Prepared for</Text>
                  <Text style={S.coverMetaVal}>{clientName}</Text>
                </View>
              ) : null}
              {siteAddress ? (
                <View>
                  <Text style={S.coverMetaLbl}>Site</Text>
                  <Text style={S.coverMetaVal}>{siteAddress}</Text>
                </View>
              ) : null}
            </View>
          </View>
          <View style={S.coverBottom}>
            <Text style={S.coverConf}>Your personal garden plan — made just for you</Text>
            <Text style={S.coverPg}>Page 1</Text>
          </View>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          RENDER HERO PAGE
      ══════════════════════════════════════════════════════════ */}
      {imageBase64 ? (
        <Page size="A4" style={{ paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }}>
          <Image src={imageBase64} style={{ width: '100%', height: 380, objectFit: 'cover' }} />
          <View style={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 40, paddingRight: 40, backgroundColor: '#0a3d2b' }}>
            <Text style={{ fontSize: 18, color: '#ffffff', fontFamily: 'Helvetica-Bold' }}>Your redesigned garden</Text>
            <Text style={{ fontSize: 11, color: '#b8962e', marginTop: 4 }}>{style} design</Text>
          </View>
          <View style={{ paddingTop: 20, paddingLeft: 40, paddingRight: 40 }}>
            <Text style={{ fontSize: 11, color: '#444444', lineHeight: 1.6 }}>This is what your garden could look like. The pages that follow explain exactly how to get there — step by step, at your own pace.</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 24, paddingLeft: 40, paddingRight: 40 }}>
            {[
              { label: 'Design style', value: style },
              { label: 'Estimated area', value: d.overview?.estimatedAreaSqm ? d.overview.estimatedAreaSqm + ' m\u00b2' : '\u2014' },
              { label: 'Garden orientation', value: d.siteAnalysis?.sunProfile?.primaryOrientation || '\u2014' },
              { label: 'Plan reference', value: referenceNumber || '\u2014' },
            ].map((item, i) => (
              <View key={i} style={{ width: '50%', marginBottom: 16, paddingRight: 20 }}>
                <Text style={{ fontSize: 9, color: '#888888', marginBottom: 2 }}>
                  {item.label.toUpperCase()}
                </Text>
                <Text style={{ fontSize: 12, color: '#1a1a1a', fontFamily: 'Helvetica-Bold' }}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
          <View style={S.footer} fixed>
            {logoBase64 ? <Image src={logoBase64} style={{ width: 60, height: 'auto' }} /> : <Text style={S.footerBrand}>Dedrab</Text>}
            <Text style={S.footerMid}>{'Dedrab Design Reference: ' + (referenceNumber || 'Pending')}</Text>
            <Text style={S.footerPg} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => 'Page ' + pageNumber + ' / ' + totalPages} />
          </View>
        </Page>
      ) : null}

      {/* ══════════════════════════════════════════════════════════
          SECTION PAGES
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        {/* ── 1. Project Overview ─────────────────────────────── */}
        <Section num="01" title="Project Overview">
          <KV label="Client"          value={clientName || '—'} />
          <KV label="Site Address"    value={siteAddress || '—'} />
          <KV label="Date"            value={dateStr} />
          <KV label="Design Language" value={style} />
          <KV label="Estimated Area"  value={d.overview?.estimatedAreaSqm ? `${d.overview.estimatedAreaSqm} m²` : '—'} />
          {d.overview?.scopeDescription ? (
            <Text style={[S.body, { marginTop: 6 }]}>{d.overview.scopeDescription}</Text>
          ) : null}
          {safeArr(d.overview?.objectives).length > 0 ? (
            <>
              <SubHead text="Project Objectives" />
              {safeArr(d.overview.objectives).map((o: string, i: number) => (
                <Bullet key={i} text={o} />
              ))}
            </>
          ) : null}
        </Section>

        {/* ── 2. Site Analysis ────────────────────────────────── */}
        <Section num="02" title="Site Analysis &amp; Constraints">
          {d.siteAnalysis ? (
            <>
              <SubHead text="Sun Exposure" />
              <KV label="Orientation"     value={d.siteAnalysis.sunProfile?.primaryOrientation} />
              <KV label="Morning Light"   value={d.siteAnalysis.sunProfile?.morningLight} />
              <KV label="Afternoon Light" value={d.siteAnalysis.sunProfile?.afternoonLight} />
              {safeArr(d.siteAnalysis.sunProfile?.shadingElements).map((s: string, i: number) => (
                <Bullet key={i} text={s} />
              ))}

              <SubHead text="Soil &amp; Drainage" />
              <KV label="Soil Type"      value={d.siteAnalysis.soil?.type} />
              <KV label="Drainage"       value={d.siteAnalysis.soil?.drainageNotes} />
              <KV label="Hardiness Zone" value={d.siteAnalysis.hardinessZone} />
              {safeArr(d.siteAnalysis.soil?.recommendedAmendments).map((a: string, i: number) => (
                <Bullet key={i} text={a} />
              ))}

              {safeArr(d.siteAnalysis.existingFeatures).length > 0 ? (
                <>
                  <SubHead text="Existing Features" />
                  <View style={S.table}>
                    <View style={S.tableHdr}>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Feature</Text>
                      <Text style={S.tableHdrT}>Type</Text>
                      <Text style={S.tableHdrT}>Disposition</Text>
                    </View>
                    {safeArr(d.siteAnalysis.existingFeatures).map((f: any, i: number) => (
                      <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCell, { flex: 2 }]}>{safe(f.label)}</Text>
                        <Text style={S.tableCell}>{safe(f.type)}</Text>
                        <Text style={S.tableCell}>{safe(f.disposition)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {safeArr(d.siteAnalysis.microclimates).length > 0 ? (
                <>
                  <SubHead text="Microclimate Notes" />
                  {safeArr(d.siteAnalysis.microclimates).map((m: any, i: number) => (
                    <Bullet key={i} text={`${safe(m.zone)}: ${safe(m.description)}`} />
                  ))}
                </>
              ) : null}

              {d.siteAnalysis.topographyNotes ? (
                <Text style={[S.body, { marginTop: 4 }]}>{d.siteAnalysis.topographyNotes}</Text>
              ) : null}
            </>
          ) : plan ? <Text style={S.body}>{plan}</Text> : null}
        </Section>

        {/* ── 3. Design Concept ───────────────────────────────── */}
        <Section num="03" title="Design Direction">
          {d.designConcept ? (
            <>
              {d.designConcept.conceptStatement
                ? <Text style={[S.body, { marginBottom: 6 }]}>{d.designConcept.conceptStatement}</Text>
                : null}
              {d.designConcept.rationale
                ? <Text style={S.italic}>{d.designConcept.rationale}</Text>
                : null}
              {safeArr(d.designConcept.principles).length > 0 ? (
                <>
                  <SubHead text="Design Principles" />
                  {safeArr(d.designConcept.principles).map((p: string, i: number) => (
                    <Bullet key={i} text={p} />
                  ))}
                </>
              ) : null}
              {safeArr(d.designConcept.materialMoods).length > 0 ? (
                <>
                  <SubHead text="Material &amp; Mood Direction" />
                  {safeArr(d.designConcept.materialMoods).map((m: string, i: number) => (
                    <Bullet key={i} text={m} />
                  ))}
                </>
              ) : null}
              {safeArr(d.designConcept.colourPalette).length > 0 ? (
                <>
                  <SubHead text="Colour Palette" />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
                    {safeArr(d.designConcept.colourPalette).map((col: any, i: number) => {
                      const colStr = typeof col === 'string' ? col : (col?.name || col?.hex || col?.colour || col?.color || String(col));
                      const hexStr = typeof col === 'string' ? col : (col?.hex || col?.colour || col?.color || colStr);
                      const hexVal = getSwatchHex(hexStr, COLOUR_HEX_MAP, T.accent);
                      return (
                        <View key={i} style={{ width: '50%', flexDirection: 'row', alignItems: 'center', paddingBottom: 10, paddingRight: 16 }}>
                          <View style={{ width: 14, height: 14, backgroundColor: hexVal, marginRight: 8, borderWidth: 0.5, borderColor: '#cccccc' }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1a1a1a' }}>{colStr}</Text>
                            <Text style={{ fontSize: 8, color: '#666666' }}>{col.role || ''}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </Section>

      </Page>

      {/* ── Page 3: Spatial Layout + Planting ─────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        {/* ── 4. Spatial Layout ───────────────────────────────── */}
        <Section num="04" title="Spatial Layout &amp; Zoning">
          {aerialImageUrl ? (
            <>
              <View style={{ backgroundColor: '#f9f6f0', marginBottom: 4 }}>
                <Image src={aerialImageUrl} style={[S.imgSingle, { height: 340, objectFit: 'contain', marginBottom: 0 }]} />
              </View>
              <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }]}>
                Garden Layout Plan — print this and take it outside.
              </Text>
            </>
          ) : (
            <View style={{ paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, backgroundColor: '#f5f5f0', marginBottom: 16 }}>
              <Text style={{ fontSize: 10, color: '#888888', fontStyle: 'italic' }}>
                Garden layout plan not available for this session.
              </Text>
            </View>
          )}
          {d.spatialLayout ? (
            <>
              {d.spatialLayout.compositionNotes
                ? <Text style={[S.body, { marginBottom: 6 }]}>{d.spatialLayout.compositionNotes}</Text>
                : null}

              {safeArr(d.spatialLayout.zones).length > 0 ? (
                <>
                  <SubHead text="Design Zones" />
                  <View style={S.table}>
                    <View style={S.tableHdr}>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Zone</Text>
                      <Text style={S.tableHdrT}>Type</Text>
                      <Text style={S.tableHdrT}>Area (m²)</Text>
                    </View>
                    {safeArr(d.spatialLayout.zones).map((z: any, i: number) => (
                      <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCellB, { flex: 2 }]}>{safe(z.name)}</Text>
                        <Text style={S.tableCell}>{safe(z.type)}</Text>
                        <Text style={S.tableCell}>{safe(z.areaSqm)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {safeArr(d.spatialLayout.focalPoints).length > 0 ? (
                <>
                  <SubHead text="Focal Points" />
                  {safeArr(d.spatialLayout.focalPoints).map((f: string, i: number) => (
                    <Bullet key={i} text={f} />
                  ))}
                </>
              ) : null}

              {safeArr(d.spatialLayout.circulationRoutes).length > 0 ? (
                <>
                  <SubHead text="Circulation Routes" />
                  {safeArr(d.spatialLayout.circulationRoutes).map((r: any, i: number) => (
                    <Bullet key={i} text={`${safe(r.id)}: ${safe(r.surfaceTreatment)}, ${safe(r.widthM)}m wide`} />
                  ))}
                </>
              ) : null}
            </>
          ) : null}
        </Section>

      </Page>

      {/* ── Page 3b: Planting Schedule ────────────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        <Section num="05" title="Planting Specification">
          {d.plantingSpecification?.layeringStrategy
            ? <Text style={[S.body, { marginBottom: 8 }]}>{d.plantingSpecification.layeringStrategy}</Text>
            : null}

          {plants.length > 0 ? (
            <>
              <SubHead text="Plant Schedule" />
              <View style={S.table}>
                <View style={[S.tableHdr, { flexDirection: 'row' }]}>
                  <Text style={[S.tableHdrT, { width: '30%' }]}>Botanical Name</Text>
                  <Text style={[S.tableHdrT, { width: '22%' }]}>Common Name</Text>
                  <Text style={[S.tableHdrT, { width: '8%' }]}>Qty</Text>
                  <Text style={[S.tableHdrT, { width: '20%' }]}>Mature Size</Text>
                  <Text style={[S.tableHdrT, { width: '12%' }]}>Layer</Text>
                  <Text style={[S.tableHdrT, { width: '8%' }]}>Care</Text>
                </View>
                {plants.map((p: any, i: number) => (
                  <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tableCellB, { width: '30%' }]}>{safe(p.botanicalName)}{p.cultivar && p.cultivar !== 'null' && p.cultivar !== '' ? ` '${p.cultivar}'` : ''}</Text>
                    <Text style={[S.tableCell, { width: '22%' }]}>{safe(p.commonName)}</Text>
                    <Text style={[S.tableCell, { width: '8%' }]}>{safe(p.quantity)}</Text>
                    <Text style={[S.tableCell, { width: '20%' }]}>{safe(p.matureSize)}</Text>
                    <Text style={[S.tableCell, { width: '12%' }]}>{safe(p.layer)}</Text>
                    <Text style={[S.tableCell, { width: '8%', fontSize: 10 }]}>{getPlantCareStars(p)}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#0a3d2b', marginRight: 16 }}>
                  *** easy
                </Text>
                <Text style={{ fontSize: 9, color: '#0a3d2b', marginRight: 16 }}>
                  **- moderate
                </Text>
                <Text style={{ fontSize: 9, color: '#0a3d2b' }}>
                  *-- needs attention
                </Text>
              </View>
            </>
          ) : null}
        </Section>
      </Page>

      {/* ── Page 3c: Seasonal Matrix ──────────────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        <Section num="05b" title="Seasonal Interest Matrix">
          {plants.length > 0 ? (
            <View style={S.table}>
              <View style={[S.tableHdr, { flexDirection: 'row' }]}>
                <Text style={[S.tableHdrT, { flex: 2 }]}>Plant</Text>
                <Text style={[S.tableHdrT, { flex: 2.5 }]}>Spring</Text>
                <Text style={[S.tableHdrT, { flex: 2.5 }]}>Summer</Text>
                <Text style={[S.tableHdrT, { flex: 2.5 }]}>Autumn</Text>
                <Text style={[S.tableHdrT, { flex: 2.5 }]}>Winter</Text>
              </View>
              {plants.map((p: any, i: number) => (
                <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                  <Text style={[S.tableCellB, { flex: 2, fontSize: 7.5 }]}>{safe(p.commonName)}</Text>
                  <Text style={[S.tableCell, { flex: 2.5, fontSize: 7.5 }]}>{safe(p.seasonalInterest?.spring, '—')}</Text>
                  <Text style={[S.tableCell, { flex: 2.5, fontSize: 7.5 }]}>{safe(p.seasonalInterest?.summer, '—')}</Text>
                  <Text style={[S.tableCell, { flex: 2.5, fontSize: 7.5 }]}>{safe(p.seasonalInterest?.autumn, '—')}</Text>
                  <Text style={[S.tableCell, { flex: 2.5, fontSize: 7.5 }]}>{safe(p.seasonalInterest?.winter, '—')}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {d.plantingSpecification?.seasonalNarrative
            ? <Text style={[S.body, { marginTop: 10 }]}>{d.plantingSpecification.seasonalNarrative}</Text>
            : null}
        </Section>
      </Page>

      {/* ── Page 4: Hardscape + Soil/Irrigation ───────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        {/* ── 6. Hardscape ────────────────────────────────────── */}
        <Section num="06" title="Hardscape &amp; Materials Palette">
          {d.hardscapeSpecification ? (
            <>
              {d.hardscapeSpecification.paletteNarrative
                ? <Text style={[S.body, { marginBottom: 6 }]}>{d.hardscapeSpecification.paletteNarrative}</Text>
                : null}

              {safeArr(d.hardscapeSpecification.materials).length > 0 ? (
                <>
                  <SubHead text="Materials Schedule" />
                  <View style={S.table}>
                    <View style={S.tableHdr}>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Element</Text>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Material</Text>
                      <Text style={S.tableHdrT}>Finish</Text>
                      <Text style={S.tableHdrT}>Unit Cost Estimate</Text>
                    </View>
                    {safeArr(d.hardscapeSpecification.materials).map((m: any, i: number) => (
                      <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCellB, { flex: 2 }]}>{safe(m.element)}</Text>
                        <Text style={[S.tableCell, { flex: 2 }]}>{safe(m.material)}</Text>
                        <Text style={S.tableCell}>{safe(m.finish)}</Text>
                        <Text style={S.tableCell}>{formatCost(m.unitCostRange)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginTop: 6 }]}>
                    These are ballpark figures to help you plan. Prices vary by supplier and region — always get a quote before you commit.
                  </Text>
                </>
              ) : null}

              {safeArr(d.hardscapeSpecification.boundaryTreatments).length > 0 ? (
                <>
                  <SubHead text="Boundary Treatments" />
                  {safeArr(d.hardscapeSpecification.boundaryTreatments).map((b: string, i: number) => (
                    <Bullet key={i} text={b} />
                  ))}
                </>
              ) : null}

              {safeArr(d.hardscapeSpecification.waterFeatures).length > 0 ? (
                <>
                  <SubHead text="Water Features &amp; Focal Structures" />
                  {safeArr(d.hardscapeSpecification.waterFeatures).map((w: string, i: number) => (
                    <Bullet key={i} text={w} />
                  ))}
                  {safeArr(d.hardscapeSpecification.focalStructures).map((f: string, i: number) => (
                    <Bullet key={i} text={f} />
                  ))}
                </>
              ) : null}

              {safeArr(d.hardscapeSpecification.lighting).length > 0 ? (
                <>
                  <SubHead text="Lighting Specification" />
                  <View style={S.table}>
                    <View style={S.tableHdr}>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Type</Text>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Location</Text>
                      <Text style={S.tableHdrT}>Colour Temp</Text>
                    </View>
                    {safeArr(d.hardscapeSpecification.lighting).map((l: any, i: number) => (
                      <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCellB, { flex: 2 }]}>{safe(l.type)}</Text>
                        <Text style={[S.tableCell, { flex: 2 }]}>{safe(l.location)}</Text>
                        <Text style={S.tableCell}>{l.colourTempK ? `${l.colourTempK}K` : '—'}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </Section>

        {/* ── 7. Soil, Drainage & Irrigation ──────────────────── */}
        <Section num="07" title="Soil, Drainage &amp; Irrigation">
          {d.soilAndIrrigation ? (
            <>
              {d.soilAndIrrigation.soilPreparationPlan
                ? <><SubHead text="Soil Preparation" /><Text style={S.body}>{d.soilAndIrrigation.soilPreparationPlan}</Text></>
                : null}
              {d.soilAndIrrigation.drainageStrategy
                ? <><SubHead text="Drainage Strategy" /><Text style={S.body}>{d.soilAndIrrigation.drainageStrategy}</Text></>
                : null}
              {d.soilAndIrrigation.mulchingRecommendation
                ? <><SubHead text="Mulching" /><Text style={S.body}>{d.soilAndIrrigation.mulchingRecommendation}</Text></>
                : null}
              {safeArr(d.soilAndIrrigation.irrigationZones).length > 0 ? (
                <>
                  <SubHead text="Irrigation Zones" />
                  <View style={S.table}>
                    <View style={S.tableHdr}>
                      <Text style={[S.tableHdrT, { flex: 2 }]}>Zone</Text>
                      <Text style={S.tableHdrT}>Type</Text>
                      <Text style={S.tableHdrT}>Coverage (m²)</Text>
                    </View>
                    {safeArr(d.soilAndIrrigation.irrigationZones).map((z: any, i: number) => (
                      <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                        <Text style={[S.tableCellB, { flex: 2 }]}>{safe(z.name)}</Text>
                        <Text style={S.tableCell}>{safe(z.type)}</Text>
                        <Text style={S.tableCell}>{safe(z.coverageAreaSqm)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
        </Section>
      </Page>

      {/* ── Page 5: Implementation + Maintenance + Costs ──────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        {/* ── 8. Implementation Plan ──────────────────────────── */}
        <Section num="08" title="How to Do It — Your Phased Plan">
          <View style={{ borderLeftWidth: 3, borderLeftColor: T.accent, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10, marginBottom: 14, backgroundColor: '#f9f7f3' }}>
            <Text style={{ fontSize: 7, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Right, let&apos;s get started</Text>
            <Text style={S.body}>We&apos;ve broken this into phases so it never feels overwhelming. Phase 1 is a great place to start — most people get it done over a couple of weekends. Come back to this plan whenever you&apos;re ready for the next step.</Text>
          </View>
          {(() => {
            const allTasks = safeArr(d.implementationPlan?.tasks);
            const ph1 = allTasks.filter((t: any) => {
              const ph = String(t.phase || '');
              return ph === '1' || ph.toLowerCase().startsWith('phase 1') || (ph.startsWith('1') && ph.length <= 2);
            });
            const quickWins = (ph1.length > 0 ? ph1 : allTasks).slice(0, 3);
            if (quickWins.length === 0) return null;
            return (
              <View style={{ borderLeftWidth: 4, borderLeftColor: '#0a3d2b', backgroundColor: '#f0f7f0', paddingTop: 12, paddingBottom: 12, paddingLeft: 16, paddingRight: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 8 }}>This weekend</Text>
                {quickWins.map((t: any, i: number) => (
                  <Text key={i} style={{ fontSize: 10, color: '#1a1a1a', lineHeight: 1.5, marginBottom: 4 }}>{'\u2192 '}{safe(t.task)}</Text>
                ))}
              </View>
            );
          })()}
          {safeArr(d.recommendations).length > 0 ? (
            <>
              <SubHead text="Recommendations" />
              {safeArr(d.recommendations).map((r: any, i: number) => (
                <View key={i} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: T.accent, paddingLeft: 10, marginBottom: 12, backgroundColor: '#f9f7f3' }}>
                  <Text style={{ fontSize: 7, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Recommendation</Text>
                  <Text style={[S.body, { fontFamily: 'Helvetica-Bold', marginBottom: 3 }]}>{safe(r.title)}</Text>
                  <Text style={[S.body, { marginBottom: 3 }]}>{safe(r.description)}</Text>
                  <Text style={[S.small, { fontStyle: 'italic', color: T.inkLight }]}>{safe(r.justification)}</Text>
                  {r.estimatedCost ? (
                    <Text style={[S.small, { color: T.accent, fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>{formatCost(r.estimatedCost)}</Text>
                  ) : null}
                </View>
              ))}
            </>
          ) : null}
          {d.implementationPlan ? (
            <>
              <View style={S.kvRow}>
                <Text style={S.kvLabel}>Total Duration (Estimate)</Text>
                <View>
                  <Text style={S.kvValue}>{d.implementationPlan.totalWeeks ? `${d.implementationPlan.totalWeeks} weeks` : '—'}</Text>
                  <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginTop: 2 }]}>Based on a standard contractor team. Actual duration may vary.</Text>
                </View>
              </View>
              {d.implementationPlan.criticalPathNotes
                ? <Text style={[S.body, { marginBottom: 6 }]}>{d.implementationPlan.criticalPathNotes}</Text>
                : null}
              {safeArr(d.implementationPlan.tasks).length > 0 ? (
                <View style={S.table}>
                  <View style={S.tableHdr}>
                    <Text style={[S.tableHdrT, { flex: 2 }]}>Phase</Text>
                    <Text style={[S.tableHdrT, { flex: 3 }]}>Task</Text>
                    <Text style={S.tableHdrT}>Time needed</Text>
                  </View>
                  {safeArr(d.implementationPlan.tasks).map((t: any, i: number) => (
                    <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={[S.tableCellB, { flex: 2 }]}>{safe(t.phase)}</Text>
                      <Text style={[S.tableCell, { flex: 3 }]}>{safe(t.task)}</Text>
                      <Text style={S.tableCell}>{t.estimatedDays ? getDurationLabel(Number(t.estimatedDays)) : '—'}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </Section>

        {/* ── 9. Maintenance Schedule ─────────────────────────── */}
        <Section num="09" title="Ongoing Care">
          <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginBottom: 10 }]}>
            This is your year-round care guide. Every garden is different — use this as a starting point and adjust as you get to know your plants.
          </Text>
          {d.maintenanceSchedule ? (
            <>
              {safeArr(d.maintenanceSchedule.tasks).length > 0 ? (
                <View style={S.table}>
                  <View style={S.tableHdr}>
                    <Text style={S.tableHdrT}>Season</Text>
                    <Text style={[S.tableHdrT, { flex: 3 }]}>Task</Text>
                    <Text style={[S.tableHdrT, { flex: 2 }]}>Frequency</Text>
                  </View>
                  {safeArr(d.maintenanceSchedule.tasks).map((t: any, i: number) => (
                    <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={S.tableCellB}>{safe(t.season)}</Text>
                      <Text style={[S.tableCell, { flex: 3 }]}>{safe(t.task)}</Text>
                      <Text style={[S.tableCell, { flex: 2 }]}>{safe(t.frequency)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {d.maintenanceSchedule.annualPruningRegime
                ? <><SubHead text="Annual Pruning Regime" /><Text style={S.body}>{d.maintenanceSchedule.annualPruningRegime}</Text></>
                : null}
              {d.maintenanceSchedule.feedingSchedule
                ? <><SubHead text="Feeding Schedule" /><Text style={S.body}>{d.maintenanceSchedule.feedingSchedule}</Text></>
                : null}
              {d.maintenanceSchedule.longTermManagementNotes
                ? <><SubHead text="Long-term Management" /><Text style={S.body}>{d.maintenanceSchedule.longTermManagementNotes}</Text></>
                : null}
              <KV label="Professional Visits" value={d.maintenanceSchedule.professionalVisitsPerYear ? `${d.maintenanceSchedule.professionalVisitsPerYear} per year` : '—'} />
            </>
          ) : null}
        </Section>

        {/* ── 10. Cost Estimate ────────────────────────────────── */}
        <Section num="10" title="Cost Estimate Summary">
          {d.costEstimate ? (
            <>
              {costLines.length > 0 ? (
                <View style={S.table}>
                  <View style={S.tableHdr}>
                    <Text style={[S.tableHdrT, { flex: 2 }]}>Category</Text>
                    <Text style={[S.tableHdrT, { flex: 3 }]}>Description</Text>
                    <Text style={S.tableHdrT}>Low</Text>
                    <Text style={S.tableHdrT}>High</Text>
                  </View>
                  {costLines.map((l: any, i: number) => (
                    <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={[S.tableCellB, { flex: 2 }]}>{safe(l.category)}</Text>
                      <Text style={[S.tableCell, { flex: 3 }]}>{safe(l.description)}</Text>
                      <Text style={S.tableCell}>{currency(l.low, cur)}</Text>
                      <Text style={S.tableCell}>{currency(l.high, cur)}</Text>
                    </View>
                  ))}
                  <View style={S.costTotal}>
                    <Text style={[S.costTotalT, { flex: 5 }]}>Total incl. {contingencyPct}% contingency</Text>
                    <Text style={S.costTotalV}>{currency(grandLow, cur)} – {currency(grandHigh, cur)}</Text>
                  </View>
                </View>
              ) : null}
              {d.costEstimate.costingNotes
                ? <Text style={[S.small, { marginTop: 4 }]}>{d.costEstimate.costingNotes}</Text>
                : null}
            </>
          ) : null}
        </Section>
      </Page>

      {/* ── Key Considerations ────────────────────────────────── */}
      {safeArr(d.keyConsiderations).length > 0 ? (
        <Page size="A4" style={S.page}>
          <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

          <Section num="11" title="Key Considerations">
            <Text style={[S.body, { marginBottom: 12 }]}>
              A few things worth checking before you get started — nothing to worry about, just good to know.
            </Text>
            {safeArr(d.keyConsiderations).map((item: any, i: number) => {
              const prepend = KEY_CONSIDERATION_PREPEND[item.heading] || null;
              return (
                <View key={i} style={{ marginBottom: 10 }} wrap={false}>
                  <Text style={[S.bold, { marginBottom: 2 }]}>{safe(item.heading)}</Text>
                  {prepend ? <Text style={[S.body, { fontStyle: 'italic', marginBottom: 2 }]}>{prepend}</Text> : null}
                  <Text style={S.body}>{safe(item.guidance)}</Text>
                </View>
              );
            })}
          </Section>
        </Page>
      ) : null}

      {/* ── Page 6: Aerial Layout Plan ────────────────────────── */}
      {aerialImageUrl ? (
        <Page size="A4" style={S.page}>
          <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

          <Section num="App A" title="Garden Layout Plan">
            <Text style={[S.small, { marginBottom: 8 }]}>
              Top-down layout sketch showing proposed planting areas. Print this and take it outside.
            </Text>
            <View style={{ backgroundColor: '#f9f6f0', marginBottom: 12 }}>
              <Image src={aerialImageUrl} style={[S.imgSingle, { height: 360, objectFit: 'contain', marginBottom: 0 }]} />
            </View>
            {plants.length > 0 ? (
              <>
                <SubHead text="Plant Reference" />
                <View style={S.table}>
                  <View style={S.tableHdr}>
                    <Text style={[S.tableHdrT, { flex: 0.4 }]}>#</Text>
                    <Text style={[S.tableHdrT, { flex: 1.8 }]}>Location</Text>
                    <Text style={[S.tableHdrT, { flex: 3.2 }]}>Plant</Text>
                    <Text style={[S.tableHdrT, { flex: 3.6 }]}>Description</Text>
                  </View>
                  {plants.map((p: any, i: number) => (
                    <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={[S.tableCellB, { flex: 0.4, color: T.accent }]}>{i + 1}</Text>
                      <Text style={[S.tableCellB, { flex: 1.8 }]}>{safe(p.location || p.gridLocation || '—')}</Text>
                      <Text style={[S.tableCellB, { flex: 3.2, fontSize: 7.5 }]}>{safe(p.botanicalName)}{p.commonName && p.commonName !== p.botanicalName ? ` — ${p.commonName}` : ''}</Text>
                      <Text style={[S.tableCell, { flex: 3.6, fontSize: 7.5 }]}>{safe(p.designRationale)}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </Section>
        </Page>
      ) : null}

      {/* ── Page 7: Appendices ────────────────────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} referenceNumber={referenceNumber} logoBase64={logoBase64} />

        <Section num="App B" title="Appendices">

          {/* A: Before & After */}
          {(hasBefore || hasAfter) ? (
            <>
              <SubHead text="B — Site Photography: Before &amp; After" />
              {hasBefore && hasAfter ? (
                <View style={S.imgRow}>
                  <View style={S.imgCol}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Before</Text>
                    <Image src={imageDataUrl!} style={S.imgPhoto} />
                  </View>
                  <View style={S.imgCol}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your redesigned garden</Text>
                    <Image src={imageBase64} style={S.imgPhoto} />
                  </View>
                </View>
              ) : hasAfter ? (
                <>
                  <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your redesigned garden</Text>
                  <Image src={imageBase64} style={S.imgSingle} />
                </>
              ) : null}
            </>
          ) : null}

          {/* C: Garden Render */}
          {imageBase64 ? (
            <>
              <SubHead text="C — Your Finished Garden" />
              <Image src={imageBase64} style={[S.imgSingle, { height: 220, marginBottom: 0 }]} />
              <View style={{ backgroundColor: '#0a3d2b', flexDirection: 'row', paddingTop: 8, paddingBottom: 8, paddingLeft: 16, paddingRight: 16, marginBottom: 12 }}>
                {[
                  { label: 'THEME', value: style || '—', flex: 1, valueSize: 9 },
                  { label: 'TRANSFORMATION', value: transformationLabel, flex: 2, valueSize: 8 },
                  { label: 'ORIENTATION', value: formattedOrientation ? formattedOrientation.replace('Facing', 'facing') : '—', flex: 1, valueSize: 9 },
                ].map((item) => (
                  <View key={item.label} style={{ flex: item.flex }}>
                    <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</Text>
                    <Text style={{ fontSize: item.valueSize ?? 9, color: '#ffffff', fontFamily: 'Helvetica-Bold' }}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* D: Plant data sheets */}
          {plants.length > 0 ? (
            <>
              <SubHead text="D — Plant Data Reference" />
              <View style={S.table}>
                <View style={S.tableHdr}>
                  <Text style={[S.tableHdrT, { flex: 2 }]}>Botanical Name</Text>
                  <Text style={S.tableHdrT}>Sun</Text>
                  <Text style={S.tableHdrT}>Water</Text>
                  <Text style={S.tableHdrT}>Growth</Text>
                  <Text style={S.tableHdrT}>Hardiness</Text>
                </View>
                {plants.map((p: any, i: number) => (
                  <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tableCellB, { flex: 2 }]}>{safe(p.botanicalName)}</Text>
                    <Text style={S.tableCell}>{safe(p.sunRequirement)}</Text>
                    <Text style={S.tableCell}>{safe(p.waterRequirement)}</Text>
                    <Text style={S.tableCell}>{safe(p.growthRate)}</Text>
                    <Text style={S.tableCell}>{safe(p.hardinessRating)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* E: Caveats */}
          {safeArr(d.caveats).length > 0 ? (
            <>
              <SubHead text="E — Notes &amp; Caveats" />
              {safeArr(d.caveats).map((c: string, i: number) => (
                <Bullet key={i} text={c} />
              ))}
            </>
          ) : null}

        </Section>
      </Page>

      {/* ── Shopping List Appendix ────────────────────────────── */}
      <Page size="A4" style={{ paddingTop: 48, paddingBottom: 48, paddingLeft: 48, paddingRight: 48 }}>
        <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 2 }}>Dedrab</Text>
        <Text style={{ fontSize: 14, color: '#b8962e', marginBottom: 4 }}>Your Garden Shopping List</Text>
        <Text style={{ fontSize: 10, color: '#888888', marginBottom: 24 }}>dedrab.com</Text>
        <View style={{ height: 1, backgroundColor: '#b8962e', marginBottom: 24 }} />

        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 8 }}>Plants</Text>
        {plants.map((p: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: '#0a3d2b', marginRight: 8 }} />
            <Text style={{ fontSize: 10, color: '#1a1a1a' }}>{p.quantity ? `${p.quantity} \u00d7 ` : '1 \u00d7 '}{safe(p.commonName || p.botanicalName)}</Text>
          </View>
        ))}
        <View style={{ marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 8 }}>Materials & Hardscape</Text>
        {safeArr(d.hardscapeSpecification?.materials).map((m: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: '#0a3d2b', marginRight: 8 }} />
            <Text style={{ fontSize: 10, color: '#1a1a1a' }}>{safe(m.element)}{m.material ? ` \u2014 ${m.material}` : ''}</Text>
          </View>
        ))}
        <View style={{ marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0a3d2b', marginBottom: 8 }}>Tools & Sundries</Text>
        {(() => {
          const defaultTools = ['Garden fork or spade', 'Trowel', 'Compost (as required)', 'Mulch (as required)', 'Plant labels', 'Watering can or hose'];
          const tools: any[] = safeArr(d.tools).length > 0 ? safeArr(d.tools) : defaultTools;
          return tools.map((tool: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <View style={{ width: 10, height: 10, borderWidth: 1, borderColor: '#0a3d2b', marginRight: 8 }} />
              <Text style={{ fontSize: 10, color: '#1a1a1a' }}>{typeof tool === 'string' ? tool : safe(tool.name || String(tool))}</Text>
            </View>
          ));
        })()}
        <View style={{ marginBottom: 16 }} />

        <View style={{ position: 'absolute', bottom: 48, left: 48, right: 48 }}>
          <Text style={{ fontSize: 9, color: '#aaaaaa', textAlign: 'center' }}>Generated by Dedrab · dedrab.com</Text>
        </View>
      </Page>

    </Document>
  );
};
