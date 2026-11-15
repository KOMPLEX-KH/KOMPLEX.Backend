import { db } from "@/db/drizzle/index.js";
import { desc, or, sql, type SQL } from "drizzle-orm";

/**
 * Plain Postgres text search (replaces Meilisearch).
 *
 * The query is split into words; a row matches when any word appears in its
 * title or description (case-insensitive substring, so Khmer text without
 * spaces still matches). Rows matching more words rank higher, and a match in
 * the title counts double. Ties go to the most recently updated row.
 *
 * Returns `{ hits: [{ id }] }` so callers can keep using `searchResults.hits`.
 */
const MAX_WORDS = 8;

const escapeLike = (word: string) => word.replace(/[\\%_]/g, (c) => `\\${c}`);

export const searchIds = async (
  // drizzle tables in this project are typed as `any`
  table: any,
  query: string,
  { limit = 10, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<{ hits: { id: number }[] }> => {
  const words = Array.from(
    new Set(
      String(query ?? "")
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2 && w !== "null" && w !== "undefined")
    )
  ).slice(0, MAX_WORDS);

  if (words.length === 0) return { hits: [] };

  const patterns = words.map((w) => `%${escapeLike(w)}%`);

  const matches: SQL[] = patterns.flatMap((p) => [
    sql`${table.title} ILIKE ${p}`,
    sql`COALESCE(${table.description}, '') ILIKE ${p}`,
  ]);

  const score = sql.join(
    patterns.map(
      (p) =>
        sql`(CASE WHEN ${table.title} ILIKE ${p} THEN 2 ELSE 0 END + CASE WHEN COALESCE(${table.description}, '') ILIKE ${p} THEN 1 ELSE 0 END)`
    ),
    sql` + `
  );

  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(or(...matches))
    .orderBy(desc(sql`(${score})`), desc(table.updatedAt))
    .limit(Number(limit) || 10)
    .offset(Number(offset) || 0);

  return { hits: rows as { id: number }[] };
};
