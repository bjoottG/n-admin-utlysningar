import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiRamComponent, K } from './ei-delade';
import { KONTERINGSSTATUS_NAMN, PostingConfigStatus } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';
import { EiKonteringTabellComponent } from './kontering-tabell.component';
import { EiTestaUppslagComponent } from './testa-uppslag.component';

@Component({
  selector: 'app-ei-konteringar-lista',
  imports: [FormsModule, RouterLink, EiRamComponent, EiKonteringTabellComponent, EiTestaUppslagComponent],
  template: `
    <app-ei-ram flik="konteringar">
      <div class="flex items-center justify-between gap-4 flex-wrap mb-1">
        <h2 class="flex items-center gap-1 text-lg font-semibold text-text">
          Konteringar
        </h2>
        <div class="flex items-center gap-2">
          <button type="button" (click)="uppslagOppen.set(true)" [class]="k.sekundar">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>
            Testa uppslag
          </button>
          <a [routerLink]="bas + '/konteringar/ny'" [class]="k.primar">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Ny kontering
          </a>
        </div>
      </div>
      <p class="text-sm text-text-secondary mb-3">
        En kontering används när ett ärende med samma finansieringsmedel, beslutande organisation och flöde betalas ut.
      </p>

      <div class="bg-surface border border-border">
        <div class="flex items-end gap-4 flex-wrap px-5 py-4">
          <div class="w-full max-w-[260px]">
            <label for="ei-f-sok" [class]="k.etikett">Sök</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted pointer-events-none" aria-hidden="true">search</span>
              <input id="ei-f-sok" type="text" autocomplete="off" placeholder="Fritext …" [ngModel]="sok()" (ngModelChange)="sok.set($event)" [class]="k.falt + ' pl-9'" />
            </div>
          </div>
          <div>
            <label for="ei-f-org" [class]="k.etikett">Utbetalande organisation</label>
            <select id="ei-f-org" [ngModel]="org()" (ngModelChange)="org.set($event); profil.set('')" [class]="k.falt + ' max-w-[220px]'">
              <option value="">Alla</option>
              @for (o of service.organisationer(); track o.id) { <option [value]="o.id">{{ o.name }}</option> }
            </select>
          </div>
          <div>
            <label for="ei-f-profil" [class]="k.etikett">Integrationsprofil</label>
            <select id="ei-f-profil" [ngModel]="profil()" (ngModelChange)="profil.set($event)" [class]="k.falt + ' max-w-[240px]'">
              <option value="">Alla</option>
              @for (p of profilval(); track p.id) { <option [value]="p.id">{{ p.name }}</option> }
            </select>
          </div>
          <div>
            <label for="ei-f-fm" [class]="k.etikett">Finansieringsmedel</label>
            <select id="ei-f-fm" [ngModel]="fm()" (ngModelChange)="fm.set($event)" [class]="k.falt + ' max-w-[240px]'">
              <option value="">Alla</option>
              @for (f of service.finansieringsmedel(); track f.id) { <option [value]="f.id">{{ f.shortName }}</option> }
            </select>
          </div>
          <div>
            <label for="ei-f-beslut" [class]="k.etikett">Beslutande organisation</label>
            <select id="ei-f-beslut" [ngModel]="beslut()" (ngModelChange)="beslut.set($event)" [class]="k.falt + ' max-w-[220px]'">
              <option value="">Alla</option>
              @for (b of service.beslutandeOrganisationer(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
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
        <p class="px-5 pb-2 text-[13px] text-text-muted" aria-live="polite">Visar {{ filtrerade().length }} av {{ service.konteringar().length }} konteringar</p>
        <app-ei-kontering-tabell [konteringar]="filtrerade()" />
      </div>
    </app-ei-ram>

    @if (uppslagOppen()) {
      <app-ei-testa-uppslag (stang)="uppslagOppen.set(false)" />
    }
  `,
})
export class EiKonteringarListaComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly statusar: PostingConfigStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
  readonly statusNamn = KONTERINGSSTATUS_NAMN;

  readonly uppslagOppen = signal(false);
  readonly sok = signal('');
  readonly org = signal('');
  readonly profil = signal('');
  readonly fm = signal('');
  readonly beslut = signal('');
  readonly status = signal<PostingConfigStatus | ''>('');

  readonly profilval = computed(() =>
    this.service.profiler().filter((p) => !this.org() || p.organisationId === this.org()),
  );

  readonly antalFilter = computed(
    () => [this.sok().trim(), this.org(), this.profil(), this.fm(), this.beslut(), this.status()].filter(Boolean).length,
  );

  readonly filtrerade = computed(() => {
    const s = this.sok().trim().toLowerCase();
    return this.service.konteringar().filter((t) => {
      const p = this.service.hamtaProfil(t.profileId);
      if (this.org() && p?.organisationId !== this.org()) return false;
      if (this.profil() && t.profileId !== this.profil()) return false;
      if (this.fm() && t.fundingSourceId !== this.fm()) return false;
      if (this.beslut() && t.decidingOrganisationId !== this.beslut()) return false;
      if (this.status() && t.status !== this.status()) return false;
      if (!s) return true;
      const fm = this.service.hamtaFinansieringsmedel(t.fundingSourceId);
      return [
        this.service.konteringNamn(t),
        p?.name ?? '',
        this.service.hamtaOrg(p?.organisationId ?? null)?.name ?? '',
        fm?.anslag ?? '',
        fm?.uppdrag ?? '',
        t.description ?? '',
      ].some((f) => f.toLowerCase().includes(s));
    });
  });

  rensa(): void {
    this.sok.set('');
    this.org.set('');
    this.profil.set('');
    this.fm.set('');
    this.beslut.set('');
    this.status.set('');
  }
}
