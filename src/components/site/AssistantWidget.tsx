import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowDownRight, Bot, Loader2, MessageCircleQuestion, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const WELCOME =
  "Hi! I'm your TheProjectWork AI Assistant. I can help you explore software projects, understand technologies, compare project options, check what's included and solve common project-related doubts. What would you like to know?";

const SUGGESTIONS = [
  "Which projects are available under ₹5,000?",
  "Recommend a project for Computer Engineering.",
  "Which projects use Python and machine learning?",
  "Does this project include source code and PPT?",
  "How can I install this project?",
  "Is a live demo available?",
  "Can you explain this project's main features?",
  "How do I purchase a project?",
];

const MAX = 1000;
const INVITE_SEEN = "tpw-ai-invite-seen";
const INVITE_DISMISSED = "tpw-ai-invite-dismissed";

export function AssistantWidget() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy, error]);
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, busy]);

  const [invite, setInvite] = useState(false);
  const [hover, setHover] = useState(false);
  const [inviteDismissed, setInviteDismissed] = useState(true);

  useEffect(() => {
    // Read session storage after hydration only.
    setInviteDismissed(sessionStorage.getItem(INVITE_DISMISSED) === "1");
    if (pathname !== "/" || sessionStorage.getItem(INVITE_SEEN) === "1") return;
    const show = window.setTimeout(() => {
      sessionStorage.setItem(INVITE_SEEN, "1");
      setInvite(true);
    }, 2000);
    const hide = window.setTimeout(() => setInvite(false), 9000);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [pathname]);

  function dismissInvite() {
    sessionStorage.setItem(INVITE_DISMISSED, "1");
    setInviteDismissed(true);
    setInvite(false);
  }

  if (pathname.startsWith("/admin")) return null;
  const slugMatch = pathname.match(/^\/projects\/([a-z0-9-]+)$/);

  async function send(history: Msg[]) {
    setBusy(true);
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/public/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, currentSlug: slugMatch?.[1] }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? "The assistant couldn't answer right now.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let text = "";
      setMessages([...history, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: text }]);
      }
      if (!text.trim()) {
        setMessages(history);
        throw new Error("The assistant didn't return an answer. Please try again.");
      }
    } catch (e) {
      if (ctrl.signal.aborted) return;
      setMessages(history);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function submit(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    if (t.length > MAX) return setError(`Please keep your message under ${MAX} characters.`);
    const next = [...messages, { role: "user" as const, content: t }];
    setMessages(next);
    setInput("");
    void send(next);
  }

  const bubbleVisible = !open && !inviteDismissed && (invite || hover);

  return (
    <>
      {bubbleVisible && (
        <div className="fixed bottom-[5.5rem] right-5 z-50 flex max-w-[16rem] flex-col items-end" role="status">
          <div className="ai-pop-in relative rounded-2xl rounded-br-sm border border-border bg-card py-2.5 pl-3.5 pr-8 text-sm font-medium text-foreground shadow-card">
            {hover && !invite ? "Ask your doubt!" : "Hey! 👋 Have a project doubt? Ask me anything!"}
            <button
              type="button"
              onClick={dismissInvite}
              aria-label="Dismiss invitation"
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {invite && <ArrowDownRight aria-hidden className="ai-nudge mr-6 mt-1 h-5 w-5 text-muted-foreground" />}
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={() => { setOpen(true); setInvite(false); }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onFocus={() => setHover(true)}
          onBlur={() => setHover(false)}
          aria-label="Open TheProjectWork AI Assistant"
          className="ai-pulse fixed bottom-5 right-5 z-50 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-card transition-transform duration-200 hover:!scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span aria-hidden className="ai-ring pointer-events-none absolute inset-0 rounded-full border-2 border-primary" />
          <MessageCircleQuestion className="h-5 w-5" /> <span className="hidden sm:inline">Ask AI</span>
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label="TheProjectWork AI Assistant"
          className="ai-slide-up fixed inset-x-2 bottom-2 z-50 flex h-[min(620px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-[400px]"
        >
          <header className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground"><Bot className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">TheProjectWork AI Assistant</p>
              <p className="text-xs text-muted-foreground">AI-powered · answers may need checking</p>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="icon" aria-label="Start a new conversation" onClick={() => { abortRef.current?.abort(); setMessages([]); setError(null); }}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" aria-label="Close assistant" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4" aria-live="polite">
            <div className="text-sm"><Markdown text={WELCOME} /></div>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => submit(s)} className="rounded-full border border-border px-3 py-1.5 text-left text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">{m.content}</div>
              ) : (
                <div key={i} className="text-sm"><Markdown text={m.content} onNavigate={() => setOpen(window.innerWidth >= 640)} /></div>
              ),
            )}
            {busy && messages[messages.length - 1]?.role === "user" && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking project details…</p>
            )}
            {error && (
              <div className="rounded-xl border border-destructive/40 p-3 text-sm">
                <p className="text-destructive">{error}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => send(messages)} disabled={busy || messages[messages.length - 1]?.role !== "user"}>Retry</Button>
                  <Button size="sm" variant="ghost" asChild><Link to="/contact">Contact support</Link></Button>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); submit(input); }}>
            <div className="flex items-end gap-2">
              <label htmlFor="assistant-input" className="sr-only">Your question</label>
              <textarea
                id="assistant-input"
                ref={inputRef}
                value={input}
                maxLength={MAX}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
                placeholder="Ask about a project…"
                className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" size="icon" className="h-10 w-10 shrink-0 rounded-full" disabled={busy || !input.trim()} aria-label="Send">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              AI assistant. Don't share passwords or payment details. Chats aren't saved and clear when you refresh or leave the site. <Link to="/privacy" className="underline">Privacy</Link>
            </p>
          </form>
        </section>
      )}
    </>
  );
}

function Markdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const navigate = useNavigate();
  return (
    <div className={cn("space-y-2 break-words [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1")}>
      <ReactMarkdown
        components={{
          a: ({ href, children }) =>
            href?.startsWith("/") ? (
              <a href={href} onClick={(e) => { e.preventDefault(); onNavigate?.(); void navigate({ href }); }} className="font-medium text-primary underline underline-offset-2">{children}</a>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-primary underline underline-offset-2">{children}</a>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
