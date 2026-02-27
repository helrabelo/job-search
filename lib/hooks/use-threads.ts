"use client";

import { useEffect, useState } from "react";
import { useData } from "@/components/data-provider";
import type { Thread } from "@/lib/types";

export function useThreads() {
  const { refreshKey } = useData();
  const [threads, setThreads] = useState<(Thread & { post_count: number })[]>([]);

  useEffect(() => {
    fetch("/api/threads")
      .then((r) => r.json())
      .then(setThreads)
      .catch(console.error);
  }, [refreshKey]);

  return threads;
}
