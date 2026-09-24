import { Routes } from '@angular/router';
import { StartsidaComponent } from './startsida/startsida.component';
import { FinansieringComponent } from './finansiering/finansiering.component';
import { UtlysningarListaComponent } from './utlysningar/utlysningar-lista.component';
import { SkapaUtlysningComponent } from './skapa-utlysning/skapa-utlysning.component';
import { UtlysningDetaljComponent } from './utlysning-detalj/utlysning-detalj.component';
import { LasComponent, lasGuard } from './las/las.component';

export const routes: Routes = [
  { path: 'las', component: LasComponent },
  { path: '', component: StartsidaComponent, canActivate: [lasGuard], pathMatch: 'full' },
  { path: 'finansiering', component: FinansieringComponent, canActivate: [lasGuard] },
  { path: 'utlysningar', component: UtlysningarListaComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/ny', component: SkapaUtlysningComponent, canActivate: [lasGuard] },
  { path: 'utlysningar/:id', component: UtlysningDetaljComponent, canActivate: [lasGuard] },
  // Utlysningar (NY): samma komponenter, men finansieringsmedel ersatt av Finansiering och med borttagning.
  { path: 'utlysningar-ny', component: UtlysningarListaComponent, canActivate: [lasGuard], data: { variant: 'ny' } },
  { path: 'utlysningar-ny/ny', component: SkapaUtlysningComponent, canActivate: [lasGuard], data: { variant: 'ny' } },
  { path: 'utlysningar-ny/:id', component: UtlysningDetaljComponent, canActivate: [lasGuard], data: { variant: 'ny' } },
  { path: '**', redirectTo: '' },
];
