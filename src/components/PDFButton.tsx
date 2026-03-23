'use client';

import { pdf } from '@react-pdf/renderer';
import { GardenPlanPDF } from './GardenPlanPDF';
import { Download, Send } from 'lucide-react';
import { useState } from 'react';

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
  gardenOrientation,
  sendMode,
  onPdfReady,
  sendDisabled,
  sendLabel,
}: Props) {
  const [generating, setGenerating] = useState(false);

  const fileName = [
    'gardig',
    clientName?.replace(/\s+/g, '_') || null,
    style.replace(/\s+/g, '_'),
    'Proposal',
  ].filter(Boolean).join('_') + '.pdf';

  async function buildPdf(): Promise<Blob | null> {
    console.log('[PDFButton] Starting PDF generation');
    const pdfDoc = (
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
        gardenOrientation={gardenOrientation}
      />
    );
    try {
      const blob = await pdf(pdfDoc).toBlob();
      console.log('[PDFButton] PDF generated, size:', blob.size);
      return blob;
    } catch (err) {
      console.error('[PDFButton] PDF generation error:', err);
      return null;
    }
  }

  if (sendMode) {
    async function handleSend() {
      if (!onPdfReady || sendDisabled) return;
      setGenerating(true);
      const blob = await buildPdf();
      if (!blob) {
        setGenerating(false);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onPdfReady(base64);
        setGenerating(false);
      };
      reader.readAsDataURL(blob);
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

  async function handleDownload() {
    setGenerating(true);
    const blob = await buildPdf();
    if (!blob) {
      setGenerating(false);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setGenerating(false);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={generating}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        background: '#0a3d2b', border: 'none', color: '#b8962e',
        padding: '8px 18px', borderRadius: 4,
        cursor: generating ? 'wait' : 'pointer',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        fontSize: 13, fontWeight: 700, letterSpacing: '0.01em',
        opacity: generating ? 0.7 : 1, transition: 'opacity 0.15s',
      }}
    >
      <Download size={14} />
      {generating ? 'Building PDF...' : 'Export PDF'}
    </button>
  );
}
