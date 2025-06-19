// 9. src/app/features/home/home.component.ts
import { Component, OnInit } from '@angular/core';
import { PaperService } from '../../core/services/paper.service';
import { Paper } from '../../models/paper.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  recentPapers: Paper[] = [];

  constructor(private paperService: PaperService) {}

  async ngOnInit() {
    const result = await this.paperService.getPapers({ pageSize: 6 });
    this.recentPapers = result.papers;
  }

  onSearch(query: string) {
    // 导航到搜索页面
  }
}