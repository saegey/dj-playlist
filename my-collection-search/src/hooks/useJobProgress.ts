"use client";

import { useState, useEffect, useCallback } from "react";
import { createJobEventSource, getJobStatus, type JobStatusResponse } from "@/services/asyncTrackService";

export interface JobProgressState {
  status: JobStatusResponse | null;
  isConnected: boolean;
  isComplete: boolean;
  isFailed: boolean;
  error: string | null;
  progress: number;
}

export interface UseJobProgressOptions {
  jobId: string;
  queue?: string;
  onProgress?: (progress: number) => void;
  onComplete?: (result: unknown) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function useJobProgress({
  jobId,
  queue,
  onProgress,
  onComplete,
  onError,
  enabled = true,
}: UseJobProgressOptions) {
  const [state, setState] = useState<JobProgressState>({
    status: null,
    isConnected: false,
    isComplete: false,
    isFailed: false,
    error: null,
    progress: 0,
  });

  const updateProgress = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
    onProgress?.(progress);
  }, [onProgress]);

  const handleComplete = useCallback((result: unknown) => {
    setState(prev => ({
      ...prev,
      isComplete: true,
      isConnected: false,
      progress: 100,
    }));
    onComplete?.(result);
  }, [onComplete]);

  const handleError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      isFailed: true,
      isConnected: false,
      error,
    }));
    onError?.(error);
  }, [onError]);

  useEffect(() => {
    if (!enabled || !jobId) return;

    // First, get the initial job status
    getJobStatus(jobId, queue)
      .then(status => {
        setState(prev => ({
          ...prev,
          status,
          progress: status.progress || 0,
          isComplete: status.state === "completed",
          isFailed: status.state === "failed",
          error: status.failedReason || null,
        }));

        // If job is already complete/failed, don't start SSE
        if (status.state === "completed") {
          handleComplete(status.returnvalue);
          return;
        }
        if (status.state === "failed") {
          handleError(status.failedReason || "Job failed");
          return;
        }
      })
      .catch(err => {
        console.error("Failed to get initial job status:", err);
        handleError(err.message);
        return;
      });

    // Set up SSE connection for real-time updates
    const eventSource = createJobEventSource(jobId, queue);

    eventSource.onopen = () => {
      setState(prev => ({ ...prev, isConnected: true }));
    };

    eventSource.addEventListener("connected", () => {
      console.log("SSE connected for job:", jobId);
    });

    eventSource.addEventListener("progress", (event) => {
      try {
        const data = JSON.parse(event.data);
        updateProgress(data.progress);
      } catch (err) {
        console.error("Failed to parse progress event:", err);
      }
    });

    eventSource.addEventListener("completed", (event) => {
      try {
        const data = JSON.parse(event.data);
        handleComplete(data.result);
        eventSource.close();
      } catch (err) {
        console.error("Failed to parse completed event:", err);
      }
    });

    eventSource.addEventListener("failed", (event) => {
      try {
        const data = JSON.parse(event.data);
        handleError(data.error || "Job failed");
        eventSource.close();
      } catch (err) {
        console.error("Failed to parse failed event:", err);
        handleError("Job failed");
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setState(prev => ({ ...prev, isConnected: false }));

      // Don't automatically reconnect for now, but could implement exponential backoff here
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [enabled, jobId, queue, updateProgress, handleComplete, handleError]);

  const refetch = useCallback(async () => {
    if (!jobId) return;

    try {
      const status = await getJobStatus(jobId, queue);
      setState(prev => ({
        ...prev,
        status,
        progress: status.progress || 0,
        isComplete: status.state === "completed",
        isFailed: status.state === "failed",
        error: status.failedReason || null,
      }));
    } catch (err) {
      console.error("Failed to refetch job status:", err);
      handleError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  }, [jobId, queue, handleError]);

  return {
    ...state,
    refetch,
  };
}