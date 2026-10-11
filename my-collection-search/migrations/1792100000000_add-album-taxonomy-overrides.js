/** Full replacements, independently resettable for genres and styles. A header
 * with no links means deliberately empty; no header means use Discogs. */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE album_taxonomy_overrides (
      release_id varchar(255) NOT NULL,
      friend_id integer NOT NULL,
      kind text NOT NULL CHECK (kind IN ('genres', 'styles')),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (release_id, friend_id, kind),
      FOREIGN KEY (release_id, friend_id) REFERENCES albums(release_id, friend_id) ON DELETE CASCADE
    );
    CREATE TABLE album_taxonomy_override_genres (
      release_id varchar(255) NOT NULL,
      friend_id integer NOT NULL,
      kind text NOT NULL,
      genre_id uuid NOT NULL REFERENCES genres(id),
      PRIMARY KEY (release_id, friend_id, kind, genre_id),
      FOREIGN KEY (release_id, friend_id, kind)
        REFERENCES album_taxonomy_overrides(release_id, friend_id, kind) ON DELETE CASCADE
    );
    CREATE INDEX album_taxonomy_override_genres_genre_idx ON album_taxonomy_override_genres(genre_id);

    -- All consumers resolve through this function. The fallback is only used
    -- for tracks without an album row; source spellings and unknown values
    -- remain intact when there is no override.
    CREATE FUNCTION effective_album_taxonomy_values(
      release text, friend integer, category text, fallback text[] DEFAULT '{}'
    ) RETURNS text[] LANGUAGE sql STABLE AS $$
      SELECT COALESCE(
        (SELECT ARRAY(
          SELECT g.name FROM album_taxonomy_override_genres l
          JOIN genres g ON g.id = l.genre_id
          WHERE l.release_id = o.release_id AND l.friend_id = o.friend_id AND l.kind = o.kind
          ORDER BY g.name
        ) FROM album_taxonomy_overrides o
         WHERE o.release_id = release AND o.friend_id = friend AND o.kind = category),
        (SELECT COALESCE(CASE category WHEN 'genres' THEN a.genres ELSE a.styles END, '{}'::text[])
         FROM albums a WHERE a.release_id = release AND a.friend_id = friend),
        fallback, '{}'::text[]
      )
    $$;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    DROP FUNCTION effective_album_taxonomy_values(text, integer, text, text[]);
    DROP TABLE album_taxonomy_override_genres;
    DROP TABLE album_taxonomy_overrides;
  `);
};
