-- Migration: Make apple_music_persistent_id not unique
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='tracks' AND column_name='apple_music_persistent_id'
  ) THEN
    ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_apple_music_persistent_id_key;
    ALTER TABLE tracks ALTER COLUMN apple_music_persistent_id DROP NOT NULL;
  END IF;
END$$;
