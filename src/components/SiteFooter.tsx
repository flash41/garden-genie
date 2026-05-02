import Link from 'next/link';
import { CookiePreferencesButton } from '@/components/AnalyticsConsent';

export function SiteFooter() {
  return (
    <footer className="bg-[#050f0a]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-7 px-6 md:px-15 py-12 border-b border-white/[0.06]">
        <div>
          <img src="/dd_logo.png" alt="Dedrab" className="h-12 w-auto block" />
          <div className="text-[9px] tracking-[3px] uppercase text-[#b8962e] mt-1.5">
            Garden Inspiration
          </div>
        </div>
        <ul className="flex flex-wrap justify-center gap-8 list-none m-0 p-0">
          <li>
            <a
              href="/#examples"
              className="text-[10px] tracking-[2px] uppercase text-white/75 hover:text-[#b8962e] transition-colors no-underline"
            >
              Examples
            </a>
          </li>
          <li>
            <a
              href="/#how"
              className="text-[10px] tracking-[2px] uppercase text-white/75 hover:text-[#b8962e] transition-colors no-underline"
            >
              How It Works
            </a>
          </li>
          <li>
            <a
              href="/#features"
              className="text-[10px] tracking-[2px] uppercase text-white/75 hover:text-[#b8962e] transition-colors no-underline"
            >
              What You Get
            </a>
          </li>
          <li>
            <Link
              href="/notes"
              className="text-[10px] tracking-[2px] uppercase text-white/75 hover:text-[#b8962e] transition-colors no-underline"
            >
              Notes
            </Link>
          </li>
          <li>
            <Link
              href="/design"
              className="text-[10px] tracking-[2px] uppercase text-white/75 hover:text-[#b8962e] transition-colors no-underline"
            >
              Design Tool
            </Link>
          </li>
        </ul>
      </div>
      <div className="flex justify-between items-center flex-wrap gap-3.5 px-6 md:px-15 py-5">
        <span className="text-[10px] text-white/55 tracking-[1px]">
          © 2025 Dedrab. Garden inspiration powered by AI.
        </span>
        <ul className="flex gap-7 list-none m-0 p-0">
          <li>
            <a
              href="/legal#privacy"
              className="text-[10px] tracking-[1.5px] uppercase text-white/60 hover:text-white/50 transition-colors no-underline"
            >
              Privacy
            </a>
          </li>
          <li>
            <a
              href="/legal#terms"
              className="text-[10px] tracking-[1.5px] uppercase text-white/60 hover:text-white/50 transition-colors no-underline"
            >
              Terms
            </a>
          </li>
        </ul>
        <CookiePreferencesButton className="text-[10px] tracking-[1.5px] uppercase text-white/60 hover:text-white/50 transition-colors no-underline" />
      </div>
    </footer>
  );
}
