import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EI_BAS, EiDialogComponent, EiKallaComponent, EiNotisComponent, EiRamComponent, K } from './ei-delade';
import {
  IntegrationProfile,
  Organisation,
  PROFILSTATUS_NAMN,
  SPARRAD_KLASS,
  giltighetText,
  profilStatus,
  profilStatusKlass,
  sparrPa,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

interface Grupp {
  org: Organisation;
  profiler: IntegrationProfile[];
}

@Component({
  selector: 'app-ei-profiler-lista',
  imports: [FormsModule, RouterLink, EiRamComponent, EiKallaComponent, EiDialogComponent, EiNotisComponent],
  template: `
    <app-ei-ram flik="profiler">
      <div class="flex items-center justify-between gap-4 flex-wrap mb-3">
        <h2 class="flex items-center gap-1 text-lg font-semibold text-text">
          Integrationsprofiler
        </h2>
        <div class="flex items-center gap-2">
          <button type="button" (click)="oppnaStoppa()" [class]="k.fara">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">block</span>
            Stoppa alla utbetalningar
          </button>
          <a [routerLink]="bas + '/integrationsprofiler/ny'" [class]="k.primar">
            <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            Ny integrationsprofil
          </a>
        </div>
      </div>

      @if (baraSparrade()) {
        <div class="flex items-center gap-3 mb-3 text-sm">
          <span class="text-text">Visar spärrade integrationsprofiler.</span>
          <a [routerLink]="bas + '/integrationsprofiler'" [class]="k.lank">Visa alla</a>
        </div>
      }

      <div class="bg-surface border border-border overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th scope="col" [class]="k.th + ' pl-5'"><span class="inline-flex items-center gap-1">Organisation</span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Integrationsprofil</span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Ekonomisystem</span></th>
              <th scope="col" [class]="k.th">Status</th>
              <th scope="col" [class]="k.th">Giltig</th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Attribut</span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Konteringar</span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Spärr</span></th>
              <th scope="col" [class]="k.th + ' pr-5'">Varningar</th>
            </tr>
          </thead>
          @for (g of grupper(); track g.org.id) {
            <tbody class="border-b border-border">
              @for (p of g.profiler; track p.id; let forsta = $first) {
                <tr class="border-b border-border-muted last:border-b-0 hover:bg-component-hover">
                  @if (forsta) {
                    <th scope="rowgroup" [attr.rowspan]="g.profiler.length" class="pl-5 pr-4 py-3 align-top text-left font-semibold text-text bg-surface-subtle">
                      {{ g.org.name }}
                      <span class="block text-[12px] font-normal text-text-muted">{{ g.org.shortName }}{{ g.org.nypsId ? ' · ' + g.org.nypsId : '' }}</span>
                    </th>
                  }
                  <td class="px-4 py-3 align-top">
                    <a [routerLink]="profilLank(p.id)" class="font-medium" [class]="k.lank">{{ p.name }}</a>
                    <app-ei-kalla class="ml-1.5" [kalla]="p.source" />
                  </td>
                  <td class="px-4 py-3 align-top">{{ service.systemNamn(p) }}</td>
                  <td class="px-4 py-3 align-top">
                    <span [class]="k.status + ' ' + statusKlass(p)">{{ statusNamn(p) }}</span>
                  </td>
                  <td class="px-4 py-3 align-top whitespace-nowrap">
                    {{ giltig(p) }}
                    <app-ei-kalla class="ml-1" [kalla]="p.validFromSource" />
                  </td>
                  <td class="px-4 py-3 align-top whitespace-nowrap">{{ p.mappings.length }} ({{ valbara(p) }} valbara)</td>
                  <td class="px-4 py-3 align-top">{{ service.konteringarFor(p.id).length }}</td>
                  <td class="px-4 py-3 align-top">
                    @if (sparrad(p)) {
                      <span [class]="k.status + ' ' + sparradKlass">Spärrad</span>
                    } @else {
                      <span class="text-text-subtle">–</span>
                    }
                  </td>
                  <td class="pl-4 pr-5 py-3 align-top">
                    @let n = service.profilVarningar(p).length;
                    @if (n) {
                      <a [routerLink]="profilLank(p.id)" [queryParams]="{ flik: 'oversikt' }"
                        class="inline-flex items-center gap-1 text-warning-dark hover:underline"
                        [attr.aria-label]="n + (n === 1 ? ' varning' : ' varningar') + ' i ' + p.name">
                        <span class="material-symbols-outlined text-[18px] text-warning" aria-hidden="true">warning</span>{{ n }}
                      </a>
                    } @else {
                      <span class="text-text-subtle">–</span>
                    }
                  </td>
                </tr>
              } @empty {
                <tr>
                  <th scope="row" class="pl-5 pr-4 py-3 align-top text-left font-semibold text-text bg-surface-subtle">
                    {{ g.org.name }}
                    <span class="block text-[12px] font-normal text-text-muted">{{ g.org.shortName }}</span>
                    <app-ei-kalla [kalla]="g.org.source" />
                  </th>
                  <td colspan="8" class="px-4 py-3 align-top">
                    <p class="text-text-muted italic">Ingen integrationsprofil</p>
                    <p class="text-[13px] text-text-secondary mt-0.5">
                      {{ g.org.name }} har ingen integrationsprofil. Utan profil kan organisationen inte betala ut via ekonomisk integration.
                    </p>
                    @if (g.org.note) {
                      <p class="text-[13px] text-text-muted mt-0.5">{{ g.org.note }}</p>
                    }
                    <a [routerLink]="bas + '/integrationsprofiler/ny'" [queryParams]="{ org: g.org.id }" class="inline-flex items-center gap-1 mt-1.5 font-medium" [class]="k.lank">
                      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Skapa integrationsprofil
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          } @empty {
            <tbody><tr><td colspan="9" class="px-6 py-10 text-center text-text-muted">Inga integrationsprofiler är spärrade.</td></tr></tbody>
          }
        </table>
      </div>
    </app-ei-ram>

    <!-- Stoppa alla utbetalningar (6.9) -->
    @if (stoppaOppen()) {
      <app-ei-dialog rubrik="Stoppa alla utbetalningar" roll="alertdialog" bredd="max-w-[600px]" (stang)="stoppaOppen.set(false)">
        @if (service.aktivaProfiler().length; as n) {
          <app-ei-notis niva="error">
            En spärrperiod läggs till på {{ n }} aktiva integrationsprofil(er), med start nu och utan slutdatum.
          </app-ei-notis>
          <ul class="list-disc pl-5 text-sm text-text space-y-0.5">
            @for (p of service.aktivaProfiler(); track p.id) {
              <li>{{ p.name }} <span class="text-text-muted">({{ service.hamtaOrg(p.organisationId)?.shortName }})</span></li>
            }
          </ul>
          <div>
            <label for="ei-stoppa-orsak" [class]="k.etikett">Orsak <span class="text-error" aria-hidden="true">*</span></label>
            <textarea id="ei-stoppa-orsak" rows="2" [ngModel]="orsak()" (ngModelChange)="orsak.set($event)" [class]="k.falt + ' resize-y'"
              [attr.aria-invalid]="forsok() && !orsak().trim() ? true : null"></textarea>
            @if (forsok() && !orsak().trim()) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>Ange en orsak.</p>
            }
          </div>
          <label class="flex items-start gap-2 text-sm cursor-pointer">
            <input type="checkbox" class="w-4 h-4 mt-0.5 accent-primary" [checked]="forstar()" (change)="forstar.set(!forstar())" />
            Jag förstår att alla utbetalningar via ekonomisk integration stoppas tills spärren tas bort.
          </label>
          <p [class]="k.hjalp">Spärrarna tas bort per profil under fliken Spärrperioder.</p>
        } @else {
          <p class="text-sm text-text">Det finns inga aktiva integrationsprofiler att spärra.</p>
        }
        <button fot type="button" (click)="stoppaOppen.set(false)" [class]="k.sekundar">Avbryt</button>
        @if (service.aktivaProfiler().length) {
          <button fot type="button" (click)="stoppa()" [class]="k.fara" [disabled]="!forstar()" [class.opacity-50]="!forstar()">Stoppa alla utbetalningar</button>
        }
      </app-ei-dialog>
    }
  `,
})
export class EiProfilerListaComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly sparradKlass = SPARRAD_KLASS;

  private readonly query = toSignal(this.route.queryParamMap, { requireSync: true });
  readonly baraSparrade = computed(() => this.query().get('sparrade') === 'ja');

  readonly grupper = computed<Grupp[]>(() =>
    this.service
      .organisationer()
      .map((org) => ({
        org,
        profiler: this.service
          .profilerFor(org.id)
          .filter((p) => !this.baraSparrade() || this.sparrad(p))
          .sort((a, b) => a.validFrom.localeCompare(b.validFrom)),
      }))
      .filter((g) => !this.baraSparrade() || g.profiler.length),
  );

  profilLank(id: string): string {
    return `${EI_BAS}/integrationsprofiler/${id}`;
  }
  statusNamn(p: IntegrationProfile): string {
    return PROFILSTATUS_NAMN[profilStatus(p)];
  }
  statusKlass(p: IntegrationProfile): string {
    return profilStatusKlass(profilStatus(p));
  }
  giltig(p: IntegrationProfile): string {
    return giltighetText(p.validFrom, p.validTo);
  }
  valbara(p: IntegrationProfile): number {
    return p.mappings.filter((m) => m.mode === 'SELECTABLE').length;
  }
  sparrad(p: IntegrationProfile): boolean {
    return !!sparrPa(p);
  }

  /* ---------- Stoppa alla utbetalningar ---------- */

  readonly stoppaOppen = signal(false);
  readonly orsak = signal('');
  readonly forstar = signal(false);
  readonly forsok = signal(false);

  oppnaStoppa(): void {
    this.orsak.set('');
    this.forstar.set(false);
    this.forsok.set(false);
    this.stoppaOppen.set(true);
  }

  stoppa(): void {
    this.forsok.set(true);
    if (!this.orsak().trim() || !this.forstar()) return;
    this.service.stoppaAlla(this.orsak().trim());
    this.stoppaOppen.set(false);
  }
}
