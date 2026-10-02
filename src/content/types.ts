/** Shared content types. All fact-bearing text on the site (3D and plain) comes from src/content/*. */

export interface Link {
  label: string;
  href: string;
  /** Opens in a new tab (PDFs only). */
  newTab?: boolean;
}

export interface Metric {
  /** Verbatim value from FACTS.md, e.g. "84.09%", "R² 0.70", "~96%". */
  value: string;
  caption: string;
}

/** A sentence written for the revamp (✎ in COPY.md): framing only, no new facts. */
export interface Voice {
  text: string;
  voice: true;
}
