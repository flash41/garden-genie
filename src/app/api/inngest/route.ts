import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { pipelineFunction } from '@/inngest/functions/pipeline';
import { heartbeatFunction } from '@/inngest/functions/heartbeat';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pipelineFunction, heartbeatFunction],
});
