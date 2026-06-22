import { db } from '@neighborhood-showcase/db';
import { announcement as announcementSchema } from '@neighborhood-showcase/db/schema/showcase';
import { sql } from 'drizzle-orm';

/**
 * Distinct provider-authored tags across live announcements, ordered by how
 * often they are used, to power authoring autocomplete. Tags persist already
 * normalized (trim/case-fold/dedupe), so this surfaces them as-is.
 */
export async function listTagSuggestions(limit = 100): Promise<string[]> {
  const result = await db.execute<{ tag: string }>(sql`
    SELECT tag, COUNT(*) AS uses
    FROM ${announcementSchema} a, unnest(a.tags) AS tag
    WHERE a.deleted_at IS NULL
    GROUP BY tag
    ORDER BY uses DESC, tag ASC
    LIMIT ${limit}
  `);
  return result.rows.map((row) => row.tag);
}
