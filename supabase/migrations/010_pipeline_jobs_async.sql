-- Extend pipeline_jobs with result storage columns
ALTER TABLE pipeline_jobs
  ADD COLUMN IF NOT EXISTS design_json     JSONB,
  ADD COLUMN IF NOT EXISTS render_url      TEXT,
  ADD COLUMN IF NOT EXISTS aerial_url      TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint     JSONB,
  ADD COLUMN IF NOT EXISTS control_points  JSONB,
  ADD COLUMN IF NOT EXISTS g2_grid         JSONB,
  ADD COLUMN IF NOT EXISTS validation_result JSONB,
  ADD COLUMN IF NOT EXISTS retried         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS detected_currency TEXT,
  ADD COLUMN IF NOT EXISTS error_message   TEXT,
  ADD COLUMN IF NOT EXISTS input_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS design_lang     TEXT,
  ADD COLUMN IF NOT EXISTS country         TEXT,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ DEFAULT NOW();

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_pipeline_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pipeline_jobs_updated_at
  BEFORE UPDATE ON pipeline_jobs
  FOR EACH ROW EXECUTE FUNCTION update_pipeline_jobs_updated_at();

-- Storage bucket for pipeline assets (original images, renders, aerial plans)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pipeline-assets',
  'pipeline-assets',
  false,
  10485760,
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: service role only (no public access)
CREATE POLICY "Service role full access to pipeline-assets"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'pipeline-assets');
