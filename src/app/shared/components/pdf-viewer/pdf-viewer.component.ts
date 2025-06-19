// src/app/shared/components/pdf-viewer/pdf-viewer.component.ts
import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

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

  ngOnInit() {
    // 配置PDF.js worker
    if (typeof pdfjsLib !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }

  ngAfterViewInit() {
    if (this.pdfUrl) {
      this.loadPDF();
    }
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

    this.isLoading = true;
    this.error = null;
    this.loadingProgress = 0;

    try {
      const loadingTask = pdfjsLib.getDocument({
        url: this.pdfUrl,
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true
      });

      // 监听加载进度
      loadingTask.onProgress = (progress: any) => {
        if (progress.total) {
          this.loadingProgress = Math.round((progress.loaded / progress.total) * 100);
        }
      };

      this.pdfDoc = await loadingTask.promise;
      this.totalPages = this.pdfDoc.numPages;
      this.currentPage = 1;
      
      await this.renderPage();
      this.isLoading = false;
    } catch (error: any) {
      console.error('PDF加载失败:', error);
      this.error = this.getErrorMessage(error);
      this.isLoading = false;
    }
  }

  async renderPage() {
    if (!this.pdfDoc || this.isRendering) return;

    this.isRendering = true;

    try {
      const page = await this.pdfDoc.getPage(this.currentPage);
      const canvas = this.pdfCanvas.nativeElement;
      const context = canvas.getContext('2d');

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
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      // 渲染页面
      if (context) {
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
      }

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
    if (error.name === 'InvalidPDFException') {
      return '无效的PDF文件';
    } else if (error.name === 'MissingPDFException') {
      return 'PDF文件未找到';
    } else if (error.name === 'UnexpectedResponseException') {
      return '网络请求失败，请检查文件路径';
    } else {
      return error.message || 'PDF加载失败';
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