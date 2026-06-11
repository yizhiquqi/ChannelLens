import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

type JsonRecord = Record<string, unknown>;
type DataObject = object;

export type EvidenceUpload = {
  name: string;
  path: string;
  size: number;
  type: string;
};

function safeStorageFileName(fileName: string) {
  const parts = fileName.split('.');
  const rawExtension = parts.length > 1 ? parts.pop() ?? '' : '';
  const rawBase = parts.join('.') || fileName;
  const extension = rawExtension.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const base = rawBase
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 80);

  return `${base || 'file'}${extension ? `.${extension}` : ''}`;
}

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

  const row = {
    id,
    user_id: typeof nextPayload.userId === 'string' ? nextPayload.userId : null,
    user_email: typeof nextPayload.userEmail === 'string' ? nextPayload.userEmail : null,
    status: String(nextPayload.status ?? 'pending'),
    payload: nextPayload,
  };

  const query = typeof payload.id === 'string' && payload.id
    ? supabase.from('partner_profiles').upsert(row)
    : supabase.from('partner_profiles').insert(row);

  const { error } = await query;
  if (error && String(error.message).includes('user_id')) {
    const { error: fallbackError } = await supabase.from('partner_profiles').upsert({
      id,
      status: String(nextPayload.status ?? 'pending'),
      payload: nextPayload,
    });
    if (fallbackError) throw fallbackError;
    return { ...nextPayload, storage: 'supabase' };
  }

  if (error) throw error;
  return { ...nextPayload, storage: 'supabase' };
}

export async function fetchCreatorProfiles<T extends JsonRecord>() {
  if (!supabase) return [] as T[];

  let { data, error } = await supabase
    .from('partner_profiles')
    .select('id,user_id,user_email,status,payload,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error && String(error.message).includes('user_id')) {
    const fallback = await supabase
      .from('partner_profiles')
      .select('id,status,payload,created_at,updated_at')
      .order('created_at', { ascending: false });
    data = fallback.data as typeof data;
    error = fallback.error;
  }

  if (error) throw error;

  return ((data ?? []) as Array<JsonRecord & { payload: JsonRecord }>).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    userId: row.user_id ?? row.payload.userId,
    userEmail: row.user_email ?? row.payload.userEmail,
    status: row.status,
    submittedAt: row.payload.submittedAt ?? row.created_at,
  })) as T[];
}

export async function upsertCreatorProfiles(profiles: JsonRecord[]) {
  if (!supabase) return;
  const rows = profiles.map((profile) => {
    const id = withId(profile, 'PROFILE');
    return {
      id,
      user_id: typeof profile.userId === 'string' ? profile.userId : null,
      user_email: typeof profile.userEmail === 'string' ? profile.userEmail : null,
      status: String(profile.status ?? 'pending'),
      payload: { ...profile, id },
      updated_at: new Date().toISOString(),
    };
  });

  let { error } = await supabase.from('partner_profiles').upsert(rows);
  if (error && String(error.message).includes('user_id')) {
    const fallbackRows = profiles.map((profile) => {
      const id = withId(profile, 'PROFILE');
      return {
        id,
        status: String(profile.status ?? 'pending'),
        payload: { ...profile, id },
        updated_at: new Date().toISOString(),
      };
    });
    error = (await supabase.from('partner_profiles').upsert(fallbackRows)).error;
  }
  if (error) throw error;
}

export async function fetchAdminPartners<T extends DataObject>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('admin_partners')
    .select('id,visibility,payload,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    adminVisibility: row.visibility ?? (row.payload as JsonRecord).adminVisibility ?? 'internal',
  })) as T[];
}

export async function fetchPublicAdminPartners<T extends DataObject>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('admin_partners')
    .select('id,visibility,payload,created_at,updated_at')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    adminVisibility: 'public',
  })) as T[];
}

export async function fetchPartnerVisibilityOverrides() {
  if (!supabase) return [] as Array<{ id: string; visibility: string }>;

  const { data, error } = await supabase
    .from('partner_visibility')
    .select('id,visibility');

  if (error) return [];
  return (data ?? []) as Array<{ id: string; visibility: string }>;
}

export async function upsertAdminPartners(partners: JsonRecord[]) {
  if (!supabase) return;
  const rows = partners.map((partner) => {
    const id = withId(partner, 'PARTNER');
    const visibility = String(partner.adminVisibility ?? 'internal');
    return {
      id,
      visibility,
      payload: { ...partner, id },
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('admin_partners').upsert(rows);
  if (error) throw error;

  const visibilityRows = rows.map((partner) => ({
    id: partner.id,
    visibility: partner.visibility,
    updated_at: new Date().toISOString(),
  }));
  const { error: visibilityError } = await supabase.from('partner_visibility').upsert(visibilityRows);
  if (visibilityError) throw visibilityError;
}

export async function uploadEvidenceFiles(files: File[], ownerId?: string) {
  if (!supabase) {
    return files.map((file) => ({ name: file.name, path: file.name, size: file.size, type: file.type }));
  }

  const folder = ownerId || 'anonymous';
  const uploaded: EvidenceUpload[] = [];

  for (const file of files) {
    const safeName = safeStorageFileName(file.name);
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const { error } = await supabase.storage.from('evidence-files').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) throw error;
    uploaded.push({ name: file.name, path, size: file.size, type: file.type });
  }

  return uploaded;
}

export async function createEvidenceFileUrl(path: string) {
  if (!supabase) return path;

  const { data, error } = await supabase.storage.from('evidence-files').createSignedUrl(path, 60 * 10);
  if (error) throw error;

  return data.signedUrl;
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

export async function fetchPublicCooperationReviews<T extends DataObject>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('cooperation_feedback')
    .select('id,review_status,evidence_status,payload,created_at,updated_at')
    .eq('review_status', 'verified')
    .eq('evidence_status', 'verified')
    .eq('payload->>reviewVisibility', 'public')
    .order('created_at', { ascending: false });

  if (error) return [] as T[];

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    reviewStatus: row.review_status,
    evidenceStatus: row.evidence_status,
    createdAt: (row.payload as JsonRecord)?.createdAt ?? row.created_at,
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

export async function insertDueDiligenceRequest(payload: JsonRecord) {
  const id = withId(payload, 'DD');
  const nextPayload: JsonRecord = { ...payload, id };

  if (!supabase) {
    return { ...nextPayload, storage: 'local' };
  }

  const { error } = await supabase.from('due_diligence_requests').insert({
    id,
    status: String(nextPayload.status ?? 'pending'),
    report_type: String(nextPayload.expected_report_type ?? nextPayload.reportType ?? 'standard'),
    payload: nextPayload,
  });

  if (error) throw error;
  return { ...nextPayload, storage: 'supabase' };
}

export async function fetchDueDiligenceRequests<T extends JsonRecord>() {
  if (!supabase) return [] as T[];

  const { data, error } = await supabase
    .from('due_diligence_requests')
    .select('id,status,report_type,payload,created_at,updated_at')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.payload as T),
    id: row.id,
    status: row.status,
    reportType: row.report_type,
    submittedAt: (row.payload as JsonRecord)?.submittedAt ?? row.created_at,
  })) as T[];
}

export async function upsertDueDiligenceRequests(requests: JsonRecord[]) {
  if (!supabase) return;

  const rows = requests.map((request) => {
    const id = withId(request, 'DD');
    return {
      id,
      status: String(request.status ?? 'pending'),
      report_type: String(request.expected_report_type ?? request.reportType ?? 'standard'),
      payload: { ...request, id },
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase.from('due_diligence_requests').upsert(rows);
  if (error) throw error;
}

export async function fetchUserProfile<T extends JsonRecord>(userId: string) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as T | null;
}

export async function upsertUserProfile(profile: JsonRecord) {
  if (!supabase) return;

  const { error } = await supabase.from('user_profiles').upsert({
    ...profile,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function fetchIsAdmin(userId: string, email?: string) {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .or(`user_id.eq.${userId},email.eq.${email ?? ''}`)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}
