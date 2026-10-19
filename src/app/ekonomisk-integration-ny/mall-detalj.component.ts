import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import {
  EI_BAS,
  EiBegreppComponent,
  EiDialogComponent,
  EiKallaComponent,
  EiKodstrangComponent,
  EiNotisComponent,
  EiRamComponent,
  K,
} from './ei-delade';
import {
  ARENDEFALT_NAMN,
  FLODE_NAMN,
  MALLSTATUS_NAMN,
  PostingProfile,
  PostingTemplate,
  TemplateVersion,
  URSPRUNG_NAMN,
  VERSIONSTATUS_NAMN,
  aktivaVarden,
  gallandeVersion,
  idag,
  kodstrang,
  mallStatusKlass,
  profilStatus,
  relevantaVersioner,
  sorteradeMappningar,
  sorteradeVersioner,
  versionStatus,
  versionStatusKlass,
} from './ei-modell';
import { EkonomiskIntegrationService, nyttId } from './ei.service';
import { EiVardefaltComponent, EiVidUtbetalningComponent } from './mall-delar';

interface VardeRad {
  attribut: string;
  varde: string;
  platshallare: boolean;
  ursprung: string;
  bokforsI: string[];
  inaktivt: boolean;
  namnSaknas?: boolean;
}

@Component({
  selector: 'app-ei-mall-detalj',
  imports: [
    FormsModule,
    RouterLink,
    DatumValjareComponent,
    EiRamComponent,
    EiBegreppComponent,
    EiDialogComponent,
    EiKallaComponent,
    EiKodstrangComponent,
    EiNotisComponent,
    EiVardefaltComponent,
    EiVidUtbetalningComponent,
  ],
  template: `
    @if (mall(); as t) {
      @let p = profil()!;
      <app-ei-ram flik="mallar" [brodsmulor]="[{ text: t.name }]">
        <!-- Sidhuvud -->
        <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-semibold text-text">{{ t.name }}</h2>
              <span [class]="k.status + ' ' + statusKlass(t)">{{ statusNamn[t.status] }}</span>
              <app-ei-kalla [kalla]="t.source" />
            </div>
            <dl class="flex flex-wrap gap-x-6 gap-y-1 mt-1.5 text-sm">
              <div><dt class="inline text-text-muted mr-1">Konteringsprofil:</dt><dd class="inline"><a [routerLink]="bas + '/konteringsprofiler/' + p.id" [class]="k.lank">{{ p.name }}</a></dd></div>
              <div><dt class="inline text-text-muted mr-1">Utbetalande organisation:</dt><dd class="inline">{{ service.hamtaOrg(p.organisationId)?.name }}</dd></div>
              <div><dt class="inline text-text-muted mr-1">Flöde:</dt><dd class="inline">{{ flodeNamn[t.flow] }} ({{ t.flow }})</dd></div>
              <div><dt class="inline text-text-muted mr-1">Avsedd för:</dt><dd class="inline">{{ avseddFor() }}</dd></div>
            </dl>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" (click)="oppnaNyVersion()" [class]="k.primar">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Ny version
            </button>
            <a [routerLink]="bas + '/konteringsmallar/ny'" [queryParams]="{ kopiaAv: t.id }" [class]="k.sekundarLiten">
              <span class="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>Skapa kopia
            </a>
            @if (t.status === 'ACTIVE') {
              <button type="button" (click)="sattStatus('INACTIVE')" [class]="k.sekundarLiten">Inaktivera</button>
            } @else {
              <button type="button" (click)="aktivera()" [class]="k.sekundarLiten">Aktivera</button>
            }
          </div>
        </div>

        <!-- Notiser och varningar -->
        @if (t.notices.length || varningar().length) {
          <div class="space-y-2 mb-5">
            @for (v of varningar(); track v.text) {
              <app-ei-notis niva="warning">{{ v.text }}</app-ei-notis>
            }
            @for (n of t.notices; track $index) {
              <app-ei-notis [niva]="n.level">{{ n.text }}</app-ei-notis>
            }
          </div>
        }

        <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
          <!-- Versioner -->
          <section class="bg-surface border border-border xl:col-span-2">
            <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold border-b border-border-muted">Versioner <app-ei-begrepp term="Version" /></h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th scope="col" class="pl-5 pr-2 py-2.5 w-10"><span class="sr-only">Vald</span></th>
                    <th scope="col" [class]="k.th">Giltig från</th>
                    <th scope="col" [class]="k.th">Status</th>
                    <th scope="col" [class]="k.th">Ändringsorsak</th>
                    <th scope="col" [class]="k.th">Skapad</th>
                    <th scope="col" class="pl-4 pr-5 py-2.5"><span class="sr-only">Åtgärder</span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (v of versioner(); track v.id) {
                    @let st = versionStatus(t, v);
                    <tr class="border-b border-border-muted cursor-pointer" (click)="valdVersionId.set(v.id)"
                      [class]="v.id === valdVersion()?.id ? 'bg-component-selected' : 'hover:bg-component-hover'">
                      <td class="pl-5 pr-2 py-2.5">
                        <input type="radio" name="ei-version" class="w-4 h-4 accent-primary" [checked]="v.id === valdVersion()?.id"
                          (change)="valdVersionId.set(v.id)" [attr.aria-label]="'Visa version ' + v.validFrom" />
                      </td>
                      <td class="px-4 py-2.5 whitespace-nowrap">{{ v.validFrom }} <app-ei-kalla class="ml-1" [kalla]="v.validFromSource" /></td>
                      <td class="px-4 py-2.5"><span [class]="k.status + ' ' + versionKlass(st)">{{ versionNamn[st] }}</span></td>
                      <td class="px-4 py-2.5">
                        {{ v.changeReason ?? '–' }}
                        <app-ei-kalla class="ml-1" [kalla]="v.changeReasonSource" />
                      </td>
                      <td class="px-4 py-2.5 whitespace-nowrap">{{ v.createdAt }} <app-ei-kalla class="ml-1" [kalla]="v.source" /></td>
                      <td class="pl-4 pr-5 py-1.5 text-right">
                        @if (st === 'UPCOMING') {
                          <button type="button" (click)="taBortVersion.set(v); $event.stopPropagation()" [attr.aria-label]="'Ta bort version ' + v.validFrom" title="Ta bort version" [class]="k.ikon">
                            <span class="material-symbols-outlined text-[20px] align-middle">delete</span>
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          @if (valdVersion(); as v) {
            <!-- Värden för vald version -->
            <section class="bg-surface border border-border">
              <h3 class="px-5 py-3 text-base font-semibold border-b border-border-muted">Värden, version {{ v.validFrom }}</h3>
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <th scope="col" [class]="k.th + ' pl-5'">Attribut</th>
                    <th scope="col" [class]="k.th">Värde</th>
                    <th scope="col" [class]="k.th">Ursprung</th>
                    <th scope="col" [class]="k.th + ' pr-5'"><span class="inline-flex items-center gap-1">Bokförs i <app-ei-begrepp term="Bokförs i" /></span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of vardeRader(); track r.attribut) {
                    <tr class="border-b border-border-muted odd:bg-surface-subtle">
                      <td class="pl-5 pr-4 py-2 font-medium">{{ r.attribut }}</td>
                      <td class="px-4 py-2" [class]="r.platshallare ? 'italic text-text-muted' : ''">
                        {{ r.varde }}@if (r.namnSaknas) {<span class="text-text-muted"> · Namn saknas</span>}
                        @if (r.inaktivt) { <span class="ml-1 text-[12px] text-warning-dark">(inaktivt)</span> }
                      </td>
                      <td class="px-4 py-2 text-text-secondary">{{ r.ursprung }}</td>
                      <td class="pl-4 pr-5 py-2">
                        <span class="inline-flex gap-1">@for (b of r.bokforsI; track b) { <span [class]="k.chip">{{ b }}</span> }</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>

            <div class="space-y-5">
              <!-- Skillnad mot föregående -->
              @if (foregaende(); as f) {
                <section class="bg-surface border border-border px-5 py-3">
                  <h3 class="text-sm font-semibold mb-2">Skillnad mot föregående version ({{ f.validFrom }})</h3>
                  @if (skillnader().length) {
                    <ul class="text-sm space-y-1 list-none m-0 p-0">
                      @for (s of skillnader(); track $index) { <li class="font-mono text-[13px]">{{ s }}</li> }
                    </ul>
                  } @else {
                    <p class="text-sm text-text-muted">Inga ändrade värden.</p>
                  }
                </section>
              }

              <app-ei-vid-utbetalning [profil]="p" [finansieringsmedelId]="t.intendedFor.fundingSourceId" [gammalt]="t.legacyConsumptionAccount" />

              <app-ei-kodstrang [rader]="kodrader()" />
            </div>
          }
        </div>
      </app-ei-ram>

      <!-- Ny version -->
      @if (nyVersion(); as nv) {
        <app-ei-dialog rubrik="Ny version" bredd="max-w-[760px]" (stang)="nyVersion.set(null)">
          <p class="text-sm text-text-secondary">Värdena är förifyllda från {{ gallande() ? 'gällande version' : 'senaste versionen' }}. Den version som gäller på utbetalningsdagen används.</p>
          <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4">
            <div>
              <label for="ei-nv-fran" [class]="k.etikett">Giltig från <span class="text-error" aria-hidden="true">*</span></label>
              <app-datum-valjare inputId="ei-nv-fran" etikett="Giltig från" [varde]="nv.validFrom" (vardeChange)="sattNyVersion({ validFrom: $event })" />
            </div>
            <div>
              <label for="ei-nv-orsak" [class]="k.etikett">Ändringsorsak <span class="text-error" aria-hidden="true">*</span></label>
              <input id="ei-nv-orsak" type="text" autocomplete="off" [ngModel]="nv.changeReason" (ngModelChange)="sattNyVersion({ changeReason: $event })" [class]="k.falt" />
            </div>
          </div>
          <app-ei-vardefalt [profil]="p" [values]="nv.values" (valuesChange)="sattNyVersion({ values: $event })" [visaFel]="forsokSpara() && t.status === 'ACTIVE'" idPrefix="ei-nv-" />
          @if (forsokSpara() && nyVersionFel().length) {
            <ul class="space-y-1 list-none m-0 p-0" role="alert">
              @for (f of nyVersionFel(); track f) {
                <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
              }
            </ul>
          }
          <button fot type="button" (click)="nyVersion.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="sparaNyVersion()" [class]="k.primar">Spara version</button>
        </app-ei-dialog>
      }

      <!-- Ta bort version -->
      @if (taBortVersion(); as v) {
        <app-ei-dialog rubrik="Ta bort versionen?" roll="alertdialog" (stang)="taBortVersion.set(null)">
          <p class="text-sm text-text">Den kommande versionen med giltig från {{ v.validFrom }} tas bort.</p>
          <button fot type="button" (click)="taBortVersion.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="bekraftaTaBortVersion(v)" [class]="k.fara">Ta bort</button>
        </app-ei-dialog>
      }

      <!-- Kan inte aktiveras (M2) -->
      @if (aktiveringsfel(); as fel) {
        <app-ei-dialog rubrik="Konteringsmallen kan inte aktiveras" roll="alertdialog" (stang)="aktiveringsfel.set(null)">
          <ul class="space-y-2 list-none m-0 p-0">
            @for (f of fel; track f.text) {
              <li [class]="k.fel + ' text-sm items-start'">
                <span class="material-symbols-outlined text-[18px]">block</span>
                <span>
                  {{ f.text }}
                  @if (f.attribut) {
                    <a [routerLink]="bas + '/konteringsprofiler/' + p.id" [queryParams]="{ flik: 'vardelistor', attribut: f.attribut }" class="block" [class]="k.lank">Gå till värdelistan i konteringsprofilen</a>
                  }
                </span>
              </li>
            }
          </ul>
          <button fot type="button" (click)="aktiveringsfel.set(null)" [class]="k.sekundar">Stäng</button>
        </app-ei-dialog>
      }
    } @else {
      <app-ei-ram flik="mallar" [brodsmulor]="[{ text: 'Hittades inte' }]">
        <p class="text-sm text-text-muted">Konteringsmallen finns inte.</p>
      </app-ei-ram>
    }
  `,
})
export class EiMallDetaljComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly flodeNamn = FLODE_NAMN;
  readonly statusNamn = MALLSTATUS_NAMN;
  readonly versionNamn = VERSIONSTATUS_NAMN;
  readonly versionStatus = versionStatus;
  readonly versionKlass = versionStatusKlass;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  readonly mall = computed(() => this.service.hamtaMall(this.params().get('id')));
  readonly profil = computed<PostingProfile | null>(() => this.service.hamtaProfil(this.mall()?.profileId ?? null));
  readonly versioner = computed(() => (this.mall() ? sorteradeVersioner(this.mall()!).reverse() : []));
  readonly gallande = computed(() => (this.mall() ? gallandeVersion(this.mall()!) : null));
  readonly varningar = computed(() => (this.mall() ? this.service.mallVarningar(this.mall()!) : []));

  readonly valdVersionId = signal<string | null>(null);
  readonly valdVersion = computed<TemplateVersion | null>(() => {
    const t = this.mall();
    if (!t) return null;
    return (
      t.versions.find((v) => v.id === this.valdVersionId()) ?? this.gallande() ?? sorteradeVersioner(t).slice(-1)[0] ?? null
    );
  });

  readonly foregaende = computed<TemplateVersion | null>(() => {
    const t = this.mall();
    const v = this.valdVersion();
    if (!t || !v) return null;
    const lista = sorteradeVersioner(t);
    const i = lista.findIndex((x) => x.id === v.id);
    return i > 0 ? lista[i - 1] : null;
  });

  readonly skillnader = computed(() => {
    const p = this.profil();
    const v = this.valdVersion();
    const f = this.foregaende();
    if (!p || !v || !f) return [];
    const attribut = [...new Set([...Object.keys(f.values), ...Object.keys(v.values)])];
    const ordning = sorteradeMappningar(p).map((m) => m.attributeId);
    attribut.sort((a, b) => ordning.indexOf(a) - ordning.indexOf(b));
    return attribut
      .filter((a) => (f.values[a] ?? '') !== (v.values[a] ?? ''))
      .map((a) => `${this.service.attributNamn(p, a)}: ${f.values[a] || '–'} → ${v.values[a] || '–'}`);
  });

  readonly vardeRader = computed<VardeRad[]>(() => {
    const p = this.profil();
    const t = this.mall();
    const v = this.valdVersion();
    if (!p || !t || !v) return [];
    return sorteradeMappningar(p).map((m) => {
      const bas = { attribut: this.service.attributNamn(p, m.attributeId), ursprung: URSPRUNG_NAMN[m.mode], bokforsI: m.bookIn, inaktivt: false };
      switch (m.mode) {
        case 'SELECTABLE': {
          const kod = v.values[m.attributeId];
          if (!kod) return { ...bas, varde: '‹ej vald›', platshallare: true };
          const varde = m.values.find((x) => x.code === kod);
          return {
            ...bas,
            varde: varde?.name ? `${kod} – ${varde.name}` : kod,
            namnSaknas: !varde?.name,
            platshallare: false,
            inaktivt: !!varde && varde.status === 'INACTIVE',
          };
        }
        case 'FIXED':
          return { ...bas, varde: m.fixedValue ?? '–', platshallare: false };
        case 'FROM_CASE':
          return { ...bas, varde: `‹${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']}›`, platshallare: true };
        case 'FOLLOWS_FLOW':
          return { ...bas, varde: t.flow, platshallare: false };
      }
    });
  });

  readonly kodrader = computed(() => {
    const p = this.profil();
    const t = this.mall();
    const v = this.valdVersion();
    return p && t && v ? kodstrang(p, t.flow, v.values) : [];
  });

  avseddFor(): string {
    const t = this.mall();
    if (!t) return '–';
    const delar = [
      this.service.hamtaFinansieringsmedel(t.intendedFor.fundingSourceId)?.anslag,
      this.service.hamtaBeslutande(t.intendedFor.decidingOrganisationId)?.name,
    ].filter(Boolean);
    return delar.length ? delar.join(' · ') : '–';
  }

  statusKlass(t: PostingTemplate): string {
    return mallStatusKlass(t.status);
  }

  /* ---------- Status ---------- */

  readonly aktiveringsfel = signal<{ text: string; attribut?: string }[] | null>(null);

  aktivera(): void {
    const t = this.mall();
    const p = this.profil();
    if (!t || !p) return;
    const fel: { text: string; attribut?: string }[] = [];
    if (profilStatus(p) === 'ENDED') fel.push({ text: `Konteringsprofilen ${p.name} är avslutad.` });
    const versioner = relevantaVersioner(t);
    for (const v of versioner.length ? versioner : sorteradeVersioner(t).slice(-1)) {
      for (const m of p.mappings.filter((x) => x.mode === 'SELECTABLE')) {
        const kod = v.values[m.attributeId];
        if (kod && aktivaVarden(m).some((x) => x.code === kod)) continue;
        const namn = this.service.attributNamn(p, m.attributeId);
        const text = !aktivaVarden(m).length
          ? `${namn} saknar värde i versionen ${v.validFrom}. Värdelistan för ${namn} i konteringsprofilen har inga aktiva värden, så inget värde kan väljas.`
          : kod
            ? `${namn} ${kod} i versionen ${v.validFrom} är inaktivt. Skapa en ny version med ett aktivt värde.`
            : `${namn} saknar värde i versionen ${v.validFrom}. Alla valbara fält måste ha ett värde.`;
        if (!fel.some((f) => f.text === text)) fel.push({ text, attribut: !aktivaVarden(m).length ? m.attributeId : undefined });
      }
    }
    if (fel.length) {
      this.aktiveringsfel.set(fel);
      return;
    }
    this.sattStatus('ACTIVE');
  }

  sattStatus(status: PostingTemplate['status']): void {
    const t = this.mall();
    if (!t) return;
    this.service.sparaMall({ ...t, status }, status === 'ACTIVE' ? 'Konteringsmallen är aktiverad.' : 'Konteringsmallen är inaktiverad.');
  }

  /* ---------- Versioner ---------- */

  readonly nyVersion = signal<{ validFrom: string; changeReason: string; values: Record<string, string> } | null>(null);
  readonly forsokSpara = signal(false);
  readonly taBortVersion = signal<TemplateVersion | null>(null);

  oppnaNyVersion(): void {
    const t = this.mall();
    if (!t) return;
    const bas = this.gallande() ?? sorteradeVersioner(t).slice(-1)[0];
    this.forsokSpara.set(false);
    this.nyVersion.set({ validFrom: '', changeReason: '', values: { ...(bas?.values ?? {}) } });
  }

  sattNyVersion(andring: Partial<{ validFrom: string; changeReason: string; values: Record<string, string> }>): void {
    this.nyVersion.update((n) => (n ? { ...n, ...andring } : n));
  }

  /** M3, M4, inaktiva värden och (för aktiva mallar) M2. */
  readonly nyVersionFel = computed(() => {
    const n = this.nyVersion();
    const t = this.mall();
    const p = this.profil();
    if (!n || !t || !p) return [];
    const fel: string[] = [];
    const senaste = sorteradeVersioner(t).slice(-1)[0];
    if (!n.validFrom) fel.push('Ange giltig från.');
    else if (senaste && n.validFrom <= senaste.validFrom)
      fel.push(`Giltig från måste vara senare än den senaste versionen (${senaste.validFrom}).`);
    if (!n.changeReason.trim()) fel.push('Ange en ändringsorsak.');
    for (const m of p.mappings.filter((x) => x.mode === 'SELECTABLE')) {
      const kod = n.values[m.attributeId];
      const namn = this.service.attributNamn(p, m.attributeId);
      if (kod && !aktivaVarden(m).some((v) => v.code === kod)) fel.push(`${namn}: ${kod} är inaktivt och kan inte väljas i en ny version.`);
      else if (!kod && t.status === 'ACTIVE') fel.push(`${namn}: Välj ett värde. Konteringsmallen är aktiv.`);
    }
    return fel;
  });

  sparaNyVersion(): void {
    this.forsokSpara.set(true);
    const n = this.nyVersion();
    const t = this.mall();
    const p = this.profil();
    if (!n || !t || !p || this.nyVersionFel().length) return;
    const valbara = new Set(p.mappings.filter((m) => m.mode === 'SELECTABLE').map((m) => m.attributeId));
    const values = Object.fromEntries(Object.entries(n.values).filter(([a, kod]) => kod && valbara.has(a)));
    const v: TemplateVersion = {
      id: nyttId('v'),
      validFrom: n.validFrom,
      changeReason: n.changeReason.trim(),
      createdAt: idag(),
      values,
      source: 'underlag',
    };
    this.service.sparaMall({ ...t, versions: [...t.versions, v] }, `Versionen från ${v.validFrom} har sparats.`);
    this.valdVersionId.set(v.id);
    this.nyVersion.set(null);
  }

  bekraftaTaBortVersion(v: TemplateVersion): void {
    const t = this.mall();
    this.taBortVersion.set(null);
    if (!t || versionStatus(t, v) !== 'UPCOMING') return; // M5
    this.service.sparaMall({ ...t, versions: t.versions.filter((x) => x.id !== v.id) }, 'Versionen har tagits bort.');
    if (this.valdVersionId() === v.id) this.valdVersionId.set(null);
  }
}
