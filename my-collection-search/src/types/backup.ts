export const BACKUP_PROVIDERS = ["restic-b2"] as const;
export type BackupProvider = (typeof BACKUP_PROVIDERS)[number];

export const BACKUP_RETENTION_PRESETS = ["aggressive", "balanced", "archive"] as const;
export type BackupRetentionPreset = (typeof BACKUP_RETENTION_PRESETS)[number];

export type BackupPolicy = {
  enabled: boolean;
  provider: BackupProvider;
  schedule_cron: string;
  retention_preset: BackupRetentionPreset;
  include_database: boolean;
  include_audio_files: boolean;
  include_album_covers: boolean;
  include_uploads: boolean;
  updated_at: string;
};

export type BackupPolicyUpdate = Partial<
  Omit<BackupPolicy, "provider" | "updated_at"> & {
    provider: BackupProvider;
  }
>;
