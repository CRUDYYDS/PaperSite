// 6. 更新后的 PaperCard 组件中的下载方法
// src/app/shared/components/paper-card/paper-card.component.ts
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Paper } from '../../../models/paper.model';
import { PaperService } from '../../../core/services/paper.service';
import { EnvironmentUtil } from '../../../core/utils/environment.util';

@Component({
  selector: 'app-paper-card',
  templateUrl: './paper-card.component.html',
  styleUrls: ['./paper-card.component.scss']
})
export class PaperCardComponent {
  @Input() paper!: Paper;

  constructor(
    private router: Router,
    private paperService: PaperService
  ) {}

  viewDetails() {
    this.router.navigate(['/paper', this.paper.id]);
  }

  downloadPaper(event: Event) {
    event.stopPropagation();
    
    // 增加下载计数
    this.paperService.incrementDownloadCount(this.paper.id);
    
    // 获取正确的文件路径
    const downloadUrl = this.paper.fileUrl || EnvironmentUtil.getPaperPath(this.paper.filePath);
    
    // 打开下载链接
    window.open(downloadUrl, '_blank');
  }

  getAuthorsText(): string {
    if (this.paper.authors.length <= 2) {
      return this.paper.authors.join(', ');
    }
    return `${this.paper.authors[0]} 等 ${this.paper.authors.length} 人`;
  }
}