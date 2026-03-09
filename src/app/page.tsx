'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Leaf, Wand2, Loader2, Camera, Compass } from 'lucide-react';
import PDFButton from '@/components/PDFButton'; // Fixed component import

export default function GardenDashboard() {
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState('Modern Minimalist');
  const [orientation, setOrientation] = useState('South Facing (Full Sun)');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ plan: string; imageUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateRedesign = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);      // Clear old results
    setErrorMessage(null); // Clear old errors

    try {
      const response = await fetch('/api/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview, style, orientation }),
      });

      if (!response.ok) {
        // This catches the "503 Busy" error from Google
        throw new Error('Google is currently over-capacity. Please wait 30 seconds and try again.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F8] text-slate-800 font-serif">
      <header className="max-w-7xl mx-auto px-8 py-10 flex justify-between items-center border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-light tracking-widest uppercase text-slate-900">
            Garden<span className="font-bold text-emerald-900">AI</span>
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-emerald-800/60 font-sans mt-1">Landscape Architectural Intelligence</p>
        </div>
        
        {/* PDF Button moved to a safe Client Component */}
        {result && (
          <PDFButton plan={result.plan} imageUrl={result.imageUrl} style={style} />
        )}
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-4">
          <div className="bg-emerald-950 text-emerald-50 p-8 rounded-[2rem] shadow-2xl space-y-8 sticky top-8">
            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic">Site Analysis</label>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-emerald-900/50 border border-emerald-800 group">
                {preview ? (
                  <>
                    <img src={preview} alt="Site" className="object-cover w-full h-full opacity-80" />
                    <button onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white text-xs">✕</button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                    <Camera className="mb-4 text-emerald-500/50" size={32} />
                    <p className="text-sm font-sans text-emerald-200/60 uppercase">Upload site photo</p>
                    <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic">Design Language</label>
              <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-emerald-900/50 border border-emerald-800 rounded-xl p-4 font-sans text-white outline-none">
                <option>Modern Minimalist</option>
                <option>English Cottage</option>
                <option>Japanese Zen</option>
                <option>Mediterranean Oasis</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic flex items-center gap-2">
                <Compass size={14} /> Solar Orientation
              </label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="w-full bg-emerald-900/50 border border-emerald-800 rounded-xl p-4 font-sans text-white outline-none">
                <option>North Facing (Shady)</option>
                <option>South Facing (Full Sun)</option>
                <option>East Facing (Morning Sun)</option>
                <option>West Facing (Evening Sun)</option>
              </select>
            </div>

            <button onClick={generateRedesign} disabled={loading || !preview} className="w-full bg-[#D4AF37] hover:bg-[#C19A2B] text-emerald-950 py-5 rounded-xl font-sans font-bold uppercase tracking-widest text-sm transition-all shadow-xl disabled:bg-emerald-900/50">
              {loading ? <><Loader2 className="animate-spin" /> Drafting...</> : <><Wand2 size={18} /> Draft Redesign</>}
            </button>
          </div>
        </aside>

        <section className="lg:col-span-8 space-y-12">
          {/* Professional Error Alert */}
{errorMessage && (
  <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl animate-in fade-in slide-in-from-top-4">
    <div className="flex items-center gap-4">
      <div className="bg-red-500 text-white p-2 rounded-full font-bold">!</div>
      <div>
        <h3 className="text-red-800 font-bold font-sans uppercase tracking-tight text-sm">System Alert</h3>
        <p className="text-red-700 font-sans text-sm mt-1">{errorMessage}</p>
      </div>
    </div>
  </div>
)}

          {loading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-inner border border-slate-100">
               <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                  <div className="h-full bg-emerald-900 animate-[loading_2s_infinite]"></div>
               </div>
               <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-emerald-900 font-bold animate-pulse">Synthesizing Botanical Data</p>
            </div>
          )}

{result && (
  <div className="space-y-8 animate-in fade-in duration-1000">
    {/* The Image Box - I added a gray background so we can see it */}
    <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-200">
      <div className="bg-slate-100 rounded-[1.5rem] overflow-hidden min-h-[400px] flex items-center justify-center">
        {result.imageUrl ? (
          <img 
            src={result.imageUrl} 
            alt="Your New Garden" 
            className="w-full h-auto block" 
          />
        ) : (
          <p className="text-slate-400">The image failed to draw. Check your internet.</p>
        )}
      </div>
    </div>

    {/* The Text Box - I forced the text to be DARK CHCOCOLATE color so it shows up */}
    <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm text-left">
      <div className="text-slate-900 prose prose-slate lg:prose-xl">
        <ReactMarkdown>{result.plan}</ReactMarkdown>
      </div>
    </div>
  </div>
)}
        </section>
      </main>
      <style jsx>{` @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } `}</style>
    </div>
  );
}