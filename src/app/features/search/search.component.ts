// src/app/features/search/search.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PaperService } from '../../core/services/paper.service';
import { Paper } from '../../models/paper.model';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchResults: Paper[] = [];
  currentQuery = '';
  hasSearched = false;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paperService: PaperService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.currentQuery = params['q'];
        this.performSearch();
      }
    });
  }

  onSearch(query: string) {
    this.currentQuery = query;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { q: query },
      queryParamsHandling: 'merge'
    });
  }

  async performSearch() {
    if (!this.currentQuery.trim()) return;

    this.loading = true;
    this.hasSearched = true;
    this.searchResults = await this.paperService.searchPapers(this.currentQuery);
    this.loading = false;
  }
}