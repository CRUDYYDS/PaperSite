// src/app/features/paper-detail/paper-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaperService } from '../../core/services/paper.service';
import { Paper } from '../../models/paper.model';
import { EnvironmentUtil } from '../../core/utils/environment.util';

@Component({
  selector: 'app-paper-detail',
  templateUrl: './paper-detail.component.html',
  styleUrls: ['./paper-detail.component.scss']
})
export class PaperDetailComponent implements OnInit {
  paper: Paper | null = null;
  currentView: 'info' | 'preview' = 'info';
  error: string | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paperService: PaperService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadPaper(id);
    } else {
      this.error = '论文ID无效';
    }
  }

  async loadPaper(id: string) {
    try {
      this.isLoading = true;
      this.error = null;
      
      this.paper = await this.paperService.getPaperById(id);
      
      if (!this.paper) {
        this.error = '论文不存在或已被删除';
      }
    } catch (error: any) {
      console.error('加载论文详情失败:', error);
      this.error = error.message || '加载论文详情时发生错误';
    } finally {
      this.isLoading = false;
    }
  }

  async reloadPaper() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadPaper(id);
    }
  }

  switchView(view: 'info' | 'preview') {
    this.currentView = view;
    
    // 如果切换到预览视图，记录一次查看
    if (view === 'preview' && this.paper) {
      this.trackPaperView();
    }
  }

  getPdfUrl(): string {
    if (!this.paper) return '';
    
    // 如果已经有完整的URL，直接使用
    if (this.paper.fileUrl) {
      return this.paper.fileUrl;
    }
    
    // 根据环境构建URL
    if (EnvironmentUtil.isGitHubPagesMode()) {
      // GitHub Pages 模式：使用完整的GitHub Pages URL
      const baseHref = EnvironmentUtil.getBaseHref().replace(/\/$/, '');
      return `${baseHref}/${this.paper.filePath}`;
    } else {
      // 开发模式：使用相对路径，但需要确保路径正确
      // 移除 papers/ 前缀，因为它应该在 assets 或 data 目录下
      const fileName = this.paper.filePath.split('/').pop() || this.paper.fileName;
      return `/assets/papers/${fileName}`;
    }
  }

  downloadPaper() {
    if (this.paper) {
      // 增加下载计数
      this.paperService.incrementDownloadCount(this.paper.id);
      
      // 获取下载URL
      const downloadUrl = this.getPdfUrl();
      
      // 创建下载链接
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = this.paper.fileName;
      link.target = '_blank';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 更新本地下载计数显示
      this.paper.downloadCount++;
    }
  }

  goBack() {
    // 优先使用浏览器历史记录
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // 如果没有历史记录，导航到论文列表
      this.router.navigate(['/papers']);
    }
  }

  private trackPaperView() {
    // 记录论文查看次数（如果需要的话）
    console.log(`论文查看: ${this.paper?.title}`);
    
    // 这里可以调用服务记录查看统计
    // this.analyticsService.trackPaperView(this.paper.id);
  }

  // 分享论文
  sharePaper() {
    if (this.paper) {
      const shareData = {
        title: this.paper.title,
        text: `查看论文: ${this.paper.title}`,
        url: window.location.href
      };

      if (navigator.share) {
        // 使用原生分享API
        navigator.share(shareData).catch(console.error);
      } else {
        // 降级到复制链接
        this.copyPaperLink();
      }
    }
  }

  // 复制论文链接
  copyPaperLink() {
    const url = window.location.href;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        // 可以显示一个提示消息
        console.log('链接已复制到剪贴板');
      }).catch(console.error);
    } else {
      // 降级方案
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      console.log('链接已复制到剪贴板');
    }
  }

  // 检查PDF是否可用
  isPdfAvailable(): boolean {
    return !!(this.paper && (this.paper.fileUrl || this.paper.filePath));
  }

  // 检查PDF是否可访问
  isPdfAccessible(): boolean {
    if (!this.paper) return false;
    
    const url = this.getPdfUrl();
    // 检查是否为有效的URL或本地assets路径
    return url.startsWith('http') || url.startsWith('/assets') || url.includes('assets/');
  }

  // 获取论文作者字符串
  getAuthorsString(): string {
    if (!this.paper || !this.paper.authors.length) return '';
    
    if (this.paper.authors.length <= 3) {
      return this.paper.authors.join(', ');
    }
    
    return `${this.paper.authors.slice(0, 2).join(', ')} 等 ${this.paper.authors.length} 人`;
  }

  // 格式化文件大小
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}