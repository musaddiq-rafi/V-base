import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const CURSOR_COLOR_HUES = [0, 25, 45, 140, 185, 215, 265, 310] as const;

function hashStringToIndex(value: string, length: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

function getCursorColorForUserId(userId: string): string {
  const index = hashStringToIndex(userId, CURSOR_COLOR_HUES.length);
  const hue = CURSOR_COLOR_HUES[index];
  // CSS color string used by the collaboration caret extension
  return `hsl(${hue} 85% 45%)`;
}

// Guard: ensure env is configured, surface clear error in dev
const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;


const liveblocks = new Liveblocks({
  secret: secretKey!,
});

export async function POST(request: Request) {
  
  // Get the current Clerk user
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the room from the request body
  const { room } = await request.json();
  
  

  // Create a Liveblocks session for the user
  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.emailAddresses[0]?.emailAddress || "Anonymous",
      email: user.emailAddresses[0]?.emailAddress || "",
      avatar: user.imageUrl || "",
      color: getCursorColorForUserId(user.id),
    },
  });

  // Give the user access to the requested room
  // Room access patterns:
  // - workspace:{orgId} - Workspace presence room
  // - workspace:{orgId}:room:{roomId} - Specific room within workspace
  if (room) {
    session.allow(room, session.FULL_ACCESS);
  }

  // Authorize and return the token
  const { status, body } = await session.authorize();
  
  
  return new NextResponse(body, { status });
}
