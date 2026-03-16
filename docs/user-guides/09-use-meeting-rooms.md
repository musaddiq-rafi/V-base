# Use Meeting Rooms

This page explains how to start or join a meeting, prepare your camera and microphone, use the in-call controls, and leave or end meeting sessions.

---

## Table Of Contents

1. [Join Or Create A Meeting](#join-or-create-a-meeting)
2. [Prepare In The Lobby](#prepare-in-the-lobby)
3. [Use In-Meeting Controls](#use-in-meeting-controls)
4. [Open People And Chat Panels](#open-people-and-chat-panels)
5. [Leave Or End A Meeting Session](#leave-or-end-a-meeting-session)
6. [Common Issues](#common-issues)
7. [Related Guides](#related-guides)

---

## Join Or Create A Meeting

When you open a meeting room, the first screen is the meeting selector.

The page header shows how many sessions are active with text like `{active}/{max} meetings active`.

The current main heading is `Join or Create a Meeting`.

If there are active sessions, each meeting card shows:

1. The meeting name
2. Participant count
3. How long it has been running
4. Who started it
5. A `Join` button

If there are no active sessions, the page shows:

1. `No active meetings`
2. `Be the first to start a meeting in this room`

To create a meeting:

1. Select `Create New Meeting`.
2. Enter a `Meeting Name`.
3. Use a clear title such as the placeholder example `e.g., Code Base Updates`.
4. Confirm the creation action.

If the room has reached capacity, the button changes to `Maximum Meetings Reached`.

Meeting rooms support up to 3 simultaneous meeting sessions in the current product limits.

![Meeting selector showing active meetings and the Create New Meeting button.](../media/screenshots/meeting-01-selector-and-create-button.png)
Caption: Join an active session or create a new one from the meeting selector screen.

![Creating a new meeting from the selector screen.](../media/gifs/meeting-flow-01-create-meeting.gif)
Caption: Start a new session by opening the create dialog and entering a meeting name.

Placeholder media to capture during docs QA.

---

## Prepare In The Lobby

After selecting a meeting, you enter the lobby.

The lobby headline is `Ready to join?`

The page also explains: `Check your audio and video settings before joining the meeting.`

Use the lobby to:

1. Preview your camera
2. Toggle microphone on or off
3. Toggle camera on or off
4. Check whether your devices show `On` or `Off`

If camera permissions are blocked, the preview can show `Camera permission denied`.

When you are ready, select `Join Meeting`.

![Meeting lobby showing camera preview and device toggles.](../media/screenshots/meeting-02-lobby-preview-and-device-status.png)
Caption: Use the lobby to confirm your devices before you join the live call.

Placeholder media to capture during docs QA.

---

## Use In-Meeting Controls

Once you are inside the live meeting, the bottom control bar gives you the main call actions.

Current controls include:

1. Microphone toggle
2. Camera toggle
3. `Present now`
4. `Raise hand` or `Lower hand`
5. `More options`
6. `Leave`

Helpful tooltips in the current UI include:

1. `Turn off microphone (Ctrl+D)` or `Turn on microphone (Ctrl+D)`
2. `Turn off camera (Ctrl+E)` or `Turn on camera (Ctrl+E)`
3. `Present now` or `Stop presenting`
4. `Raise hand` or `Lower hand`
5. `More options`
6. `Leave call`

The `More options` menu currently includes:

1. `Settings`
2. `Meeting details`

Use the in-call controls for quick adjustments while staying in the meeting.

![Meeting stage showing the bottom control bar with mic, camera, present, hand, and leave actions.](../media/screenshots/meeting-03-in-call-controls.png)
Caption: The bottom call bar is the main place to manage your devices and live meeting actions.

Placeholder media to capture during docs QA.

---

## Open People And Chat Panels

The live meeting header includes access to side panels.

Use it to open:

1. `People`
2. `In-call messages`

The chat button can show an unread badge when new messages arrive while the panel is closed.

Use the `People` panel to review who is in the meeting and see raised-hand activity.

Use the `In-call messages` panel to read and send meeting chat without leaving the call layout.

![Meeting stage showing the People and In-call messages side panels.](../media/screenshots/meeting-04-people-and-chat-panels.png)
Caption: Open the side panel when you need the participant list or in-call chat.

![Using in-call chat during a meeting.](../media/gifs/meeting-flow-02-open-chat-and-people.gif)
Caption: Open the side panel to switch between participant details and in-call messages.

Placeholder media to capture during docs QA.

---

## Leave Or End A Meeting Session

Use `Leave` in the bottom bar when you want to exit the current call.

After leaving, the current interface shows:

1. `You left the meeting`
2. `Join Another Meeting`
3. `Back to Workspace`

Some meeting cards on the selector screen also show an end button for the meeting creator or for abandoned meetings. That action permanently closes the active session and should be used carefully.

![Meeting end state showing Join Another Meeting and Back to Workspace.](../media/screenshots/meeting-05-left-meeting-state.png)
Caption: After leaving, you can either return to the selector or go back to the workspace.

Placeholder media to capture during docs QA.

---

## Common Issues

### I cannot create another meeting

The room may already be at the simultaneous session limit. Join an existing meeting or wait for one to end.

### My camera preview is blank in the lobby

Check whether your camera is toggled on and whether the browser blocked camera permission.

### I missed messages while focusing on the call

Look for the unread badge on the chat button, then open `In-call messages`.

### I left the wrong meeting

Use `Join Another Meeting` from the leave screen to return to the selector quickly.

---

## Related Guides

- [VBase User Guide](./README.md)
- [Create and Open Rooms](./04-create-and-open-rooms.md)
- [Use Workspace Chat](./05-use-workspace-chat.md)
