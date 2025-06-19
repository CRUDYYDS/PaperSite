// 2. src/app/core/services/github-upload.service.ts (更新版本)
// 修复后的 src/app/core/services/github-upload.service.ts (TypeScript类型安全版本)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { GitHubConfigService, GitHubConfig } from './github-config.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// 定义GitHub API相关的接口
interface GitHubFileInfo {
  sha: string;
  content: string;
  [key: string]: any;
}

interface GitHubUploadData {
  message: string;
  content: string;
  committer: {
    name: string;
    email: string;
  };
  sha?: string; // 可选的SHA字段
}

interface PapersData {
  papers: any[];
  metadata: {
    totalCount: number;
    lastUpdated: string;
    categories: { [key: string]: number };
  };
}

@Injectable({
  providedIn: 'root'
})
export class GitHubUploadService {
  private readonly API_BASE = 'https://api.github.com';

  constructor(
    private http: HttpClient,
    private configService: GitHubConfigService
  ) {}

  // 修复中文编码问题的安全 Base64 编码方法
  private safeBase64Encode(str: string): string {
    try {
      // 方法1: 使用 TextEncoder 处理 UTF-8
      const encoder = new TextEncoder();
      const uint8Array = encoder.encode(str);
      let binaryString = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
      }
      return btoa(binaryString);
    } catch (error) {
      console.warn('TextEncoder method failed, trying fallback...');
      try {
        // 方法2: 使用 encodeURIComponent + unescape 的经典方法
        return btoa(unescape(encodeURIComponent(str)));
      } catch (fallbackError) {
        console.error('All encoding methods failed:', fallbackError);
        throw new Error('无法编码内容，请检查是否包含特殊字符');
      }
    }
  }

  // 安全 Base64 解码方法
  private safeBase64Decode(base64: string): string {
    try {
      const decoded = atob(base64);
      // 尝试解码 UTF-8
      return decodeURIComponent(escape(decoded));
    } catch (error) {
      console.warn('UTF-8 decode failed, returning raw:', error);
      return atob(base64);
    }
  }

  // 获取请求头
  private getHeaders(config: GitHubConfig): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Papers-Site-Uploader/1.0'
    });
  }

  // 测试Token有效性
  async testConnection(): Promise<boolean> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('GitHub配置未设置');
    }

    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}`;
      const response = await this.http.get(url, { 
        headers: this.getHeaders(config) 
      }).toPromise();
      
      console.log('Connection test successful:', response);
      return true;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        switch (error.status) {
          case 401:
            throw new Error('Token无效或已过期');
          case 404:
            throw new Error('仓库不存在或无访问权限');
          case 403:
            throw new Error('API限制或权限不足');
          default:
            throw new Error(`连接失败: ${error.message}`);
        }
      }
      throw error;
    }
  }

  // 上传文件到GitHub仓库 (修复版本)
  async uploadFile(file: File, path: string): Promise<any> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('GitHub配置未设置');
    }

    try {
      console.log(`Starting upload for: ${path}`);
      
      // 1. 将文件转为base64
      const base64Content = await this.fileToBase64(file);
      console.log(`File converted to base64, size: ${base64Content.length} chars`);
      
      // 2. 检查文件是否已存在 (允许404错误)
      let existingFile: GitHubFileInfo | null = null;
      try {
        existingFile = await this.getFileInfo(path, config);
        console.log('File already exists, will update with SHA:', existingFile?.sha);
      } catch (error) {
        console.log('File does not exist (expected for new files)');
        // 文件不存在是正常的，继续上传
      }
      
      // 3. 准备上传数据 (使用正确的类型)
      const uploadData: GitHubUploadData = {
        message: `Upload ${file.name} via Papers Site`,
        content: base64Content,
        committer: {
          name: 'Papers Site',
          email: 'papers-site@example.com'
        }
      };

      // 如果文件已存在，添加 SHA
      if (existingFile && existingFile.sha) {
        uploadData.sha = existingFile.sha;
      }

      console.log('Upload data prepared:', {
        message: uploadData.message,
        contentLength: uploadData.content.length,
        hasSha: !!uploadData.sha
      });

      // 4. 执行上传
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      const response = await this.http.put(url, uploadData, { 
        headers: this.getHeaders(config) 
      }).pipe(
        catchError(this.handleError)
      ).toPromise();
      
      console.log('Upload successful:', response);
      return response;
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // 更新papers.json文件 (修复版本)
  async updatePapersJson(newPaper: any): Promise<any> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('GitHub配置未设置');
    }

    try {
      console.log('Starting papers.json update...');
      
      // 1. 获取当前papers.json
      let currentData: GitHubFileInfo | null = null;
      let papers: PapersData = {
        papers: [],
        metadata: {
          totalCount: 0,
          lastUpdated: new Date().toISOString(),
          categories: {}
        }
      };

      try {
        currentData = await this.getFileContent('data/papers.json', config);
        if (currentData && currentData.content) {
          const decodedContent = this.safeBase64Decode(currentData.content);
          papers = JSON.parse(decodedContent);
          console.log('Existing papers.json loaded, current count:', papers.papers?.length || 0);
        }
      } catch (error) {
        console.log('papers.json does not exist or is empty, creating new one');
      }
      
      // 2. 确保数据结构正确
      if (!papers.papers) {
        papers.papers = [];
      }
      if (!papers.metadata) {
        papers.metadata = {
          totalCount: 0,
          lastUpdated: new Date().toISOString(),
          categories: {}
        };
      }
      
      // 3. 添加新论文 (TypeScript类型安全)
      papers.papers.push(newPaper);
      console.log('New paper added:', newPaper.title);
      
      // 4. 更新元数据
      papers.metadata = {
        totalCount: papers.papers.length,
        lastUpdated: new Date().toISOString(),
        categories: this.calculateCategoryStats(papers.papers)
      };

      // 5. 转换为JSON并编码
      const jsonString = JSON.stringify(papers, null, 2);
      console.log('JSON string created, length:', jsonString.length);
      
      const encodedContent = this.safeBase64Encode(jsonString);
      console.log('Content encoded to base64, length:', encodedContent.length);

      // 6. 准备更新数据 (使用正确的类型)
      const updateData: GitHubUploadData = {
        message: `Add paper: ${newPaper.title}`,
        content: encodedContent,
        committer: {
          name: 'Papers Site',
          email: 'papers-site@example.com'
        }
      };

      // 如果文件已存在，添加 SHA
      if (currentData && currentData.sha) {
        updateData.sha = currentData.sha;
      }

      // 7. 执行更新
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/data/papers.json`;
      const response = await this.http.put(url, updateData, { 
        headers: this.getHeaders(config) 
      }).pipe(
        catchError(this.handleError)
      ).toPromise();
      
      console.log('papers.json update successful');
      return response;
      
    } catch (error) {
      console.error('papers.json update failed:', error);
      throw error;
    }
  }

  // 计算分类统计
  private calculateCategoryStats(papers: any[]): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    papers.forEach(paper => {
      const category = paper.category || '其他';
      stats[category] = (stats[category] || 0) + 1;
    });
    return stats;
  }

  // 获取文件信息 (改进错误处理和类型)
  private async getFileInfo(path: string, config: GitHubConfig): Promise<GitHubFileInfo | null> {
    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      const response = await this.http.get<GitHubFileInfo>(url, { 
        headers: this.getHeaders(config) 
      }).toPromise();
      return response || null;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        // 404 是正常的，表示文件不存在
        return null;
      }
      // 其他错误才抛出
      throw error;
    }
  }

  // 获取文件内容 (改进错误处理和类型)
  private async getFileContent(path: string, config: GitHubConfig): Promise<GitHubFileInfo | null> {
    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      const response = await this.http.get<GitHubFileInfo>(url, { 
        headers: this.getHeaders(config) 
      }).toPromise();
      return response || null;
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  // 文件转base64 (改进版本)
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const result = reader.result as string;
          // 移除 data:xxx;base64, 前缀
          const base64 = result.split(',')[1];
          if (!base64) {
            throw new Error('无法提取文件的 base64 内容');
          }
          console.log(`File read successful, base64 length: ${base64.length}`);
          resolve(base64);
        } catch (error) {
          console.error('Error processing file:', error);
          reject(new Error('文件处理失败'));
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        reject(new Error('文件读取失败'));
      };

      reader.onabort = () => {
        reject(new Error('文件读取被中断'));
      };
      
      // 开始读取文件
      reader.readAsDataURL(file);
    });
  }

  // 改进的错误处理
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '操作失败';
    
    console.error('GitHub API Error:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error
    });
    
    if (error.status === 0) {
      errorMessage = '网络连接失败，请检查网络状态';
    } else if (error.status === 401) {
      errorMessage = 'GitHub Token无效或已过期';
    } else if (error.status === 403) {
      if (error.error?.message?.includes('rate limit')) {
        errorMessage = 'GitHub API 速率限制，请稍后重试';
      } else {
        errorMessage = 'API权限不足或仓库访问被拒绝';
      }
    } else if (error.status === 404) {
      errorMessage = '仓库或文件不存在';
    } else if (error.status === 422) {
      errorMessage = '请求数据格式错误或文件过大';
    } else if (error.status >= 500) {
      errorMessage = 'GitHub服务器错误，请稍后重试';
    } else if (error.error?.message) {
      errorMessage = `GitHub API: ${error.error.message}`;
    }
    
    return throwError(() => new Error(errorMessage));
  };
}
