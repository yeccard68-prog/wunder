// Content pipeline contracts:
// current information → source → fact extraction → verification → quiz generation → database → feed

/** Raw input: one article / web page / feed entry. */
export interface SourceDocument {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string; // ISO
  text: string;
}

/** Anything that can deliver current information (RSS, news API, Wikipedia "current events", ...). */
export interface SourceProvider {
  name: string;
  fetch(): Promise<SourceDocument[]>;
}

/** A quiz item generated from exactly one source document. */
export interface GeneratedQuestion {
  categoryId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
  supportingQuote: string; // verbatim sentence from the source that proves the answer
}

export interface VerifiedQuestion extends GeneratedQuestion {
  source: SourceDocument;
}

/** Where verified questions end up (Supabase, JSON file, ...). */
export interface QuestionSink {
  save(questions: VerifiedQuestion[]): Promise<void>;
}
