import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const layerConfig = {
  "BDA Layouts": {
    order: 1,
    label: "BDA",
    color: "#0F9D58",
    weight: 2,
    opacity: 0.8,
    fillColor: "#0F9D58",
    fillOpacity: 0.15
  },
  "Illegal Layouts": {
    order: 3,
    label: "Unauthorized",
    color: "#E65100",
    weight: 2,
    opacity: 0.8,
    fillColor: "#E65100",
    fillOpacity: 0.15
  },
  "Approved Layouts": {
    order: 2,
    label: "Approved",
    color: "#FFEA00",
    weight: 2,
    opacity: 0.8,
    fillColor: "#FFEA00",
    fillOpacity: 0.15
  }
};

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get the date range for a bidding session
 * @param {number} session - Session number (1 or 2)
 * @returns {string} Date range string
 */
export function getSessionDate(session) {
  if (session === 1) return "16-17 Feb 2026";
  if (session === 2) return "17-18 Feb 2026";
  return "";
}

/**
 * Convert string to proper title case
 * Handles special cases like "F.E.Matadahalli" → "F.E. Of Matadahalli"
 * and "KUMARASWAMY 2 ND STAGE" → "Kumaraswamy 2nd Stage"
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function toTitleCase(str) {
  if (!str) return "";

  // Fix typo: "BANASHNKARI" → "BANASHANKARI"
  str = str.replace(/BANASHNKARI/gi, "BANASHANKARI");

  // Fix spacing issues: "2 ND" → "2nd" (fix spacing and convert to lowercase ordinal)
  str = str.replace(/(\d+)\s+(ND|ST|RD|TH)\b/gi, (match, num, suffix) => {
    return num + suffix.toLowerCase();
  });

  // Handle "F.E.Matadahalli" or "F.e.Matadahalli" → "F.E. Matadahalli" (add space after initials when followed by capital letter word)
  str = str.replace(
    /([A-Za-z]\.[A-Za-z]\.)([A-Z][a-z]+)/g,
    (match, initials, word) => {
      // Uppercase the initials part to ensure "F.E." format
      return initials.toUpperCase() + " " + word;
    }
  );

  // Handle "F.E. OF" or "F.E.OF" → "F.E. Of"
  str = str.replace(/([A-Za-z]\.[A-Za-z]\.\s*)OF\b/gi, (match, initials) => {
    return initials.toUpperCase() + "Of";
  });

  // Handle other cases where period is followed by capital letter (add space)
  str = str.replace(/([A-Za-z]\.)([A-Z][a-z]+)/g, "$1 $2");

  // Known short acronyms to preserve (2-4 characters, no periods)
  const knownAcronyms = new Set(["BSK", "BDA", "FE", "JP", "RMV", "MV"]);

  // Split into words and process each
  return str.replace(/\S+/g, (word) => {
    // Handle ordinal numbers (1st, 2nd, 3rd, 4th, etc.) - keep lowercase
    if (/^\d+(st|nd|rd|th)$/i.test(word)) {
      return word.toLowerCase();
    }

    // If it contains periods (like "F.E."), check if it's initials
    if (word.includes(".")) {
      const parts = word.split(".").filter((part) => part.length > 0); // Remove empty parts from trailing periods
      // If all non-empty parts are 1-2 chars and letters, it's likely initials - keep uppercase with periods
      if (
        parts.length > 0 &&
        parts.every((part) => part.length <= 2 && /^[A-Za-z]*$/.test(part))
      ) {
        // Preserve the original structure: uppercase each letter part, keep periods
        // Uppercase the letter parts and join with periods
        const letterParts = parts.map((part) => part.toUpperCase());
        const reconstructed = letterParts.join(".");
        // Only add trailing period if the original word ended with a period
        // and the reconstructed version doesn't already end with one
        const hadTrailingPeriod = word.endsWith(".");
        const needsTrailingPeriod =
          hadTrailingPeriod && !reconstructed.endsWith(".");
        return needsTrailingPeriod ? reconstructed + "." : reconstructed;
      }
    }

    // Only preserve known short acronyms (2-4 chars, no periods), not long words
    const upperWord = word.toUpperCase();
    if (
      word.length <= 4 &&
      !word.includes(".") &&
      knownAcronyms.has(upperWord)
    ) {
      return upperWord;
    }

    // Otherwise, standard title case: first letter uppercase, rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Normalize layout name by extracting the base name (before first comma)
 * and removing block numbers to group similar layouts together
 * @param {string} layout - Full layout name
 * @returns {string} Normalized base layout name
 */
export function normalizeLayoutName(layout) {
  if (!layout) return "";

  // Fix typo: "BANASHNKARI" → "BANASHANKARI" before processing
  let base = layout.replace(/BANASHNKARI/gi, "BANASHANKARI");

  // Extract base name (everything before first comma)
  base = base.split(",")[0].trim();

  // Remove "(Corner)" since it's now a separate type field
  base = base.replace(/\s*\(Corner\)\s*/gi, "").trim();

  // Remove block numbers (e.g., "1st Block", "2nd Block", etc.) to group layouts
  // Pattern: one or more digits followed by (st|nd|rd|th) followed by "Block" or "block"
  base = base.replace(/\s+\d+(st|nd|rd|th)\s+block\s*/gi, "").trim();

  // Handle "F.E.Matadahalli" or "F.e.Matadahalli" → "F.E. Matadahalli" (add space after initials when followed by word)
  // This must happen before word processing to ensure proper spacing
  // Match pattern like "F.E." followed immediately by a word (no space)
  base = base.replace(/([A-Za-z]\.[A-Za-z]\.)(?=[A-Za-z])/g, (match) => {
    // Uppercase the initials and add space after the period
    return match.toUpperCase() + " ";
  });

  // Normalize case: Title Case (capitalize first letter of each word)
  // But preserve acronyms (all caps words like "BSK", "BDA") and content in parentheses
  const parts = [];
  let current = "";
  let inParens = false;

  for (let i = 0; i < base.length; i++) {
    const char = base[i];
    if (char === "(") {
      if (current.trim()) {
        parts.push(current.trim());
        current = "";
      }
      inParens = true;
      current += char;
    } else if (char === ")") {
      current += char;
      parts.push(current.trim());
      current = "";
      inParens = false;
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    parts.push(current.trim());
  }

  // Known short acronyms to preserve (2-4 characters, no periods)
  const knownAcronyms = new Set(["BSK", "BDA", "FE", "JP", "RMV", "MV"]);

  const normalized = parts
    .map((part) => {
      // Preserve content in parentheses as-is
      if (part.startsWith("(") && part.endsWith(")")) {
        return part;
      }
      // Handle words
      const words = part.split(/\s+/);
      return words
        .map((word) => {
          // If it contains periods (like "F.E."), check if it's initials
          if (word.includes(".")) {
            const parts = word.split(".").filter((part) => part.length > 0); // Remove empty parts from trailing periods
            // If all non-empty parts are 1-2 chars and letters, it's likely initials - keep uppercase
            if (
              parts.length > 0 &&
              parts.every(
                (part) => part.length <= 2 && /^[A-Za-z]*$/.test(part)
              )
            ) {
              return word.toUpperCase();
            }
          }

          // Only preserve known short acronyms (2-4 chars, no periods), not long words
          const upperWord = word.toUpperCase();
          if (
            word.length <= 4 &&
            !word.includes(".") &&
            knownAcronyms.has(upperWord)
          ) {
            return upperWord;
          }

          // Otherwise, capitalize first letter, lowercase rest
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
    })
    .join(" ");

  return normalized;
}
