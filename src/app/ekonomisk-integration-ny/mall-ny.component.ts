import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { EI_BAS, EiBegreppComponent, EiKodstrangComponent, EiNotisComponent, EiRamComponent, K } from './ei-delade';
import {
  FLODE_NAMN,
  Flow,
  PROFILSTATUS_NAMN,
  PostingTemplate,
  TemplateStatus,
  gallandeVersion,
  idag,
  kodstrang,
  profilStatus,
  sorteradeVersioner,
} from './ei-modell';
import { EkonomiskIntegrationService, nyttId } from './ei.service';
import { EiFranProfilenComponent, EiVardefaltComponent, EiVidUtbetalningComponent } from './mall-delar';

@Component({
  selector: 'app-ei-mall-ny',
  imports: [
    FormsModule,
    DatumValjareComponent,
    EiRamComponent,
    EiBegreppComponent,
    EiKodstrangComponent,
    EiNotisComponent,
    EiVardefaltComponent,
    EiFranProfilenComponent,
    EiVidUtbetalningComponent,
  ],
  template: `
    <app-ei-ram flik="mallar" [brodsmulor]="[{ text: kopia() ? 'Kopia av ' + kopia()!.name : 'Ny konteringsmall' }]">
      <form (ngSubmit)="spara('DRAFT')" novalidate class="max-w-[960px] space-y-5">
        <h2 class="flex items-center gap-1 text-xl font-semibold text-text">
          {{ kopia() ? 'Skapa kopia av ' + kopia()!.name : 'Ny konteringsmall' }} <app-ei-begrepp term="Konteringsmall" />
        </h2>
        @if (kopia()) {
          <app-ei-notis>Värdena är kopierade från {{ kopia()!.name }}. Ge kopian ett nytt namn och välj eventuellt en annan beslutande organisation.</app-ei-notis>
        }

        <section class="bg-surface border border-border p-5 space-y-4">
          <!-- 1. Integrationsprofil -->
          <div>
            <label for="ei-n-profil" [class]="k.etikett">Integrationsprofil <span class="text-error" aria-hidden="true">*</span></label>
            <select id="ei-n-profil" name="profil" [ngModel]="profilId()" (ngModelChange)="valjProfil($event)" [class]="k.falt"
              [class.border-border-error]="visaFel(fel().profil)">
              <option value="">– Välj integrationsprofil –</option>
              @for (p of service.profiler(); track p.id) {
                @let st = profilStatus(p);
                <option [value]="p.id" [disabled]="st === 'ENDED'">
                  {{ service.hamtaOrg(p.organisationId)?.name }} – {{ p.name }} ({{ profilStatusNamn[st] }})
                </option>
              }
            </select>
            @if (visaFel(fel().profil); as f) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
            } @else {
              <p [class]="k.hjalp">Avslutade profiler kan inte väljas.</p>
            }
          </div>

          <!-- 2. Namn och flöde -->
          <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div>
              <label for="ei-n-namn" [class]="k.etikett">Namn <span class="text-error" aria-hidden="true">*</span></label>
              <input id="ei-n-namn" name="namn" type="text" autocomplete="off" [ngModel]="namn()" (ngModelChange)="namn.set($event)"
                [class]="k.falt" [class.border-border-error]="visaFel(fel().namn)" [attr.aria-invalid]="visaFel(fel().namn) ? true : null" />
              @if (visaFel(fel().namn); as f) {
                <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
              } @else {
                <p [class]="k.hjalp">Unikt inom integrationsprofilen.</p>
              }
            </div>
            @if (profil(); as p) {
              @if (p.flows.length > 1) {
                <fieldset>
                  <legend [class]="k.etikett + ' inline-flex items-center gap-1'">Flöde <app-ei-begrepp term="Flöde" /></legend>
                  <div class="flex items-center gap-5 h-[38px]">
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
          </div>

          <!-- 3. Avsedd för -->
          <fieldset class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <legend [class]="k.etikett + ' col-span-full'">Avsedd för (valfritt)</legend>
            <div>
              <label for="ei-n-fm" class="block text-[13px] text-text-secondary mb-1">Finansieringsmedel</label>
              <select id="ei-n-fm" name="fm" [ngModel]="finansieringsmedelId()" (ngModelChange)="finansieringsmedelId.set($event)" [class]="k.falt">
                <option [ngValue]="null">– Inget valt –</option>
                @for (f of service.finansieringsmedel(); track f.id) {
                  <option [ngValue]="f.id">{{ f.anslag }} · {{ f.uppdrag }}</option>
                }
              </select>
            </div>
            <div>
              <label for="ei-n-beslut" class="text-[13px] text-text-secondary mb-1 inline-flex items-center gap-1">Beslutande organisation <app-ei-begrepp term="Beslutande organisation" /></label>
              <select id="ei-n-beslut" name="beslut" [ngModel]="beslutandeId()" (ngModelChange)="beslutandeId.set($event)" [class]="k.falt">
                <option [ngValue]="null">– Ingen vald –</option>
                @for (b of service.beslutandeOrganisationer(); track b.id) {
                  <option [ngValue]="b.id">{{ b.name }}</option>
                }
              </select>
            </div>
            <p class="col-span-full text-[13px] text-text-muted">
              Används bara som information i den här prototypen. Kopplingen till finansieringsmedel och utlysningar kommer senare.
            </p>
          </fieldset>
        </section>

        @if (profil(); as p) {
          <!-- 4. Värden att välja -->
          <section class="bg-surface border border-border p-5 space-y-3">
            <h3 class="text-base font-semibold">Värden att välja</h3>
            <app-ei-vardefalt [profil]="p" [(values)]="varden" [visaFel]="forsokAktivera()" />
          </section>

          <!-- 5. Från profilen -->
          <app-ei-fran-profilen [profil]="p" [flode]="flode()" />

          <!-- 6. Vid utbetalning -->
          <app-ei-vid-utbetalning [profil]="p" [finansieringsmedelId]="finansieringsmedelId()" [gammalt]="kopia()?.legacyConsumptionAccount ?? null" />

          <!-- 7. Giltig från -->
          <section class="bg-surface border border-border p-5">
            <div class="max-w-[220px]">
              <label for="ei-n-fran" [class]="k.etikett + ' inline-flex items-center gap-1'">Giltig från <span class="text-error" aria-hidden="true">*</span> <app-ei-begrepp term="Version" /></label>
              <app-datum-valjare inputId="ei-n-fran" etikett="Giltig från" [varde]="giltigFran()" (vardeChange)="giltigFran.set($event)" />
              @if (visaFel(fel().giltigFran); as f) {
                <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</p>
              }
            </div>
          </section>

          <!-- 8. Kodsträng -->
          <app-ei-kodstrang [rader]="kodrader()" />
        }

        @if (forsokAktivera() && saknade().length) {
          <app-ei-notis niva="error">
            Konteringsmallen kan inte aktiveras: {{ saknade().join(', ') }} saknar värde. Spara som utkast eller välj värden.
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
export class EiMallNyComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly k = K;
  readonly flodeNamn = FLODE_NAMN;
  readonly profilStatusNamn = PROFILSTATUS_NAMN;
  readonly profilStatus = profilStatus;

  readonly kopia = signal<PostingTemplate | null>(
    this.service.hamtaMall(this.route.snapshot.queryParamMap.get('kopiaAv')),
  );

  readonly profilId = signal('');
  readonly namn = signal('');
  readonly flode = signal<Flow>('UTB');
  readonly finansieringsmedelId = signal<string | null>(null);
  readonly beslutandeId = signal<string | null>(null);
  readonly varden = signal<Record<string, string>>({});
  readonly giltigFran = signal(idag());
  readonly forsokSpara = signal(false);
  readonly forsokAktivera = signal(false);

  constructor() {
    const k = this.kopia();
    if (k) {
      const v = gallandeVersion(k) ?? sorteradeVersioner(k).slice(-1)[0];
      this.valjProfil(k.profileId);
      this.flode.set(k.flow);
      this.finansieringsmedelId.set(k.intendedFor.fundingSourceId);
      this.beslutandeId.set(k.intendedFor.decidingOrganisationId);
      this.varden.set({ ...(v?.values ?? {}) });
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

  readonly kodrader = computed(() => (this.profil() ? kodstrang(this.profil()!, this.flode(), this.varden()) : []));

  /** M1 och M3. */
  readonly fel = computed(() => {
    const fel: { profil?: string; namn?: string; giltigFran?: string } = {};
    if (!this.profil()) fel.profil = 'Välj en integrationsprofil.';
    if (!this.namn().trim()) fel.namn = 'Ange ett namn.';
    else if (this.profilId() && this.service.namnUpptagetMall(this.namn(), this.profilId(), null))
      fel.namn = 'Namnet används redan av en annan konteringsmall i profilen.';
    if (!this.giltigFran()) fel.giltigFran = 'Ange giltig från.';
    return fel;
  });

  /** M2: valbara fält utan aktivt värde. */
  readonly saknade = computed(() => (this.profil() ? this.service.saknadeVarden(this.profil()!, this.varden()) : []));

  visaFel(fel: string | undefined): string | undefined {
    return this.forsokSpara() ? fel : undefined;
  }

  spara(status: TemplateStatus): void {
    this.forsokSpara.set(true);
    this.forsokAktivera.set(status === 'ACTIVE');
    const p = this.profil();
    if (!p || Object.keys(this.fel()).length) return;
    if (status === 'ACTIVE' && this.saknade().length) return;
    const values = Object.fromEntries(Object.entries(this.varden()).filter(([, kod]) => !!kod));
    const mall: PostingTemplate = {
      id: nyttId('km'),
      name: this.namn().trim(),
      profileId: p.id,
      flow: this.flode(),
      status,
      intendedFor: { fundingSourceId: this.finansieringsmedelId(), decidingOrganisationId: this.beslutandeId() },
      legacyConsumptionAccount: null,
      versions: [
        { id: nyttId('v'), validFrom: this.giltigFran(), changeReason: null, createdAt: idag(), values, source: 'underlag' },
      ],
      notices: [],
      source: 'underlag',
    };
    this.service.sparaMall(mall, status === 'ACTIVE' ? 'Konteringsmallen har sparats och aktiverats.' : 'Konteringsmallen har sparats.');
    this.router.navigate([EI_BAS, 'konteringsmallar', mall.id]);
  }

  avbryt(): void {
    const k = this.kopia();
    if (k) this.router.navigate([EI_BAS, 'konteringsmallar', k.id]);
    else if (this.route.snapshot.queryParamMap.get('profil'))
      this.router.navigate([EI_BAS, 'integrationsprofiler', this.route.snapshot.queryParamMap.get('profil')], { queryParams: { flik: 'mallar' } });
    else this.router.navigate([EI_BAS, 'konteringsmallar']);
  }
}
