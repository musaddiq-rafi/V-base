import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
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
