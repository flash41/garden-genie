import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { pipelineFunction } from '@/inngest/functions/pipeline';
import { heartbeatFunction } from '@/inngest/functions/heartbeat';
import { planStartFunction } from '@/inngest/functions/plan-start';
import { pdfStartFunction } from '@/inngest/functions/render-start';
import { gardenRenderFunction } from '@/inngest/functions/garden-render';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pipelineFunction, heartbeatFunction, planStartFunction, pdfStartFunction, gardenRenderFunction],
});
