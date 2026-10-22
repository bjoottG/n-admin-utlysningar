import { Routes } from '@angular/router';
import { EiEkonomisystemDetaljComponent, EiEkonomisystemListaComponent } from './ekonomisystem.component';
import { EiKonteringDetaljComponent } from './kontering-detalj.component';
import { EiKonteringNyComponent } from './kontering-ny.component';
import { EiKonteringarListaComponent } from './konteringar-lista.component';
import { EiProfilGuideComponent } from './profil-guide.component';
import { EiProfilDetaljComponent } from './profil-detalj.component';
import { EiProfilerListaComponent } from './profiler-lista.component';

/** Ekonomisk integration (NY) – laddas lazy från app.routes.ts. */
export const EI_ROUTES: Routes = [
  { path: '', redirectTo: 'ekonomisystem', pathMatch: 'full' },
  { path: 'ekonomisystem', component: EiEkonomisystemListaComponent },
  { path: 'ekonomisystem/:id', component: EiEkonomisystemDetaljComponent },
  { path: 'integrationsprofiler', component: EiProfilerListaComponent },
  { path: 'integrationsprofiler/ny', component: EiProfilGuideComponent },
  { path: 'integrationsprofiler/:id', component: EiProfilDetaljComponent },
  { path: 'konteringar', component: EiKonteringarListaComponent },
  { path: 'konteringar/ny', component: EiKonteringNyComponent },
  { path: 'konteringar/:id', component: EiKonteringDetaljComponent },
  // Adresser från version 1
  { path: 'konteringsmallar', redirectTo: 'konteringar' },
];
