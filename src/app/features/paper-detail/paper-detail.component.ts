// src/app/features/paper-detail/paper-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PaperService } from '../../core/services/paper.service';
import { Paper } from '../../models/paper.model';

@Component({
  selector: 'app-paper-detail',
  templateUrl: './paper-detail.component.html',
  styleUrls: ['./paper-detail.component.scss']
})
export class PaperDetailComponent implements OnInit {
  paper: Paper | null = null;

  constructor(
    private route: ActivatedRoute,
    private paperService: PaperService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.paper = await this.paperService.getPaperById(id);
    }
  }

  downloadPaper() {
    if (this.paper) {
      window.open(this.paper.fileUrl || this.paper.filePath, '_blank');
    }
  }

  goBack() {
    window.history.back();
  }
}