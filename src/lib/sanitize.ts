import DOMPurify from "dompurify";

// Every external link opens safely in a new tab.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("href")) {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer nofollow");
  }
});

const CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "iframe", "object", "embed"],
  FORBID_ATTR: ["style", "srcset"],
  ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i,
};

/** Sanitizes rich-text HTML coming from the editor before it is rendered or stored. */
export const sanitizeHtml = (html: string | null | undefined): string =>
  html ? DOMPurify.sanitize(html, CONFIG) : "";

/** Plain text from HTML, without ever attaching the HTML to the live document. */
export const htmlToText = (html: string | null | undefined): string => {
  if (!html) return "";
  // Space after block-level closers so "<h2>A</h2><p>B</p>" reads "A B", not "AB".
  const spaced = html.replace(/<\/(p|div|h[1-6]|li|blockquote|pre|tr|td|th)>|<br\s*\/?>/gi, "$& ");
  const doc = new DOMParser().parseFromString(spaced, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

export const excerpt = (html: string | null | undefined, limit = 140): string => {
  const text = htmlToText(html);
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
};

/** Returns the URL only if it is an http(s) link; blocks javascript:, data:, etc. */
export const safeExternalUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
};
