/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as channels from "../channels.js";
import type * as clerk from "../clerk.js";
import type * as codeFiles from "../codeFiles.js";
import type * as documents from "../documents.js";
import type * as http from "../http.js";
import type * as meetings from "../meetings.js";
import type * as messages from "../messages.js";
import type * as rooms from "../rooms.js";
import type * as spreadsheets from "../spreadsheets.js";
import type * as users from "../users.js";
import type * as whiteboards from "../whiteboards.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  channels: typeof channels;
  clerk: typeof clerk;
  codeFiles: typeof codeFiles;
  documents: typeof documents;
  http: typeof http;
  meetings: typeof meetings;
  messages: typeof messages;
  rooms: typeof rooms;
  spreadsheets: typeof spreadsheets;
  users: typeof users;
  whiteboards: typeof whiteboards;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
