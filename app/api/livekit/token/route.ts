import { NextRequest, NextResponse } from "next/server";
import { AccessToken, VideoGrant } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantName, participantIdentity } =
      await request.json();

    // Validate required fields
    if (!roomName || !participantName || !participantIdentity) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: roomName, participantName, participantIdentity",
        },
        { status: 400 }
      );
    }

    // Get LiveKit credentials from environment
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("LiveKit API key or secret not configured");
      return NextResponse.json(
        { error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      // Token expires in 1 hour
      ttl: "1h",
    });

    // Add video grant for room permissions
    const videoGrant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canUpdateOwnMetadata: true,
    };

    at.addGrant(videoGrant);

    // Generate JWT token
    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}

// Also support GET for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const roomName = searchParams.get("roomName");
  const participantName = searchParams.get("participantName");
  const participantIdentity = searchParams.get("participantIdentity");

  if (!roomName || !participantName || !participantIdentity) {
    return NextResponse.json(
      {
        error:
          "Missing required query params: roomName, participantName, participantIdentity",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured" },
      { status: 500 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    name: participantName,
    ttl: "1h",
  });

  const videoGrant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
    canUpdateOwnMetadata: true,
  };

  at.addGrant(videoGrant);

  const token = await at.toJwt();

  return NextResponse.json({ token });
}
