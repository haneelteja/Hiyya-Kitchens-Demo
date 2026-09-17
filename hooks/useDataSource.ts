"use client";

import { useMemo } from "react";
import { MockDataSource } from "@/lib/data/mock/MockDataSource";
import type { DataSource } from "@/lib/data/DataSource";

/**
 * The one place a component asks for a DataSource. Swapping MockDataSource for
 * SupabaseDataSource in Stage B happens here and nowhere else — every component
 * using this hook keeps working unchanged.
 */
export function useDataSource(): DataSource {
  return useMemo(() => new MockDataSource(), []);
}
