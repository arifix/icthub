import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Lightbulb, MessageCircle, MessageSquareText, Send, ShieldCheck, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { errorMessage, supabase } from "../lib/supabase";
import { timeAgo } from "../lib/format";
import { readJSON, writeJSON } from "../lib/storage";
import type { ChatMessageKind, Tables } from "../types/supabase";
import { Spinner } from "./ui";

type ChatMessage = Tables<"chat_messages">;

const MESSAGE_LIMIT = 100;
const MAX_LENGTH = 1000;
// Read state is per device, like notifications.
const LAST_READ_KEY = "icthub_chat_last_read";
// Set the first time the chat is closed; until then it opens by itself.
const DISMISSED_KEY = "icthub_chat_dismissed";

const KINDS: { value: ChatMessageKind; label: string; icon: LucideIcon }[] = [
  { value: "message", label: "Message", icon: MessageCircle },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "feedback", label: "Feedback", icon: MessageSquareText },
];

const ChatWidget: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(() => !readJSON(DISMISSED_KEY, false));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<ChatMessageKind>("message");
  const [sending, setSending] = useState(false);
  const [lastReadId, setLastReadId] = useState<number>(() => readJSON(LAST_READ_KEY, 0));

  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Follow new messages unless the reader has scrolled up to older ones.
  const followLatest = useRef(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .order("id", { ascending: false })
      .limit(MESSAGE_LIMIT);
    setLoadFailed(!!error);
    if (!error) setMessages((data ?? []).reverse());
    setLoading(false);
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    // The sender gets their own message twice: from the insert and from realtime.
    setMessages((current) =>
      current.some((m) => m.id === message.id)
        ? current
        : [...current, message].sort((a, b) => a.id - b.id).slice(-MESSAGE_LIMIT),
    );
  }, []);

  useEffect(() => {
    void load();
    const channel = supabase
      .channel("chat_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) =>
        addMessage(payload.new as ChatMessage),
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "chat_messages" }, (payload) => {
        const { id } = payload.old as Pick<ChatMessage, "id">;
        setMessages((current) => current.filter((m) => m.id !== id));
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, addMessage]);

  const openChat = () => {
    followLatest.current = true;
    setOpen(true);
    // Catches anything missed while realtime was disconnected.
    void load();
  };

  const closeChat = () => {
    writeJSON(DISMISSED_KEY, true);
    setOpen(false);
    launcherRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Phones: don't pop up the keyboard over the conversation.
    const target = window.matchMedia("(min-width: 640px)").matches ? inputRef.current : panelRef.current;
    target?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open && followLatest.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  const newestId = messages[messages.length - 1]?.id ?? 0;

  useEffect(() => {
    if (open && newestId > lastReadId) {
      setLastReadId(newestId);
      writeJSON(LAST_READ_KEY, newestId);
    }
  }, [open, newestId, lastReadId]);

  const unreadCount = open ? 0 : messages.filter((m) => m.id > lastReadId && m.user_id !== user?.id).length;

  const send = async () => {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    const { data, error } = await supabase.from("chat_messages").insert({ content, kind }).select().single();
    setSending(false);
    if (error) {
      toast.error(errorMessage(error, "Couldn't send your message. Please try again."));
      return;
    }
    followLatest.current = true;
    addMessage(data);
    setDraft("");
    setKind("message");
    inputRef.current?.focus();
  };

  const remove = async (message: ChatMessage) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    const { error } = await supabase.from("chat_messages").delete().eq("id", message.id);
    if (error) {
      toast.error(errorMessage(error, "Couldn't delete the message."));
      return;
    }
    setMessages((current) => current.filter((m) => m.id !== message.id));
  };

  const onPanelKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      closeChat();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    // Keep keyboard focus inside the modal.
    const focusable = panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), textarea");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={openChat}
        aria-label={unreadCount ? `Open student chat, ${unreadCount} unread` : "Open student chat"}
        title="Student chat"
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-fg shadow-lift transition hover:bg-accent-hover"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-end justify-end bg-slate-950/40 backdrop-blur-sm animate-fade-in print:hidden sm:p-5"
            onMouseDown={(e) => e.target === e.currentTarget && closeChat()}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="chat-title"
              tabIndex={-1}
              onKeyDown={onPanelKeyDown}
              className="flex h-dvh w-full flex-col overflow-hidden bg-surface shadow-pop animate-rise-in focus:outline-none sm:h-[min(680px,calc(100dvh-2.5rem))] sm:max-w-md sm:rounded-2xl sm:border sm:border-line"
            >
              <div className="flex items-start gap-3 border-b border-line px-4 py-3">
                <div className="min-w-0 flex-1">
                  <h2 id="chat-title" className="text-base font-bold text-ink">
                    Student Chat
                  </h2>
                  <p className="text-xs text-ink-subtle">Everyone in the portal can see what you post here.</p>
                </div>
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Close chat"
                  className="rounded-lg p-1.5 text-ink-subtle transition hover:bg-surface-2 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div
                ref={listRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                }}
                className="flex-1 overflow-y-auto overscroll-contain bg-canvas px-4 py-4"
              >
                {loading ? (
                  <div className="grid h-full place-items-center">
                    <Spinner />
                  </div>
                ) : loadFailed && messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <div>
                      <p className="text-sm text-ink-subtle">The chat couldn't be loaded.</p>
                      <button
                        type="button"
                        onClick={() => void load()}
                        className="mt-2 text-sm font-semibold text-accent-ink hover:underline"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center">
                    <p className="max-w-[16rem] text-sm text-ink-subtle">
                      No messages yet. Say hello, or share a suggestion for the portal.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-4" aria-live="polite">
                    {messages.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        own={!!user && message.user_id === user.id}
                        canDelete={isAdmin || (!!user && message.user_id === user.id)}
                        onDelete={() => void remove(message)}
                      />
                    ))}
                  </ul>
                )}
              </div>

              <form
                className="border-t border-line px-4 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <div role="radiogroup" aria-label="Message type" className="mb-2 flex flex-wrap gap-1.5">
                  {KINDS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={kind === value}
                      onClick={() => setKind(value)}
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        kind === value
                          ? "border-accent bg-accent-soft text-accent-ink"
                          : "border-line text-ink-subtle hover:text-ink"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    maxLength={MAX_LENGTH}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      // isComposing: Enter confirms a word in IME keyboards, it must not send.
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    placeholder={
                      kind === "suggestion"
                        ? "Share a suggestion…"
                        : kind === "feedback"
                          ? "Share your feedback…"
                          : "Write a message…"
                    }
                    aria-label="Your message"
                    className="min-w-0 flex-1 resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:border-accent focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    aria-label="Send message"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg transition hover:bg-accent-hover disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {draft.length > MAX_LENGTH - 100 && (
                  <p className="mt-1 text-right text-xs text-ink-subtle">
                    {draft.length} / {MAX_LENGTH}
                  </p>
                )}
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

const MessageItem: React.FC<{
  message: ChatMessage;
  own: boolean;
  canDelete: boolean;
  onDelete: () => void;
}> = ({ message, own, canDelete, onDelete }) => {
  const kind = message.kind === "message" ? null : KINDS.find((k) => k.value === message.kind);
  const fromAdmin = message.author_role === "admin";

  return (
    <li className={`flex items-start gap-2 ${own ? "flex-row-reverse" : ""}`}>
      {!own && (
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
            fromAdmin ? "bg-accent text-accent-fg" : "bg-surface-3 text-ink-muted"
          }`}
        >
          {fromAdmin ? <ShieldCheck className="h-4 w-4" /> : message.author_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className={`flex min-w-0 max-w-[80%] flex-col ${own ? "items-end" : "items-start"}`}>
        <div className={`mb-1 flex flex-wrap items-center gap-x-1.5 text-xs ${own ? "justify-end" : ""}`}>
          <span className="font-semibold text-ink">{own ? "You" : message.author_name}</span>
          {fromAdmin && !own && (
            <span className="rounded bg-accent px-1 py-px text-[10px] font-semibold uppercase tracking-wide text-accent-fg">
              Admin
            </span>
          )}
          <time className="text-ink-subtle" dateTime={message.created_at} title={new Date(message.created_at).toLocaleString()}>
            {timeAgo(message.created_at)}
          </time>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={own ? "Delete your message" : `Delete message by ${message.author_name}`}
              className="rounded p-0.5 text-ink-subtle transition hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <div
          className={`rounded-2xl px-3 py-2 text-sm ${
            own ? "rounded-tr-sm bg-accent text-accent-fg" : "rounded-tl-sm border border-line bg-surface text-ink"
          }`}
        >
          {kind && (
            <span className={`mb-1 flex items-center gap-1 text-[11px] font-semibold ${own ? "opacity-90" : "text-accent-ink"}`}>
              <kind.icon className="h-3 w-3" />
              {kind.label}
            </span>
          )}
          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>
        </div>
      </div>
    </li>
  );
};

export default ChatWidget;
