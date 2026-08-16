const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_ANON_KEY = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "");
const TABLE = "app_records";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

function headers(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function request(path, options = {}) {
  if (!supabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: headers(options.headers),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase request failed (${response.status}): ${detail || response.statusText}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function fetchRemoteCollection(collection) {
  const query = new URLSearchParams({
    select: "record_id,record_data,actor_id,owner_id,updated_at,deleted_at",
    collection_name: `eq.${collection}`,
    deleted_at: "is.null",
    order: "updated_at.asc",
  });

  const rows = await request(`${TABLE}?${query.toString()}`, { method: "GET" });
  return Array.isArray(rows) ? rows.map((row) => row.record_data).filter(Boolean) : [];
}

export async function pushRemoteChanges({ collection, upserts, deletes, actorId, ownerId, identityFn }) {
  const now = new Date().toISOString();

  if (upserts.length) {
    const rows = upserts.map((record) => ({
      collection_name: collection,
      record_id: identityFn(record),
      record_data: record,
      actor_id: actorId || null,
      owner_id: ownerId || actorId || null,
      updated_at: now,
      deleted_at: null,
    }));

    await request(`${TABLE}?on_conflict=collection_name,record_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  }

  if (deletes.length) {
    const rows = deletes.map((recordId) => ({
      collection_name: collection,
      record_id: String(recordId),
      record_data: {},
      actor_id: actorId || null,
      owner_id: ownerId || actorId || null,
      updated_at: now,
      deleted_at: now,
    }));

    await request(`${TABLE}?on_conflict=collection_name,record_id`, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
  }
}
