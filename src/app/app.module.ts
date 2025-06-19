// 2. src/app/app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './features/home/home.component';
import { PaperListComponent } from './features/paper-list/paper-list.component';
import { PaperDetailComponent } from './features/paper-detail/paper-detail.component';
import { SearchComponent } from './features/search/search.component';
import { UploadComponent } from './admin/upload/upload.component';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { PaperCardComponent } from './shared/components/paper-card/paper-card.component';
import { SearchBoxComponent } from './shared/components/search-box/search-box.component';
import { LoadingComponent } from './shared/components/loading/loading.component';
import { PaginationComponent } from './shared/components/pagination/pagination.component';
import { TruncatePipe } from './shared/pipes/truncate.pipe';
import { FileSizePipe } from './shared/pipes/filesize.pipe';
import {GitHubConfigComponent} from './shared/components/github-config/github-config.component'


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PaperListComponent,
    PaperDetailComponent,
    SearchComponent,
    UploadComponent,
    HeaderComponent,
    FooterComponent,
    PaperCardComponent,
    SearchBoxComponent,
    LoadingComponent,
    PaginationComponent,
    TruncatePipe,
    FileSizePipe,
    GitHubConfigComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
