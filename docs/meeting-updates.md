# Weekly Meeting Summary

### 12 Dec 2025

#### Suggestions:

- **Figma UI Mockup:**
  - User Dashboard: No need to keep "Sign out" button separate, use a 'Use Profile' dropdown component with all the profile related options
  - Workspace dashboard: move the workspace information summary section at top (above the rooms)
  - Workspace dashboard: may show a count of the rooms, count/list of joined members
  - Coding room dashboard: allow users to group code files into folders
  - Meeting room: allow to create multiple meetings, lets keep it to max: 3 [due to cloud free tier limitations] (keep this multiple meeting feature for later, for now, just one)
  - keep a separate chatbox for each room (already done)

<br>

- **Code Implementation:**
  - the 1st mvp looks good so far
  - gradually start making the room structures, each one of you work on separate room features
  - progressively build the rooms without overwhelming with too many features, first, just make it work with the base features as planned

<br>

- **Previous week's member contributions:**
  - **220042148**:
    - created the base figma mockup
    - implemented the workspace group chat feature
    - Direct chat box with workspace members with live notifications
  - **220042162**:
    - synchronization between auth provider and cloud backend to ensure data consistency
    - implemented 'create workspace' feature with member management options
    - member invititation system through email
  - **220042135**:
    - designed the overall UI flow of the app
    - improved the landing page
    - redesigned page components for a modern, clean look
