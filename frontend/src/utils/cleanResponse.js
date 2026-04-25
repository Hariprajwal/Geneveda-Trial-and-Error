/**
 * Strips markdown formatting from LLM responses to produce clean, human-readable text.
 * Used in all chat components (Patient, Doctor, Nurse).
 */
export function cleanResponse(text) {
  if (!text) return "";

  return text
    // ── Tables: convert | col | col | rows to "Label: Value" style ──
    .replace(/^\|(.+)\|$/gm, (_, content) => {
      // Skip separator rows (|---|---|)
      if (/^[\s\-|:]+$/.test(content)) return "";
      const cells = content.split("|").map(c => c.trim()).filter(Boolean);
      // If only one cell or looks like a header, just join with spaces
      return cells.length > 1 ? cells.join("  —  ") : cells[0];
    })
    // ── Remove markdown headings (# ## ###) ──
    .replace(/^#{1,6}\s+/gm, "")
    // ── Remove bold+italic (***text***) ──
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    // ── Remove bold (**text** or __text__) ──
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    // ── Remove italic (*text* or _text_) ── (careful not to strip star bullets)
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "$1")
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, "$1")
    // ── Convert dash/star bullet points to bullet character ──
    .replace(/^[ \t]*[-*+]\s+/gm, "• ")
    // ── Remove horizontal rules ──
    .replace(/^[-*_]{3,}\s*$/gm, "")
    // ── Remove inline code backticks ──
    .replace(/`(.+?)`/g, "$1")
    // ── Remove blockquote markers ──
    .replace(/^>\s*/gm, "")
    // ── Clean up multiple consecutive blank lines ──
    .replace(/\n{3,}/g, "\n\n")
    // ── Trim leading/trailing whitespace ──
    .trim();
}
