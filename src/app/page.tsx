'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Wand2, Loader2, Camera, Compass, ImageOff } from 'lucide-react';
import PDFButton from '@/components/PDFButton';

export default function GardenDashboard() {
  const [preview, setPreview] = useState<string | null>(null);
  const [style, setStyle] = useState('Modern Minimalist');
  const [orientation, setOrientation] = useState('South Facing (Full Sun)');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<{ plan: string; imageBase64: string } | null>(null);

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
    setResult(null);
    setErrorMessage(null);
    setLoadingMessage('Analysing Site Photography...');

    try {
      setTimeout(() => setLoadingMessage('Synthesizing Botanical Data...'), 3000);
      setTimeout(() => setLoadingMessage('Rendering Design Visualisation...'), 8000);

      const response = await fetch('/api/redesign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: preview, style, orientation }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'The analysis failed. Please try again.');
      }

      const data = await response.json();
      setResult({ plan: data.plan, imageBase64: data.imageBase64 });

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
            gardig<span className="font-bold text-emerald-900">.com</span>
          </h1>
          <p className="text-xs tracking-[0.2em] uppercase text-emerald-800/60 font-sans mt-1">
            Garden Design Platform
          </p>
        </div>
        {result && (
          <PDFButton
            plan={result.plan}
            imageBase64={result.imageBase64}
            imageDataUrl={preview || undefined}
            style={style}
          />
        )}
      </header>

      <main className="max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">

        <aside className="lg:col-span-4">
          <div className="bg-emerald-950 text-emerald-50 p-8 rounded-[2rem] shadow-2xl space-y-8 sticky top-8">

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic">
                Site Analysis
              </label>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-emerald-900/50 border border-emerald-800">
                {preview ? (
                  <>
                    <img src={preview} alt="Site" className="object-cover w-full h-full opacity-80" />
                    <button
                      onClick={() => setPreview(null)}
                      className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white text-xs hover:bg-black/70 transition-colors"
                    >&#x2715;</button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                    <Camera className="mb-4 text-emerald-500/50" size={32} />
                    <p className="text-sm font-sans text-emerald-200/60 uppercase tracking-widest">
                      Upload Site Photo
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic">
                Design Language
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-emerald-900/50 border border-emerald-800 rounded-xl p-4 font-sans text-white outline-none focus:border-emerald-600 transition-colors"
              >
                <option>Modern Minimalist</option>
                <option>English Cottage</option>
                <option>Irish Urban</option>
                <option>European Urban</option>
                <option>Japanese Zen</option>
                <option>Mediterranean Oasis</option>
                <option>Tropical Paradise</option>
                <option>Native Wildflower</option>
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-400/80 italic flex items-center gap-2">
                <Compass size={14} /> Solar Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="w-full bg-emerald-900/50 border border-emerald-800 rounded-xl p-4 font-sans text-white outline-none focus:border-emerald-600 transition-colors"
              >
                <option>North Facing (Shady)</option>
                <option>South Facing (Full Sun)</option>
                <option>East Facing (Morning Sun)</option>
                <option>West Facing (Evening Sun)</option>
              </select>
            </div>

            <button
              onClick={generateRedesign}
              disabled={loading || !preview}
              className="w-full bg-[#D4AF37] hover:bg-[#C19A2B] text-emerald-950 py-5 rounded-xl font-sans font-bold uppercase tracking-widest text-sm transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> Drafting...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Wand2 size={18} /> Draft Redesign
                </span>
              )}
            </button>

          </div>
        </aside>

        <section className="lg:col-span-8 space-y-8">

          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="bg-red-500 text-white w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0">!</div>
                <div>
                  <h3 className="text-red-800 font-bold font-sans uppercase tracking-tight text-sm">System Alert</h3>
                  <p className="text-red-700 font-sans text-sm mt-1">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2rem] shadow-inner border border-slate-100">
              <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden mb-8">
                <div className="h-full bg-emerald-900 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]"></div>
              </div>
              <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-emerald-900 font-bold animate-pulse">
                {loadingMessage}
              </p>
            </div>
          )}

          {!loading && !result && !errorMessage && (
            <div className="min-h-[500px] flex flex-col items-center justify-center bg-white rounded-[2rem] border border-dashed border-slate-200 text-center p-12">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <Wand2 className="text-emerald-700" size={28} />
              </div>
              <h2 className="text-xl font-light text-slate-700 tracking-wide mb-2">Your Design Will Appear Here</h2>
              <p className="text-sm font-sans text-slate-400 max-w-sm">
                Upload a site photo, select your design language and solar orientation, then click Draft Redesign.
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-8">

              <div className="bg-white p-4 rounded-[2rem] shadow-lg border border-slate-200">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-800/60 mb-3 px-2">
                  Design Render — {style}
                </p>
                <div className="bg-slate-100 rounded-[1.5rem] overflow-hidden min-h-[400px] flex items-center justify-center">
                  {result.imageBase64 ? (
                    <img
                      src={result.imageBase64}
                      alt="Garden Design Render"
                      className="w-full h-auto block"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400 p-8 text-center">
                      <ImageOff size={32} />
                      <p className="font-sans text-sm">
                        Image render unavailable. Your plan is complete below.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2rem] border border-slate-200 shadow-sm">
                <p className="text-xs uppercase tracking-widest font-sans font-bold text-emerald-800/60 mb-6">
                  Design Specification
                </p>
                <div className="prose prose-slate lg:prose-lg max-w-none text-slate-900">
                  <ReactMarkdown>{result.plan}</ReactMarkdown>
                </div>
              </div>

            </div>
          )}

        </section>
      </main>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
