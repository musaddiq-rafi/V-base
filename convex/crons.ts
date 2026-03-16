import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Clean up orphaned presence records every 5 minutes.
 * Handles the edge case where a user's browser crashes or loses
 * connectivity without firing beforeunload / visibilitychange.
 */
crons.interval(
  "cleanup stale presence",
  { minutes: 5 },
  internal.userPresence.cleanupStalePresence,
);

export default crons;
