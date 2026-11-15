import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { pipelineFunction } from '@/inngest/functions/pipeline';
import { heartbeatFunction } from '@/inngest/functions/heartbeat';
import { planStartFunction } from '@/inngest/functions/plan-start';
import { renderStartFunction } from '@/inngest/functions/render-start';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pipelineFunction, heartbeatFunction, planStartFunction, renderStartFunction],
});
