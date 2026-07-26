export const RELATION_TYPES = [
  "related",
  "parent",
  "child",
  "depends-on",
  "uses",
  "implements",
  "alternative-to",
] as const;

export type RelationType = (typeof RELATION_TYPES)[number];

export interface Relation {
  targetId: string;
  type: RelationType;
}

export interface Resource {
  url: string;
  title: string;
  type: "article" | "documentation" | "video" | "repository" | "blog" | "notes";
  website: string;
}

export interface KnowledgeNode {
  id: string;
  title: string;
  slug: string;
  summary: string;
  notes: string;
  keywords: string[];
  tags: string[];
  sections: string[];
  resources: Resource[];
  relations: Relation[];
  archived: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NodeDraft = Omit<
  KnowledgeNode,
  "id" | "slug" | "archived" | "favorite" | "createdAt" | "updatedAt"
>;

export interface PendingCapture {
  title: string;
  url: string;
  selectedText?: string;
}

export const EMPTY_NODE_DRAFT: NodeDraft = {
  title: "",
  summary: "",
  notes: "",
  keywords: [],
  tags: [],
  sections: [],
  resources: [],
  relations: [],
};
