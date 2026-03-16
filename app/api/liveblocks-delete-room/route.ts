import { Liveblocks } from "@liveblocks/node";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * Delete one or more Liveblocks rooms
 * POST /api/liveblocks-delete-room
 * Body: { roomIds: string[] }
 */
export async function POST(request: Request) {
  try {
    console.log("Liveblocks delete room API called");

    // Verify the user is authenticated
    const user = await currentUser();
    if (!user) {
      console.log("Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomIds } = await request.json();
    console.log("Room IDs to delete:", roomIds);

    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      console.log("Invalid roomIds:", roomIds);
      return NextResponse.json(
        { error: "roomIds array is required" },
        { status: 400 }
      );
    }

    // Delete all specified rooms
    const results = await Promise.allSettled(
      roomIds.map(async (roomId: string) => {
        try {
          console.log("Attempting to delete room:", roomId);
          await liveblocks.deleteRoom(roomId);
          console.log("Successfully deleted room:", roomId);
          return { roomId, success: true };
        } catch (error: any) {
          console.log(
            "Error deleting room:",
            roomId,
            error?.message,
            error?.status
          );
          // Ignore 404 errors (room doesn't exist)
          if (error?.status === 404) {
            return { roomId, success: true, note: "Room did not exist" };
          }
          throw error;
        }
      })
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failedCount = results.filter((r) => r.status === "rejected").length;

    console.log("Delete results:", { successCount, failedCount, results });

    return NextResponse.json({
      success: true,
      deleted: successCount,
      failed: failedCount,
      results,
    });
  } catch (error: any) {
    console.error("Error deleting Liveblocks rooms:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete rooms" },
      { status: 500 }
    );
  }
}
