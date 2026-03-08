import { VisitorType, type DeviceType } from './classify.js';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  /** Comma-separated IPs to mark as owner. Set in wrangler.jsonc or dashboard. */
  OWNER_IPS?: string;
}

export interface PageView {
  path: string;
  referrer: string | null;
  country: string | null;
  city: string | null;
  continent: string | null;
  visitor_hash: string;
  visitor_type: VisitorType;
  device_type: DeviceType;
  is_owner: number;
}

const INSERT = `INSERT INTO page_views (path, referrer, country, city, continent, visitor_hash, visitor_type, device_type, is_owner) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

export async function recordPageView(db: D1Database, pv: PageView): Promise<void> {
  await db.prepare(INSERT).bind(
    pv.path,
    pv.referrer,
    pv.country,
    pv.city,
    pv.continent,
    pv.visitor_hash,
    pv.visitor_type,
    pv.device_type,
    pv.is_owner,
  ).run();
}
