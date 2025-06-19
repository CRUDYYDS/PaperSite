// src/app/features/paper-list/paper-list.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaperService } from '../../core/services/paper.service';
import { Paper, Category } from '../../models/paper.model';

@Component({
  selector: 'app-paper-list',
  templateUrl: './paper-list.component.html',
  styleUrls: ['./paper-list.component.scss']
})
export class PaperListComponent implements OnInit {
  papers: Paper[] = [];
  categories: Category[] = [];
  selectedCategory = '';
  sortBy = 'date';
  currentPage = 1;
  pageSize = 20;
  totalPapers = 0;
  loading = false;

  constructor(
    private paperService: PaperService,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.categories = await this.paperService.getCategories();
    this.route.params.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      this.loadPapers();
    });
  }

  async loadPapers() {
    this.loading = true;
    const result = await this.paperService.getPapers({
      page: this.currentPage,
      pageSize: this.pageSize,
      category: this.selectedCategory,
      sortBy: this.sortBy
    });
    this.papers = result.papers;
    this.totalPapers = result.total;
    this.loading = false;
  }

  applyFilters() {
    this.currentPage = 1;
    this.loadPapers();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadPapers();
  }
}