export interface AnalysisResult {
  rhythm?: {
    bpm?: number;
    danceability?: number;
  };
  tonal?: {
    key_edma?: {
      key?: string;
      scale?: string;
    };
  };
  metadata?: {
    audio_properties?: {
      length?: number;
    };
  };
  [key: string]: unknown;
}

export type TrackAnalysisUpdate = {
  bpm?: number;
  key?: string;
  danceability?: number;
  duration_seconds?: number;
};

export function mapAnalysisToTrackUpdate(result: AnalysisResult): TrackAnalysisUpdate {
  const bpm = typeof result?.rhythm?.bpm === "number"
    ? Number(Math.round(result.rhythm.bpm))
    : undefined;

  const key =
    result?.tonal?.key_edma?.key && result?.tonal?.key_edma?.scale
      ? `${result.tonal.key_edma.key} ${result.tonal.key_edma.scale}`
      : undefined;

  const danceability = typeof result?.rhythm?.danceability === "number"
    ? Math.round(result.rhythm.danceability * 1000) / 1000
    : undefined;

  const duration_seconds = typeof result?.metadata?.audio_properties?.length === "number"
    ? Math.round(result.metadata.audio_properties.length)
    : undefined;

  return { bpm, key, danceability, duration_seconds };
}

export class AnalysisService {
  private essentiaApiUrl: string;

  constructor() {
    this.essentiaApiUrl = process.env.ESSENTIA_API_URL || "http://essentia:8001/analyze";
  }

  async analyzeAudio(wavFileName: string): Promise<AnalysisResult> {
    const audioUrl = `http://app:3000/api/audio?filename=${wavFileName}`;

    console.log("Calling Essentia API:", this.essentiaApiUrl, "with file", audioUrl);

    try {
      const res = await fetch(this.essentiaApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: audioUrl,
        }),
      });

      console.log("Essentia API response status:", res.status);

      if (!res.ok) {
        const responseText = await res.text();
        throw new Error(`Essentia API error: ${res.status} ${responseText}`);
      }

      const analysisResult = await res.json();
      return analysisResult;
    } catch (err) {
      throw new Error(
        `Essentia API call failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async updateTrackInDatabase(
    trackId: string,
    friendId: number,
    localAudioUrl: string,
    analysisResult: AnalysisResult
  ): Promise<void> {
    try {
      const { Pool } = await import("pg");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });

      // Map analysis result to track updates
      const updates = mapAnalysisToTrackUpdate(analysisResult);

      console.debug("Updating track from analysis:", {
        local_audio_url: localAudioUrl,
        track_id: trackId,
        friend_id: friendId,
        updates,
      });

      // Build dynamic UPDATE with only provided fields
      const sets: string[] = [];
      const vals: unknown[] = [];
      let i = 1;
      if (localAudioUrl) {
        sets.push(`local_audio_url = $${i++}`);
        vals.push(localAudioUrl);
      }
      if (typeof updates.bpm === "number") {
        sets.push(`bpm = $${i++}`);
        vals.push(updates.bpm);
      }
      if (typeof updates.key === "string") {
        sets.push(`key = $${i++}`);
        vals.push(updates.key);
      }
      if (typeof updates.danceability === "number") {
        sets.push(`danceability = $${i++}`);
        vals.push(updates.danceability);
      }
      if (typeof updates.duration_seconds === "number") {
        sets.push(`duration_seconds = $${i++}`);
        vals.push(updates.duration_seconds);
      }

      if (sets.length > 0) {
        vals.push(trackId, friendId);
        const sql = `UPDATE tracks SET ${sets.join(", ")} WHERE track_id = $${i++} AND friend_id = $${i} RETURNING *`;
        const { rows } = await pool.query(sql, vals);

        if (rows && rows[0]) {
          try {
            const { getMeiliClient } = await import("@/lib/meili");
            const meiliClient = getMeiliClient();
            const index = meiliClient.index("tracks");
            const res = await index.updateDocuments(rows);
            console.debug("MeiliSearch index updated successfully", res);
          } catch (meiliError) {
            console.error("Failed to update MeiliSearch:", meiliError);
          }
        }
      } else {
        console.debug("No analysis-driven updates to apply for track", trackId);
      }

      await pool.end();
    } catch (err) {
      console.warn("Could not update track from analysis:", err);
      throw err;
    }
  }
}