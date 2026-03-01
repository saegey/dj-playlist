import { NextResponse } from "next/server";
import {
  getManifestFiles,
  parseManifestFile,
  getReleasePath,
  getManifestPath,
  saveManifest,
} from "@/server/services/discogsManifestService";
import {
  manifestCleanupResponseSchema,
  manifestVerificationResponseSchema,
} from "@/api-contract/schemas";

interface VerificationResult {
  username: string;
  totalReleaseIds: number;
  missingFiles: string[];
  validFiles: string[];
}

export async function GET() {
  try {
    const manifestFiles = getManifestFiles();
    if (!manifestFiles.length) {
      const emptyResponse = {
        message: "No manifest files found yet. Run Discogs sync to create them.",
        results: [],
        summary: {
          totalManifests: 0,
          totalMissingFiles: 0,
          totalValidFiles: 0,
        },
      };
      const validated = manifestVerificationResponseSchema.parse(emptyResponse);
      return NextResponse.json(validated, { status: 200 });
    }

    const results: VerificationResult[] = [];

    for (const manifestFile of manifestFiles) {
      const { manifest, username } = parseManifestFile(manifestFile);
      const releaseIds: string[] = manifest.releaseIds || [];
      const missingFiles: string[] = [];
      const validFiles: string[] = [];

      for (const releaseId of releaseIds) {
        const releasePath = getReleasePath(username, releaseId);
        if (!releasePath) {
          missingFiles.push(releaseId);
        } else {
          validFiles.push(releaseId);
        }
      }

      results.push({
        username,
        totalReleaseIds: releaseIds.length,
        missingFiles,
        validFiles,
      });
    }

    const response = {
      message: "Manifest verification complete",
      results,
      summary: {
        totalManifests: results.length,
        totalMissingFiles: results.reduce((sum, r) => sum + r.missingFiles.length, 0),
        totalValidFiles: results.reduce((sum, r) => sum + r.validFiles.length, 0),
      },
    };
    const validated = manifestVerificationResponseSchema.parse(response);
    return NextResponse.json(validated);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const manifestFiles = getManifestFiles();
    if (!manifestFiles.length) {
      const emptyResponse = {
        message: "No manifest files to clean yet.",
        results: [],
        summary: {
          totalManifests: 0,
          totalRemoved: 0,
          totalKept: 0,
        },
      };
      const validated = manifestCleanupResponseSchema.parse(emptyResponse);
      return NextResponse.json(validated, { status: 200 });
    }

    const results: {
      username: string;
      before: number;
      after: number;
      removed: string[];
    }[] = [];

    for (const manifestFile of manifestFiles) {
      const { manifest, username } = parseManifestFile(manifestFile);
      const releaseIds: string[] = manifest.releaseIds || [];
      const validReleaseIds: string[] = [];
      const removedReleaseIds: string[] = [];

      for (const releaseId of releaseIds) {
        const releasePath = getReleasePath(username, releaseId);
        if (releasePath) {
          validReleaseIds.push(releaseId);
        } else {
          removedReleaseIds.push(releaseId);
        }
      }

      // Save the cleaned manifest
      const manifestPath = getManifestPath(username);
      saveManifest(manifestPath, validReleaseIds);

      results.push({
        username,
        before: releaseIds.length,
        after: validReleaseIds.length,
        removed: removedReleaseIds,
      });
    }

    const response = {
      message: "Manifests cleaned successfully",
      results,
      summary: {
        totalManifests: results.length,
        totalRemoved: results.reduce((sum, r) => sum + r.removed.length, 0),
        totalKept: results.reduce((sum, r) => sum + r.after, 0),
      },
    };
    const validated = manifestCleanupResponseSchema.parse(response);
    return NextResponse.json(validated);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
