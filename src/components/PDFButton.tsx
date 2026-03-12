'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { GardenPlanPDF } from './GardenPlanPDF';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  doc?: any;
  plan?: string;
  imageBase64: string;
  imageDataUrl?: string;
  gridImageUrl?: string;   // annotated render with grid + plant numbers
  style: string;
  clientName?: string;
  siteAddress?: string;
}

export default function PDFButton({
  doc,
  plan,
  imageBase64,
  imageDataUrl,
  gridImageUrl,
  style,
  clientName,
  siteAddress,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  const fileName = [
    'gardig',
    clientName?.replace(/\s+/g, '_') || null,
    style.replace(/\s+/g, '_'),
    'Proposal',
  ].filter(Boolean).join('_') + '.pdf';

  return (
    <PDFDownloadLink
      document={
        <GardenPlanPDF
          doc={doc}
          plan={plan}
          imageBase64={imageBase64}
          imageDataUrl={imageDataUrl}
          gridImageUrl={gridImageUrl}
          style={style}
          clientName={clientName}
          siteAddress={siteAddress}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            background: '#0a3d2b', border: 'none', color: '#b8962e',
            padding: '8px 18px', borderRadius: 4,
            cursor: loading ? 'wait' : 'pointer',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
            opacity: loading ? 0.7 : 1, transition: 'opacity 0.15s',
          }}
        >
          <Download size={14} />
          {loading ? 'Building PDF...' : 'Export PDF'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
