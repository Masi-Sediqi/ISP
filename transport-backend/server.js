import express from 'express';
import cors from 'cors';
import pg from 'pg';

const { Pool } = pg;
const PORT = Number(process.env.PORT || 5050);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'afghanpower',
  user: process.env.PGUSER || 'afghanpower',
  password: process.env.PGPASSWORD || '',
  max: 10,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_records (
      collection_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      record_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      actor_id TEXT,
      owner_id TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ,
      PRIMARY KEY (collection_name, record_id)
    );
    CREATE INDEX IF NOT EXISTS app_records_collection_active_idx
      ON app_records(collection_name, updated_at) WHERE deleted_at IS NULL;
  `);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));


app.get('/api/network-info', (_req, res) => {
  res.json({ host: 'VPS', api: '/api', database: 'PostgreSQL' });
});

app.get('/api/cars', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT record_data FROM app_records WHERE collection_name='cars' AND deleted_at IS NULL ORDER BY updated_at ASC");
    res.json(rows.map(r => r.record_data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/cars', async (req, res) => {
  try {
    const record = { ...(req.body || {}), id: req.body?.id || (globalThis.crypto?.randomUUID?.() || `${Date.now()}`) };
    await pool.query(`INSERT INTO app_records(collection_name,record_id,record_data,updated_at,deleted_at) VALUES('cars',$1,$2::jsonb,NOW(),NULL) ON CONFLICT(collection_name,record_id) DO UPDATE SET record_data=EXCLUDED.record_data,updated_at=NOW(),deleted_at=NULL`, [String(record.id), JSON.stringify(record)]);
    res.status(201).json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/cars/:id', async (req, res) => {
  try {
    const current = await pool.query("SELECT record_data FROM app_records WHERE collection_name='cars' AND record_id=$1", [req.params.id]);
    const record = { ...(current.rows[0]?.record_data || {}), ...(req.body || {}), id: req.params.id };
    await pool.query(`INSERT INTO app_records(collection_name,record_id,record_data,updated_at,deleted_at) VALUES('cars',$1,$2::jsonb,NOW(),NULL) ON CONFLICT(collection_name,record_id) DO UPDATE SET record_data=EXCLUDED.record_data,updated_at=NOW(),deleted_at=NULL`, [req.params.id, JSON.stringify(record)]);
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/cars/:id', async (req, res) => {
  try {
    await pool.query(`UPDATE app_records SET record_data='{}'::jsonb,updated_at=NOW(),deleted_at=NOW() WHERE collection_name='cars' AND record_id=$1`, [req.params.id]);
    res.status(204).end();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/advanced-report/status', (_req, res) => {
  res.json({ mode: 'local', provider: 'vps' });
});

app.post('/api/advanced-report/chat', (_req, res) => {
  res.status(503).json({ error: 'Advanced AI reporting is not configured on this VPS yet.' });
});

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, storage: 'postgresql' }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/api/collections/:collection', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT record_data FROM app_records WHERE collection_name=$1 AND deleted_at IS NULL ORDER BY updated_at ASC`,
      [req.params.collection]
    );
    res.json(rows.map((r) => r.record_data));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/changes', async (req, res) => {
  const { collection, upserts = [], deletes = [], actorId = null, ownerId = null } = req.body || {};
  if (!collection) return res.status(400).json({ error: 'collection is required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of upserts) {
      if (!item?.id) continue;
      await client.query(`
        INSERT INTO app_records(collection_name,record_id,record_data,actor_id,owner_id,updated_at,deleted_at)
        VALUES($1,$2,$3::jsonb,$4,$5,NOW(),NULL)
        ON CONFLICT(collection_name,record_id) DO UPDATE SET
          record_data=EXCLUDED.record_data, actor_id=EXCLUDED.actor_id, owner_id=EXCLUDED.owner_id,
          updated_at=NOW(), deleted_at=NULL`,
        [collection, String(item.id), JSON.stringify(item.record || {}), actorId, ownerId]
      );
    }
    for (const id of deletes) {
      await client.query(`
        INSERT INTO app_records(collection_name,record_id,record_data,actor_id,owner_id,updated_at,deleted_at)
        VALUES($1,$2,'{}'::jsonb,$3,$4,NOW(),NOW())
        ON CONFLICT(collection_name,record_id) DO UPDATE SET
          record_data='{}'::jsonb, actor_id=EXCLUDED.actor_id, owner_id=EXCLUDED.owner_id,
          updated_at=NOW(), deleted_at=NOW()`,
        [collection, String(id), actorId, ownerId]
      );
    }
    await client.query('COMMIT');
    res.json({ ok: true, upserts: upserts.length, deletes: deletes.length });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

app.get('/api/backup/rows', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT collection_name,record_id,record_data,actor_id,owner_id,updated_at,deleted_at FROM app_records ORDER BY collection_name,record_id`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/backup/restore', async (req, res) => {
  const incoming = Array.isArray(req.body?.rows) ? req.body.rows.filter(r => r?.collection_name && r?.record_id) : [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query(`SELECT collection_name,record_id,deleted_at FROM app_records`);
    const incomingKeys = new Set(incoming.map(r => `${r.collection_name}\u0000${r.record_id}`));
    let archived = 0;
    for (const row of existing.rows) {
      const key = `${row.collection_name}\u0000${row.record_id}`;
      if (!incomingKeys.has(key) && !row.deleted_at) {
        await client.query(`UPDATE app_records SET record_data='{}'::jsonb,updated_at=NOW(),deleted_at=NOW() WHERE collection_name=$1 AND record_id=$2`, [row.collection_name,row.record_id]);
        archived++;
      }
    }
    for (const r of incoming) {
      await client.query(`
        INSERT INTO app_records(collection_name,record_id,record_data,actor_id,owner_id,updated_at,deleted_at)
        VALUES($1,$2,$3::jsonb,$4,$5,COALESCE($6::timestamptz,NOW()),$7::timestamptz)
        ON CONFLICT(collection_name,record_id) DO UPDATE SET record_data=EXCLUDED.record_data,actor_id=EXCLUDED.actor_id,owner_id=EXCLUDED.owner_id,updated_at=EXCLUDED.updated_at,deleted_at=EXCLUDED.deleted_at`,
        [String(r.collection_name),String(r.record_id),JSON.stringify(r.record_data || {}),r.actor_id || null,r.owner_id || null,r.updated_at || null,r.deleted_at || null]
      );
    }
    await client.query('COMMIT');
    res.json({ restoredRows: incoming.length, archivedExtraRows: archived, verified: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally { client.release(); }
});

initDb().then(() => app.listen(PORT, '127.0.0.1', () => console.log(`Afghan Power API on 127.0.0.1:${PORT}`)))
  .catch((e) => { console.error('Database init failed:', e); process.exit(1); });
