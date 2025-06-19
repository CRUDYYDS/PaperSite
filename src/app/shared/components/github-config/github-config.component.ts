// 3. src/app/shared/components/github-config/github-config.component.ts
import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GitHubConfigService } from '../../../core/services/github-config.service';
import { GitHubUploadService } from '../../../core/services/github-upload.service';

@Component({
  selector: 'app-github-config',
  templateUrl: './github-config.component.html',
  styleUrls: ['./github-config.component.scss']
})
export class GitHubConfigComponent {
  @Input() isConfigured = false;
  @Output() configSaved = new EventEmitter<void>();
  @Output() configCleared = new EventEmitter<void>();

  configForm: FormGroup;
  showToken = false;
  isTesting = false;
  testResult: { success: boolean; message: string } | null = null;

  constructor(
    private fb: FormBuilder,
    private configService: GitHubConfigService,
    private uploadService: GitHubUploadService
  ) {
    this.configForm = this.fb.group({
      owner: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-]+$/)]],
      repo: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9\-_.]+$/)]],
      token: ['', [Validators.required, this.tokenValidator.bind(this)]]
    });

    // 加载已保存的配置
    this.loadExistingConfig();
  }

  tokenValidator(control: any) {
    if (!control.value) return null;
    return this.configService.validateToken(control.value) ? null : { invalidToken: true };
  }

  loadExistingConfig() {
    const config = this.configService.getConfig();
    if (config) {
      this.configForm.patchValue({
        owner: config.owner,
        repo: config.repo
        // token不自动填充，需要用户重新输入
      });
    }
  }

  toggleTokenVisibility() {
    this.showToken = !this.showToken;
  }

  async onTest() {
    if (this.configForm.valid) {
      this.isTesting = true;
      this.testResult = null;

      // 临时设置配置进行测试
      const tempConfig = this.configForm.value;
      this.configService.setConfig(tempConfig);

      try {
        await this.uploadService.testConnection();
        this.testResult = {
          success: true,
          message: '成功连接到GitHub仓库！Token有效且具有必要权限。'
        };
      } catch (error: any) {
        this.testResult = {
          success: false,
          message: error.message || '连接测试失败'
        };
      } finally {
        this.isTesting = false;
      }
    }
  }

  onSave() {
    if (this.configForm.valid) {
      const config = this.configForm.value;
      this.configService.setConfig(config);
      this.configSaved.emit();
      
      // 清除测试结果
      this.testResult = null;
    }
  }

  onClear() {
    this.configService.clearConfig();
    this.configForm.reset();
    this.testResult = null;
    this.configCleared.emit();
  }
}