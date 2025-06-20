# PaperSite 软件工程文档

## 项目概述

**项目名称**: PaperSite - 学术论文管理系统  
**版本**: v1.0.0  
**最后更新**: 2025年6月20日

---

## 1. 需求文档

### 1.1 项目背景

随着学术研究的不断发展，研究人员需要一个高效、直观的平台来管理、浏览和分享学术论文。PaperSite旨在提供一个现代化的Web应用，支持论文的在线预览、分类管理和便捷搜索。

### 1.2 功能需求

#### 1.2.1 核心功能
- **F001**: 论文浏览 - 用户可以浏览所有论文列表，支持分页显示
- **F002**: 论文详情 - 显示论文的详细信息，包括标题、作者、摘要、关键词等
- **F003**: PDF预览 - 在线预览PDF论文内容，无需下载
- **F004**: 论文搜索 - 支持按标题、作者、关键词搜索论文
- **F005**: 分类筛选 - 按学科分类筛选论文
- **F006**: 论文下载 - 提供PDF文件下载功能

#### 1.2.2 管理功能
- **F007**: 论文上传 - 通过GitHub API上传新论文
- **F008**: 元数据管理 - 添加和编辑论文的元信息
- **F009**: 分类管理 - 管理论文分类体系
- **F010**: GitHub集成 - 与GitHub仓库同步论文文件

#### 1.2.3 用户体验功能
- **F011**: 响应式设计 - 适配桌面端和移动端设备
- **F012**: 加载状态 - 显示加载进度和状态反馈
- **F013**: 错误处理 - 友好的错误提示和处理机制
- **F014**: 快捷键支持 - PDF预览支持键盘快捷键操作

### 1.3 非功能需求

#### 1.3.1 性能需求
- **NFR001**: 页面加载时间不超过3秒
- **NFR002**: PDF预览响应时间不超过5秒
- **NFR003**: 支持并发用户数不少于100人

#### 1.3.2 兼容性需求
- **NFR004**: 支持Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- **NFR005**: 响应式设计，支持1024px及以上桌面端，768px及以上平板端
- **NFR006**: 移动端兼容iOS 12+和Android 8+

#### 1.3.3 安全需求
- **NFR007**: GitHub Token安全管理，仅会话存储
- **NFR008**: 防止XSS和CSRF攻击
- **NFR009**: HTTPS加密传输

#### 1.3.4 可用性需求
- **NFR010**: 系统可用性达到99.5%
- **NFR011**: 用户界面直观易用，新用户5分钟内能掌握基本操作

### 1.4 用户故事

#### 1.4.1 研究人员用户
```
作为一名研究人员
我希望能够快速搜索相关领域的论文
以便找到我研究需要的参考文献
```

#### 1.4.2 学生用户
```
作为一名学生
我希望能够在线预览PDF论文
以便在不下载的情况下快速浏览论文内容
```

#### 1.4.3 管理员用户
```
作为系统管理员
我希望能够批量上传和管理论文
以便维护一个完整的论文数据库
```

---

## 2. 设计文档 (Design)

### 2.1 系统架构

#### 2.1.1 整体架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端应用      │    │   静态资源      │    │   GitHub API    │
│   (Angular)     │◄──►│   (JSON/PDF)    │◄──►│                 │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 2.1.2 技术栈
- **前端框架**: Angular 17
- **编程语言**: TypeScript
- **样式语言**: SCSS
- **PDF处理**: PDF.js 3.11.174
- **HTTP客户端**: Angular HttpClient
- **状态管理**: RxJS
- **构建工具**: Angular CLI
- **部署平台**: GitHub Pages

### 2.2 模块设计

#### 2.2.1 核心模块结构
```
src/app/
├── core/                   # 核心模块
│   ├── services/          # 核心服务
│   └── utils/             # 工具类
├── features/              # 功能模块
│   ├── home/              # 首页
│   ├── paper-list/        # 论文列表
│   ├── paper-detail/      # 论文详情
│   └── search/            # 搜索功能
├── shared/                # 共享模块
│   ├── components/        # 共享组件
│   └── pipes/             # 管道
├── layout/                # 布局组件
├── admin/                 # 管理功能
└── models/                # 数据模型
```

#### 2.2.2 数据模型
```typescript
interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  keywords: string[];
  category: string;
  publishDate: string;
  fileName: string;
  fileSize: number;
  repository: string;
  filePath: string;
  fileUrl?: string;
  downloadCount: number;
  createdAt: string;
}
```

### 2.3 用户界面设计

#### 2.3.1 设计原则
- **简洁性**: 界面简洁清晰，避免冗余元素
- **一致性**: 保持视觉和交互的一致性
- **可访问性**: 支持键盘导航和屏幕阅读器
- **响应性**: 适配不同设备和屏幕尺寸

#### 2.3.2 页面布局
```
┌─────────────────────────────────────┐
│            Header (导航栏)           │
├─────────────────────────────────────┤
│                                     │
│            Main Content             │
│                                     │
├─────────────────────────────────────┤
│            Footer                   │
└─────────────────────────────────────┘
```

#### 2.3.3 色彩方案
- **主色调**: #007bff (蓝色)
- **辅助色**: #6c757d (灰色)
- **成功色**: #28a745 (绿色)
- **警告色**: #ffc107 (黄色)
- **错误色**: #dc3545 (红色)

### 2.4 数据库设计

#### 2.4.1 数据存储方案
采用JSON文件作为数据存储，包括：
- `papers.json`: 论文数据和元信息
- `categories.json`: 分类数据

#### 2.4.2 文件存储方案
- **PDF文件**: 存储在GitHub仓库的`papers/`目录
- **元数据**: 存储在`data/`目录

---

## 3. 开发文档 (Development)

### 3.1 开发环境

#### 3.1.1 环境要求
- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **Angular CLI**: 17.x
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+

#### 3.1.2 项目初始化
```bash
# 克隆项目
git clone https://github.com/CRUDYYDS/PaperSite.git
cd PaperSite

# 安装依赖
npm install

# 启动开发服务器
ng serve

# 构建项目
ng build
```

### 3.2 开发规范

#### 3.2.1 代码规范
- **TypeScript**: 使用严格模式，启用所有类型检查
- **命名规范**: 
  - 组件: PascalCase (e.g., `PaperDetailComponent`)
  - 服务: PascalCase + Service (e.g., `PaperService`)
  - 变量/方法: camelCase
  - 常量: UPPER_SNAKE_CASE
- **文件命名**: kebab-case (e.g., `paper-detail.component.ts`)

#### 3.2.2 组件开发规范
```typescript
@Component({
  selector: 'app-paper-detail',
  templateUrl: './paper-detail.component.html',
  styleUrls: ['./paper-detail.component.scss']
})
export class PaperDetailComponent implements OnInit {
  // 按以下顺序组织代码：
  // 1. @Input() 属性
  // 2. @Output() 属性
  // 3. public 属性
  // 4. private 属性
  // 5. constructor
  // 6. 生命周期钩子
  // 7. public 方法
  // 8. private 方法
}
```

#### 3.2.3 服务开发规范
```typescript
@Injectable({
  providedIn: 'root'
})
export class PaperService {
  // 使用依赖注入
  constructor(private http: HttpClient) {}
  
  // 返回Observable
  getPapers(): Observable<Paper[]> {
    return this.http.get<Paper[]>('/api/papers');
  }
  
  // 错误处理
  private handleError(error: HttpErrorResponse) {
    // 错误处理逻辑
  }
}
```

### 3.3 关键组件实现

#### 3.3.1 PDF预览组件
```typescript
export class PdfViewerComponent implements OnInit, AfterViewInit {
  @Input() pdfUrl!: string;
  @ViewChild('pdfCanvas') pdfCanvas!: ElementRef<HTMLCanvasElement>;
  
  private pdfDoc: any = null;
  currentPage = 1;
  totalPages = 0;
  scale: number | string = 1.0;
  
  async loadPDF() {
    const loadingTask = pdfjsLib.getDocument({
      url: this.pdfUrl,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
      cMapPacked: true
    });
    
    this.pdfDoc = await loadingTask.promise;
    this.totalPages = this.pdfDoc.numPages;
    await this.renderPage();
  }
}
```

#### 3.3.2 GitHub集成服务
```typescript
export class GitHubUploadService {
  private readonly API_BASE = 'https://api.github.com';
  
  async uploadFile(file: File, path: string): Promise<any> {
    const base64Content = await this.fileToBase64(file);
    const uploadData = {
      message: `Upload ${file.name}`,
      content: base64Content,
      committer: {
        name: 'Papers Site',
        email: 'papers-site@example.com'
      }
    };
    
    return this.http.put(`${this.API_BASE}/repos/owner/repo/contents/${path}`, uploadData);
  }
}
```

### 3.4 环境配置

#### 3.4.1 开发环境配置
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  githubPagesMode: false,
  baseHref: '/'
};
```

#### 3.4.2 生产环境配置
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  githubPagesMode: true,
  baseHref: '/PaperSite/'
};
```

---

## 4. 测试文档 (Testing)

### 4.1 测试策略

#### 4.1.1 测试金字塔
```
┌─────────────────┐
│   E2E Tests     │  ← 少量端到端测试
├─────────────────┤
│ Integration     │  ← 适量集成测试
│    Tests        │
├─────────────────┤
│   Unit Tests    │  ← 大量单元测试
└─────────────────┘
```

#### 4.1.2 测试类型
- **单元测试**: 测试组件、服务、管道的独立功能
- **集成测试**: 测试组件间的交互和数据流
- **端到端测试**: 测试完整的用户流程

### 4.2 单元测试

#### 4.2.1 组件测试示例
```typescript
describe('PaperDetailComponent', () => {
  let component: PaperDetailComponent;
  let fixture: ComponentFixture<PaperDetailComponent>;
  let paperService: jasmine.SpyObj<PaperService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PaperService', ['getPaperById']);
    
    TestBed.configureTestingModule({
      declarations: [PaperDetailComponent],
      providers: [
        { provide: PaperService, useValue: spy }
      ]
    });
    
    fixture = TestBed.createComponent(PaperDetailComponent);
    component = fixture.componentInstance;
    paperService = TestBed.inject(PaperService) as jasmine.SpyObj<PaperService>;
  });

  it('should load paper on init', async () => {
    const mockPaper = { id: '1', title: 'Test Paper' };
    paperService.getPaperById.and.returnValue(Promise.resolve(mockPaper));
    
    await component.loadPaper('1');
    
    expect(component.paper).toEqual(mockPaper);
  });
});
```

#### 4.2.2 服务测试示例
```typescript
describe('PaperService', () => {
  let service: PaperService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaperService]
    });
    
    service = TestBed.inject(PaperService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should fetch papers', () => {
    const mockPapers = [{ id: '1', title: 'Test Paper' }];
    
    service.getPapers().subscribe(papers => {
      expect(papers).toEqual(mockPapers);
    });
    
    const req = httpMock.expectOne('/data/papers.json');
    expect(req.request.method).toBe('GET');
    req.flush({ papers: mockPapers });
  });
});
```

### 4.3 集成测试

#### 4.3.1 PDF预览集成测试
```typescript
describe('PDF Viewer Integration', () => {
  it('should load and display PDF', async () => {
    const component = fixture.componentInstance;
    component.pdfUrl = '/test.pdf';
    
    await component.loadPDF();
    
    expect(component.totalPages).toBeGreaterThan(0);
    expect(component.currentPage).toBe(1);
  });
});
```

### 4.4 端到端测试

#### 4.4.1 用户流程测试
```typescript
describe('Paper browsing flow', () => {
  it('should allow user to browse and view paper', async () => {
    await page.goto('/papers');
    
    // 点击第一个论文
    await page.click('.paper-card:first-child');
    
    // 验证论文详情页面
    await expect(page.locator('.paper-title')).toBeVisible();
    
    // 点击PDF预览
    await page.click('[data-testid="pdf-preview-tab"]');
    
    // 验证PDF加载
    await expect(page.locator('.pdf-canvas')).toBeVisible();
  });
});
```

### 4.5 测试覆盖率

#### 4.5.1 覆盖率目标
- **行覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 85%

#### 4.5.2 测试执行命令
```bash
# 运行单元测试
ng test

# 运行测试并生成覆盖率报告
ng test --code-coverage

# 运行端到端测试
ng e2e
```

---

## 5. 部署文档 (Deployment)

### 5.1 部署架构

#### 5.1.1 部署环境
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  开发环境       │    │  GitHub仓库     │    │  GitHub Pages   │
│  (localhost)    │───►│  (源代码)       │───►│  (生产环境)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

#### 5.1.2 CI/CD流程
```
开发者推送代码 → GitHub Actions触发 → 自动构建 → 自动部署到GitHub Pages
```

### 5.2 GitHub Pages部署

#### 5.2.1 部署配置
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build
      run: ng build --configuration production
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

#### 5.2.2 构建配置
```json
// angular.json
{
  "configurations": {
    "production": {
      "baseHref": "/PaperSite/",
      "deployUrl": "/PaperSite/",
      "outputHashing": "all",
      "sourceMap": false,
      "optimization": true,
      "buildOptimizer": true
    }
  }
}
```

### 5.3 环境变量配置

#### 5.3.1 GitHub Secrets
```
GITHUB_TOKEN: GitHub访问令牌 (自动生成)
```

#### 5.3.2 环境配置文件
```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  githubPagesMode: true,
  baseHref: '/PaperSite/',
  apiUrl: 'https://crudyyds.github.io/PaperSite'
};
```

### 5.4 部署清单

#### 5.4.1 部署前检查
- [ ] 代码通过所有测试
- [ ] 构建无错误和警告
- [ ] 环境配置正确
- [ ] 静态资源路径配置正确
- [ ] PDF文件路径映射正确

#### 5.4.2 部署步骤
1. **推送代码到main分支**
   ```bash
   git add .
   git commit -m "Deploy: update features"
   git push origin main
   ```

2. **等待GitHub Actions完成**
   - 监控Actions页面的构建状态
   - 检查构建日志确认无错误

3. **验证部署结果**
   - 访问生产环境URL
   - 测试关键功能
   - 检查PDF预览功能

#### 5.4.3 回滚策略
如果部署出现问题：
1. **快速回滚**: 恢复到上一个工作版本的commit
2. **修复部署**: 修复问题后重新部署
3. **热修复**: 对关键问题进行紧急修复

### 5.5 监控和维护

#### 5.5.1 性能监控
- **页面加载时间**: 使用浏览器开发者工具监控
- **资源大小**: 监控bundle大小和资源加载
- **用户体验**: 监控核心功能的响应时间

#### 5.5.2 日常维护
- **依赖更新**: 定期更新npm依赖包
- **安全更新**: 及时应用安全补丁
- **性能优化**: 定期检查和优化性能
- **备份**: 定期备份重要数据和配置

#### 5.5.3 故障处理
```
故障发现 → 问题诊断 → 影响评估 → 修复方案 → 实施修复 → 验证结果 → 总结改进
```

---

## 6. 总结

### 6.1 项目达成目标

- 达成一个较为完整的论文管理系统，符合基本需求（真实需求）
- 实现了CICD
- 依托于github平台，该项目资源完全免费

### 6.2 未来展望

- 添加自动分析论文，并填充参数功能
- 添加论文笔记功能
- 横向使用多github仓库，扩展项目存储空间
- 添加博客功能

---