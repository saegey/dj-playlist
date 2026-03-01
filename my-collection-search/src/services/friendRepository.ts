import { dbQuery } from "@/lib/serverDb";

export class FriendRepository {
  async findIdByUsername(username: string): Promise<number | null> {
    const result = await dbQuery<{ id: number }>(
      "SELECT id FROM friends WHERE username = $1 LIMIT 1",
      [username]
    );
    return result.rows[0]?.id ?? null;
  }
}

export const friendRepository = new FriendRepository();
