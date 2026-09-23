import { Routes } from '@angular/router';
import { StartsidaComponent } from './startsida/startsida.component';
import { UtlysningarListaComponent } from './utlysningar/utlysningar-lista.component';
import { SkapaUtlysningComponent } from './skapa-utlysning/skapa-utlysning.component';
import { UtlysningDetaljComponent } from './utlysning-detalj/utlysning-detalj.component';
import { LasComponent, lasGuard } from './las/las.component';

export const routes: Routes = [
  { path: 'las', component: LasComponent },
  { path: '', component: StartsidaComponent, canActivate: [lasGuard], pathMatch: 'full' },
  { path: 'utlysningar', component: UtlysningarListaComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/ny', component: SkapaUtlysningComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/:id', component: UtlysningDetaljComponent, canActivate: [lasGuard] },
  { path: '**', redirectTo: '' },
];
