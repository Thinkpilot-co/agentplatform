"use client";

import { useEffect, useRef } from "react";
import type { PlatformEvent } from "@/core/types";

export function useEvents(onEvent: (event: PlatformEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    const handler = (e: MessageEvent) => {
      try {
        const event = JSON.parse(e.data) as PlatformEvent;
        onEventRef.current(event);
      } catch {
        // Ignore parse errors
      }
    };

    const eventTypes = [
      "instance:connected",
      "instance:disconnected",
      "instance:error",
      "instance:health",
      "instance:added",
      "instance:removed",
      "docker:container:discovered",
      "docker:container:started",
      "docker:container:stopped",
    ];

    for (const type of eventTypes) {
      eventSource.addEventListener(type, handler);
    }

    return () => {
      eventSource.close();
    };
  }, []);
}
