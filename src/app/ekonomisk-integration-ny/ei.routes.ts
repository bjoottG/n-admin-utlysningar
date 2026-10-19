import { Routes } from '@angular/router';
import { EiEkonomisystemDetaljComponent, EiEkonomisystemListaComponent } from './ekonomisystem.component';
import { EiMallDetaljComponent } from './mall-detalj.component';
import { EiMallNyComponent } from './mall-ny.component';
import { EiMallarListaComponent } from './mallar-lista.component';
import { EiProfilGuideComponent } from './profil-guide.component';
import { EiProfilDetaljComponent } from './profil-detalj.component';
import { EiProfilerListaComponent } from './profiler-lista.component';

/** Ekonomisk integration (NY) – laddas lazy från app.routes.ts. */
export const EI_ROUTES: Routes = [
  { path: '', redirectTo: 'ekonomisystem', pathMatch: 'full' },
  { path: 'ekonomisystem', component: EiEkonomisystemListaComponent },
  { path: 'ekonomisystem/:id', component: EiEkonomisystemDetaljComponent },
  { path: 'konteringsprofiler', component: EiProfilerListaComponent },
  { path: 'konteringsprofiler/ny', component: EiProfilGuideComponent },
  { path: 'konteringsprofiler/:id', component: EiProfilDetaljComponent },
  { path: 'konteringsmallar', component: EiMallarListaComponent },
  { path: 'konteringsmallar/ny', component: EiMallNyComponent },
  { path: 'konteringsmallar/:id', component: EiMallDetaljComponent },
];
