import { Worker } from "bullmq";
import { createDownloadWorker } from "@/queues/jobs/downloadAudio";
import { createAnalyzeWorker } from "@/queues/jobs/analyzeAudio";
import { getRedisConnection, disconnectRedis } from "@/lib/redis";

let downloadWorker: Worker | null = null;
let analyzeWorker: Worker | null = null;

async function startWorkers() {
  console.log("Starting BullMQ workers...");

  try {
    // Test Redis connection
    const redis = getRedisConnection();
    await redis.ping();
    console.log("Redis connection established");

    // Create workers
    downloadWorker = createDownloadWorker();
    analyzeWorker = createAnalyzeWorker();

    // Set up event listeners
    downloadWorker.on("completed", (job) => {
      console.log(`Download job ${job.id} completed`);
    });

    downloadWorker.on("failed", (job, err: Error) => {
      console.error(`Download job ${job?.id} failed:`, err);
    });

    downloadWorker.on("error", (err: Error) => {
      console.error("Download worker error:", err);
    });

    analyzeWorker.on("completed", (job) => {
      console.log(`Analysis job ${job.id} completed`);
    });

    analyzeWorker.on("failed", (job, err: Error) => {
      console.error(`Analysis job ${job?.id} failed:`, err);
    });

    analyzeWorker.on("error", (err: Error) => {
      console.error("Analysis worker error:", err);
    });

    console.log("Workers started successfully");
    console.log("Download worker concurrency: 2");
    console.log("Analysis worker concurrency: 3");

  } catch (error) {
    console.error("Failed to start workers:", error);
    process.exit(1);
  }
}

async function shutdown() {
  console.log("Shutting down workers...");

  const shutdownPromises: Promise<void>[] = [];

  if (downloadWorker) {
    shutdownPromises.push(downloadWorker.close());
  }

  if (analyzeWorker) {
    shutdownPromises.push(analyzeWorker.close());
  }

  try {
    await Promise.all(shutdownPromises);
    disconnectRedis();
    console.log("Workers shut down successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  shutdown();
});

// Start the workers
startWorkers().catch((error) => {
  console.error("Failed to start workers:", error);
  process.exit(1);
});