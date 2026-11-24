import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromise: Promise<void> | null = null;
function loadScript() {
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromise = null; reject(new Error("Turnstile failed to load")); };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Renders the Cloudflare check. Change `resetKey` to get a fresh token after each submit. */
export function TurnstileWidget({ onToken, resetKey = 0 }: { onToken: (token: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const { data } = useQuery({ queryKey: ["turnstile-site-key"], queryFn: () => getTurnstileSiteKey(), staleTime: Infinity });
  const siteKey = data?.siteKey;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let id: string | undefined;
    let cancelled = false;
    cb.current(null);
    void loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      id = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (t: string) => cb.current(t),
        "expired-callback": () => cb.current(null),
        "error-callback": () => cb.current(null),
      });
    });
    return () => { cancelled = true; if (id) window.turnstile?.remove(id); };
  }, [siteKey, resetKey]);

  return <div ref={ref} className="min-h-[65px]" />;
}
