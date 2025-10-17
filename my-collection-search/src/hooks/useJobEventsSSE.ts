"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTrackStore } from "@/stores/trackStore";

interface JobCompletedEvent {
  type: "job_completed";
  job_id: string;
  track_id: string;
  friend_id: number;
  result?: {
    local_audio_url?: string;
  };
  timestamp: number;
}

interface JobErrorEvent {
  type: "error";
  message: string;
  timestamp: number;
}

type JobEvent = JobCompletedEvent | JobErrorEvent;

export function useJobEventsSSE() {
  const queryClient = useQueryClient();
  const { updateTrack } = useTrackStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Create SSE connection
    eventSourceRef.current = new EventSource("/api/jobs/events");

    eventSourceRef.current.onmessage = (event) => {
      try {
        if (event.data === "connected") {
          console.log("Job events SSE connected");
          return;
        }

        const jobEvent: JobEvent = JSON.parse(event.data);

        if (jobEvent.type === "job_completed") {
          console.log(`Job ${jobEvent.job_id} completed for track ${jobEvent.track_id}`);

          // Update Zustand track store if audio file was downloaded
          if (jobEvent.result?.local_audio_url) {
            updateTrack(jobEvent.track_id, jobEvent.friend_id, {
              local_audio_url: jobEvent.result.local_audio_url,
            });
            console.log(`Updated track store: ${jobEvent.track_id} -> ${jobEvent.result.local_audio_url}`);
          }

          // Update React Query caches
          queryClient.setQueriesData(
            {
              predicate: (query) => query.queryKey[0] === "tracks",
            },
            (oldData: unknown) => {
              if (!oldData) return oldData;

              const updateTrack = (track: Record<string, unknown>) => {
                if (track.track_id === jobEvent.track_id && track.friend_id === jobEvent.friend_id) {
                  return {
                    ...track,
                    local_audio_url: jobEvent.result?.local_audio_url,
                  };
                }
                return track;
              };

              const data = oldData as Record<string, unknown>;

              // Handle infinite query format
              if (data.pages && Array.isArray(data.pages)) {
                return {
                  ...data,
                  pages: data.pages.map((page: Record<string, unknown>) => ({
                    ...page,
                    hits: Array.isArray(page.hits) ? page.hits.map(updateTrack) : page.hits,
                  })),
                };
              }

              // Handle single page format
              if (data.hits && Array.isArray(data.hits)) {
                return {
                  ...data,
                  hits: data.hits.map(updateTrack),
                };
              }

              // Handle array format (playlist tracks)
              if (Array.isArray(data)) {
                return data.map(updateTrack);
              }

              return oldData;
            }
          );

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
    };

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient, updateTrack]);

  return eventSourceRef.current?.readyState === EventSource.OPEN;
}