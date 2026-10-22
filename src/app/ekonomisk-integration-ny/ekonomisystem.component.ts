import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { EI_BAS, EiBegreppComponent, EiKallaComponent, EiNotisComponent, EiRamComponent, K } from './ei-delade';
import {
  ARENDEFALT_NAMN,
  Category,
  EconomicSystem,
  INTEGRATION_NAMN,
  IntegrationProfile,
  LAGE_NAMN,
  integrationKlass,
  kategoriText,
  profilStatus,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

const UTVECKLARE_ETIKETT =
  'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-sm bg-surface-neutral text-on-surface-neutral border border-border whitespace-nowrap';

/* ============================================================
   Lista
   ============================================================ */

@Component({
  selector: 'app-ei-ekonomisystem-lista',
  imports: [RouterLink, EiRamComponent, EiBegreppComponent, EiKallaComponent],
  template: `
    <app-ei-ram flik="ekonomisystem">
      <h2 class="flex items-center gap-1 text-lg font-semibold text-text mb-3">
        Ekonomisystem <app-ei-begrepp term="Ekonomisystem" />
      </h2>
      <ul class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 list-none p-0 m-0">
        @for (s of service.system(); track s.id) {
          <li class="flex">
            <a [routerLink]="bas + '/ekonomisystem/' + s.id"
              class="group flex flex-col w-full min-h-[180px] p-4 bg-surface border border-border hover:border-border-strong hover:shadow-sm transition-[border-color,box-shadow] focus:outline-none focus-visible:border-border-focus focus-visible:shadow-focus">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <h3 class="text-lg font-semibold text-text leading-snug">{{ s.name }}</h3>
                  <p class="text-[13px] text-text-muted">{{ s.vendor }}</p>
                </div>
                <div class="flex flex-wrap justify-end gap-1">
                  <span [class]="utvecklare">
                    <span class="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
                    Sätts av utvecklare
                  </span>
                  <span [class]="k.status + ' ' + integrationKlass(s.integrationStatus)">{{ integrationNamn[s.integrationStatus] }}</span>
                  <app-ei-kalla [kalla]="s.source" />
                </div>
              </div>
              <p class="text-sm text-text-secondary leading-normal mt-1.5">{{ s.description }}</p>
              <dl class="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
                <div><dt class="inline text-text-muted mr-1">Attribut:</dt> <dd class="inline text-text font-medium">{{ s.attributes.length }}</dd></div>
                <div><dt class="inline text-text-muted mr-1">Dimensioner:</dt> <dd class="inline text-text font-medium">{{ s.categories.length }}</dd></div>
                <div><dt class="inline text-text-muted mr-1">Integrationsprofiler:</dt> <dd class="inline text-text font-medium">{{ antalProfiler(s.id) }}</dd></div>
              </dl>
              <span class="mt-auto pt-3 self-end flex items-center text-interactive" aria-hidden="true">
                <span class="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
              </span>
            </a>
          </li>
        }
      </ul>
    </app-ei-ram>
  `,
})
export class EiEkonomisystemListaComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly bas = EI_BAS;
  readonly k = K;
  readonly utvecklare = UTVECKLARE_ETIKETT;
  readonly integrationNamn = INTEGRATION_NAMN;
  readonly integrationKlass = integrationKlass;

  antalProfiler(systemId: string): number {
    return this.service.profiler().filter((p) => p.economicSystemId === systemId).length;
  }
}

/* ============================================================
   Detaljsida (skrivskyddad)
   ============================================================ */

interface Anvandning {
  profil: IntegrationProfile;
  kort: string;
  attributId: string;
  kategori: Category;
}

@Component({
  selector: 'app-ei-ekonomisystem-detalj',
  imports: [RouterLink, EiRamComponent, EiBegreppComponent, EiKallaComponent, EiNotisComponent],
  template: `
    @if (system(); as s) {
      <app-ei-ram flik="ekonomisystem" [brodsmulor]="[{ text: s.name }]">
        <div class="flex items-center gap-3 flex-wrap mb-3">
          <h2 class="text-xl font-semibold text-text">{{ s.name }}</h2>
          <span class="text-sm text-text-muted">{{ s.vendor }}</span>
          <span [class]="utvecklare">
            <span class="material-symbols-outlined text-[14px]" aria-hidden="true">lock</span>
            Sätts av utvecklare
          </span>
          <span [class]="k.status + ' ' + integrationKlass(s.integrationStatus)">{{ integrationNamn[s.integrationStatus] }}</span>
          <app-ei-kalla [kalla]="s.source" />
        </div>
        <div class="mb-6 max-w-[900px] space-y-2">
          <app-ei-notis>
            Ekonomisystemet sätts upp av utvecklare och kan inte ändras här. Det visar vad som går att använda i en integrationsprofil.
            <span class="block mt-1">{{ s.integrationStatusText }}</span>
          </app-ei-notis>
          @if (s.integrationStatus === 'NOT_AVAILABLE') {
            <app-ei-notis niva="warning">
              {{ s.name }} finns med som exempel på ett andra ekonomisystem. Attribut och dimensioner är ett antagande. Det finns ingen
              filgenerering för {{ s.name }}, så integrationsprofiler kan bara sparas som utkast.
            </app-ei-notis>
          }
        </div>

        <nav class="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-sm" aria-label="Innehåll">
          @for (a of ankare(); track a.id) {
            <a [href]="'#' + a.id" (click)="hoppa($event, a.id)" class="text-interactive hover:underline">{{ a.namn }}</a>
          }
        </nav>

        <div class="space-y-8">
          <!-- 5.1 Attribut -->
          <section id="ei-attribut" class="bg-surface border border-border">
            <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
              Attribut <app-ei-begrepp term="Attribut" />
              <app-ei-kalla class="ml-2" [kalla]="s.attributeDescriptionsSource" />
              @if (s.attributeDescriptionsSource === 'assumption') {
                <span class="text-[13px] font-normal text-text-muted">(beskrivningarna)</span>
              }
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-left">
                    <th scope="col" class="pl-5 pr-4 py-2.5 font-semibold"><span class="inline-flex items-center gap-1">Attribut <app-ei-begrepp term="Attribut" /></span></th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">Beskrivning</th>
                    <th scope="col" class="px-4 py-2.5 font-semibold whitespace-nowrap"><span class="inline-flex items-center gap-1">Kan mappas till <app-ei-begrepp term="Dimension" /></span></th>
                    <th scope="col" class="pl-4 pr-5 py-2.5 font-semibold whitespace-nowrap"><span class="inline-flex items-center gap-1">Används i profiler <app-ei-begrepp term="Integrationsprofil" /></span></th>
                  </tr>
                </thead>
                <tbody>
                  @for (a of s.attributes; track a.id) {
                    <tr class="border-b border-border-muted odd:bg-surface-subtle">
                      <td class="pl-5 pr-4 py-2.5 font-medium text-text whitespace-nowrap">{{ a.name }}</td>
                      <td class="px-4 py-2.5 text-text-secondary">{{ a.description }}</td>
                      <td class="px-4 py-2.5 font-mono text-[13px] whitespace-nowrap">{{ kategoriText(a.allowedCategories) }}</td>
                      <td class="pl-4 pr-5 py-2.5">
                        <div class="flex flex-wrap gap-1">
                          @for (u of anvandningForAttribut(a.id); track u.profil.id) {
                            <a [routerLink]="profilLank(u.profil.id)" [queryParams]="{ flik: 'mappning' }" [title]="u.profil.name"
                              class="inline-block px-1.5 py-px text-xs rounded-sm bg-surface-primary text-on-surface-primary border border-primary-lighter hover:border-primary whitespace-nowrap">{{ u.kort }} · {{ u.kategori }}</a>
                          } @empty {
                            <span class="text-text-subtle">–</span>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- 5.2 Dimensioner -->
          <section id="ei-dimensioner" class="bg-surface border border-border">
            <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
              Dimensioner <app-ei-begrepp term="Dimension" />
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-left">
                    <th scope="col" class="pl-5 pr-4 py-2.5 font-semibold"><span class="inline-flex items-center gap-1">Dimension <app-ei-begrepp term="Dimension" /></span></th>
                    <th scope="col" class="px-4 py-2.5 font-semibold">Beskrivning</th>
                    <th scope="col" class="pl-4 pr-5 py-2.5 font-semibold">Används av</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of s.categories; track c.code) {
                    <tr class="border-b border-border-muted odd:bg-surface-subtle">
                      <td class="pl-5 pr-4 py-2.5 font-mono text-[13px] font-medium whitespace-nowrap">{{ c.label }}</td>
                      <td class="px-4 py-2.5 text-text-secondary">{{ c.description }}</td>
                      <td class="pl-4 pr-5 py-2.5 text-text">{{ anvandsAvText(c.code) || '–' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="flex items-center gap-1.5 px-5 py-3 text-[13px] text-text-secondary border-t border-border-muted">
              <span class="material-symbols-outlined text-[18px] text-info" aria-hidden="true">info</span>
              @if (anvandning().length) {
                Samma dimension kan betyda olika saker i olika profiler. Utgå alltid från attributets namn.
              } @else {
                Inga integrationsprofiler använder {{ s.name }}.
              }
            </p>
          </section>

          <!-- 5.3 Mappningsmatris -->
          <section id="ei-matris" class="bg-surface border border-border">
            <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
              Mappningsmatris <app-ei-begrepp term="Mappning" />
            </h3>
            <div class="overflow-x-auto">
              <table class="text-sm border-collapse min-w-full">
                <thead>
                  <tr>
                    <th scope="col" class="sticky left-0 z-10 bg-surface pl-5 pr-4 py-2.5 text-left font-semibold border-b border-r border-border">Attribut</th>
                    @for (c of s.categories; track c.code) {
                      <th scope="col" class="px-2 py-2.5 font-mono text-[12px] font-semibold text-center border-b border-border whitespace-nowrap min-w-[84px]">{{ c.label }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (a of s.attributes; track a.id) {
                    <tr>
                      <th scope="row" class="sticky left-0 z-10 bg-surface pl-5 pr-4 py-2 text-left font-medium border-b border-r border-border-muted whitespace-nowrap">{{ a.name }}</th>
                      @for (c of s.categories; track c.code) {
                        @let tillaten = a.allowedCategories.includes(c.code);
                        @let marken = cellMarken(a.id, c.code);
                        <td class="px-1.5 py-1.5 text-center align-middle border-b border-l border-border-muted"
                          [class]="!tillaten ? 'bg-gray-200' : marken.length ? 'bg-surface-primary' : 'bg-surface'"
                          [attr.aria-label]="!tillaten ? 'Inte tillåten' : marken.length ? null : 'Tillåten, används inte'">
                          <div class="flex flex-wrap justify-center gap-1">
                            @for (m of marken; track m.profil.id) {
                              <a [routerLink]="profilLank(m.profil.id)" [queryParams]="{ flik: 'mappning' }" [title]="m.profil.name + ': ' + a.name + ' i ' + c.code"
                                class="inline-block px-1.5 py-px text-xs font-medium rounded-sm bg-primary text-on-primary hover:bg-primary-hover whitespace-nowrap">{{ m.kort }}</a>
                            }
                          </div>
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 text-[13px] text-text-secondary border-t border-border-muted">
              <span class="flex items-center gap-1.5"><span class="inline-block w-4 h-4 bg-gray-200 border border-border" aria-hidden="true"></span>Grå: kombinationen är inte tillåten</span>
              <span class="flex items-center gap-1.5"><span class="inline-block w-4 h-4 bg-surface border border-border" aria-hidden="true"></span>Ljus: tillåten men används inte</span>
              <span class="flex items-center gap-1.5"><span class="inline-block px-1.5 py-px text-xs font-medium rounded-sm bg-primary text-on-primary" aria-hidden="true">{{ exempelKort() }}</span>Märke: används av organisationens profil. Klicka för att se mappningen.</span>
              <span class="text-text-muted">Visar aktiva och planerade integrationsprofiler.</span>
            </div>
          </section>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- 5.4 Böcker -->
            <section id="ei-bocker" class="bg-surface border border-border">
              <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
                Böcker (transaktionstyper) <app-ei-begrepp term="Bokförs i" />
              </h3>
              <ul class="px-5 py-3 space-y-1.5 list-none m-0 text-sm">
                @for (b of s.transactionTypes; track b.code) {
                  <li><span class="inline-block w-9 font-mono text-[13px] font-semibold">{{ b.code }}</span>{{ b.label }}</li>
                }
              </ul>
              <p class="px-5 pb-3 text-[13px] text-text-secondary">Reskontraraden blir AP vid utbetalning och AR vid inbetalning.</p>
            </section>

            <!-- 5.5 Flöden -->
            <section id="ei-floden" class="bg-surface border border-border">
              <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
                Flöden <app-ei-begrepp term="Flöde" />
              </h3>
              <ul class="px-5 py-3 space-y-1.5 list-none m-0 text-sm">
                @for (f of s.flows; track f.code) {
                  <li><span class="inline-block w-10 font-mono text-[13px] font-semibold">{{ f.code }}</span>{{ f.label }}</li>
                }
              </ul>
            </section>

            <!-- 5.6 Värdeursprung -->
            <section id="ei-ursprung" class="bg-surface border border-border">
              <h3 class="flex items-center gap-1 px-5 py-3 text-base font-semibold text-text border-b border-border-muted">
                Värdeursprung <app-ei-begrepp term="Värde i kontering" />
              </h3>
              <dl class="px-5 py-3 space-y-2.5 text-sm">
                <div><dt class="font-medium">{{ lage.SELECTABLE }}</dt><dd class="text-text-secondary">Värdet väljs ur värdelistan när en kontering skapas.</dd></div>
                <div><dt class="font-medium">{{ lage.FIXED }}</dt><dd class="text-text-secondary">Värdet sätts i integrationsprofilen och gäller alla konteringar.</dd></div>
                <div><dt class="font-medium">{{ lage.FROM_CASE }}</dt><dd class="text-text-secondary">Värdet fylls i vid utbetalning, antingen {{ arendefalt.CASE_ID }} (CASE_ID) eller {{ arendefalt.COUNTERPART_CODE }} (COUNTERPART_CODE).</dd></div>
                <div><dt class="font-medium">{{ lage.FOLLOWS_FLOW }}</dt><dd class="text-text-secondary">Värdet är samma som konteringens flöde (UTB eller INB).</dd></div>
              </dl>
            </section>
          </div>

          <!-- 5.7 Ersatta systemattribut -->
          @if (s.replacedSystemAttributes.length) {
            <section id="ei-ersatta" class="bg-surface border border-border">
              <h3 class="px-5 py-3 text-base font-semibold text-text border-b border-border-muted">Ersatta systemattribut</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-border text-left">
                      <th scope="col" class="pl-5 pr-4 py-2.5 font-semibold">Gammalt attribut</th>
                      <th scope="col" class="px-4 py-2.5 font-semibold">Kod</th>
                      <th scope="col" class="px-4 py-2.5 font-semibold">Gamla värden</th>
                      <th scope="col" class="pl-4 pr-5 py-2.5 font-semibold">Ersätts av</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of s.replacedSystemAttributes; track r.oldCode) {
                      <tr class="border-b border-border-muted odd:bg-surface-subtle">
                        <td class="pl-5 pr-4 py-2.5 font-medium">{{ r.oldName }}</td>
                        <td class="px-4 py-2.5 font-mono text-[13px]">{{ r.oldCode }}</td>
                        <td class="px-4 py-2.5 font-mono text-[13px]">{{ r.oldValues }}</td>
                        <td class="pl-4 pr-5 py-2.5 text-text-secondary">{{ r.replacedBy }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          }
        </div>
      </app-ei-ram>
    } @else {
      <app-ei-ram flik="ekonomisystem" [brodsmulor]="[{ text: 'Hittades inte' }]">
        <p class="text-sm text-text-muted">Ekonomisystemet finns inte.</p>
      </app-ei-ram>
    }
  `,
})
export class EiEkonomisystemDetaljComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);

  readonly k = K;
  readonly utvecklare = UTVECKLARE_ETIKETT;
  readonly lage = LAGE_NAMN;
  readonly arendefalt = ARENDEFALT_NAMN;
  readonly integrationNamn = INTEGRATION_NAMN;
  readonly integrationKlass = integrationKlass;
  readonly kategoriText = kategoriText;

  private readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))));
  readonly system = computed<EconomicSystem | null>(() => this.service.hamtaSystem(this.id() ?? ''));

  readonly ankare = computed(() => [
    { id: 'ei-attribut', namn: 'Attribut' },
    { id: 'ei-dimensioner', namn: 'Dimensioner' },
    { id: 'ei-matris', namn: 'Mappningsmatris' },
    { id: 'ei-bocker', namn: 'Böcker' },
    { id: 'ei-floden', namn: 'Flöden' },
    { id: 'ei-ursprung', namn: 'Värdeursprung' },
    ...(this.system()?.replacedSystemAttributes.length ? [{ id: 'ei-ersatta', namn: 'Ersatta systemattribut' }] : []),
  ]);

  /** Mappningar i aktiva och planerade profiler som använder systemet. */
  readonly anvandning = computed<Anvandning[]>(() => {
    const s = this.system();
    if (!s) return [];
    return this.service
      .profiler()
      .filter((p) => p.economicSystemId === s.id && ['ACTIVE', 'PLANNED'].includes(profilStatus(p)))
      .flatMap((p) =>
        p.mappings.map((m) => ({
          profil: p,
          kort: this.service.hamtaOrg(p.organisationId)?.shortName ?? '?',
          attributId: m.attributeId,
          kategori: m.category,
        })),
      );
  });

  readonly exempelKort = computed(() => this.anvandning()[0]?.kort ?? this.service.organisationer()[0]?.shortName ?? '');

  anvandningForAttribut(attributId: string): Anvandning[] {
    return this.anvandning().filter((u) => u.attributId === attributId);
  }

  cellMarken(attributId: string, kategori: Category): Anvandning[] {
    return this.anvandning().filter((u) => u.attributId === attributId && u.kategori === kategori);
  }

  anvandsAvText(kategori: Category): string {
    return this.anvandning()
      .filter((u) => u.kategori === kategori)
      .map((u) => `${u.kort}: ${this.service.attributNamn(u.profil, u.attributId)}`)
      .join(' · ');
  }

  profilLank(id: string): string {
    return `${EI_BAS}/integrationsprofiler/${id}`;
  }

  hoppa(e: Event, id: string): void {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
