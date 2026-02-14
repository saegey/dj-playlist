#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE = process.env.API_BASE || "http://localhost:3000/api";
const API_KEY = process.env.API_KEY;

// Helper to call Next.js API
async function apiCall(endpoint: string, method = "GET", data?: any) {
  try {
    const headers: any = {
      "Content-Type": "application/json",
    };

    // Add API key if configured (for production access)
    if (API_KEY) {
      headers["Authorization"] = `Bearer ${API_KEY}`;
    }

    const response = await axios({
      method,
      url: `${API_BASE}${endpoint}`,
      data,
      headers,
    });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.response?.data?.message || error.message;
    throw new Error(`API Error: ${message}`);
  }
}

// Define tool schemas
const tools = [
  {
    name: "search_tracks",
    description: "Search for tracks in your collection by title, artist, album, genre, or tags. Supports filtering by BPM range, key, and star rating.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (title, artist, album, genre, or tag)",
        },
        bpm_min: {
          type: "number",
          description: "Minimum BPM",
        },
        bpm_max: {
          type: "number",
          description: "Maximum BPM",
        },
        key: {
          type: "string",
          description: "Musical key (e.g., 'A minor', 'C major')",
        },
        star_rating: {
          type: "number",
          description: "Filter by star rating (0-5)",
        },
        limit: {
          type: "number",
          description: "Number of results to return",
          default: 10,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_track_details",
    description: "Get detailed information about a specific track including audio analysis (BPM, key, mood scores, danceability)",
    inputSchema: {
      type: "object",
      properties: {
        track_id: {
          type: "string",
          description: "The track ID",
        },
        username: {
          type: "string",
          description: "Username (optional, uses default if not provided)",
        },
      },
      required: ["track_id"],
    },
  },
  {
    name: "list_playlists",
    description: "List all playlists in your collection",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_playlist",
    description: "Get details about a specific playlist including all tracks",
    inputSchema: {
      type: "object",
      properties: {
        playlist_id: {
          type: "string",
          description: "The playlist ID",
        },
      },
      required: ["playlist_id"],
    },
  },
  {
    name: "create_playlist",
    description: "Create a new playlist with optional tracks",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Playlist name",
        },
        tracks: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Array of track IDs to add to playlist",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "generate_ai_playlist",
    description: "Generate an optimized DJ playlist using genetic algorithm based on seed tracks. Creates smooth transitions based on BPM, key compatibility, and mood progression.",
    inputSchema: {
      type: "object",
      properties: {
        playlist: {
          type: "array",
          items: {
            type: "object",
          },
          description: "Array of seed track objects to base the playlist on",
        },
      },
      required: ["playlist"],
    },
  },
  {
    name: "get_playlist_tracks",
    description: "Get all track IDs in a playlist",
    inputSchema: {
      type: "object",
      properties: {
        playlist_id: {
          type: "string",
          description: "The playlist ID",
        },
      },
      required: ["playlist_id"],
    },
  },
  {
    name: "collection_stats",
    description: "Get statistics about your music collection including total tracks, genre distribution, BPM ranges, and more",
    inputSchema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Username (optional)",
        },
      },
    },
  },
  {
    name: "get_friends",
    description: "List all friends and their shared collections",
    inputSchema: {
      type: "object",
      properties: {
        showCurrentUser: {
          type: "boolean",
          description: "Include current user in results",
          default: false,
        },
        showSpotifyUsernames: {
          type: "boolean",
          description: "Include Spotify usernames",
          default: false,
        },
      },
    },
  },
  {
    name: "add_friend",
    description: "Add a friend to share collections with",
    inputSchema: {
      type: "object",
      properties: {
        username: {
          type: "string",
          description: "Friend's username",
        },
      },
      required: ["username"],
    },
  },
  {
    name: "search_apple_music",
    description: "Search for tracks on Apple Music to enrich track metadata",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Track title",
        },
        artist: {
          type: "string",
          description: "Artist name",
        },
        album: {
          type: "string",
          description: "Album name",
        },
        isrc: {
          type: "string",
          description: "ISRC code",
        },
      },
    },
  },
  {
    name: "search_spotify",
    description: "Search for tracks on Spotify",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Track title",
        },
        artist: {
          type: "string",
          description: "Artist name",
        },
      },
    },
  },
  {
    name: "search_youtube",
    description: "Search for tracks on YouTube Music",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Track title",
        },
        artist: {
          type: "string",
          description: "Artist name",
        },
      },
    },
  },
  {
    name: "update_track",
    description: "Update track metadata (star rating, notes, tags, URLs, etc.)",
    inputSchema: {
      type: "object",
      properties: {
        track_id: {
          type: "string",
          description: "Track ID",
        },
        star_rating: {
          type: "number",
          description: "Star rating (0-5)",
        },
        notes: {
          type: "string",
          description: "Track notes",
        },
        local_tags: {
          type: "string",
          description: "Comma-separated tags",
        },
        apple_music_url: {
          type: "string",
          description: "Apple Music URL",
        },
        spotify_url: {
          type: "string",
          description: "Spotify URL",
        },
        youtube_url: {
          type: "string",
          description: "YouTube URL",
        },
        soundcloud_url: {
          type: "string",
          description: "SoundCloud URL",
        },
      },
      required: ["track_id"],
    },
  },
  {
    name: "get_missing_apple_music",
    description: "Get tracks that are missing Apple Music URLs",
    inputSchema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number",
          default: 1,
        },
        pageSize: {
          type: "number",
          description: "Number of tracks per page",
          default: 50,
        },
        username: {
          type: "string",
          description: "Username (optional)",
        },
      },
    },
  },
];

// Tool handlers
async function handleToolCall(name: string, args: any) {
  switch (name) {
    case "search_tracks": {
      // Build filters object
      const filters: any = {};
      if (args.bpm_min) filters.bpm_min = args.bpm_min;
      if (args.bpm_max) filters.bpm_max = args.bpm_max;
      if (args.key) filters.key = args.key;
      if (args.star_rating) filters.star_rating = args.star_rating;

      // Call the search API
      const result = await apiCall("/tracks/search", "POST", {
        query: args.query,
        limit: args.limit || 10,
        offset: 0,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      });

      if (!result || !result.tracks || result.tracks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No tracks found matching "${args.query}". Try a different search term.`,
            },
          ],
        };
      }

      const tracksList = result.tracks
        .map(
          (t: any) =>
            `• ${t.title} - ${t.artist}${t.bpm ? ` (${t.bpm} BPM)` : ""}${t.key ? `, ${t.key}` : ""}${t.star_rating ? ` [★${t.star_rating}]` : ""}`
        )
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${result.tracks.length} tracks${result.estimatedTotalHits > result.tracks.length ? ` (${result.estimatedTotalHits} total)` : ""}:\n\n${tracksList}`,
          },
        ],
      };
    }

    case "get_track_details": {
      const queryParams = args.username ? `?username=${args.username}` : "";
      const track = await apiCall(`/tracks/${args.track_id}${queryParams}`);

      const details = `
**${track.title}** by ${track.artist}
${track.album ? `Album: ${track.album}` : ""}
${track.year ? `Year: ${track.year}` : ""}

**Audio Analysis:**
- BPM: ${track.bpm || "Not analyzed"}
- Key: ${track.key || "Not analyzed"}
- Danceability: ${track.danceability || "N/A"}
- Duration: ${track.duration_seconds ? `${Math.floor(track.duration_seconds / 60)}:${String(track.duration_seconds % 60).padStart(2, "0")}` : track.duration || "N/A"}

**Mood:**
- Happy: ${track.mood_happy || 0}
- Sad: ${track.mood_sad || 0}
- Aggressive: ${track.mood_aggressive || 0}
- Relaxed: ${track.mood_relaxed || 0}

**Metadata:**
- Star Rating: ${track.star_rating !== undefined ? `★${track.star_rating}/5` : "Not rated"}
- Genres: ${track.genres?.join(", ") || "N/A"}
- Styles: ${track.styles?.join(", ") || "N/A"}
- Tags: ${track.local_tags || "None"}
${track.notes ? `- Notes: ${track.notes}` : ""}

**Platform URLs:**
${track.discogs_url ? `- Discogs: ${track.discogs_url}` : ""}
${track.spotify_url ? `- Spotify: ${track.spotify_url}` : ""}
${track.apple_music_url ? `- Apple Music: ${track.apple_music_url}` : ""}
${track.youtube_url ? `- YouTube: ${track.youtube_url}` : ""}
${track.soundcloud_url ? `- SoundCloud: ${track.soundcloud_url}` : ""}
      `.trim();

      return {
        content: [{ type: "text", text: details }],
      };
    }

    case "list_playlists": {
      const playlists = await apiCall("/playlists");

      if (!playlists || playlists.length === 0) {
        return {
          content: [{ type: "text", text: "No playlists found." }],
        };
      }

      const playlistList = playlists
        .map((p: any) => `• ${p.name} (ID: ${p.id})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Your playlists:\n\n${playlistList}`,
          },
        ],
      };
    }

    case "get_playlist": {
      const trackIds = await apiCall(`/playlists/${args.playlist_id}/tracks`);

      if (!trackIds || !trackIds.track_ids || trackIds.track_ids.length === 0) {
        return {
          content: [{ type: "text", text: "Playlist is empty." }],
        };
      }

      // Fetch track details
      const tracks = await apiCall("/tracks/batch", "POST", {
        track_ids: trackIds.track_ids,
      });

      const tracksInfo = tracks
        .map((t: any, idx: number) => `${idx + 1}. ${t.title} - ${t.artist}${t.bpm ? ` (${t.bpm} BPM)` : ""}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Playlist tracks (${tracks.length} total):\n\n${tracksInfo}`,
          },
        ],
      };
    }

    case "create_playlist": {
      await apiCall("/playlists", "POST", {
        name: args.name,
        tracks: args.tracks || [],
      });

      return {
        content: [
          {
            type: "text",
            text: `✓ Playlist "${args.name}" created successfully!${args.tracks?.length ? ` Added ${args.tracks.length} tracks.` : ""}`,
          },
        ],
      };
    }

    case "generate_ai_playlist": {
      const result = await apiCall("/playlists/genetic", "POST", {
        playlist: args.playlist,
      });

      // The API returns { result: Track[] } and we need to normalize it
      const tracks = result.result || result;

      const tracksInfo = tracks
        .map((t: any, idx: number) => `${idx + 1}. ${t.title} - ${t.artist} (${t.bpm} BPM, ${t.key})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `✓ AI-generated playlist (${tracks.length} tracks):\n\n${tracksInfo}`,
          },
        ],
      };
    }

    case "get_playlist_tracks": {
      const result = await apiCall(`/playlists/${args.playlist_id}/tracks`);

      return {
        content: [
          {
            type: "text",
            text: `Playlist track IDs:\n${result.track_ids.join("\n")}`,
          },
        ],
      };
    }

    case "collection_stats": {
      // This would require a custom endpoint or database query
      // For now, return a placeholder
      return {
        content: [
          {
            type: "text",
            text: "Collection statistics endpoint not yet implemented. Consider adding /api/tracks/stats endpoint.",
          },
        ],
      };
    }

    case "get_friends": {
      const queryParams = new URLSearchParams();
      if (args.showCurrentUser) queryParams.append("showCurrentUser", "true");
      if (args.showSpotifyUsernames) queryParams.append("showSpotifyUsernames", "true");

      const result = await apiCall(`/friends?${queryParams.toString()}`);

      if (!result.friends || result.friends.length === 0) {
        return {
          content: [{ type: "text", text: "No friends added yet." }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Your friends:\n${result.friends.join("\n")}`,
          },
        ],
      };
    }

    case "add_friend": {
      await apiCall("/friends", "POST", { username: args.username });

      return {
        content: [
          {
            type: "text",
            text: `✓ Added ${args.username} as a friend!`,
          },
        ],
      };
    }

    case "search_apple_music": {
      const result = await apiCall("/ai/apple-music-search", "POST", {
        title: args.title,
        artist: args.artist,
        album: args.album,
        isrc: args.isrc,
      });

      if (!result.results || result.results.length === 0) {
        return {
          content: [{ type: "text", text: "No results found on Apple Music." }],
        };
      }

      const resultsList = result.results
        .slice(0, 5)
        .map((r: any) => `• ${r.trackName} - ${r.artistName} (${r.collectionName})`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Apple Music results:\n\n${resultsList}`,
          },
        ],
      };
    }

    case "search_spotify": {
      const result = await apiCall("/ai/spotify-track-search", "POST", {
        title: args.title,
        artist: args.artist,
      });

      if (!result.results || result.results.length === 0) {
        return {
          content: [{ type: "text", text: "No results found on Spotify." }],
        };
      }

      const resultsList = result.results
        .slice(0, 5)
        .map((r: any) => `• ${r.name} - ${r.artists?.join(", ")}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Spotify results:\n\n${resultsList}`,
          },
        ],
      };
    }

    case "search_youtube": {
      const result = await apiCall("/ai/youtube-music-search", "POST", {
        title: args.title,
        artist: args.artist,
      });

      if (!result.results || result.results.length === 0) {
        return {
          content: [{ type: "text", text: "No results found on YouTube." }],
        };
      }

      const resultsList = result.results
        .slice(0, 5)
        .map((r: any) => `• ${r.title} - ${r.channel}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `YouTube results:\n\n${resultsList}`,
          },
        ],
      };
    }

    case "update_track": {
      const { track_id, ...updates } = args;
      await apiCall("/tracks/update", "PATCH", { track_id, ...updates });

      return {
        content: [
          {
            type: "text",
            text: `✓ Track updated successfully!`,
          },
        ],
      };
    }

    case "get_missing_apple_music": {
      const queryParams = new URLSearchParams();
      if (args.page) queryParams.append("page", args.page.toString());
      if (args.pageSize) queryParams.append("pageSize", args.pageSize.toString());
      if (args.username) queryParams.append("username", args.username);

      const result = await apiCall(`/tracks/missing-apple-music?${queryParams.toString()}`);

      if (!result.tracks || result.tracks.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "All tracks have Apple Music URLs!",
            },
          ],
        };
      }

      const tracksList = result.tracks
        .slice(0, 10)
        .map((t: any) => `• ${t.title} - ${t.artist}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Tracks missing Apple Music URLs (${result.total} total, showing first 10):\n\n${tracksList}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Create and start server
const server = new Server(
  {
    name: "groovenet-dj",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const result = await handleToolCall(request.params.name, request.params.arguments);
    return result;
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Groovenet MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
