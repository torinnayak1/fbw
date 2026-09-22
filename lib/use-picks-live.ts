"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "./supabase-browser";

export function usePicksLive(enabled: boolean, onChange: () => void) {
  useEffect(() => {
    if (!enabled) return;

    const client = supabaseBrowser();
    if (!client) {
      const poll = window.setInterval(onChange, 8000);
      return () => window.clearInterval(poll);
    }

    const channel = client
      .channel("picks-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "picks" },
        () => {
          onChange();
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          onChange();
        }
      });

    const poll = window.setInterval(onChange, 20000);
    return () => {
      window.clearInterval(poll);
      void client.removeChannel(channel);
    };
  }, [enabled, onChange]);
}
