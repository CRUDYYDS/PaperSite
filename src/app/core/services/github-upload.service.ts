// 2. src/app/core/services/github-upload.service.ts (更新版本)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { GitHubConfigService, GitHubConfig } from './github-config.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GitHubUploadService {
  private readonly API_BASE = 'https://api.github.com';

  constructor(
    private http: HttpClient,
    private configService: GitHubConfigService
  ) {}

  // 获取请求头
  private getHeaders(config: GitHubConfig): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `token ${config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
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
      await this.http.get(url, { headers: this.getHeaders(config) }).toPromise();
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

  // 上传文件到GitHub仓库
  async uploadFile(file: File, path: string): Promise<any> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('GitHub配置未设置');
    }

    try {
      // 1. 将文件转为base64
      const base64Content = await this.fileToBase64(file);
      
      // 2. 检查文件是否已存在
      const existingFile = await this.getFileInfo(path, config);
      
      // 3. 上传/更新文件
      const uploadData = {
        message: `Upload ${file.name} via web interface`,
        content: base64Content,
        ...(existingFile && { sha: existingFile.sha })
      };

      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      
      return await this.http.put(url, uploadData, { 
        headers: this.getHeaders(config) 
      }).pipe(
        catchError(this.handleError)
      ).toPromise();
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  // 更新papers.json文件
  async updatePapersJson(newPaper: any): Promise<any> {
    const config = this.configService.getConfig();
    if (!config) {
      throw new Error('GitHub配置未设置');
    }

    try {
      // 1. 获取当前papers.json
      const currentData = await this.getFileContent('data/papers.json', config);
      let papers = currentData ? JSON.parse(atob(currentData.content)) : { 
        papers: [], 
        metadata: {
          totalCount: 0,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // 2. 添加新论文
      papers.papers.push(newPaper);
      papers.metadata = {
        totalCount: papers.papers.length,
        lastUpdated: new Date().toISOString()
      };

      // 3. 更新文件
      const updateData = {
        message: `Add paper: ${newPaper.title}`,
        content: btoa(JSON.stringify(papers, null, 2)),
        sha: currentData?.sha
      };

      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/data/papers.json`;
      
      return await this.http.put(url, updateData, { 
        headers: this.getHeaders(config) 
      }).pipe(
        catchError(this.handleError)
      ).toPromise();
      
    } catch (error) {
      console.error('Update papers.json failed:', error);
      throw error;
    }
  }

  // 获取文件信息
  private async getFileInfo(path: string, config: GitHubConfig): Promise<any> {
    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      return await this.http.get(url, { 
        headers: this.getHeaders(config) 
      }).toPromise();
    } catch (error) {
      return null; // 文件不存在
    }
  }

  // 获取文件内容
  private async getFileContent(path: string, config: GitHubConfig): Promise<any> {
    try {
      const url = `${this.API_BASE}/repos/${config.owner}/${config.repo}/contents/${path}`;
      return await this.http.get(url, { 
        headers: this.getHeaders(config) 
      }).toPromise();
    } catch (error) {
      return null;
    }
  }

  // 文件转base64
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // 移除data:xxx;base64,前缀
      };
      reader.onerror = error => reject(error);
    });
  }

  // 错误处理
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = '上传失败';
    
    if (error.status === 0) {
      errorMessage = '网络连接失败';
    } else if (error.status === 401) {
      errorMessage = 'GitHub Token无效或已过期';
    } else if (error.status === 403) {
      errorMessage = 'API限制或权限不足';
    } else if (error.status === 404) {
      errorMessage = '仓库不存在';
    } else if (error.status >= 500) {
      errorMessage = 'GitHub服务器错误';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  };
}