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
  
  // 预计算的PDF URL，避免在模板中调用方法
  pdfUrl: string = '';
  isPdfReady: boolean = false;

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
      } else {
        // 论文加载成功后，计算PDF URL
        this.calculatePdfUrl();
      }
    } catch (error: any) {
      console.error('加载论文详情失败:', error);
      this.error = error.message || '加载论文详情时发生错误';
    } finally {
      this.isLoading = false;
    }
  }

  // 计算PDF URL的私有方法，只调用一次
  private calculatePdfUrl() {
    if (!this.paper) {
      this.pdfUrl = '';
      this.isPdfReady = false;
      return;
    }

    console.log('=== PDF URL Debug ===');
    console.log('Paper ID:', this.paper.id);
    console.log('fileUrl from data:', this.paper.fileUrl);
    console.log('filePath from data:', this.paper.filePath);
    console.log('GitHub Pages Mode:', EnvironmentUtil.isGitHubPagesMode());
    console.log('Base Href:', EnvironmentUtil.getBaseHref());
    console.log('Current window.location:', window.location.href);
    console.log('Current window.origin:', window.location.origin);
    
    // 处理本地文件路径
    if (this.paper.filePath) {
      // 如果在GitHub Pages模式下
      if (EnvironmentUtil.isGitHubPagesMode()) {
        const baseHref = EnvironmentUtil.getBaseHref().replace(/\/$/, '');
        
        if (this.paper.filePath.startsWith('papers/')) {
          const relativePath = `${baseHref}/${this.paper.filePath}`;
          const absoluteUrl = `${window.location.origin}${relativePath}`;
          
          console.log('Using GitHub Pages papers path with baseHref:', relativePath);
          console.log('🌍 COMPLETE URL WITH DOMAIN:', absoluteUrl);
          
          this.pdfUrl = relativePath;
        } else {
          const relativePath = `${baseHref}/${this.paper.filePath}`;
          const absoluteUrl = `${window.location.origin}${relativePath}`;
          
          console.log('Using GitHub Pages URL with baseHref:', relativePath);
          console.log('🌍 COMPLETE URL WITH DOMAIN:', absoluteUrl);
          
          this.pdfUrl = relativePath;
        }
      } else {
        // 开发模式
        if (this.paper.filePath.startsWith('assets/')) {
          this.pdfUrl = `/${this.paper.filePath}`;
        } else if (this.paper.filePath.startsWith('papers/')) {
          this.pdfUrl = `/${this.paper.filePath}`;
        } else {
          this.pdfUrl = `/assets/papers/${this.paper.fileName}`;
        }
      }
    }
    
    // 如果没有filePath，检查fileUrl
    if (!this.pdfUrl && this.paper.fileUrl && this.paper.fileUrl.startsWith('http')) {
      this.pdfUrl = this.paper.fileUrl;
    }
    
    // 检查PDF是否可访问
    this.isPdfReady = !!(this.pdfUrl && (
      this.pdfUrl.startsWith('http') || 
      this.pdfUrl.startsWith('/assets') || 
      this.pdfUrl.startsWith('assets/') ||
      this.pdfUrl.startsWith('/PaperSite/') ||
      this.pdfUrl.includes('/papers/')
    ));

    console.log('Final PDF URL:', this.pdfUrl);
    console.log('PDF Ready:', this.isPdfReady);
    
    // 测试PDF访问性
    if (this.isPdfReady) {
      this.testPdfAccess();
    }
  }

  // 测试PDF访问性
  private async testPdfAccess() {
    const fullUrl = this.pdfUrl.startsWith('http') ? this.pdfUrl : `${window.location.origin}${this.pdfUrl}`;
    
    try {
      console.log('🔍 Testing actual PDF access:', fullUrl);
      const response = await fetch(fullUrl, { 
        method: 'HEAD',
        mode: 'cors',
        cache: 'no-cache'
      });
      
      console.log('✅ PDF access test result:', {
        status: response.status,
        statusText: response.statusText,
        accessible: response.ok
      });
      
    } catch (error) {
      console.error('❌ PDF access test failed:', error);
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

  downloadPaper() {
    if (this.paper) {
      // 增加下载计数
      this.paperService.incrementDownloadCount(this.paper.id);
      
      // 获取下载URL - 使用预计算的pdfUrl
      const downloadUrl = this.pdfUrl || this.paper.fileUrl || this.paper.filePath;
      
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
  }
}