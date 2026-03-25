import Link from 'next/link';

export const metadata = {
  title: 'Legal — Dedrab',
  description: 'Terms of Use and Privacy Policy for Dedrab.',
};

export default function LegalPage() {
  return (
    <>
      <style>{`
        :root {
          --parchment: #F4EFE4;
          --linen: #EDE6D3;
          --forest: #0a3d2b;
          --forest-mid: #1a5c3f;
          --gold: #b8962e;
          --gold-light: #D4AF37;
          --umber: #2C1A0E;
          --warm-grey: #8a7e6e;
          --cream-dark: #d9cdb8;
        }
        body { background: var(--parchment); color: var(--umber); }
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');
        .legal-h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          font-weight: 600;
          color: var(--forest);
          margin: 48px 0 16px;
          padding-top: 48px;
          border-top: 1px solid var(--cream-dark);
        }
        .legal-h2:first-of-type { border-top: none; padding-top: 0; margin-top: 0; }
        .legal-h3 {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          color: var(--forest-mid);
          margin: 28px 0 10px;
        }
        .legal-p {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          line-height: 1.75;
          color: var(--warm-grey);
          margin: 0 0 14px;
        }
        .legal-ul {
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          line-height: 1.75;
          color: var(--warm-grey);
          padding-left: 24px;
          margin: 0 0 14px;
        }
        .legal-ul li { margin-bottom: 6px; }
        a.legal-link { color: var(--forest); text-decoration: underline; }
        a.legal-link:hover { color: var(--gold); }
      `}</style>

      {/* Nav */}
      <nav style={{
        background: 'var(--forest)',
        padding: '16px 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: 'white', letterSpacing: 3, textTransform: 'uppercase' }}>Dedrab</span>
        </Link>
        <Link href="/design" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--gold-light)', textDecoration: 'none' }}>
          ← Back to Design Tool
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '80px 40px 120px' }}>
        {/* Page heading */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--gold)' }}>Legal</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 400, color: 'var(--forest)', margin: '0 0 16px' }}>
            Terms &amp; Privacy
          </h1>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, color: 'var(--warm-grey)', lineHeight: 1.7 }}>
            Last updated: March 2026
          </p>
        </div>

        {/* ── TERMS OF SERVICE ─────────────────────────── */}
        <section id="terms">
          <h2 className="legal-h2">Terms of Service</h2>
          <p className="legal-p">
            Please read these Terms of Service carefully before using Dedrab. By using the service you agree to be bound by these terms.
          </p>

          <h3 className="legal-h3">What Dedrab Is</h3>
          <p className="legal-p">
            Dedrab is an AI-powered garden design tool. You upload a photograph of your garden and receive an AI-generated design proposal including a visual render, plant list, materials guide, and implementation plan.
          </p>
          <p className="legal-p">
            Dedrab is a design inspiration and planning tool. It is not a surveying service, a professional landscape architecture service, or a guaranteed specification. All outputs are AI-generated and are intended as creative guidance only.
          </p>

          <h3 className="legal-h3">Use of the Service</h3>
          <p className="legal-p">You must be 18 years or older to use Dedrab.</p>
          <p className="legal-p">
            You are responsible for ensuring you have the right to upload any photograph you submit. Do not upload photographs of other people&apos;s properties without their permission.
          </p>
          <p className="legal-p">You may not use Dedrab to generate content that is unlawful, offensive, or harmful.</p>
          <p className="legal-p">
            Access to Dedrab during the early access period requires an invitation code. Invitation codes are personal, non-transferable, and may not be shared.
          </p>

          <h3 className="legal-h3">AI-Generated Content</h3>
          <p className="legal-p">
            All design proposals, plant lists, renders, and reports are generated by artificial intelligence. While we aim for accuracy, AI-generated content may contain errors, omissions, or suggestions that are not suitable for your specific site conditions, soil type, climate, or local regulations.
          </p>
          <p className="legal-p">
            You should always verify plant suitability, material specifications, and implementation plans with a qualified professional before proceeding. Dedrab accepts no liability for any loss or damage arising from reliance on AI-generated design content.
          </p>
          <p className="legal-p">
            The Layout Plan Sketch included in your report is an indicative creative guide, not a surveyed drawing. It may contain inaccuracies in scale or proportion due to perspective limitations in the source photograph.
          </p>
          <p className="legal-p">
            Cost estimates provided in your report are indicative unit cost estimates only and will vary by supplier, region, and project scope. Always obtain formal quotes before committing to purchase.
          </p>

          <h3 className="legal-h3">Quote Requests and Landscaping Partners</h3>
          <p className="legal-p">
            If you choose to request quotes from landscaping partners through Dedrab, you are consenting to your contact details and design plan being shared with those partners. Dedrab facilitates this introduction but is not party to any agreement between you and a landscaping partner. We are not responsible for the quality, pricing, or conduct of any third-party landscaper.
          </p>

          <h3 className="legal-h3">Your Content</h3>
          <p className="legal-p">
            You retain ownership of any photographs you upload to Dedrab. By uploading a photograph you grant us a limited licence to process it for the purpose of generating your design proposal and storing it as part of your design record.
          </p>
          <p className="legal-p">
            The AI-generated design proposals, renders, and reports produced for you are yours to use for personal, non-commercial purposes. You may share them with contractors or landscapers for the purpose of implementing your garden design.
          </p>

          <h3 className="legal-h3">Payments</h3>
          <p className="legal-p">
            During the early access period, access to Dedrab is by invitation only and no payment is required. When paid access is introduced, pricing will be clearly stated before any payment is taken. All payments are processed securely through Stripe. We do not store card details.
          </p>

          <h3 className="legal-h3">Limitation of Liability</h3>
          <p className="legal-p">
            To the fullest extent permitted by law, Dedrab shall not be liable for any indirect, incidental, or consequential loss arising from your use of the service, including but not limited to any loss arising from reliance on AI-generated design content or from any arrangement made with a landscaping partner.
          </p>
          <p className="legal-p">
            Our total liability to you shall not exceed the amount you paid to use the service.
          </p>

          <h3 className="legal-h3">Changes to These Terms</h3>
          <p className="legal-p">
            We may update these terms from time to time. We will notify users of material changes by posting a notice on the site. Continued use of the service after changes take effect constitutes acceptance of the updated terms.
          </p>

          <h3 className="legal-h3">Governing Law</h3>
          <p className="legal-p">
            These terms are governed by the laws of Ireland. Any disputes shall be subject to the exclusive jurisdiction of the Irish courts.
          </p>

          <h3 className="legal-h3">Contact</h3>
          <p className="legal-p">
            For any questions about these terms, contact us at <a href="mailto:hello@dedrab.com" className="legal-link">hello@dedrab.com</a>.
          </p>
        </section>

        {/* ── PRIVACY POLICY ───────────────────────────── */}
        <section id="privacy">
          <h2 className="legal-h2">Privacy Policy</h2>

          <h3 className="legal-h3">Who We Are</h3>
          <p className="legal-p">
            Dedrab is a garden design tool that uses artificial intelligence to generate visual redesigns and design proposals from photographs of your garden. We are based in Ireland and this policy is written in compliance with the General Data Protection Regulation (GDPR).
          </p>

          <h3 className="legal-h3">What Information We Collect</h3>
          <p className="legal-p">We collect the following information when you use Dedrab:</p>
          <ul className="legal-ul">
            <li><strong>Your email address</strong> — provided by you when you request your design plan to be delivered, when you request quotes from landscaping partners, or when you share your plan with someone else.</li>
            <li><strong>Your postcode or ZIP code</strong> — provided by you when you request a quote from one of our landscaping partners.</li>
            <li><strong>Your garden photograph</strong> — the image you upload to generate your design proposal.</li>
            <li><strong>Your design preferences</strong> — the design style, transformation level, garden orientation, and hardiness zone you select.</li>
            <li><strong>Your design report and render</strong> — the AI-generated design proposal, plant list, render image, and PDF report produced from your inputs.</li>
            <li><strong>Your unique reference number</strong> — a reference code assigned to your design session for reconciliation and support purposes.</li>
            <li><strong>Usage data</strong> — standard server logs including IP address, browser type, and pages visited, retained for security and performance monitoring.</li>
          </ul>

          <h3 className="legal-h3">How We Use Your Information</h3>
          <p className="legal-p">We use your information for the following purposes:</p>
          <ul className="legal-ul">
            <li><strong>To deliver your design proposal</strong> — your email address is used to send you your plan PDF and any confirmation emails you request.</li>
            <li><strong>To process quote requests</strong> — if you request quotes from landscaping partners, your email address, postcode, and design plan are shared with those partners so they can contact you with a quote. By submitting a quote request you are giving explicit consent to this sharing.</li>
            <li><strong>To improve our service</strong> — we may retain anonymised design data to improve the quality of our AI outputs.</li>
            <li><strong>For security and fraud prevention</strong> — usage logs are retained to protect the service from abuse.</li>
          </ul>

          <h3 className="legal-h3">Sharing Your Information</h3>
          <p className="legal-p">
            We do not sell your personal information.
          </p>
          <p className="legal-p">
            If you request a quote from a landscaping partner, we will share the following with that partner: your email address, your postcode, and a copy of your design plan. This sharing happens only when you explicitly request it by submitting the quote request form.
          </p>
          <p className="legal-p">We use the following third-party services to operate Dedrab, each of which may process your data as a data processor on our behalf:</p>
          <ul className="legal-ul">
            <li><strong>Vercel</strong> — website hosting and serverless infrastructure (USA, with EU data transfer safeguards)</li>
            <li><strong>Supabase</strong> — database storage for design records and quote requests (EU region)</li>
            <li><strong>Resend</strong> — transactional email delivery</li>
            <li><strong>Google Gemini API</strong> — AI processing of your garden photograph and design generation</li>
            <li><strong>Cloudflare</strong> — DNS, security, and performance</li>
          </ul>
          <p className="legal-p">
            Each of these providers operates under their own privacy policies and data processing agreements.
          </p>

          <h3 className="legal-h3">Your Garden Photographs</h3>
          <p className="legal-p">
            When you upload a photograph of your garden, it is processed by our AI provider (Google Gemini) to generate your design proposal. Your photograph may be retained as part of your design record in our database and included within your PDF design report. We do not use your photographs for any purpose other than generating and storing your design proposal.
          </p>

          <h3 className="legal-h3">How Long We Retain Your Data</h3>
          <p className="legal-p">
            Email addresses provided for plan delivery are retained only for the purpose of delivering what you requested and are not used for marketing.
          </p>
          <p className="legal-p">
            Design records including your photograph reference, report data, and PDF are retained to allow us to reconcile quote requests and provide support. You may request deletion of your record at any time by contacting us.
          </p>
          <p className="legal-p">
            Quote request records including your email and postcode are retained for business reconciliation purposes.
          </p>

          <h3 className="legal-h3">Your Rights Under GDPR</h3>
          <p className="legal-p">If you are based in the EU or UK you have the following rights:</p>
          <ul className="legal-ul">
            <li>The right to access the personal data we hold about you.</li>
            <li>The right to request correction of inaccurate data.</li>
            <li>The right to request deletion of your data.</li>
            <li>The right to object to processing of your data.</li>
            <li>The right to data portability.</li>
          </ul>
          <p className="legal-p">
            To exercise any of these rights, contact us at <a href="mailto:privacy@dedrab.com" className="legal-link">privacy@dedrab.com</a>.
          </p>
          <p className="legal-p">
            You also have the right to lodge a complaint with the Data Protection Commission (Ireland) at <a href="https://www.dataprotection.ie" className="legal-link" target="_blank" rel="noopener noreferrer">dataprotection.ie</a>.
          </p>

          <h3 className="legal-h3">Cookies</h3>
          <p className="legal-p">
            Dedrab uses a session cookie to remember your access code during your visit. We do not use advertising cookies or tracking cookies. We use Cloudflare Turnstile for bot protection which may set a functional cookie.
          </p>

          <h3 className="legal-h3">Contact</h3>
          <p className="legal-p">
            For any privacy-related questions or requests, contact us at <a href="mailto:privacy@dedrab.com" className="legal-link">privacy@dedrab.com</a>.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#050f0a', padding: '28px 60px', textAlign: 'center' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: 1 }}>
          © 2025 Dedrab · <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Home</Link> · <Link href="/design" style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>Design Tool</Link>
        </span>
      </footer>
    </>
  );
}
