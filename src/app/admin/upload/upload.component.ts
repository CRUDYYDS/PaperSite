// src/app/admin/upload/upload.component.ts (安全版本)
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GitHubConfigService } from '../../core/services/github-config.service';
import { GitHubUploadService } from '../../core/services/github-upload.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit, OnDestroy {
  uploadForm: FormGroup;
  selectedFiles: File[] = [];
  isUploading = false;
  uploadProgress = 0;
  uploadStatus = '';
  currentFileIndex = -1;
  uploadResult: any = null;
  uploadLog: any[] = [];
  
  isConfigured = false;
  showConfigForm = false;
  
  private configSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private configService: GitHubConfigService,
    private uploadService: GitHubUploadService
  ) {
    this.uploadForm = this.fb.group({
      title: ['', Validators.required],
      authors: ['', Validators.required],
      abstract: [''],
      keywords: [''],
      category: ['', Validators.required],
      publishDate: [new Date().toISOString().split('T')[0], Validators.required],
      branch: ['main'],
      autoGenerate: [true],
      updateCategories: [true]
    });
  }

  ngOnInit() {
    // 监听配置状态变化
    this.configSubscription = this.configService.config$.subscribe(config => {
      this.isConfigured = this.configService.isConfigured();
      if (!this.isConfigured) {
        this.showConfigForm = true;
      }
    });
  }

  ngOnDestroy() {
    this.configSubscription?.unsubscribe();
  }

  // 配置相关方法
  toggleConfigForm() {
    this.showConfigForm = !this.showConfigForm;
  }

  onConfigSaved() {
    this.showConfigForm = false;
    this.isConfigured = true;
    this.addLog('success', 'GitHub配置已保存');
  }

  onConfigCleared() {
    this.isConfigured = false;
    this.showConfigForm = true;
    this.addLog('info', 'GitHub配置已清除');
  }

  // 文件选择和拖拽
  onFileSelect(event: any) {
    const files = Array.from(event.target.files as FileList) as File[];
    this.addFiles(files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    (event.target as HTMLElement).classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.addFiles(files);
  }

  addFiles(files: File[]) {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    const validFiles = pdfFiles.filter(file => file.size <= 25 * 1024 * 1024); // 25MB限制
    
    if (pdfFiles.length !== files.length) {
      this.addLog('error', '只支持PDF文件');
    }
    
    if (validFiles.length !== pdfFiles.length) {
      this.addLog('error', '某些文件超过25MB限制');
    }
    
    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    this.addLog('info', `已选择 ${validFiles.length} 个文件`);
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
    this.addLog('info', '已移除文件');
  }

  // 上传处理
  async onSubmit() {
    if (this.uploadForm.valid && this.selectedFiles.length > 0 && this.isConfigured) {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadResult = null;
      this.uploadLog = [];
      this.currentFileIndex = 0;

      try {
        await this.performUpload();
      } catch (error: any) {
        this.addLog('error', `上传失败: ${error.message}`);
        this.uploadResult = {
          success: false,
          message: error.message || '上传过程中发生错误'
        };
      } finally {
        this.isUploading = false;
        this.currentFileIndex = -1;
      }
    }
  }

  private async performUpload() {
    const formData = this.uploadForm.value;
    let uploadedFiles = 0;
    let commitSha = '';

    this.addLog('info', '开始上传流程...');

    for (let i = 0; i < this.selectedFiles.length; i++) {
      this.currentFileIndex = i;
      const file = this.selectedFiles[i];
      
      this.uploadStatus = `正在上传文件: ${file.name}`;
      this.addLog('info', `上传文件 ${i + 1}/${this.selectedFiles.length}: ${file.name}`);
      
      // 生成文件路径
      const year = new Date().getFullYear();
      const category = this.sanitizeCategory(formData.category);
      const fileName = formData.autoGenerate ? 
        this.generateFileName(file.name, formData.title) : 
        file.name;
      const filePath = `papers/${year}/${category}/${fileName}`;

      try {
        // 上传PDF文件
        const uploadResponse = await this.uploadService.uploadFile(file, filePath);
        this.addLog('success', `文件上传成功: ${fileName}`);
        
        uploadedFiles++;
        this.uploadProgress = (i / this.selectedFiles.length) * 80; // 80%用于文件上传
        
        // 为最后一个文件创建论文记录
        if (i === this.selectedFiles.length - 1) {
          this.uploadStatus = '更新论文数据库...';
          this.addLog('info', '正在更新papers.json...');
          
          const paperData = this.createPaperData(formData, file, filePath);
          const updateResponse = await this.uploadService.updatePapersJson(paperData);
          
          commitSha = updateResponse.commit?.sha || '';
          this.addLog('success', '数据库更新成功');
        }
        
      } catch (error: any) {
        this.addLog('error', `文件上传失败 ${fileName}: ${error.message}`);
        throw error;
      }
    }

    this.uploadProgress = 100;
    this.uploadStatus = '上传完成！';
    this.addLog('success', `成功上传 ${uploadedFiles} 个文件`);

    this.uploadResult = {
      success: true,
      message: `成功上传 ${uploadedFiles} 个论文文件`,
      filesUploaded: uploadedFiles,
      commitSha: commitSha
    };
  }

  // 工具方法
  private sanitizeCategory(category: string): string {
    const categoryMap: { [key: string]: string } = {
      '人工智能': 'ai',
      '机器学习': 'ml',
      '计算机科学': 'cs',
      '数学': 'math',
      '物理学': 'physics',
      '生物学': 'biology',
      '化学': 'chemistry',
      '其他': 'other'
    };
    return categoryMap[category] || 'other';
  }

  private generateFileName(originalName: string, title: string): string {
    const timestamp = Date.now();
    const titleSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '_')
      .substring(0, 50);
    const extension = originalName.substring(originalName.lastIndexOf('.'));
    return `${timestamp}_${titleSlug}${extension}`;
  }

  private createPaperData(formData: any, file: File, filePath: string) {
    return {
      id: this.generateId(),
      title: formData.title,
      authors: formData.authors.split(',').map((a: string) => a.trim()),
      abstract: formData.abstract || '',
      keywords: formData.keywords ? 
        formData.keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k) : 
        [],
      category: formData.category,
      publishDate: formData.publishDate,
      fileName: file.name,
      fileSize: file.size,
      repository: formData.branch || 'main',
      filePath: filePath,
      downloadCount: 0,
      createdAt: new Date().toISOString()
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private addLog(type: 'info' | 'success' | 'error', message: string) {
    this.uploadLog.push({
      type,
      message,
      time: new Date()
    });
  }

  // 重置方法
  resetForm() {
    this.uploadForm.reset();
    this.uploadForm.patchValue({
      publishDate: new Date().toISOString().split('T')[0],
      branch: 'main',
      autoGenerate: true,
      updateCategories: true
    });
    this.selectedFiles = [];
    this.uploadProgress = 0;
    this.uploadStatus = '';
    this.addLog('info', '表单已重置');
  }

  resetUpload() {
    this.uploadResult = null;
    this.uploadLog = [];
    this.uploadProgress = 0;
    this.uploadStatus = '';
    this.currentFileIndex = -1;
  }

  // 导航方法
  viewPapers() {
    this.router.navigate(['/papers']);
  }

  getCurrentFileName(): string {
    if (this.currentFileIndex >= 0 && this.currentFileIndex < this.selectedFiles.length) {
      const file = this.selectedFiles[this.currentFileIndex];
      return file ? file.name : '未知文件';
    }
    return '未知文件';
  }
}
