import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiBegreppComponent, EiKallaComponent, EiRamComponent, K } from './ei-delade';
import {
  Organisation,
  PROFILSTATUS_NAMN,
  PostingProfile,
  giltighetText,
  profilStatus,
  profilStatusKlass,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

interface Grupp {
  org: Organisation;
  profiler: PostingProfile[];
}

@Component({
  selector: 'app-ei-profiler-lista',
  imports: [RouterLink, EiRamComponent, EiBegreppComponent, EiKallaComponent],
  template: `
    <app-ei-ram flik="profiler">
      <div class="flex items-center justify-between gap-4 flex-wrap mb-3">
        <h2 class="flex items-center gap-1 text-lg font-semibold text-text">
          Integrationsprofiler <app-ei-begrepp term="Integrationsprofil" />
        </h2>
        <a [routerLink]="bas + '/integrationsprofiler/ny'" [class]="k.primar">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
          Ny integrationsprofil
        </a>
      </div>

      <div class="bg-surface border border-border overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border">
              <th scope="col" [class]="k.th + ' pl-5'"><span class="inline-flex items-center gap-1">Organisation <app-ei-begrepp term="Utbetalande organisation" /></span></th>
              <th scope="col" [class]="k.th">Integrationsprofil</th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Ekonomisystem <app-ei-begrepp term="Ekonomisystem" /></span></th>
              <th scope="col" [class]="k.th">Status</th>
              <th scope="col" [class]="k.th">Giltig</th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Attribut <app-ei-begrepp term="Attribut" /></span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Konteringsmallar <app-ei-begrepp term="Konteringsmall" /></span></th>
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
                  <td class="px-4 py-3 align-top">{{ systemNamn(p.economicSystemId) }}</td>
                  <td class="px-4 py-3 align-top">
                    <span [class]="k.status + ' ' + statusKlass(p)">{{ statusNamn(p) }}</span>
                  </td>
                  <td class="px-4 py-3 align-top whitespace-nowrap">
                    {{ giltig(p) }}
                    <app-ei-kalla class="ml-1" [kalla]="p.validFromSource" />
                  </td>
                  <td class="px-4 py-3 align-top whitespace-nowrap">{{ p.mappings.length }} ({{ valbara(p) }} valbara)</td>
                  <td class="px-4 py-3 align-top">{{ service.mallarFor(p.id).length }}</td>
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
                  </th>
                  <td colspan="7" class="px-4 py-3 align-top">
                    <p class="text-text-muted italic">Ingen integrationsprofil</p>
                    <p class="text-[13px] text-text-secondary mt-0.5">
                      {{ g.org.name }} har ingen integrationsprofil. Utan profil kan organisationen inte betala ut via ekonomisk integration.
                    </p>
                    <a [routerLink]="bas + '/integrationsprofiler/ny'" [queryParams]="{ org: g.org.id }" class="inline-flex items-center gap-1 mt-1.5 font-medium" [class]="k.lank">
                      <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Skapa integrationsprofil
                    </a>
                  </td>
                </tr>
              }
            </tbody>
          }
        </table>
      </div>
    </app-ei-ram>
  `,
})
export class EiProfilerListaComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;

  readonly grupper = computed<Grupp[]>(() =>
    this.service.organisationer().map((org) => ({
      org,
      profiler: this.service
        .profilerFor(org.id)
        .sort((a, b) => a.validFrom.localeCompare(b.validFrom)),
    })),
  );

  profilLank(id: string): string {
    return `${EI_BAS}/integrationsprofiler/${id}`;
  }
  systemNamn(id: string): string {
    return this.service.hamtaSystem(id)?.name ?? id;
  }
  statusNamn(p: PostingProfile): string {
    return PROFILSTATUS_NAMN[profilStatus(p)];
  }
  statusKlass(p: PostingProfile): string {
    return profilStatusKlass(profilStatus(p));
  }
  giltig(p: PostingProfile): string {
    return giltighetText(p.validFrom, p.validTo);
  }
  valbara(p: PostingProfile): number {
    return p.mappings.filter((m) => m.mode === 'SELECTABLE').length;
  }
}
