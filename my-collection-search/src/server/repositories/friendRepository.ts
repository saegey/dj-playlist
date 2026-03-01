import { dbQuery } from "@/lib/serverDb";

export type FriendRow = {
  id: number;
  username: string;
};

export class FriendRepository {
  async listFriends(): Promise<FriendRow[]> {
    const result = await dbQuery<FriendRow>(
      "SELECT id, username FROM friends ORDER BY added_at DESC"
    );
    return result.rows;
  }

  async findIdByUsername(username: string): Promise<number | null> {
    const result = await dbQuery<{ id: number }>(
      "SELECT id FROM friends WHERE username = $1 LIMIT 1",
      [username]
    );
    return result.rows[0]?.id ?? null;
  }

  async ensureIdByUsername(username: string): Promise<number> {
    await this.insertFriendIfMissing(username);
    const id = await this.findIdByUsername(username);
    if (!id) {
      throw new Error(`Failed to resolve friend id for username '${username}'`);
    }
    return id;
  }

  async insertFriendsIfMissing(usernames: string[]): Promise<void> {
    if (usernames.length === 0) return;
    await dbQuery(
      `
      INSERT INTO friends (username)
      SELECT UNNEST($1::text[])
      ON CONFLICT (username) DO NOTHING
      `,
      [usernames]
    );
  }

  async listByUsernames(usernames: string[]): Promise<FriendRow[]> {
    if (usernames.length === 0) return [];
    const result = await dbQuery<FriendRow>(
      "SELECT id, username FROM friends WHERE username = ANY($1::text[])",
      [usernames]
    );
    return result.rows;
  }

  async insertFriendIfMissing(username: string): Promise<void> {
    await dbQuery(
      "INSERT INTO friends (username) VALUES ($1) ON CONFLICT DO NOTHING",
      [username]
    );
  }

  async deleteTracksByUsername(username: string): Promise<void> {
    await dbQuery("DELETE FROM tracks WHERE username = $1", [username]);
  }

  async deleteFriendByUsername(username: string): Promise<void> {
    await dbQuery("DELETE FROM friends WHERE username = $1", [username]);
  }
}

export const friendRepository = new FriendRepository();
