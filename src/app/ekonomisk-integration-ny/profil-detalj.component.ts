import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import {
  Brodsmula,
  EI_BAS,
  EiBegreppComponent,
  EiDialogComponent,
  EiKallaComponent,
  EiNotisComponent,
  EiRamComponent,
  K,
} from './ei-delade';
import {
  ARENDEFALT_NAMN,
  BOK_NAMN,
  BOK_ORDNING,
  BlockedPeriod,
  FLODE_NAMN,
  FLODE_ORDNING,
  Flow,
  MALLSTATUS_NAMN,
  PROFILSTATUS_NAMN,
  PostingProfile,
  TemplateStatus,
  TransactionType,
  giltighetText,
  idag,
  profilStatus,
  profilStatusKlass,
  sorteradeMappningar,
} from './ei-modell';
import { Aktivering, EiPlaneraComponent } from './ei-planera.component';
import { EkonomiskIntegrationService, ProfilFlik, nyttId } from './ei.service';
import { EiMallTabellComponent } from './mall-tabell.component';
import { EiProfilMappningComponent } from './profil-mappning.component';
import { EiProfilVardelistorComponent } from './profil-vardelistor.component';

const FLIKAR: { id: ProfilFlik; namn: string }[] = [
  { id: 'oversikt', namn: 'Översikt' },
  { id: 'mappning', namn: 'Mappning' },
  { id: 'vardelistor', namn: 'Värdelistor' },
  { id: 'mallar', namn: 'Konteringsmallar' },
  { id: 'sparr', namn: 'Spärrperioder' },
];

interface Grundform {
  name: string;
  flows: Flow[];
  transactionTypes: TransactionType[];
}
interface SparrForm {
  from: string;
  to: string;
  reason: string;
}

@Component({
  selector: 'app-ei-profil-detalj',
  imports: [
    FormsModule,
    RouterLink,
    DatumValjareComponent,
    EiRamComponent,
    EiBegreppComponent,
    EiKallaComponent,
    EiNotisComponent,
    EiDialogComponent,
    EiPlaneraComponent,
    EiMallTabellComponent,
    EiProfilMappningComponent,
    EiProfilVardelistorComponent,
  ],
  template: `
    @if (profil(); as p) {
      @let status = profilStatus(p);
      <app-ei-ram flik="profiler" [brodsmulor]="smulor()">
        <!-- Spärrbanner -->
        @if (aktuellSparr(); as s) {
          <div class="mb-4">
            <app-ei-notis niva="error">
              Utbetalningar är spärrade från {{ s.from }} till {{ s.to ?? 'tills vidare' }}. Orsak: {{ s.reason }}
            </app-ei-notis>
          </div>
        }

        <!-- Sidhuvud -->
        <div class="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-semibold text-text">{{ p.name }}</h2>
              <span [class]="k.status + ' ' + statusKlass(p)">{{ statusNamn[status] }}</span>
              <app-ei-kalla [kalla]="p.source" />
            </div>
            <dl class="flex flex-wrap gap-x-6 gap-y-1 mt-1.5 text-sm">
              <div><dt class="inline text-text-muted mr-1">Utbetalande organisation:</dt> <dd class="inline">{{ org()?.name }}</dd></div>
              <div><dt class="inline text-text-muted mr-1">Ekonomisystem:</dt> <dd class="inline"><a [routerLink]="bas + '/ekonomisystem/' + p.economicSystemId" [class]="k.lank">{{ service.hamtaSystem(p.economicSystemId)?.name }}</a></dd></div>
              <div>
                <dt class="inline text-text-muted mr-1">Giltig:</dt> <dd class="inline">{{ giltig(p) }}</dd>
                <app-ei-kalla class="ml-1" [kalla]="p.validFromSource" />
              </div>
            </dl>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            @switch (status) {
              @case ('DRAFT') {
                <button type="button" (click)="oppnaGrund()" [class]="k.sekundarLiten">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>Redigera grunduppgifter
                </button>
                <button type="button" (click)="planera.set('planera')" [class]="k.primar">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">event</span>Planera aktivering…
                </button>
                <button type="button" (click)="taBortOppen.set(true)" [class]="k.sekundarLiten">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>Ta bort
                </button>
              }
              @case ('PLANNED') {
                <button type="button" (click)="planera.set('nu')" [class]="k.primar">Aktivera nu</button>
                <button type="button" (click)="angraPlanering()" [class]="k.sekundarLiten">Ångra planering</button>
              }
              @case ('ACTIVE') {
                <button type="button" (click)="oppnaAvsluta()" [class]="k.sekundarLiten">Avsluta…</button>
                <a [routerLink]="bas + '/integrationsprofiler/ny'" [queryParams]="{ utgaFran: p.id }" [class]="k.primar">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>Skapa ny profil utifrån denna
                </a>
              }
              @case ('ENDED') {
                <a [routerLink]="bas + '/integrationsprofiler/ny'" [queryParams]="{ utgaFran: p.id }" [class]="k.primar">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>Skapa ny profil utifrån denna
                </a>
              }
            }
          </div>
        </div>

        <div class="bg-surface border border-border">
          <!-- Flikar -->
          <div role="tablist" aria-label="Integrationsprofil" class="flex items-stretch border-b border-border px-2 overflow-x-auto">
            @for (f of flikar; track f.id) {
              <button type="button" role="tab" [id]="'ei-pflik-' + f.id" [attr.aria-selected]="flik() === f.id"
                [attr.aria-controls]="'ei-ppanel-' + f.id" (click)="valjFlik(f.id)"
                class="px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors outline-none focus-visible:shadow-focus"
                [class]="flik() === f.id ? 'text-text border-primary' : 'text-text-secondary border-transparent hover:text-text hover:border-border-strong'">
                {{ f.namn }}
                @if (f.id === 'oversikt' && varningar().length) {
                  <span class="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[11px] rounded-full bg-warning text-on-warning">{{ varningar().length }}</span>
                }
                @if (f.id === 'mallar') { <span class="ml-1 text-text-muted">{{ mallar().length }}</span> }
                @if (f.id === 'sparr') { <span class="ml-1 text-text-muted">{{ p.blockedPeriods.length }}</span> }
              </button>
            }
          </div>

          <div [id]="'ei-ppanel-' + flik()" role="tabpanel" [attr.aria-labelledby]="'ei-pflik-' + flik()">
            @switch (flik()) {
              <!-- ============ Översikt ============ -->
              @case ('oversikt') {
                <div class="p-5 space-y-5">
                  @if (p.notices.length) {
                    <div class="space-y-2">
                      @for (n of p.notices; track $index) {
                        <app-ei-notis [niva]="n.level">{{ n.text }}</app-ei-notis>
                      }
                    </div>
                  }
                  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <section class="border border-border p-4">
                      <h3 class="flex items-center gap-1 text-sm font-semibold mb-2">Flöden <app-ei-begrepp term="Flöde" /></h3>
                      <ul class="text-sm space-y-1 list-none m-0 p-0">
                        @for (f of p.flows; track f) { <li>{{ flodeNamn[f] }} <span class="font-mono text-[12px] text-text-muted">({{ f }})</span></li> }
                      </ul>
                    </section>
                    <section class="border border-border p-4">
                      <h3 class="flex items-center gap-1 text-sm font-semibold mb-2">Böcker <app-ei-begrepp term="Bokförs i" /></h3>
                      <ul class="text-sm space-y-1 list-none m-0 p-0">
                        @for (b of p.transactionTypes; track b) { <li>{{ bokNamn[b] }} <span class="font-mono text-[12px] text-text-muted">({{ b }})</span></li> }
                      </ul>
                    </section>
                    <section class="border border-border p-4">
                      <h3 class="flex items-center gap-1 text-sm font-semibold mb-2">Attribut <app-ei-begrepp term="Attribut" /></h3>
                      <dl class="text-sm space-y-1.5">
                        @for (g of attributGrupper(); track g.namn) {
                          <div>
                            <dt class="text-text-muted">{{ g.namn }} ({{ g.attribut.length }})</dt>
                            <dd>{{ g.attribut.join(', ') || '–' }}</dd>
                          </div>
                        }
                      </dl>
                      <button type="button" (click)="valjFlik('mappning')" class="mt-2 text-sm" [class]="k.lank">Visa mappningen</button>
                    </section>
                    <section class="border border-border p-4">
                      <h3 class="flex items-center gap-1 text-sm font-semibold mb-2">Konteringsmallar <app-ei-begrepp term="Konteringsmall" /></h3>
                      <ul class="text-sm space-y-1 list-none m-0 p-0">
                        @for (s of mallStatusar; track s) {
                          <li class="flex justify-between max-w-[200px]"><span>{{ mallStatusNamn[s] }}</span><span class="font-medium">{{ antalMallar(s) }}</span></li>
                        }
                      </ul>
                      <button type="button" (click)="valjFlik('mallar')" class="mt-2 text-sm" [class]="k.lank">Visa konteringsmallarna</button>
                    </section>
                    <section class="border border-border p-4">
                      <h3 class="text-sm font-semibold mb-2">Varningar</h3>
                      @if (varningar().length) {
                        <ul class="text-sm space-y-1.5 list-none m-0 p-0">
                          @for (v of varningar(); track v.text) {
                            <li class="flex items-start gap-1.5">
                              <span class="material-symbols-outlined text-[18px] text-warning shrink-0" aria-hidden="true">warning</span>
                              <button type="button" (click)="valjFlik(v.flik, v.attributId)" class="text-left" [class]="k.lank">{{ v.text }}</button>
                            </li>
                          }
                        </ul>
                      } @else {
                        <p class="text-sm text-text-muted">Inga varningar.</p>
                      }
                    </section>
                    <section class="border border-border p-4">
                      <h3 class="flex items-center gap-1 text-sm font-semibold mb-2">Betalar ut för <app-ei-begrepp term="Beslutande organisation" /></h3>
                      @if (betalarUtFor().length) {
                        <ul class="text-sm space-y-1 list-none m-0 p-0">
                          @for (b of betalarUtFor(); track $index) { <li>{{ b }}</li> }
                        </ul>
                      } @else {
                        <p class="text-sm text-text-muted">–</p>
                      }
                      <p [class]="k.hjalp">Hämtas från konteringsmallarnas Avsedd för.</p>
                    </section>
                  </div>
                </div>
              }

              <!-- ============ Mappning ============ -->
              @case ('mappning') {
                <app-ei-profil-mappning [profil]="p" />
              }

              <!-- ============ Värdelistor ============ -->
              @case ('vardelistor') {
                <app-ei-profil-vardelistor [profil]="p" [attributId]="attributParam()" />
              }

              <!-- ============ Konteringsmallar ============ -->
              @case ('mallar') {
                <div class="flex items-center justify-between gap-4 px-5 py-4">
                  <p class="text-sm text-text-secondary">Konteringsmallar som använder profilen.</p>
                  @if (status !== 'ENDED') {
                    <a [routerLink]="bas + '/konteringsmallar/ny'" [queryParams]="{ profil: p.id }" [class]="k.primar">
                      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Ny konteringsmall
                    </a>
                  }
                </div>
                @if (mallar().length) {
                  <app-ei-mall-tabell [mallar]="mallar()" [visaProfil]="false" />
                } @else {
                  <div class="px-6 py-10 text-center border-t border-border-muted">
                    <p class="text-sm text-text-muted">Inga konteringsmallar ännu.</p>
                    @if (status !== 'ENDED') {
                      <a [routerLink]="bas + '/konteringsmallar/ny'" [queryParams]="{ profil: p.id }" [class]="k.sekundarLiten + ' mt-3'">Ny konteringsmall</a>
                    }
                  </div>
                }
              }

              <!-- ============ Spärrperioder ============ -->
              @case ('sparr') {
                <div class="flex items-center justify-between gap-4 px-5 py-4">
                  <p class="text-sm text-text-secondary">Under en spärrperiod skickas inga utbetalningar med profilen.</p>
                  <button type="button" (click)="oppnaSparr()" [class]="k.primar">
                    <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Lägg till spärr
                  </button>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-y border-border">
                        <th scope="col" [class]="k.th + ' pl-5'">Från</th>
                        <th scope="col" [class]="k.th">Till</th>
                        <th scope="col" [class]="k.th">Orsak</th>
                        <th scope="col" [class]="k.th">Skapad av</th>
                        <th scope="col" [class]="k.th">Skapad</th>
                        <th scope="col" class="pl-4 pr-5 py-2.5"><span class="sr-only">Åtgärder</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (s of p.blockedPeriods; track s.id) {
                        <tr class="border-b border-border-muted odd:bg-surface-subtle">
                          <td class="pl-5 pr-4 py-2.5 whitespace-nowrap">{{ s.from }}</td>
                          <td class="px-4 py-2.5 whitespace-nowrap">{{ s.to ?? 'Tills vidare' }}</td>
                          <td class="px-4 py-2.5">{{ s.reason }}</td>
                          <td class="px-4 py-2.5">{{ s.createdBy }}</td>
                          <td class="px-4 py-2.5 whitespace-nowrap">{{ s.createdAt }}</td>
                          <td class="pl-4 pr-5 py-1.5 text-right">
                            <button type="button" (click)="taBortSparr.set(s)" [attr.aria-label]="'Ta bort spärr från ' + s.from" title="Ta bort" [class]="k.ikon">
                              <span class="material-symbols-outlined text-[20px] align-middle">delete</span>
                            </button>
                          </td>
                        </tr>
                      } @empty {
                        <tr><td colspan="6" class="px-6 py-10 text-center text-text-muted">Inga spärrperioder.</td></tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            }
          </div>
        </div>
      </app-ei-ram>

      <!-- ============ Dialoger ============ -->

      @if (planera(); as lage) {
        <app-ei-planera [profil]="p" [valjDatum]="lage === 'planera'" [rubrik]="lage === 'planera' ? 'Planera aktivering' : 'Aktivera nu'"
          (klar)="aktivera($event)" (stang)="planera.set(null)" />
      }

      @if (grund(); as g) {
        <app-ei-dialog rubrik="Redigera grunduppgifter" (stang)="grund.set(null)">
          <div>
            <label for="ei-g-namn" [class]="k.etikett">Namn <span class="text-error" aria-hidden="true">*</span></label>
            <input id="ei-g-namn" type="text" autocomplete="off" [ngModel]="g.name" (ngModelChange)="sattGrund({ name: $event })" [class]="k.falt" />
          </div>
          <fieldset>
            <legend [class]="k.etikett">Flöden</legend>
            <div class="flex gap-6">
              @for (f of floden; track f) {
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-primary" [checked]="g.flows.includes(f)" (change)="vaxlaGrundFlode(f)" />
                  {{ flodeNamn[f] }} ({{ f }})
                </label>
              }
            </div>
          </fieldset>
          <fieldset>
            <legend [class]="k.etikett">Böcker</legend>
            <div class="flex flex-wrap gap-x-6 gap-y-2">
              @for (b of bocker; track b) {
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" class="w-4 h-4 accent-primary" [checked]="g.transactionTypes.includes(b)" (change)="vaxlaGrundBok(b)" />
                  {{ bokNamn[b] }} ({{ b }})
                </label>
              }
            </div>
            <p [class]="k.hjalp">Böckerna bestämmer vilka rader som skickas till Agresso.</p>
          </fieldset>
          @if (grundFel().length && forsokSpara()) {
            <ul class="space-y-1 list-none m-0 p-0" role="alert">
              @for (f of grundFel(); track $index) {
                <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
              }
            </ul>
          }
          <button fot type="button" (click)="grund.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="sparaGrund()" [class]="k.primar">Spara</button>
        </app-ei-dialog>
      }

      @if (avslutaDatum() !== null) {
        <app-ei-dialog rubrik="Avsluta integrationsprofilen" (stang)="avslutaDatum.set(null)">
          <div>
            <label for="ei-avsluta" [class]="k.etikett">Giltig till</label>
            <app-datum-valjare inputId="ei-avsluta" etikett="Giltig till" [varde]="avslutaDatum()!" (vardeChange)="avslutaDatum.set($event)" />
            <p [class]="k.hjalp">Profilen blir Avslutad när datumet har passerats. Konteringsmallar som använder profilen får en varning.</p>
            @if (avslutaDatum()! && avslutaDatum()! < p.validFrom) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>Giltig till kan inte vara före giltig från ({{ p.validFrom }}).</p>
            }
          </div>
          <button fot type="button" (click)="avslutaDatum.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="avsluta()" [class]="k.primar" [disabled]="!avslutaDatum() || avslutaDatum()! < p.validFrom">Avsluta</button>
        </app-ei-dialog>
      }

      @if (taBortOppen()) {
        <app-ei-dialog rubrik="Ta bort integrationsprofilen?" roll="alertdialog" (stang)="taBortOppen.set(false)">
          @if (mallar().length) {
            <p [class]="k.fel + ' text-sm'"><span class="material-symbols-outlined text-[18px]">block</span>Profilen används i {{ mallar().length }} konteringsmall(ar). Ta bort eller flytta dem först.</p>
          } @else {
            <p class="text-sm text-text"><span class="font-semibold">{{ p.name }}</span> tas bort.</p>
          }
          <button fot type="button" (click)="taBortOppen.set(false)" [class]="k.sekundar">Avbryt</button>
          @if (!mallar().length) {
            <button fot type="button" (click)="taBort()" [class]="k.fara">Ta bort</button>
          }
        </app-ei-dialog>
      }

      @if (sparr(); as s) {
        <app-ei-dialog rubrik="Lägg till spärr" (stang)="sparr.set(null)">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="ei-s-fran" [class]="k.etikett">Från <span class="text-error" aria-hidden="true">*</span></label>
              <app-datum-valjare inputId="ei-s-fran" etikett="Från" [varde]="s.from" (vardeChange)="sattSparr({ from: $event })" />
            </div>
            <div>
              <label for="ei-s-till" [class]="k.etikett">Till</label>
              <app-datum-valjare inputId="ei-s-till" etikett="Till" placeholder="Tills vidare" [varde]="s.to" (vardeChange)="sattSparr({ to: $event })" />
            </div>
          </div>
          <div>
            <label for="ei-s-orsak" [class]="k.etikett">Orsak <span class="text-error" aria-hidden="true">*</span></label>
            <textarea id="ei-s-orsak" rows="2" [ngModel]="s.reason" (ngModelChange)="sattSparr({ reason: $event })" [class]="k.falt + ' resize-y'"></textarea>
          </div>
          @if (forsokSpara() && sparrFel().length) {
            <ul class="space-y-1 list-none m-0 p-0" role="alert">
              @for (f of sparrFel(); track $index) {
                <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
              }
            </ul>
          }
          <button fot type="button" (click)="sparr.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="sparaSparr()" [class]="k.primar">Lägg till</button>
        </app-ei-dialog>
      }

      @if (taBortSparr(); as s) {
        <app-ei-dialog rubrik="Ta bort spärren?" roll="alertdialog" (stang)="taBortSparr.set(null)">
          <p class="text-sm text-text">Spärren {{ s.from }} – {{ s.to ?? 'tills vidare' }} tas bort.</p>
          <button fot type="button" (click)="taBortSparr.set(null)" [class]="k.sekundar">Avbryt</button>
          <button fot type="button" (click)="bekraftaTaBortSparr(s)" [class]="k.fara">Ta bort</button>
        </app-ei-dialog>
      }
    } @else {
      <app-ei-ram flik="profiler" [brodsmulor]="[{ text: 'Hittades inte' }]">
        <p class="text-sm text-text-muted">Integrationsprofilen finns inte. Den kan ha tagits bort.</p>
      </app-ei-ram>
    }
  `,
})
export class EiProfilDetaljComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly k = K;
  readonly bas = EI_BAS;
  readonly flikar = FLIKAR;
  readonly statusNamn = PROFILSTATUS_NAMN;
  readonly flodeNamn = FLODE_NAMN;
  readonly bokNamn = BOK_NAMN;
  readonly floden = FLODE_ORDNING;
  readonly bocker = BOK_ORDNING;
  readonly mallStatusar: TemplateStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE'];
  readonly mallStatusNamn = MALLSTATUS_NAMN;
  readonly profilStatus = profilStatus;

  private readonly params = toSignal(this.route.paramMap, { requireSync: true });
  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });

  readonly profil = computed(() => this.service.hamtaProfil(this.params().get('id')));
  readonly flik = computed<ProfilFlik>(() => {
    const f = this.query().get('flik');
    return FLIKAR.some((x) => x.id === f) ? (f as ProfilFlik) : 'oversikt';
  });
  readonly attributParam = computed(() => this.query().get('attribut'));

  readonly org = computed(() => this.service.hamtaOrg(this.profil()?.organisationId ?? null));
  readonly mallar = computed(() => (this.profil() ? this.service.mallarFor(this.profil()!.id) : []));
  readonly varningar = computed(() => (this.profil() ? this.service.profilVarningar(this.profil()!) : []));

  readonly smulor = computed<Brodsmula[]>(() => {
    const p = this.profil();
    if (!p) return [];
    return [
      { text: p.name, lank: `${EI_BAS}/integrationsprofiler/${p.id}` },
      { text: FLIKAR.find((f) => f.id === this.flik())!.namn },
    ];
  });

  readonly attributGrupper = computed(() => {
    const p = this.profil();
    if (!p) return [];
    const namn = (mode: string) =>
      sorteradeMappningar(p)
        .filter((m) => m.mode === mode)
        .map((m) => this.service.attributNamn(p, m.attributeId) + (m.mode === 'FIXED' ? ` (${m.fixedValue})` : m.mode === 'FROM_CASE' ? ` (${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']})` : ''));
    return [
      { namn: 'Valbara', attribut: namn('SELECTABLE') },
      { namn: 'Fasta', attribut: namn('FIXED') },
      { namn: 'Från ärendet', attribut: namn('FROM_CASE') },
      { namn: 'Följer flödet', attribut: namn('FOLLOWS_FLOW') },
    ];
  });

  readonly betalarUtFor = computed(() => {
    const namn = this.mallar()
      .map((t) => this.service.hamtaBeslutande(t.intendedFor.decidingOrganisationId)?.name)
      .filter((n): n is string => !!n);
    return [...new Set(namn)].sort((a, b) => a.localeCompare(b, 'sv'));
  });

  readonly aktuellSparr = computed(() => {
    const dag = idag();
    return this.profil()?.blockedPeriods.find((s) => s.from <= dag && (!s.to || s.to >= dag)) ?? null;
  });

  antalMallar(s: TemplateStatus): number {
    return this.mallar().filter((t) => t.status === s).length;
  }

  statusKlass(p: PostingProfile): string {
    return profilStatusKlass(profilStatus(p));
  }

  giltig(p: PostingProfile): string {
    return giltighetText(p.validFrom, p.validTo);
  }

  valjFlik(flik: ProfilFlik, attribut?: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { flik, attribut: attribut ?? null },
      replaceUrl: true,
    });
  }

  /* ---------- Livscykel ---------- */

  readonly planera = signal<'planera' | 'nu' | null>(null);
  readonly avslutaDatum = signal<string | null>(null);
  readonly taBortOppen = signal(false);

  aktivera(a: Aktivering): void {
    const p = this.profil();
    if (!p) return;
    this.planera.set(null);
    this.service.aktivera(p.id, a.datum, a.avslutaId);
    this.service.visaBekraftelse(a.datum <= idag() ? 'Integrationsprofilen är aktiv.' : `Aktiveringen är planerad till ${a.datum}.`);
  }

  angraPlanering(): void {
    const p = this.profil();
    if (p) this.service.andraProfil(p.id, (x) => ({ ...x, status: 'DRAFT' }), 'Planeringen har ångrats. Profilen är ett utkast igen.');
  }

  oppnaAvsluta(): void {
    this.avslutaDatum.set(idag());
  }

  avsluta(): void {
    const p = this.profil();
    const datum = this.avslutaDatum();
    if (!p || !datum) return;
    this.avslutaDatum.set(null);
    this.service.andraProfil(p.id, (x) => ({ ...x, validTo: datum }), `Integrationsprofilen avslutas ${datum}.`);
  }

  taBort(): void {
    const p = this.profil();
    if (!p) return;
    this.taBortOppen.set(false);
    this.service.taBortProfil(p.id);
    this.router.navigate([EI_BAS, 'integrationsprofiler']);
  }

  /* ---------- Grunduppgifter (utkast) ---------- */

  readonly grund = signal<Grundform | null>(null);
  readonly forsokSpara = signal(false);

  oppnaGrund(): void {
    const p = this.profil();
    if (!p) return;
    this.forsokSpara.set(false);
    this.grund.set({ name: p.name, flows: [...p.flows], transactionTypes: [...p.transactionTypes] });
  }

  sattGrund(andring: Partial<Grundform>): void {
    this.grund.update((g) => (g ? { ...g, ...andring } : g));
  }

  vaxlaGrundFlode(f: Flow): void {
    this.grund.update((g) =>
      g ? { ...g, flows: FLODE_ORDNING.filter((x) => (x === f ? !g.flows.includes(f) : g.flows.includes(x))) } : g,
    );
  }

  vaxlaGrundBok(b: TransactionType): void {
    this.grund.update((g) =>
      g
        ? {
            ...g,
            transactionTypes: BOK_ORDNING.filter((x) => (x === b ? !g.transactionTypes.includes(b) : g.transactionTypes.includes(x))),
          }
        : g,
    );
  }

  readonly grundFel = computed(() => {
    const g = this.grund();
    const p = this.profil();
    if (!g || !p) return [];
    const fel = this.service.grundfel({ ...p, ...g });
    const utanBok = p.mappings
      .filter((m) => !m.bookIn.some((b) => g.transactionTypes.includes(b)))
      .map((m) => this.service.attributNamn(p, m.attributeId));
    if (utanBok.length) fel.push(`${utanBok.join(', ')} bokförs bara i böcker som tas bort. Ändra Bokförs i under Mappning först.`);
    return fel;
  });

  sparaGrund(): void {
    this.forsokSpara.set(true);
    const g = this.grund();
    const p = this.profil();
    if (!g || !p || this.grundFel().length) return;
    this.service.sparaProfil({
      ...p,
      name: g.name.trim(),
      flows: g.flows,
      transactionTypes: g.transactionTypes,
      mappings: p.mappings.map((m) => ({ ...m, bookIn: m.bookIn.filter((b) => g.transactionTypes.includes(b)) })),
    });
    this.grund.set(null);
  }

  /* ---------- Spärrperioder (P2) ---------- */

  readonly sparr = signal<SparrForm | null>(null);
  readonly taBortSparr = signal<BlockedPeriod | null>(null);

  oppnaSparr(): void {
    this.forsokSpara.set(false);
    this.sparr.set({ from: idag(), to: '', reason: '' });
  }

  sattSparr(andring: Partial<SparrForm>): void {
    this.sparr.update((s) => (s ? { ...s, ...andring } : s));
  }

  readonly sparrFel = computed(() => {
    const s = this.sparr();
    const fel: string[] = [];
    if (!s) return fel;
    if (!s.from) fel.push('Ange från-datum.');
    if (s.to && s.from && s.to < s.from) fel.push('Till kan inte vara före från.');
    if (!s.reason.trim()) fel.push('Ange en orsak.');
    return fel;
  });

  sparaSparr(): void {
    this.forsokSpara.set(true);
    const s = this.sparr();
    const p = this.profil();
    if (!s || !p || this.sparrFel().length) return;
    const ny: BlockedPeriod = {
      id: nyttId('sp'),
      from: s.from,
      to: s.to || null,
      reason: s.reason.trim(),
      createdBy: 'Demo Demon',
      createdAt: idag(),
    };
    this.service.andraProfil(p.id, (x) => ({ ...x, blockedPeriods: [...x.blockedPeriods, ny] }), 'Spärren har lagts till.');
    this.sparr.set(null);
  }

  bekraftaTaBortSparr(s: BlockedPeriod): void {
    const p = this.profil();
    this.taBortSparr.set(null);
    if (p)
      this.service.andraProfil(p.id, (x) => ({ ...x, blockedPeriods: x.blockedPeriods.filter((b) => b.id !== s.id) }), 'Spärren har tagits bort.');
  }
}
