# Groovenet MCP Server

Model Context Protocol (MCP) server for the Groovenet DJ Playlist System. This server allows Claude to interact with your music collection through natural language.

## Features

### Track Management
- **search_tracks** - Search your collection by title, artist, genre, BPM, key, or rating
- **get_track_details** - Get detailed track info including audio analysis
- **update_track** - Update track metadata (ratings, notes, tags, URLs)
- **get_missing_apple_music** - Find tracks without Apple Music URLs

### Playlist Management
- **list_playlists** - View all your playlists
- **get_playlist** - Get playlist details and tracks
- **create_playlist** - Create new playlists
- **generate_ai_playlist** - Generate optimized DJ playlists using genetic algorithm

### Music Platform Search
- **search_apple_music** - Search Apple Music for tracks
- **search_spotify** - Search Spotify for tracks
- **search_youtube** - Search YouTube Music for tracks

### Social Features
- **get_friends** - List friends and shared collections
- **add_friend** - Add friends to share music with

### Analytics
- **collection_stats** - Get statistics about your collection

## Setup

1. Install dependencies:
```bash
cd mcp-server
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Edit `.env` and set your API base URL:
```
API_BASE=http://localhost:3000/api
```

4. Build the server:
```bash
npm run build
```

## Usage with Claude Code

Add the server to Claude Code:

```bash
claude mcp add --transport stdio --scope project groovenet \
  -- node /Users/saegey/Projects/dj-playlist/mcp-server/build/index.js
```

Verify it was added:

```bash
claude mcp list
```

## Example Queries

Once configured, you can ask Claude things like:

- "Search for all techno tracks between 128-132 BPM"
- "Show me details about track ID abc123"
- "Create a playlist called 'Deep House Sunday' with my top rated deep house tracks"
- "Generate an AI playlist starting with these tracks: [track1, track2, track3]"
- "What tracks am I missing Apple Music URLs for?"
- "Update track abc123 with 5 stars and add note 'perfect for peak time'"
- "Search Apple Music for 'Plastikman - Spastik'"
- "List all my playlists"
- "Who are my friends?"

## Development

Watch mode (rebuilds on changes):
```bash
npm run watch
```

Test the server:
```bash
npm run dev
```

## Architecture

The MCP server acts as a bridge between Claude and your Next.js API:

```
Claude Code → MCP Server → Next.js API → PostgreSQL/MeiliSearch/Services
```

All tools call your existing `/api/*` endpoints, so no database logic is duplicated.

## Adding New Tools

To add a new tool:

1. Add tool definition to the `tools` array in `src/index.ts`
2. Add handler case in `handleToolCall()` function
3. Rebuild: `npm run build`
4. Tool is automatically available in Claude Code (no restart needed)

## Troubleshooting

**Server not found:**
- Make sure you built the server: `npm run build`
- Check the path in `claude mcp add` command is correct
- Verify with `claude mcp list`

**API errors:**
- Make sure your Next.js app is running on the correct port
- Check API_BASE in `.env` matches your Next.js server
- Verify endpoints exist in your Next.js app

**Tool not working:**
- Check the API endpoint exists and returns expected data
- Look at error messages in Claude Code output
- Test the endpoint directly with curl/Postman

## License

MIT
