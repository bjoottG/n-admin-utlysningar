import { Routes } from '@angular/router';
import { UtlysningarListaComponent } from './utlysningar/utlysningar-lista.component';
import { SkapaUtlysningComponent } from './skapa-utlysning/skapa-utlysning.component';
import { UtlysningDetaljComponent } from './utlysning-detalj/utlysning-detalj.component';
import { LasComponent, lasGuard } from './las/las.component';

export const routes: Routes = [
  { path: 'las', component: LasComponent },
  { path: 'utlysningar', component: UtlysningarListaComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/ny', component: SkapaUtlysningComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/:id', component: UtlysningDetaljComponent, canActivate: [lasGuard] },
  { path: '', redirectTo: 'utlysningar', pathMatch: 'full' },
  { path: '**', redirectTo: 'utlysningar' },
];
