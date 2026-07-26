export type Resource = {
  url: string;
  title: string;
  type: "article" | "documentation" | "video" | "repository" | "blog" | "notes";
  website: string;
};

export type Relation = {
  targetId: string;
  type: "related" | "parent" | "child" | "depends-on" | "uses" | "implements" | "alternative-to";
};

export type KnowledgeNode = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  notes: string;
  sections: string[];
  tags: string[];
  keywords: string[];
  resources: Resource[];
  relations: Relation[];
  archived: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeGraph = {
  version: number;
  generatedAt: string;
  nodes: KnowledgeNode[];
};

export type SectionIndex = {
  generatedAt: string;
  sections: Array<{ name: string; slug: string; nodeIds: string[]; count: number }>;
};

export type PortalStats = {
  generatedAt: string;
  topics: number;
  sections: number;
  resources: number;
  resourceTypes: Record<string, number>;
  averageTags: number;
  relationships: number;
};
