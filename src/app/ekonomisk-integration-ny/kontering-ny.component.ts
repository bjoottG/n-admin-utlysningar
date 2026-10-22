import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { EI_BAS, EiKodstrangComponent, EiNotisComponent, EiRamComponent, K } from './ei-delade';
import {
  FLODE_NAMN,
  Flow,
  PROFILSTATUS_NAMN,
  PostingConfig,
  PostingConfigStatus,
  gallandeVersion,
  idag,
  profilStatus,
  sorteradeVersioner,
} from './ei-modell';
import { EkonomiskIntegrationService, nyttId } from './ei.service';
import {
  EiFranProfilenComponent,
  EiKonsumtionskontoComponent,
  EiVardefaltComponent,
  EiVidUtbetalningComponent,
} from './kontering-delar';

@Component({
  selector: 'app-ei-kontering-ny',
  imports: [
    FormsModule,
    RouterLink,
    DatumValjareComponent,
    EiRamComponent,
    EiKodstrangComponent,
    EiNotisComponent,
    EiVardefaltComponent,
    EiFranProfilenComponent,
    EiVidUtbetalningComponent,
    EiKonsumtionskontoComponent,
  ],
  template: `
    <app-ei-ram flik="konteringar" [brodsmulor]="[{ text: kopia() ? 'Skapa kopia' : 'Ny kontering' }]">
      <form (ngSubmit)="spara('DRAFT')" novalidate class="max-w-[960px] space-y-5">
        <h2 class="flex items-center gap-1 text-xl font-semibold text-text">
          {{ kopia() ? 'Skapa kopia av ' + service.konteringNamn(kopia()!) : 'Ny kontering' }}
        </h2>
        @if (kopia()) {
          <app-ei-notis>
            Värdena är kopierade från {{ service.konteringNamn(kopia()!) }}. Välj en ny beslutande organisation och/eller ett nytt
            finansieringsmedel. Nyckeln måste vara unik.
          </app-ei-notis>
        }

        <section class="bg-surface border border-border p-5 space-y-5">
          <!-- Integrationsprofil -->
          <div>
            <label for="ei-n-profil" [class]="k.etikett + ' inline-flex items-center gap-1'">Integrationsprofil <span class="text-error" aria-hidden="true">*</span></label>
            <select id="ei-n-profil" name="profil" [ngModel]="profilId()" (ngModelChange)="valjProfil($event)" [class]="k.falt"
              [disabled]="!!kopia()" [class.border-border-error]="visaFel(fel().profil)">
              <option value="">– Välj integrationsprofil –</option>
              @for (p of service.profiler(); track p.id) {
                @let st = profilStatus(p);
                <option [value]="p.id" [disabled]="st === 'ENDED'">
                  {{ service.hamtaOrg(p.organisationId)?.name }} · {{ service.systemNamn(p) }} · {{ p.name }} ({{ profilStatusNamn[st] }})
                </option>
              }
            </select>
            @if (visaFel(fel().profil); as f) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
            } @else {
              <p [class]="k.hjalp">{{ kopia() ? 'En kopia hamnar i samma integrationsprofil.' : 'Avslutade profiler kan inte väljas.' }}</p>
            }
          </div>

          <!-- Nyckel -->
          <fieldset class="space-y-4">
            <legend class="flex items-center gap-1 text-base font-semibold text-text mb-1">Nyckel</legend>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label for="ei-n-fm" [class]="k.etikett + ' inline-flex items-center gap-1'">Finansieringsmedel <span class="text-error" aria-hidden="true">*</span></label>
                <select id="ei-n-fm" name="fm" [ngModel]="fmId()" (ngModelChange)="fmId.set($event)" [class]="k.falt"
                  [class.border-border-error]="visaFel(fel().fm)">
                  <option value="">– Välj finansieringsmedel –</option>
                  @for (f of service.finansieringsmedel(); track f.id) {
                    <option [value]="f.id">{{ f.shortName }} · {{ f.anslag }} · {{ f.kontotyp ? 'Kontotyp: ' + f.kontotyp : 'Ingen kontotyp' }}</option>
                  }
                </select>
                @if (visaFel(fel().fm); as f) {
                  <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
                }
              </div>
              <div>
                <label for="ei-n-beslut" [class]="k.etikett + ' inline-flex items-center gap-1'">Beslutande organisation <span class="text-error" aria-hidden="true">*</span></label>
                <select id="ei-n-beslut" name="beslut" [ngModel]="beslutId()" (ngModelChange)="beslutId.set($event)" [class]="k.falt"
                  [class.border-border-error]="visaFel(fel().beslut)">
                  <option value="">– Välj beslutande organisation –</option>
                  @for (b of service.beslutandeOrganisationer(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
                </select>
                @if (visaFel(fel().beslut); as f) {
                  <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
                }
              </div>
            </div>
            @if (profil(); as p) {
              @if (p.flows.length > 1) {
                <fieldset>
                  <legend [class]="k.etikett + ' inline-flex items-center gap-1'">Flöde <span class="text-error" aria-hidden="true">*</span></legend>
                  <div class="flex items-center gap-5">
                    @for (f of p.flows; track f) {
                      <label class="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="radio" name="ei-n-flode" class="w-4 h-4 accent-primary" [checked]="flode() === f" (change)="flode.set(f)" />
                        {{ flodeNamn[f] }} ({{ f }})
                      </label>
                    }
                  </div>
                </fieldset>
              }
            }
            <p [class]="k.hjalp">Konteringen används när ett ärende med det här finansieringsmedlet och den här beslutande organisationen betalas ut.</p>

            <div class="px-4 py-3 bg-surface-subtle border border-border-muted" aria-live="polite">
              <span class="block text-[12px] text-text-muted">Konteringens namn</span>
              <span class="text-sm font-semibold text-text">{{ namn() }}</span>
            </div>
            @if (dubblett(); as d) {
              <app-ei-notis niva="error">
                Det finns redan en kontering för {{ service.konteringNamn(d) }}. Öppna den och skapa en ny version i stället.
                <a [routerLink]="bas + '/konteringar/' + d.id" class="block mt-1 font-medium underline hover:no-underline">Öppna {{ service.konteringNamn(d) }}</a>
              </app-ei-notis>
            }
          </fieldset>

          <!-- Beskrivning -->
          <div>
            <label for="ei-n-besk" [class]="k.etikett">Beskrivning (valfritt)</label>
            <textarea id="ei-n-besk" name="besk" rows="2" [ngModel]="beskrivning()" (ngModelChange)="beskrivning.set($event)" [class]="k.falt + ' resize-y'"></textarea>
          </div>
        </section>

        @if (profil(); as p) {
          <!-- Värden att välja -->
          <section class="bg-surface border border-border p-5 space-y-3">
            <h3 class="text-base font-semibold">Värden att välja</h3>
            <app-ei-vardefalt [profil]="p" [(values)]="varden" [visaFel]="forsokAktivera()" />
          </section>

          <section class="bg-surface border border-border p-5">
            <app-ei-konsumtionskonto [(varde)]="konsumtion" [finansieringsmedelId]="fmId() || null" />
          </section>

          <app-ei-fran-profilen [profil]="p" [flode]="flode()" />
          <app-ei-vid-utbetalning [profil]="p" />

          <section class="bg-surface border border-border p-5">
            <div class="max-w-[220px]">
              <label for="ei-n-fran" [class]="k.etikett + ' inline-flex items-center gap-1'">Giltig från <span class="text-error" aria-hidden="true">*</span></label>
              <app-datum-valjare inputId="ei-n-fran" etikett="Giltig från" [varde]="giltigFran()" (vardeChange)="giltigFran.set($event)" />
              @if (visaFel(fel().giltigFran); as f) {
                <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
              }
            </div>
          </section>

          <app-ei-kodstrang [rader]="kodrader()" [system]="service.systemNamn(p)" />
        }

        @if (forsokAktivera() && saknade().length) {
          <app-ei-notis niva="error">
            Konteringen kan inte aktiveras: {{ saknade().join(', ') }} saknar värde. Alla valbara fält måste ha ett aktivt värde. Spara som utkast eller välj värden.
          </app-ei-notis>
        }

        <div class="flex items-center justify-end gap-2">
          <button type="button" (click)="avbryt()" [class]="k.sekundar">Avbryt</button>
          <button type="submit" [class]="k.sekundar">Spara som utkast</button>
          <button type="button" (click)="spara('ACTIVE')" [class]="k.primar">Spara och aktivera</button>
        </div>
      </form>
    </app-ei-ram>
  `,
})
export class EiKonteringNyComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly flodeNamn = FLODE_NAMN;
  readonly profilStatusNamn = PROFILSTATUS_NAMN;
  readonly profilStatus = profilStatus;

  readonly kopia = signal<PostingConfig | null>(
    this.service.hamtaKontering(this.route.snapshot.queryParamMap.get('kopiaAv')),
  );

  readonly profilId = signal('');
  readonly fmId = signal('');
  readonly beslutId = signal('');
  readonly flode = signal<Flow>('UTB');
  readonly beskrivning = signal('');
  readonly varden = signal<Record<string, string>>({});
  readonly konsumtion = signal(false);
  readonly giltigFran = signal(idag());
  readonly forsokSpara = signal(false);
  readonly forsokAktivera = signal(false);

  constructor() {
    const k = this.kopia();
    if (k) {
      const v = gallandeVersion(k) ?? sorteradeVersioner(k).slice(-1)[0];
      this.valjProfil(k.profileId);
      this.flode.set(k.flow);
      this.fmId.set(k.fundingSourceId);
      this.beslutId.set(k.decidingOrganisationId);
      this.varden.set({ ...(v?.values ?? {}) });
      this.konsumtion.set(v?.useConsumptionAccount ?? false);
    } else {
      const p = this.service.hamtaProfil(this.route.snapshot.queryParamMap.get('profil'));
      if (p && profilStatus(p) !== 'ENDED') this.valjProfil(p.id);
    }
  }

  readonly profil = computed(() => this.service.hamtaProfil(this.profilId()));

  valjProfil(id: string): void {
    this.profilId.set(id);
    const p = this.service.hamtaProfil(id);
    if (!p) return;
    if (!p.flows.includes(this.flode())) this.flode.set(p.flows[0] ?? 'UTB');
    // Behåll bara värden för profilens valbara attribut.
    const valbara = new Set(p.mappings.filter((m) => m.mode === 'SELECTABLE').map((m) => m.attributeId));
    this.varden.update((v) => Object.fromEntries(Object.entries(v).filter(([a]) => valbara.has(a))));
  }

  readonly nyckel = computed(() => ({
    fundingSourceId: this.fmId(),
    decidingOrganisationId: this.beslutId(),
    flow: this.flode(),
  }));

  readonly namn = computed(() => this.service.konteringNamn(this.nyckel()));

  /** K2 visas direkt i formuläret. */
  readonly dubblett = computed(() =>
    this.fmId() && this.beslutId() ? this.service.hittaDubblett(this.nyckel(), null) : null,
  );

  readonly kodrader = computed(() => (this.profil() ? this.service.kodstrang(this.profil()!, this.flode(), this.varden()) : []));

  /** K1 och K4. */
  readonly fel = computed(() => {
    const fel: { profil?: string; fm?: string; beslut?: string; giltigFran?: string } = {};
    const p = this.profil();
    if (!p) fel.profil = 'Välj en integrationsprofil.';
    else if (!p.flows.includes(this.flode())) fel.profil = 'Flödet finns inte i integrationsprofilen.';
    if (!this.fmId()) fel.fm = 'Välj finansieringsmedel.';
    if (!this.beslutId()) fel.beslut = 'Välj beslutande organisation.';
    if (!this.giltigFran()) fel.giltigFran = 'Ange giltig från.';
    return fel;
  });

  /** K3: valbara fält utan aktivt värde. */
  readonly saknade = computed(() => (this.profil() ? this.service.saknadeVarden(this.profil()!, this.varden()) : []));

  visaFel(fel: string | undefined): string | undefined {
    return this.forsokSpara() ? fel : undefined;
  }

  spara(status: PostingConfigStatus): void {
    this.forsokSpara.set(true);
    this.forsokAktivera.set(status === 'ACTIVE');
    const p = this.profil();
    if (!p || Object.keys(this.fel()).length || this.dubblett()) return;
    if (status === 'ACTIVE' && this.saknade().length) return;
    const values = Object.fromEntries(Object.entries(this.varden()).filter(([, kod]) => !!kod));
    const ny: PostingConfig = {
      id: nyttId('ko'),
      profileId: p.id,
      fundingSourceId: this.fmId(),
      decidingOrganisationId: this.beslutId(),
      flow: this.flode(),
      status,
      description: this.beskrivning().trim() || null,
      versions: [
        {
          id: nyttId('v'),
          validFrom: this.giltigFran(),
          changeReason: null,
          createdAt: idag(),
          values,
          useConsumptionAccount: this.konsumtion(),
          source: 'underlag',
        },
      ],
      notices: [],
      source: 'underlag',
    };
    this.service.sparaKontering(ny, status === 'ACTIVE' ? 'Konteringen har sparats och aktiverats.' : 'Konteringen har sparats.');
    this.router.navigate([EI_BAS, 'konteringar', ny.id]);
  }

  avbryt(): void {
    const k = this.kopia();
    const profil = this.route.snapshot.queryParamMap.get('profil');
    if (k) this.router.navigate([EI_BAS, 'konteringar', k.id]);
    else if (profil) this.router.navigate([EI_BAS, 'integrationsprofiler', profil], { queryParams: { flik: 'konteringar' } });
    else this.router.navigate([EI_BAS, 'konteringar']);
  }
}
