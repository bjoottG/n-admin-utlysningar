import { Routes } from '@angular/router';
import { NyUtlysningComponent } from './ny-utlysning/ny-utlysning.component';
import { UtlysningDetaljComponent } from './utlysning-detalj/utlysning-detalj.component';

export const routes: Routes = [
  { path: 'utlysning/ny', component: NyUtlysningComponent },
  { path: 'utlysning/detalj', component: UtlysningDetaljComponent },
  { path: '', redirectTo: 'utlysning/ny', pathMatch: 'full' },
];
