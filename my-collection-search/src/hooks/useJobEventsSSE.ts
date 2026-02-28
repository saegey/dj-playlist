"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrackStore } from "@/stores/trackStore";
import { useTracksCacheUpdater } from "@/hooks/useTracksCacheUpdater";
import type { Track } from "@/types/track";

interface JobCompletedEvent {
  type: "job_completed";
  job_id: string;
  track_id: string;
  friend_id: number;
  result?: {
    local_audio_url?: string;
    duration_seconds?: number;
    analysis?: {
      rhythm?: { bpm?: number; danceability?: number };
      tonal?: { key_edma?: { key?: string; scale?: string } };
      metadata?: { audio_properties?: { length?: number } };
    };
  };
  timestamp: number;
}

interface JobErrorEvent {
  type: "error";
  message: string;
  timestamp: number;
}

type JobEvent = JobCompletedEvent | JobErrorEvent;

export function useJobEventsSSE(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { updateTrack } = useTrackStore();
  const { updateTracksInCache } = useTracksCacheUpdater();
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    // Create SSE connection
    eventSourceRef.current = new EventSource("/api/jobs/events");

    eventSourceRef.current.onmessage = (event) => {
      try {
        if (event.data === "connected") {
          console.log("Job events SSE connected");
          setIsConnected(true);
          return;
        }

        const jobEvent: JobEvent = JSON.parse(event.data);

        if (jobEvent.type === "job_completed") {
          console.log(`Job ${jobEvent.job_id} completed for track ${jobEvent.track_id}`);

          const updates: Partial<Track> = {};
          const result = jobEvent.result;

          if (result?.local_audio_url) {
            updates.local_audio_url = result.local_audio_url;
          }
          if (typeof result?.duration_seconds === "number") {
            updates.duration_seconds = result.duration_seconds;
          }

          const analysis = result?.analysis;
          if (analysis?.metadata?.audio_properties?.length && typeof analysis.metadata.audio_properties.length === "number") {
            updates.duration_seconds = Math.round(analysis.metadata.audio_properties.length);
          }
          if (analysis?.rhythm?.bpm && typeof analysis.rhythm.bpm === "number") {
            updates.bpm = String(Math.round(analysis.rhythm.bpm));
          }
          if (analysis?.rhythm?.danceability && typeof analysis.rhythm.danceability === "number") {
            updates.danceability = analysis.rhythm.danceability.toFixed(3);
          }
          if (analysis?.tonal?.key_edma?.key && analysis?.tonal?.key_edma?.scale) {
            updates.key = `${analysis.tonal.key_edma.key} ${analysis.tonal.key_edma.scale}`;
          }

          if (Object.keys(updates).length > 0) {
            updateTrack(jobEvent.track_id, jobEvent.friend_id, updates);
            updateTracksInCache({ track_id: jobEvent.track_id, friend_id: jobEvent.friend_id, ...updates });
          }

          // Invalidate tracks queries
          queryClient.invalidateQueries({
            predicate: (query) => {
              const queryKey = query.queryKey;
              return queryKey[0] === "tracks" || queryKey[0] === "playlist-tracks";
            },
          });
        } else if (jobEvent.type === "error") {
          console.error("Job events SSE error:", jobEvent.message);
        }
      } catch (error) {
        console.error("Error parsing job event:", error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error("Job events SSE connection error:", error);
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, queryClient, updateTrack, updateTracksInCache]);

  return isConnected;
}
