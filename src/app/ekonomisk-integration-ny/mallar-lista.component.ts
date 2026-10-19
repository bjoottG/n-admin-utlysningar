import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiBegreppComponent, EiRamComponent, K } from './ei-delade';
import { MALLSTATUS_NAMN, TemplateStatus } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';
import { EiMallTabellComponent } from './mall-tabell.component';

@Component({
  selector: 'app-ei-mallar-lista',
  imports: [FormsModule, RouterLink, EiRamComponent, EiBegreppComponent, EiMallTabellComponent],
  template: `
    <app-ei-ram flik="mallar">
      <div class="flex items-center justify-between gap-4 flex-wrap mb-3">
        <h2 class="flex items-center gap-1 text-lg font-semibold text-text">
          Konteringsmallar <app-ei-begrepp term="Konteringsmall" />
        </h2>
        <a [routerLink]="bas + '/konteringsmallar/ny'" [class]="k.primar">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          Ny konteringsmall
        </a>
      </div>

      <div class="bg-surface border border-border">
        <div class="flex items-end gap-4 flex-wrap px-5 py-4">
          <div class="w-full max-w-[300px]">
            <label for="ei-f-sok" [class]="k.etikett">Sök</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted pointer-events-none" aria-hidden="true">search</span>
              <input id="ei-f-sok" type="text" autocomplete="off" placeholder="Namn, profil eller Avsedd för …" [ngModel]="sok()" (ngModelChange)="sok.set($event)" [class]="k.falt + ' pl-9'" />
            </div>
          </div>
          <div>
            <label for="ei-f-org" [class]="k.etikett">Utbetalande organisation</label>
            <select id="ei-f-org" [ngModel]="org()" (ngModelChange)="org.set($event); profil.set('')" [class]="k.falt">
              <option value="">Alla</option>
              @for (o of service.organisationer(); track o.id) { <option [value]="o.id">{{ o.name }}</option> }
            </select>
          </div>
          <div>
            <label for="ei-f-profil" [class]="k.etikett">Konteringsprofil</label>
            <select id="ei-f-profil" [ngModel]="profil()" (ngModelChange)="profil.set($event)" [class]="k.falt">
              <option value="">Alla</option>
              @for (p of profilval(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
            </select>
          </div>
          <div>
            <label for="ei-f-status" [class]="k.etikett">Status</label>
            <select id="ei-f-status" [ngModel]="status()" (ngModelChange)="status.set($event)" [class]="k.falt">
              <option value="">Alla</option>
              @for (s of statusar; track s) { <option [value]="s">{{ statusNamn[s] }}</option> }
            </select>
          </div>
          @if (antalFilter()) {
            <button type="button" (click)="rensa()" class="py-2 text-sm" [class]="k.lank">Rensa filter ({{ antalFilter() }})</button>
          }
        </div>
        <p class="px-5 pb-2 text-[13px] text-text-muted" aria-live="polite">Visar {{ filtrerade().length }} av {{ service.mallar().length }} konteringsmallar</p>
        <app-ei-mall-tabell [mallar]="filtrerade()" />
      </div>
    </app-ei-ram>
  `,
})
export class EiMallarListaComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly statusar: TemplateStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
  readonly statusNamn = MALLSTATUS_NAMN;

  readonly sok = signal('');
  readonly org = signal('');
  readonly profil = signal('');
  readonly status = signal<TemplateStatus | ''>('');

  readonly profilval = computed(() =>
    this.service.profiler().filter((p) => !this.org() || p.organisationId === this.org()),
  );

  readonly antalFilter = computed(
    () => [this.sok().trim(), this.org(), this.profil(), this.status()].filter(Boolean).length,
  );

  readonly filtrerade = computed(() => {
    const s = this.sok().trim().toLowerCase();
    return this.service.mallar().filter((t) => {
      const p = this.service.hamtaProfil(t.profileId);
      if (this.org() && p?.organisationId !== this.org()) return false;
      if (this.profil() && t.profileId !== this.profil()) return false;
      if (this.status() && t.status !== this.status()) return false;
      if (!s) return true;
      return [
        t.name,
        p?.name ?? '',
        this.service.hamtaFinansieringsmedel(t.intendedFor.fundingSourceId)?.anslag ?? '',
        this.service.hamtaBeslutande(t.intendedFor.decidingOrganisationId)?.name ?? '',
      ].some((f) => f.toLowerCase().includes(s));
    });
  });

  rensa(): void {
    this.sok.set('');
    this.org.set('');
    this.profil.set('');
    this.status.set('');
  }
}
