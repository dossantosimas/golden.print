"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin requests: never expose the server instance or its database adapter.
export const authClient = createAuthClient();
