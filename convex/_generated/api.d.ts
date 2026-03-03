/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agents from "../agents.js";
import type * as analytics from "../analytics.js";
import type * as chat from "../chat.js";
import type * as cronJobs from "../cronJobs.js";
import type * as deliverables from "../deliverables.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as leads from "../leads.js";
import type * as projects from "../projects.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agents: typeof agents;
  analytics: typeof analytics;
  chat: typeof chat;
  cronJobs: typeof cronJobs;
  deliverables: typeof deliverables;
  events: typeof events;
  http: typeof http;
  leads: typeof leads;
  projects: typeof projects;
  seed: typeof seed;
  tasks: typeof tasks;
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
