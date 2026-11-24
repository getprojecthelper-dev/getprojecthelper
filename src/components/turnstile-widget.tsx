import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { getTurnstileSiteKey } from "@/lib/turnstile.functions";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
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
export function TurnstileWidget({ action, onToken, resetKey = 0 }: { action: "login" | "signup" | "contact" | "issue" | "grievance"; onToken: (token: string | null) => void; resetKey?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | undefined>(undefined);
  const [widgetError, setWidgetError] = useState(false);
  const cb = useRef(onToken);
  cb.current = onToken;
  const { data, isError } = useQuery({ queryKey: ["turnstile-site-key"], queryFn: () => getTurnstileSiteKey(), staleTime: Infinity });
  const siteKey = data?.siteKey;

  useEffect(() => {
    if (!siteKey || !ref.current) return;
    let id: string | undefined;
    let cancelled = false;
    cb.current(null);
    setWidgetError(false);
    void loadScript().then(() => {
      if (cancelled || !ref.current || !window.turnstile) return;
      id = window.turnstile.render(ref.current, {
        sitekey: siteKey,
        action,
        size: "flexible",
        theme: "light",
        callback: (t: string) => { setWidgetError(false); cb.current(t); },
        "expired-callback": () => cb.current(null),
        "timeout-callback": () => cb.current(null),
        "error-callback": () => { setWidgetError(true); cb.current(null); },
      });
      widgetId.current = id;
    }).catch(() => { if (!cancelled) { setWidgetError(true); cb.current(null); } });
    return () => { cancelled = true; if (id !== undefined) window.turnstile?.remove(id); widgetId.current = undefined; };
  }, [siteKey, action]);

  useEffect(() => {
    cb.current(null);
    setWidgetError(false);
    if (widgetId.current !== undefined) window.turnstile?.reset(widgetId.current);
  }, [resetKey]);

  return <div>
    <div ref={ref} className="min-h-[65px] w-full" />
    {(isError || data?.siteKey === "" || widgetError) && <p role="alert" className="mt-2 text-sm text-muted-foreground">Human verification could not load. Please refresh and try again.</p>}
  </div>;
}
