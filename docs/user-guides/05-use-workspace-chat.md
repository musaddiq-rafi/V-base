# Use Workspace Chat

This page shows how to open workspace chat, use the general channel, start direct messages, and understand unread and reaction behavior.

---

## Table Of Contents

1. [Open The Chat Panel](#open-the-chat-panel)
2. [Use The General Channel](#use-the-general-channel)
3. [Start A Direct Message](#start-a-direct-message)
4. [Read Reply And React To Messages](#read-reply-and-react-to-messages)
5. [Manage Unread Messages](#manage-unread-messages)
6. [Common Issues](#common-issues)
7. [Related Guides](#related-guides)

---

## Open The Chat Panel

VBase chat starts from a floating chat button.

To open it:

1. Look for the floating chat button in the workspace.
2. Select it to open the chat bubbles.
3. Select it again to collapse the bubbles.

The chat button is draggable, so you can move it to the left or right side of the screen.

When chat is closed:

1. The button shows the chat icon.
2. A red unread badge may appear if you have unread messages.

When chat is open:

1. The button changes to an `X`.
2. Chat bubbles appear above it.

![Chat floating action button in the closed state with unread count.](../media/screenshots/chat-01-chat-fab-closed.png)
Caption: The floating chat button gives you access to workspace chat from anywhere in the workspace.

![Chat bubbles open showing General and New Message.](../media/screenshots/chat-02-chat-bubbles-open.png)
Caption: Opening the chat button reveals the general channel and the New Message action.

Placeholder media to capture during docs QA.

---

## Use The General Channel

The `General` channel is the workspace-wide chat space.

To use it:

1. Open the chat panel.
2. Select `General`.
3. Read the conversation history.
4. Type your message in the `Type a message...` field.
5. Send the message.

The `General` chat bubble stays available and cannot be closed like direct-message bubbles.

![General chat window showing the message area and input.](../media/screenshots/chat-03-general-chat-window.png)
Caption: The General channel is the shared conversation space for the whole workspace.

![Opening the General chat from the floating chat system.](../media/gifs/chat-flow-01-open-general-chat.gif)
Caption: Open the chat panel and jump into the general channel in a few clicks.

Placeholder media to capture during docs QA.

---

## Start A Direct Message

To start a direct message:

1. Open the chat panel.
2. Select `New Message`.
3. In the `New Direct Message` modal, use `Search members...` to find a teammate.
4. Select the teammate from the results.
5. The direct-message bubble opens automatically.

The direct-message modal also includes:

1. A member search field.
2. A `Cancel` button.
3. An empty state message if no match appears.

![New Direct Message modal showing the member search field.](../media/screenshots/chat-04-new-direct-message-modal.png)
Caption: Use the direct-message modal to search workspace members and start a private conversation.

![Direct message member search results in the New Direct Message modal.](../media/screenshots/chat-05-dm-search-results.png)
Caption: Select a teammate from the search results to open or reuse a direct message.

![Starting a direct message from the chat panel.](../media/gifs/chat-flow-02-start-direct-message.gif)
Caption: Open New Message, search for a teammate, and start a direct conversation.

Placeholder media to capture during docs QA.

---

## Read Reply And React To Messages

Inside a chat window:

1. Messages from other people show the author name above the message.
2. Your own messages appear on the opposite side of the conversation.
3. Use `Type a message...` to write a reply.

Visible reactions in the current chat UI:

1. `like` shown as 👍
2. `haha` shown as 😂

To react to a message:

1. Open the chat window.
2. Find the message.
3. Select the reaction button you want.

In the current UI, only these two reactions are visible. Do not expect any other reaction types in the chat guide.

![Chat message area showing reaction buttons and unread badge behavior.](../media/screenshots/chat-06-message-reactions-and-unread.png)
Caption: Messages support quick reactions and show unread indicators where needed.

Placeholder media to capture during docs QA.

---

## Manage Unread Messages

Unread behavior appears in several places:

1. The floating chat button can show a total unread badge.
2. Individual chat bubbles can show unread counts.
3. If a new message arrives while chat is collapsed, VBase can show a preview popup.
4. Opening a chat window marks that channel as read.

Direct-message bubbles can be closed by hovering and selecting the `X`.

Important difference:

1. `General` stays available and cannot be removed.
2. Direct-message bubbles can be closed and reopened later when needed.

---

## Common Issues

### I cannot find the person I want to message

Open `New Message` and search again with the teammate name or account identifier.

### The search says No members found

That usually means the person is not in the current workspace or the search term does not match.

### Why is General still there when I close other chats

The `General` channel is the permanent workspace chat and is not removable from the chat bubble list.

### Why do I still see unread badges

Unread counts clear when the related chat window is opened and marked as read.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Create and Manage Workspaces](./02-create-and-manage-workspaces.md)
- [Invite and Join Team Members](./03-invite-and-join-team-members.md)