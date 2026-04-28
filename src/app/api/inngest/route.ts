import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { pipelineFunction } from '@/inngest/functions/pipeline';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pipelineFunction],
});
