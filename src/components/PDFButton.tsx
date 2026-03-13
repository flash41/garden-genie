'use client';

import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { GardenPlanPDF } from './GardenPlanPDF';
import { Download, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  // Send-mode props (used inside the email modal)
  sendMode?: boolean;
  onPdfReady?: (pdfBase64: string) => void;
  sendDisabled?: boolean;
  sendLabel?: string;
}

export default function PDFButton({
  doc,
  plan,
  imageBase64,
  imageDataUrl,
  gridImageUrl,
  aerialImageUrl,
  style,
  clientName,
  siteAddress,
  sendMode,
  onPdfReady,
  sendDisabled,
  sendLabel,
}: Props) {
  const [isClient, setIsClient] = useState(false);
  const [generating, setGenerating] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  if (!isClient) return null;

  const document = (
    <GardenPlanPDF
      doc={doc}
      plan={plan}
      imageBase64={imageBase64}
      imageDataUrl={imageDataUrl}
      gridImageUrl={gridImageUrl}
      aerialImageUrl={aerialImageUrl}
      style={style}
      clientName={clientName}
      siteAddress={siteAddress}
    />
  );

  const fileName = [
    'gardig',
    clientName?.replace(/\s+/g, '_') || null,
    style.replace(/\s+/g, '_'),
    'Proposal',
  ].filter(Boolean).join('_') + '.pdf';

  if (sendMode) {
    async function handleSend() {
      if (!onPdfReady || sendDisabled) return;
      setGenerating(true);
      try {
        const blob = await pdf(document).toBlob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          onPdfReady(base64);
          setGenerating(false);
        };
        reader.readAsDataURL(blob);
      } catch {
        setGenerating(false);
      }
    }

    return (
      <button
        id="email-send-btn"
        onClick={handleSend}
        disabled={sendDisabled || generating}
        style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: '#0a3d2b', border: 'none', color: '#b8962e',
          padding: '9px 18px', borderRadius: 4,
          cursor: sendDisabled || generating ? 'not-allowed' : 'pointer',
          fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
          fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
          opacity: sendDisabled || generating ? 0.6 : 1, transition: 'opacity 0.15s',
        }}
      >
        <Send size={14} />
        {generating ? 'Building PDF…' : (sendLabel || 'Send')}
      </button>
    );
  }

  return (
    <PDFDownloadLink document={document} fileName={fileName}>
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
