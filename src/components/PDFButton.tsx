'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import { GardenPlanPDF } from './GardenPlanPDF';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  plan: string;
  imageBase64: string;  // base64 data URL instead of remote URL
  style: string;
}

export default function PDFButton({ plan, imageBase64, style }: Props) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<GardenPlanPDF plan={plan} imageBase64={imageBase64} style={style} />}
      fileName={`GardenAI_Plan_${style.replace(/\s+/g, '_')}.pdf`}
    >
      {({ loading }) => (
        <button className="group flex items-center gap-3 bg-white border border-slate-200 px-6 py-3 rounded-full hover:bg-slate-900 hover:text-white transition-all duration-300 font-sans text-sm tracking-wide shadow-sm">
          <Download
            size={16}
            className={loading ? 'animate-bounce' : 'group-hover:-translate-y-1 transition-transform'}
          />
          {loading ? 'Preparing Plan...' : 'Export Professional Plan'}
        </button>
      )}
    </PDFDownloadLink>
  );
}
