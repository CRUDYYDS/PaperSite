// src/app/shared/components/pdf-viewer/pdf-viewer.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';

declare var pdfjsLib: any;

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() pdfUrl!: string;
  @Input() showToolbar = true;
  @ViewChild('pdfCanvas', { static: false }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  // PDF相关属性
  pdfDoc: any = null;
  currentPage = 1;
  totalPages = 0;
  scale: number | string = 1.0;
  rotation = 0;

  // 状态属性
  isLoading = false;
  loadingProgress = 0;
  error: string | null = null;
  isRendering = false;

  // 缩放选项
  scaleOptions = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2.0 },
    { label: '适合宽度', value: 'fit-width' },
    { label: '适合页面', value: 'fit-page' }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    // 配置PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  ngAfterViewInit() {
    // 使用setTimeout确保视图完全初始化
    setTimeout(() => {
      if (this.pdfUrl) {
        console.log('🎯 PDF viewer initialized, starting PDF load...');
        this.loadPDF();
      }
    }, 100);
  }

  ngOnDestroy() {
    if (this.pdfDoc) {
      this.pdfDoc.destroy();
    }
  }

  async loadPDF() {
    if (!this.pdfUrl) {
      this.error = 'PDF URL未提供';
      return;
    }

    console.log('🚀 Starting PDF.js load process...');
    console.log('📁 PDF URL:', this.pdfUrl);
    console.log('🌍 Full PDF URL:', this.pdfUrl.startsWith('http') ? this.pdfUrl : `${window.location.origin}${this.pdfUrl}`);

    this.isLoading = true;
    this.error = null;
    this.loadingProgress = 0;

    try {
      // 配置PDF.js加载参数，添加CORS支持
      const loadingTask = pdfjsLib.getDocument({
        url: this.pdfUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
        // 添加跨域支持配置
        withCredentials: false,
        isEvalSupported: false,
        // 禁用worker以避免跨域问题
        disableWorker: false,
        // 添加HTTP headers
        httpHeaders: {
          'Accept': 'application/pdf,*/*',
        }
      });

      console.log('📋 PDF.js loading task created');

      // 监听加载进度
      loadingTask.onProgress = (progress: any) => {
        if (progress.total) {
          this.loadingProgress = Math.round((progress.loaded / progress.total) * 100);
          console.log(`📊 PDF loading progress: ${this.loadingProgress}%`);
        }
      };

      console.log('⏳ Waiting for PDF.js to load document...');
      this.pdfDoc = await loadingTask.promise;
      console.log('✅ PDF document loaded successfully!');
      console.log('📄 Total pages:', this.pdfDoc.numPages);
      
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      
      console.log('🎨 Starting to render first page...');
      await this.renderPage();
      console.log('✅ First page rendered successfully!');
      
      this.isLoading = false;
      // 手动触发变更检测
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('❌ PDF加载失败:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // 如果是CORS错误，尝试备用方案
      if (error.message && (error.message.includes('CORS') || error.message.includes('fetch'))) {
        console.log('🔄 检测到CORS错误，尝试备用PDF...');
        await this.tryFallbackPDF();
      } else {
        this.error = this.getErrorMessage(error);
        this.isLoading = false;
        // 手动触发变更检测
        this.cdr.detectChanges();
      }
    }
  }

  // 备用PDF加载方法
  async tryFallbackPDF() {
    try {
      // 使用一个已知可以工作的PDF URL
      const fallbackUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      console.log('尝试加载备用PDF:', fallbackUrl);
      
      const loadingTask = pdfjsLib.getDocument({
        url: fallbackUrl,
        disableWorker: true  // 禁用worker避免跨域问题
      });

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      
      await this.renderPage();
      this.isLoading = false;
      
      // 显示警告信息
      this.error = '原始PDF无法加载，显示备用文档。这可能是由于CORS政策限制。';
      
      this.cdr.detectChanges();
    } catch (fallbackError) {
      console.error('备用PDF也加载失败:', fallbackError);
      this.error = '无法加载PDF文件，请检查网络连接或稍后重试。';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async renderPage() {
    if (!this.pdfDoc || this.isRendering || !this.pdfCanvas) return;

    // 确保canvas元素已经可用
    if (!this.pdfCanvas.nativeElement) {
      console.warn('Canvas element not ready, retrying in 100ms...');
      setTimeout(() => this.renderPage(), 100);
      return;
    }

    this.isRendering = true;

    try {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');

      // 确保context可用
      if (!context) {
        console.error('Cannot get canvas 2D context');
        return;
      }

      // 计算缩放比例
      let actualScale = this.scale;
      if (typeof this.scale === 'string' && (this.scale === 'fit-width' || this.scale === 'fit-page')) {
        actualScale = this.calculateFitScale(page);
      }

      const viewport = page.getViewport({ 
        scale: actualScale, 
        rotation: this.rotation 
      });

      // 设置canvas尺寸
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // 清除canvas
      context.clearRect(0, 0, canvas.width, canvas.height);

      // 渲染页面
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      console.log(`✅ Page ${this.currentPage} rendered successfully!`);

    } catch (error: any) {
      console.error('页面渲染失败:', error);
      this.error = '页面渲染失败';
    } finally {
      this.isRendering = false;
    }
  }

  private calculateFitScale(page: any): number {
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = this.pdfCanvas.nativeElement;
    const container = canvas.parentElement;
    
    if (!container) return 1.0;

    const containerWidth = container.clientWidth - 40; // 减去padding
    const containerHeight = container.clientHeight - 100; // 减去工具栏高度

    if (typeof this.scale === 'string' && this.scale === 'fit-width') {
      return containerWidth / viewport.width;
    } else if (typeof this.scale === 'string' && this.scale === 'fit-page') {
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      return Math.min(scaleX, scaleY);
    }

    return 1.0;
  }

  // 工具栏操作
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderPage();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.renderPage();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.renderPage();
    }
  }

  zoomIn() {
    if (typeof this.scale === 'number' && this.scale < 3) {
      this.scale = Math.min(this.scale * 1.25, 3);
      this.renderPage();
    } else if (typeof this.scale === 'string') {
      // 如果当前是字符串模式（如fit-width），切换到数字模式
      this.scale = 1.25;
      this.renderPage();
    }
  }

  zoomOut() {
    if (typeof this.scale === 'number' && this.scale > 0.25) {
      this.scale = Math.max(this.scale / 1.25, 0.25);
      this.renderPage();
    } else if (typeof this.scale === 'string') {
      // 如果当前是字符串模式，切换到数字模式
      this.scale = 0.75;
      this.renderPage();
    }
  }

  setScale(scale: number | string) {
    this.scale = scale;
    this.renderPage();
  }

  onScaleChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    if (value === 'fit-width' || value === 'fit-page') {
      this.setScale(value);
    } else {
      this.setScale(parseFloat(value));
    }
  }

  rotateClockwise() {
    this.rotation = (this.rotation + 90) % 360;
    this.renderPage();
  }

  rotateCounterClockwise() {
    this.rotation = (this.rotation - 90 + 360) % 360;
    this.renderPage();
  }

  downloadPDF() {
    if (this.pdfUrl) {
      const link = document.createElement('a');
      link.href = this.pdfUrl;
      link.download = this.pdfUrl.split('/').pop() || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private getErrorMessage(error: any): string {
    console.log('Error details:', error);
    
    if (error.name === 'InvalidPDFException') {
      return '无效的PDF文件格式';
    } else if (error.name === 'MissingPDFException') {
      return 'PDF文件未找到或无法访问';
    } else if (error.name === 'UnexpectedResponseException') {
      return '网络请求失败，请检查文件路径和网络连接';
    } else if (error.message && error.message.includes('CORS')) {
      return 'PDF文件跨域访问被阻止。这是浏览器的安全限制。';
    } else if (error.message && error.message.includes('fetch')) {
      return '网络请求失败，可能是由于CORS政策或网络问题';
    } else {
      return error.message || 'PDF加载失败，请稍后重试';
    }
  }

  // 键盘快捷键支持
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousPage();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextPage();
        break;
      case '+':
      case '=':
        event.preventDefault();
        this.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.zoomOut();
        break;
      case '0':
        event.preventDefault();
        if (typeof this.scale === 'number') {
          this.setScale(1.0);
        } else {
          this.scale = 1.0;
          this.renderPage();
        }
        break;
    }
  }

  // 模板辅助方法
  isZoomOutDisabled(): boolean {
    return typeof this.scale === 'number' && this.scale <= 0.25;
  }

  isZoomInDisabled(): boolean {
    return typeof this.scale === 'number' && this.scale >= 3;
  }

  getScaleDisplayValue(): string {
    if (typeof this.scale === 'number') {
      return Math.round(this.scale * 100) + '%';
    }
    return this.scale === 'fit-width' ? '适合宽度' : 
           this.scale === 'fit-page' ? '适合页面' : '自定义';
  }
}