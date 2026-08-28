export type UnreadChatMessage = {
  id: number;
  userId: number;
};

export function countUnreadChatMessages(
  messages: UnreadChatMessage[],
  lastReadMessageId: number,
  currentUserId: number,
) {
  return messages.filter((message) => (
    message.id > lastReadMessageId && message.userId !== currentUserId
  )).length;
}
