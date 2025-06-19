// src/app/core/services/github-config.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GitHubConfigService {
  private readonly STORAGE_KEY = 'github_config_safe';
  private configSubject = new BehaviorSubject<GitHubConfig | null>(null);
  
  public config$ = this.configSubject.asObservable();

  constructor() {
    this.loadSafeConfig();
  }

  // 设置GitHub配置
  setConfig(config: GitHubConfig): void {
    // 添加默认分支
    const fullConfig = {
      ...config,
      branch: config.branch || 'main'
    };
    
    // 仅在当前会话中保存完整配置（包含token）
    this.configSubject.next(fullConfig);
    
    // 只保存非敏感信息到localStorage
    const safeConfig = {
      owner: fullConfig.owner,
      repo: fullConfig.repo,
      branch: fullConfig.branch,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeConfig));
  }

  // 获取当前配置
  getConfig(): GitHubConfig | null {
    return this.configSubject.value;
  }

  // 检查是否已配置
  isConfigured(): boolean {
    const config = this.getConfig();
    return !!(config?.token && config?.owner && config?.repo);
  }

  // 获取仓库完整路径
  getRepositoryPath(): string {
    const config = this.getConfig();
    if (!config) return '';
    return `${config.owner}/${config.repo}`;
  }

  // 获取仓库 URL
  getRepositoryUrl(): string {
    const config = this.getConfig();
    if (!config) return '';
    return `https://github.com/${config.owner}/${config.repo}`;
  }

  // 获取 GitHub Pages URL
  getGitHubPagesUrl(): string {
    const config = this.getConfig();
    if (!config) return '';
    return `https://${config.owner}.github.io/${config.repo}/`;
  }

  // 清除配置
  clearConfig(): void {
    this.configSubject.next(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // 加载安全配置（不包含token）
  private loadSafeConfig(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const safeConfig = JSON.parse(saved);
        // token需要用户重新输入，但保留其他信息
        this.configSubject.next({
          token: '', // 空token，需要用户重新输入
          owner: safeConfig.owner || '',
          repo: safeConfig.repo || '',
          branch: safeConfig.branch || 'main'
        });
      }
    } catch (error) {
      console.warn('Failed to load GitHub config:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  // 验证Token格式
  validateToken(token: string): boolean {
    if (!token || token.length < 10) return false;
    
    // GitHub Token 格式验证
    const patterns = [
      /^gh[pousr]_[A-Za-z0-9_]{36,251}$/, // 新格式 fine-grained tokens
      /^github_pat_[A-Za-z0-9_]{22,255}$/, // Personal access tokens
      /^[a-f0-9]{40}$/ // 经典格式 40字符 hex
    ];
    
    return patterns.some(pattern => pattern.test(token));
  }

  // 验证仓库名格式
  validateRepoName(name: string): boolean {
    if (!name) return false;
    // GitHub 仓库名规则
    const pattern = /^[a-zA-Z0-9._-]+$/;
    return pattern.test(name) && name.length <= 100;
  }

  // 验证用户名格式
  validateUsername(username: string): boolean {
    if (!username) return false;
    // GitHub 用户名规则
    const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    return pattern.test(username);
  }
}
