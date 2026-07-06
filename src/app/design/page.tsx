// ─── DESIGN ROUTE GATE ────────────────────────────────────────────────────────
// Flip DESIGN_TOOL_LIVE=true in .env.local (or Vercel env vars) to re-enable
// the live tool. No other changes needed.

import DesignTool from './DesignTool';
import WaitlistGate from './WaitlistGate';

export default function DesignPage() {
  const isLive = process.env.DESIGN_TOOL_LIVE === 'true';
  return isLive ? <DesignTool /> : <WaitlistGate />;
}
