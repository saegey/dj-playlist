#!/bin/bash
# Script to check what columns are in the backup INSERT statements

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./check_backup_columns.sh <backup-file.sql>"
  exit 1
fi

echo "Checking columns in INSERT statements..."
echo ""

# Find the first INSERT INTO tracks statement and show the columns
echo "=== First INSERT INTO tracks statement ==="
grep -m 1 "INSERT INTO.*tracks" "$BACKUP_FILE" | head -c 500
echo ""
echo ""

# Count how many times apple_music_url appears in the file
echo "=== apple_music_url mentions in backup ==="
APPLE_COUNT=$(grep -c "apple_music_url" "$BACKUP_FILE")
echo "Found 'apple_music_url' $APPLE_COUNT times in backup"
echo ""

# Show a sample line with apple_music_url
echo "=== Sample line containing apple_music_url ==="
grep "apple_music_url" "$BACKUP_FILE" | head -1
echo ""
