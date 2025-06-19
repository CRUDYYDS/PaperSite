// 5. src/app/models/paper.model.ts
export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  keywords: string[];
  category: string;
  publishDate: string;
  fileName: string;
  fileSize: number;
  repository: string;
  filePath: string;
  fileUrl?: string;
  downloadCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  paperCount: number;
}
