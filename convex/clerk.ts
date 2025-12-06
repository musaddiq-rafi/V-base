"use node"; // This ensures it runs in a Node.js environment (required for svix)

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Webhook } from "svix";

export const fulfill = internalAction({
  args: {
    payload: v.string(),
    headers: v.object({
      svixId: v.string(),
      svixTimestamp: v.string(),
      svixSignature: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!CLERK_WEBHOOK_SECRET) {
      throw new Error("CLERK_WEBHOOK_SECRET is not defined");
    }

    const wh = new Webhook(CLERK_WEBHOOK_SECRET);

    const payload = wh.verify(args.payload, {
      "svix-id": args.headers.svixId,
      "svix-timestamp": args.headers.svixTimestamp,
      "svix-signature": args.headers.svixSignature,
    }) as any;

    return payload;
  },
});
