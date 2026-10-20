import { z } from "zod";

/** A friend is a library: one Discogs collection, owner of its tracks and albums. */
export const friendSchema = z.object({
  id: z.number().int(),
  username: z.string(),
});

export const friendListResponseSchema = z.object({
  results: z.array(friendSchema),
});

export const friendCreateSchema = z.object({
  username: z.string().min(1),
});

export const friendCreateResponseSchema = z.object({
  message: z.string(),
});

/** The library new sessions open on; null until one is chosen. */
export const defaultLibrarySettingsSchema = z.object({
  friend_id: z.number().int().nullable(),
});

export const defaultLibrarySettingsUpdateSchema = z.object({
  friend_id: z.number().int(),
});

export const defaultLibrarySettingsUpdateResponseSchema = z.object({
  friend_id: z.number().int(),
});

export type Friend = z.infer<typeof friendSchema>;
export type FriendListResponse = z.infer<typeof friendListResponseSchema>;
export type FriendCreate = z.infer<typeof friendCreateSchema>;
export type FriendCreateResponse = z.infer<typeof friendCreateResponseSchema>;
export type DefaultLibrarySettings = z.infer<typeof defaultLibrarySettingsSchema>;
export type DefaultLibrarySettingsUpdate = z.infer<typeof defaultLibrarySettingsUpdateSchema>;
export type DefaultLibrarySettingsUpdateResponse = z.infer<
  typeof defaultLibrarySettingsUpdateResponseSchema
>;

// Request bodies publish their input shape: the routes strip unknown fields
// rather than reject them, so OpenAPI must not claim `additionalProperties: false`.
export const friendJsonSchemas = {
  Friend: z.toJSONSchema(friendSchema),
  FriendListResponse: z.toJSONSchema(friendListResponseSchema),
  FriendCreate: z.toJSONSchema(friendCreateSchema, { io: "input" }),
  FriendCreateResponse: z.toJSONSchema(friendCreateResponseSchema),
  DefaultLibrarySettings: z.toJSONSchema(defaultLibrarySettingsSchema),
  DefaultLibrarySettingsUpdate: z.toJSONSchema(defaultLibrarySettingsUpdateSchema, { io: "input" }),
  DefaultLibrarySettingsUpdateResponse: z.toJSONSchema(defaultLibrarySettingsUpdateResponseSchema),
};
