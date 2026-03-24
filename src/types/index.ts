export interface DesignRecord {
  id: string;
  session_id: string;
  email: string;
  design_style: string;
  hardiness_zone: string;
  render_url?: string;
  pdf_url?: string;
  plant_list?: unknown;
  full_report?: unknown;
  created_at: string;
}

export interface QuoteRequest {
  id: string;
  design_record_id?: string;
  session_id: string;
  email: string;
  postcode: string;
  quotes_requested: 1 | 3;
  confirmation_sent: boolean;
  created_at: string;
}
