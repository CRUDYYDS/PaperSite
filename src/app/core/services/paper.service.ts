// src/app/core/services/paper.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Paper, Category } from '../../models/paper.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaperService {
  private readonly dataPath: string;

  constructor(private http: HttpClient) {
    // 根据环境配置数据路径
    if (environment.githubPagesMode) {
      this.dataPath = `${environment.baseHref}data/`;
    } else {
      this.dataPath = '/data/';
    }
  }

  async getPapers(options: any = {}): Promise<{ papers: Paper[], total: number }> {
    try {
      const response = await this.http.get<{papers: Paper[]}>(`${this.dataPath}papers.json`).toPromise();
      let papers = response?.papers || [];

      // 分类过滤
      if (options.category && options.category !== 'all') {
        papers = papers.filter(paper => paper.category === options.category);
      }

      // 排序
      if (options.sortBy) {
        papers = this.sortPapers(papers, options.sortBy);
      }

      // 分页
      const page = options.page || 1;
      const pageSize = options.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const paginatedPapers = papers.slice(startIndex, startIndex + pageSize);

      return { papers: paginatedPapers, total: papers.length };
    } catch (error) {
      console.error('Failed to load papers:', error);
      return { papers: [], total: 0 };
    }
  }

  async getPaperById(id: string): Promise<Paper | null> {
    try {
      const response = await this.http.get<{papers: Paper[]}>(`${this.dataPath}papers.json`).toPromise();
      const paper = response?.papers.find(p => p.id === id);
      
      if (paper && environment.githubPagesMode) {
        // 修正 GitHub Pages 环境下的文件路径
        paper.fileUrl = `${environment.baseHref}${paper.filePath}`;
      }
      
      return paper || null;
    } catch (error) {
      console.error('Failed to load paper:', error);
      return null;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      const response = await this.http.get<{categories: Category[]}>(`${this.dataPath}categories.json`).toPromise();
      return response?.categories || [];
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  }

  async searchPapers(query: string, options: any = {}): Promise<Paper[]> {
    try {
      const response = await this.http.get<{papers: Paper[]}>(`${this.dataPath}papers.json`).toPromise();
      const papers = response?.papers || [];
      const searchTerm = query.toLowerCase();
      
      let filteredPapers = papers.filter(paper => 
        paper.title.toLowerCase().includes(searchTerm) ||
        paper.authors.some(author => author.toLowerCase().includes(searchTerm)) ||
        paper.abstract?.toLowerCase().includes(searchTerm) ||
        paper.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );

      // 应用额外的过滤器
      if (options.category && options.category !== 'all') {
        filteredPapers = filteredPapers.filter(paper => paper.category === options.category);
      }

      // 排序
      if (options.sortBy) {
        filteredPapers = this.sortPapers(filteredPapers, options.sortBy);
      }

      return filteredPapers;
    } catch (error) {
      console.error('Failed to search papers:', error);
      return [];
    }
  }

  private sortPapers(papers: Paper[], sortBy: string): Paper[] {
    return papers.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'zh-CN');
        case 'date':
          return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
        case 'downloads':
          return b.downloadCount - a.downloadCount;
        case 'authors':
          return a.authors[0]?.localeCompare(b.authors[0], 'zh-CN') || 0;
        default:
          return 0;
      }
    });
  }

  // 增加下载计数
  async incrementDownloadCount(paperId: string): Promise<void> {
    // 在实际应用中，这里应该调用 API 更新下载次数
    // 由于我们使用静态 JSON，这里只是模拟
    console.log(`Incrementing download count for paper: ${paperId}`);
  }
}