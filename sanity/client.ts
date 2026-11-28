import "server-only";
import { createClient } from "next-sanity";
import { env } from "@/lib/config/env";

export const client = env.NEXT_PUBLIC_SANITY_PROJECT_ID
  ? createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: "2026-11-01",
      // Next's tag cache is the CDN; apicdn can still serve the old doc when the publish webhook triggers the refetch.
      useCdn: false,
    })
  : null;
