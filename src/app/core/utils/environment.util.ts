// src/app/core/utils/environment.util.ts
import { environment } from '../../../environments/environment';

export class EnvironmentUtil {
  // 获取资源路径
  static getAssetPath(path: string): string {
    if (environment.githubPagesMode) {
      return `${environment.baseHref}${path}`.replace(/\/+/g, '/');
    }
    return `/${path}`;
  }

  // 获取数据文件路径
  static getDataPath(filename: string): string {
    return this.getAssetPath(`data/${filename}`);
  }

  // 获取论文文件路径
  static getPaperPath(filePath: string): string {
    if (environment.githubPagesMode) {
      return `${environment.baseHref}${filePath}`.replace(/\/+/g, '/');
    }
    return `/${filePath}`;
  }

  // 检查是否为生产环境
  static isProduction(): boolean {
    return environment.production;
  }

  // 检查是否为 GitHub Pages 模式
  static isGitHubPagesMode(): boolean {
    return environment.githubPagesMode;
  }

  // 获取基础路径
  static getBaseHref(): string {
    return environment.baseHref;
  }
}