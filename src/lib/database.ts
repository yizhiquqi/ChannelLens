import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

type JsonRecord = Record<string, unknown>;

function withId(payload: JsonRecord, prefix: string) {
  const existingId = typeof payload.id === 'string' ? payload.id : '';
  return existingId || `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function insertCreatorProfile(payload: JsonRecord) {
  const id = withId(payload, 'PROFILE');
  const nextPayload: JsonRecord = { ...payload, id };

  if (!supabase) {
    return { ...nextPayload, storage: 'local' };
  }

  const { error } = await supabase.from('partner_profiles').insert({
    id,
    status: String(nextPayload.status ?? 'pending'),
    payload: nextPayload,
  });

  if (error) throw error;
  return { ...nextPayload, storage: 'supabase' };
}

export async function fetchCreatorProfiles<T extends JsonRecord>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('partner_profiles')
    .select('id,status,payload,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    status: row.status,
    submittedAt: (row.payload as JsonRecord)?.submittedAt ?? row.created_at,
  })) as T[];
}

export async function upsertCreatorProfiles(profiles: JsonRecord[]) {
  if (!supabase) return;
  const rows = profiles.map((profile) => {
    const id = withId(profile, 'PROFILE');
    return {
      id,
      status: String(profile.status ?? 'pending'),
      payload: { ...profile, id },
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('partner_profiles').upsert(rows);
  if (error) throw error;
}

export async function insertCooperationReview(payload: JsonRecord) {
  const id = withId(payload, 'REVIEW');
  const nextPayload: JsonRecord = { ...payload, id };

  if (!supabase) {
    return { ...nextPayload, storage: 'local' };
  }

  const { error } = await supabase.from('cooperation_feedback').insert({
    id,
    review_status: String(nextPayload.reviewStatus ?? 'pending'),
    evidence_status: String(nextPayload.evidenceStatus ?? 'pending_review'),
    payload: nextPayload,
  });

  if (error) throw error;
  return { ...nextPayload, storage: 'supabase' };
}

export async function fetchCooperationReviews<T extends JsonRecord>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('cooperation_feedback')
    .select('id,review_status,evidence_status,payload,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    reviewStatus: row.review_status,
    evidenceStatus: row.evidence_status,
    submittedAt: (row.payload as JsonRecord)?.submittedAt ?? row.created_at,
  })) as T[];
}

export async function upsertCooperationReviews(reviews: JsonRecord[]) {
  if (!supabase) return;
  const rows = reviews.map((review) => {
    const id = withId(review, 'REVIEW');
    return {
      id,
      review_status: String(review.reviewStatus ?? 'pending'),
      evidence_status: String(review.evidenceStatus ?? 'pending_review'),
      payload: { ...review, id },
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('cooperation_feedback').upsert(rows);
  if (error) throw error;
}
