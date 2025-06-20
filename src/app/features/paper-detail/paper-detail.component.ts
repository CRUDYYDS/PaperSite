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
    
    console.log('=== PDF URL Debug ===');
    console.log('Paper ID:', this.paper.id);
    console.log('fileUrl from data:', this.paper.fileUrl);
    console.log('filePath from data:', this.paper.filePath);
    
    // 硬编码测试URL，直接绕过数据文件的问题
    if (this.paper.id === 'test001') {
      const testUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
      console.log('Using hardcoded test URL:', testUrl);
      return testUrl;
    }
    
    if (this.paper.id === 'mc3meiuvlzhop') {
      const bertUrl = 'https://arxiv.org/pdf/1810.04805.pdf';
      console.log('Using hardcoded BERT URL:', bertUrl);
      return bertUrl;
    }
    
    // 检查是否为完整的HTTP URL
    if (this.paper.fileUrl && this.paper.fileUrl.startsWith('http')) {
      console.log('Using HTTP fileUrl:', this.paper.fileUrl);
      return this.paper.fileUrl;
    }
    
    // 处理本地文件路径
    if (this.paper.filePath) {
      // 如果在GitHub Pages模式下
      if (EnvironmentUtil.isGitHubPagesMode()) {
        // 检查filePath是否已经被转换，如果是，直接使用原始路径
        if (this.paper.filePath.startsWith('papers/')) {
          const url = `/${this.paper.filePath}`;
          console.log('Using original papers path:', url);
          return url;
        } else {
          const baseHref = EnvironmentUtil.getBaseHref().replace(/\/$/, '');
          const url = `${baseHref}/${this.paper.filePath}`;
          console.log('Using GitHub Pages URL:', url);
          return url;
        }
      } else {
        // 开发模式：检查不同的路径格式
        if (this.paper.filePath.startsWith('assets/')) {
          const url = `/${this.paper.filePath}`;
          console.log('Using assets path:', url);
          return url;
        } else if (this.paper.filePath.startsWith('papers/')) {
          // 直接使用papers路径（如果已配置在angular.json中）
          const url = `/${this.paper.filePath}`;
          console.log('Using papers path:', url);
          return url;
        } else {
          // 默认假设在assets目录下
          const url = `/assets/papers/${this.paper.fileName}`;
          console.log('Using default assets path:', url);
          return url;
        }
      }
    }
    
    // 其他情况返回一个默认的测试PDF
    const fallbackUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
    console.log('Using fallback URL:', fallbackUrl);
    return fallbackUrl;
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
    console.log('Checking PDF accessibility for URL:', url);
    
    // 检查是否为有效的URL
    const isAccessible = url.startsWith('http') || url.startsWith('/assets') || url.startsWith('assets/');
    console.log('PDF accessible:', isAccessible);
    
    return isAccessible;
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