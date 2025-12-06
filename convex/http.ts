import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      // Call the action located in clerk.ts
      const result = await ctx.runAction(internal.clerk.fulfill, {
        payload: payloadString,
        headers: {
          svixId: headerPayload.get("svix-id")!,
          svixTimestamp: headerPayload.get("svix-timestamp")!,
          svixSignature: headerPayload.get("svix-signature")!,
        },
      });

      switch (result.type) {
        case "user.created":
        case "user.updated":
          await ctx.runMutation(internal.users.upsertUser, {
            clerkId: result.data.id,
            name: `${result.data.first_name || ""} ${result.data.last_name || ""}`.trim(),
            email: result.data.email_addresses[0]?.email_address || "",
          });
          break;

        case "user.deleted":
          await ctx.runMutation(internal.users.deleteUser, {
            clerkId: result.data.id,
          });
          break;

        case "organization.created":
        case "organization.updated":
          await ctx.runMutation(
            internal.workspaces.upsertWorkspaceFromWebhook,
            {
              clerkOrgId: result.data.id,
              name: result.data.name,
              ownerId: result.data.created_by,
            }
          );
          break;

        case "organization.deleted":
          await ctx.runMutation(
            internal.workspaces.deleteWorkspaceFromWebhook,
            {
              clerkOrgId: result.data.id,
            }
          );
          break;
      }

      return new Response(null, { status: 200 });
    } catch (err) {
      console.error(err);
      return new Response("Webhook Error", { status: 400 });
    }
  }),
});

export default http;
