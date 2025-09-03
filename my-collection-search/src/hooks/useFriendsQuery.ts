import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { addFriendApi, fetchFriends, removeFriendApi } from "@/services/internalApi/friends";

export function useFriendsQuery() {
  const qc = useQueryClient();

  const { data: friends = [], isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => fetchFriends(),
  });

  const addFriend = useMutation({
    mutationFn: (username: string) => addFriendApi(username),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  const removeFriend = useMutation({
    mutationFn: (username: string) => removeFriendApi(username),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friends"] }),
  });

  return {
    friends,
    friendsLoading: isLoading,
    addFriend: (u: string) => addFriend.mutateAsync(u),
    removeFriend: (u: string) => removeFriend.mutateAsync(u),
    addFriendPending: addFriend.isPending,
    removeFriendPending: removeFriend.isPending,
  };
}
