import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

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

// ─── STYLES ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({

  // ── Cover ──────────────────────────────────────────────────────────────────
  coverPage:    { backgroundColor: T.brandDk, fontFamily: 'Helvetica', position: 'relative' },
  coverBg:      { position: 'absolute', top: 0, left: 0, right: 0, height: 420, objectFit: 'cover', opacity: 0.42 },
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
  page: { paddingTop: 44, paddingBottom: 60, paddingHorizontal: 44, backgroundColor: T.white, fontFamily: 'Helvetica' },

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
  sectionWrap:  { marginBottom: 18 },
  sectionHdr:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionNum:   { fontSize: 7, color: T.white, fontFamily: 'Helvetica-Bold', backgroundColor: T.brand, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2, marginRight: 7, letterSpacing: 0.5 },
  sectionTitle: { fontSize: 10, color: T.brand, fontFamily: 'Helvetica-Bold', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  sectionRule:  { borderBottomWidth: 0.5, borderBottomColor: T.ruleDk, marginBottom: 8 },

  // Text atoms
  body:      { fontSize: 9.5, color: T.inkMid, lineHeight: 1.6, marginBottom: 3 },
  bold:      { fontSize: 9.5, color: T.ink, fontFamily: 'Helvetica-Bold', lineHeight: 1.5 },
  label:     { fontSize: 7.5, color: T.inkLight, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  subHead:   { fontSize: 9, color: T.brand, fontFamily: 'Helvetica-Bold', marginBottom: 4, marginTop: 6 },
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
  divider: { borderBottomWidth: 1, borderBottomColor: T.ruleDk, marginVertical: 10 },

  // Images
  imgRow:     { flexDirection: 'row', gap: 10, marginBottom: 14 },
  imgCol:     { flex: 1 },
  imgCap:     { fontSize: 7.5, color: T.inkLight, fontFamily: 'Helvetica-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  imgPhoto:   { width: '100%', height: 160, objectFit: 'cover', borderRadius: 3, borderWidth: 1, borderColor: T.rule },
  imgSingle:  { width: '100%', height: 200, objectFit: 'cover', borderRadius: 3, borderWidth: 1, borderColor: T.rule, marginBottom: 12 },

  // Table
  table:     { marginBottom: 8 },
  tableHdr:  { flexDirection: 'row', backgroundColor: T.brand, paddingVertical: 4, paddingHorizontal: 6 },
  tableHdrT: { fontSize: 7.5, color: T.white, fontFamily: 'Helvetica-Bold', flex: 1 },
  tableRow:  { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: T.rule },
  tableRowAlt:{ flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: T.rule, backgroundColor: T.surface },
  tableCell: { fontSize: 8, color: T.inkMid, flex: 1, lineHeight: 1.4 },
  tableCellB:{ fontSize: 8, color: T.ink, fontFamily: 'Helvetica-Bold', flex: 1 },

  // Cost row
  costTotal: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, backgroundColor: T.brand, marginTop: 2 },
  costTotalT:{ fontSize: 8.5, color: T.white, fontFamily: 'Helvetica-Bold', flex: 1 },
  costTotalV:{ fontSize: 8.5, color: T.accentLt, fontFamily: 'Helvetica-Bold' },

  // Badge
  badge:      { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 2, marginRight: 4 },
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

// Running header + footer (fixed, repeats every page)
const PageChrome = ({ clientName, dateStr, style }: any) => (
  <>
    <View style={S.runHdr} fixed>
      <Text style={S.runBrand}>dedrab.com · Garden Design Proposal</Text>
      <Text style={S.runRight}>{clientName ? `${clientName} · ` : ''}{style}</Text>
    </View>
    <View style={S.footer} fixed>
      <Text style={S.footerBrand}>dedrab.com</Text>
      <Text style={S.footerMid}>{clientName ? `${clientName} · ` : ''}{dateStr} · Confidential</Text>
      <Text style={S.footerPg} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  </>
);

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface Props {
  doc?: any;
  plan?: string;
  imageBase64: string;
  imageDataUrl?: string;
  gridImageUrl?: string;
  aerialImageUrl?: string;
  style: string;
  clientName?: string;
  siteAddress?: string;
  gardenOrientation?: string;
  transformationLevel?: number;
}

export const GardenPlanPDF = ({ doc, plan, imageBase64, imageDataUrl, gridImageUrl, aerialImageUrl, style, clientName, siteAddress, gardenOrientation, transformationLevel }: Props) => {
  const d = doc || {};
  const hasBefore = !!imageDataUrl;
  const hasAfter  = !!imageBase64;
  const cur = d.costEstimate?.currency || 'USD';
  const coverImg = imageBase64 || imageDataUrl || null;

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
            <Text style={S.coverBrand}>dedrab.com</Text>
            <Text style={S.coverDate}>{dateStr}</Text>
          </View>
          <View style={S.coverMid}>
            <Text style={S.coverStyleTag}>{style}</Text>
            <Text style={S.coverTitle}>{coverTitle || 'Garden Design\nProposal'}</Text>
            <Text style={S.coverSubtitle}>Garden Design Proposal</Text>
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
            <Text style={S.coverConf}>Private &amp; Confidential — For Client Use Only</Text>
            <Text style={S.coverPg}>Page 1</Text>
          </View>
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          SECTION PAGES
      ══════════════════════════════════════════════════════════ */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

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
        <Section num="03" title="Design Concept &amp; Vision">
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
            </>
          ) : null}
        </Section>

      </Page>

      {/* ── Page 3: Spatial Layout + Planting ─────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

        {/* ── 4. Spatial Layout ───────────────────────────────── */}
        <Section num="04" title="Spatial Layout &amp; Zoning">
          {aerialImageUrl ? (
            <>
              <Image src={aerialImageUrl} style={[S.imgSingle, { height: 300, objectFit: 'contain', marginBottom: 4 }]} />
              <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginBottom: 12, textAlign: 'center' }]}>
                Fig. 1 — AI-Generated Layout Sketch. For indicative purposes only.
              </Text>
            </>
          ) : null}
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
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

        <Section num="05" title="Planting Specification">
          {d.plantingSpecification?.layeringStrategy
            ? <Text style={[S.body, { marginBottom: 8 }]}>{d.plantingSpecification.layeringStrategy}</Text>
            : null}

          {plants.length > 0 ? (
            <>
              <SubHead text="Plant Schedule" />
              <View style={S.table}>
                <View style={[S.tableHdr, { flexDirection: 'row' }]}>
                  <Text style={[S.tableHdrT, { flex: 3 }]}>Botanical Name</Text>
                  <Text style={[S.tableHdrT, { flex: 2 }]}>Common Name</Text>
                  <Text style={[S.tableHdrT, { flex: 1 }]}>Qty</Text>
                  <Text style={[S.tableHdrT, { flex: 2 }]}>Mature Size</Text>
                  <Text style={[S.tableHdrT, { flex: 1.5 }]}>Layer</Text>
                </View>
                {plants.map((p: any, i: number) => (
                  <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                    <Text style={[S.tableCellB, { flex: 3 }]}>{safe(p.botanicalName)}{p.cultivar && p.cultivar !== 'null' && p.cultivar !== '' ? ` '${p.cultivar}'` : ''}</Text>
                    <Text style={[S.tableCell, { flex: 2 }]}>{safe(p.commonName)}</Text>
                    <Text style={[S.tableCell, { flex: 1 }]}>{safe(p.quantity)}</Text>
                    <Text style={[S.tableCell, { flex: 2 }]}>{safe(p.matureSize)}</Text>
                    <Text style={[S.tableCell, { flex: 1.5 }]}>{safe(p.layer)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}
        </Section>
      </Page>

      {/* ── Page 3c: Seasonal Matrix ──────────────────────────── */}
      <Page size="A4" style={S.page}>
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

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
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

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
                        <Text style={S.tableCell}>{safe(m.unitCostRange)}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginTop: 6 }]}>
                    All costs are unit cost estimates only and may vary by supplier, region, and project scope. Obtain formal quotes before committing to purchase.
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
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

        {/* ── 8. Implementation Plan ──────────────────────────── */}
        <Section num="08" title="Phasing &amp; Implementation Plan">
          {safeArr(d.recommendations).length > 0 ? (
            <>
              <SubHead text="Recommendations" />
              {safeArr(d.recommendations).map((r: any, i: number) => (
                <View key={i} wrap={false} style={{ borderLeftWidth: 3, borderLeftColor: T.accent, borderLeftStyle: 'solid', paddingLeft: 10, marginBottom: 12, backgroundColor: '#f9f7f3' }}>
                  <Text style={{ fontSize: 7, color: T.accent, fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Recommendation</Text>
                  <Text style={[S.body, { fontFamily: 'Helvetica-Bold', marginBottom: 3 }]}>{safe(r.title)}</Text>
                  <Text style={[S.body, { marginBottom: 3 }]}>{safe(r.description)}</Text>
                  <Text style={[S.small, { fontStyle: 'italic', color: T.inkLight }]}>{safe(r.justification)}</Text>
                  {r.estimatedCost ? (
                    <Text style={[S.small, { color: T.accent, fontFamily: 'Helvetica-Bold', marginTop: 4 }]}>{safe(r.estimatedCost)}</Text>
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
                    <Text style={S.tableHdrT}>Days</Text>
                  </View>
                  {safeArr(d.implementationPlan.tasks).map((t: any, i: number) => (
                    <View key={i} wrap={false} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt}>
                      <Text style={[S.tableCellB, { flex: 2 }]}>{safe(t.phase)}</Text>
                      <Text style={[S.tableCell, { flex: 3 }]}>{safe(t.task)}</Text>
                      <Text style={S.tableCell}>{safe(t.estimatedDays)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </Section>

        {/* ── 9. Maintenance Schedule ─────────────────────────── */}
        <Section num="09" title="Maintenance Schedule (Indicative)">
          <Text style={[S.small, { color: T.inkLight, fontStyle: 'italic', marginBottom: 10 }]}>
            The following schedule is an indicative estimate based on typical seasonal requirements for the proposed plant palette. Adjust based on your local climate, soil conditions, and plant establishment progress.
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

      {/* ── Page 6: Aerial Layout Plan ────────────────────────── */}
      {aerialImageUrl ? (
        <Page size="A4" style={S.page}>
          <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

          <Section num="App A" title="Garden Layout Plan">
            <Text style={[S.small, { marginBottom: 8 }]}>
              Top-down layout sketch showing proposed planting areas. Print this and take it outside.
            </Text>
            <Image src={aerialImageUrl} style={[S.imgSingle, { height: 360, objectFit: 'contain' }]} />
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
        <PageChrome clientName={clientName} dateStr={dateStr} style={style} />

        <Section num="App B" title="Appendices">

          {/* A: Before & After */}
          {(hasBefore || hasAfter) ? (
            <>
              <SubHead text="B — Site Photography: Before &amp; After" />
              {hasBefore && hasAfter ? (
                <View style={S.imgRow}>
                  <View style={S.imgCol}>
                    <Text style={S.imgCap}>Before — Existing Site</Text>
                    <Image src={imageDataUrl!} style={S.imgPhoto} />
                  </View>
                  <View style={S.imgCol}>
                    <Text style={S.imgCap}>After — Design Render</Text>
                    <Image src={imageBase64} style={S.imgPhoto} />
                  </View>
                </View>
              ) : hasAfter ? (
                <>
                  <Text style={S.imgCap}>Design Render — {style}</Text>
                  <Image src={imageBase64} style={S.imgSingle} />
                </>
              ) : (
                <>
                  <Text style={S.imgCap}>Existing Site</Text>
                  <Image src={imageDataUrl!} style={S.imgSingle} />
                </>
              )}
            </>
          ) : null}

          {/* C: Garden Render */}
          {imageBase64 ? (
            <>
              <SubHead text="C — Garden Render" />
              <Image src={imageBase64} style={[S.imgSingle, { height: 220, marginBottom: 0, borderRadius: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }]} />
              <View style={{ backgroundColor: '#0a3d2b', flexDirection: 'row', padding: '8pt 16pt', marginBottom: 12 }}>
                {[
                  { label: 'THEME', value: style || '—', flex: 1, valueSize: 9 },
                  { label: 'TRANSFORMATION', value: transformationLabel, flex: 2, valueSize: 8 },
                  { label: 'ORIENTATION', value: formattedOrientation ? formattedOrientation.replace('Facing', 'facing') : '—', flex: 1, valueSize: 9 },
                ].map((item) => (
                  <View key={item.label} style={{ flex: item.flex }}>
                    <Text style={{ fontSize: 7, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</Text>
                    <Text style={{ fontSize: item.valueSize, color: '#ffffff', fontFamily: 'Helvetica-Bold' }}>{item.value}</Text>
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

          {/* E: Confidence */}
          {d.confidence ? (
            <Text style={[S.small, { marginTop: 8 }]}>
              Design confidence score: {Math.round(d.confidence * 100)}% — based on image clarity and available site data.
            </Text>
          ) : null}

        </Section>
      </Page>

    </Document>
  );
};
