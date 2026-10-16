import { useLocation } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

const PHONE = "919225311998";
const MESSAGE = "Hi! I visited TheProjectWork website and need help with a software project. Please share the details.";
export const WHATSAPP_URL = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;
const SEEN_KEY = "tpw-wa-bubble-seen";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="currentColor">
      <path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.11.56 4.17 1.62 5.99L4 29l8.27-1.6a12.1 12.1 0 0 0 3.77.6C22.68 28 28 22.64 28 16.03 28 9.4 22.68 3 16.04 3Zm0 22.9c-1.2 0-2.38-.2-3.5-.6l-.5-.18-4.9.95.98-4.75-.2-.5a9.9 9.9 0 0 1-1.5-5.25c0-5.46 4.48-9.9 9.62-9.9 5.6 0 9.86 4.54 9.86 9.9 0 5.46-4.42 10.33-9.86 10.33Zm5.4-7.4c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.6-.92-2.2-.24-.57-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.38-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.48.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.09 1.75-.72 2-1.4.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

export function WhatsAppButton() {
  const { pathname } = useLocation();
  const [bubble, setBubble] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SEEN_KEY)) return;
    const t = window.setTimeout(() => setBubble(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  const dismiss = () => {
    setBubble(false);
    sessionStorage.setItem(SEEN_KEY, "1");
  };

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="wa-root fixed right-5 z-50 flex flex-col items-end gap-2" style={{ bottom: "calc(5.75rem + env(safe-area-inset-bottom))", right: "calc(1.25rem + env(safe-area-inset-right))" }}>
      {bubble && (
        <div className="wa-bubble absolute bottom-1 right-[4.5rem] w-max max-w-[13rem] rounded-2xl border border-border bg-card py-2.5 pl-3.5 pr-8 text-sm font-medium text-card-foreground shadow-card" role="status">
          Need help with your project? 💬
          <button type="button" onClick={dismiss} aria-label="Dismiss message" className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-accent">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp (opens in a new tab)"
        onClick={dismiss}
        className="wa-btn group relative grid h-14 w-14 place-items-center rounded-full"
      >
        <span className="wa-ring absolute inset-0 rounded-full" aria-hidden="true" />
        <WhatsAppIcon className="relative h-7 w-7" />
        <span className="wa-tip pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-card">
          Chat with us on WhatsApp
        </span>
      </a>
    </div>
  );
}
