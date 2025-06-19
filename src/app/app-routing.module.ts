// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { PaperListComponent } from './features/paper-list/paper-list.component';
import { PaperDetailComponent } from './features/paper-detail/paper-detail.component';
import { SearchComponent } from './features/search/search.component';
import { UploadComponent } from './admin/upload/upload.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'papers', component: PaperListComponent },
  { path: 'paper/:id', component: PaperDetailComponent },
  { path: 'search', component: SearchComponent },
  { path: 'admin/upload', component: UploadComponent },
  { path: '**', redirectTo: '/home' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // 支持 GitHub Pages 路由
    useHash: false,
    enableTracing: false
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
