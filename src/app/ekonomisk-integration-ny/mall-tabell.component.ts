import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiBegreppComponent, EiKallaComponent, K } from './ei-delade';
import {
  FLODE_NAMN,
  MALLSTATUS_NAMN,
  PostingTemplate,
  gallandeVersion,
  kommandeVersioner,
  mallStatusKlass,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

/** Lista med konteringsmallar (7.1) – används i Del 3 och på profilens flik Konteringsmallar. */
@Component({
  selector: 'app-ei-mall-tabell',
  imports: [RouterLink, EiBegreppComponent, EiKallaComponent],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th scope="col" [class]="k.th + ' pl-5'">Konteringsmall</th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Utbetalande organisation <app-ei-begrepp term="Utbetalande organisation" /></span></th>
            @if (visaProfil()) {
              <th scope="col" [class]="k.th">Integrationsprofil</th>
            }
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Flöde <app-ei-begrepp term="Flöde" /></span></th>
            <th scope="col" [class]="k.th">Avsedd för</th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Gällande version <app-ei-begrepp term="Version" /></span></th>
            <th scope="col" [class]="k.th">Status</th>
            <th scope="col" [class]="k.th + ' pr-5'">Varningar</th>
          </tr>
        </thead>
        <tbody>
          @for (t of mallar(); track t.id) {
            @let profil = service.hamtaProfil(t.profileId);
            <tr class="border-b border-border-muted odd:bg-surface-subtle hover:bg-component-hover">
              <td class="pl-5 pr-4 py-3 align-top">
                <a [routerLink]="bas + '/konteringsmallar/' + t.id" class="font-medium" [class]="k.lank">{{ t.name }}</a>
                <app-ei-kalla class="ml-1.5" [kalla]="t.source" />
              </td>
              <td class="px-4 py-3 align-top">{{ service.hamtaOrg(profil?.organisationId ?? null)?.name ?? '–' }}</td>
              @if (visaProfil()) {
                <td class="px-4 py-3 align-top">
                  @if (profil) {
                    <a [routerLink]="bas + '/integrationsprofiler/' + profil.id" [class]="k.lank">{{ profil.name }}</a>
                  }
                </td>
              }
              <td class="px-4 py-3 align-top whitespace-nowrap">{{ flode[t.flow] }} ({{ t.flow }})</td>
              <td class="px-4 py-3 align-top">{{ avseddFor(t) }}</td>
              <td class="px-4 py-3 align-top">{{ versionText(t) }}</td>
              <td class="px-4 py-3 align-top">
                <span [class]="k.status + ' ' + statusKlass(t)">{{ statusNamn[t.status] }}</span>
              </td>
              <td class="pl-4 pr-5 py-3 align-top">
                @let v = service.mallVarningar(t);
                @if (v.length) {
                  <a [routerLink]="bas + '/konteringsmallar/' + t.id"
                    class="inline-flex items-center gap-1 text-warning-dark hover:underline"
                    [title]="titel(v)"
                    [attr.aria-label]="v.length + (v.length === 1 ? ' varning' : ' varningar') + ': ' + titel(v)">
                    <span class="material-symbols-outlined text-[18px] text-warning" aria-hidden="true">warning</span>{{ v.length }}
                  </a>
                } @else {
                  <span class="text-text-subtle">–</span>
                }
              </td>
            </tr>
          } @empty {
            <tr><td [attr.colspan]="visaProfil() ? 8 : 7" class="px-6 py-10 text-center text-sm text-text-muted">{{ tomText() }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class EiMallTabellComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly flode = FLODE_NAMN;
  readonly statusNamn = MALLSTATUS_NAMN;

  readonly mallar = input.required<PostingTemplate[]>();
  readonly visaProfil = input(true);
  readonly tomText = input('Inga konteringsmallar matchar filtret.');

  avseddFor(t: PostingTemplate): string {
    const delar = [
      this.service.hamtaFinansieringsmedel(t.intendedFor.fundingSourceId)?.anslag,
      this.service.hamtaBeslutande(t.intendedFor.decidingOrganisationId)?.name,
    ].filter(Boolean);
    return delar.length ? delar.join(' · ') : '–';
  }

  versionText(t: PostingTemplate): string {
    const g = gallandeVersion(t);
    const kommande = kommandeVersioner(t)[0];
    const bas = g ? `Giltig från ${g.validFrom}` : 'Ingen gällande';
    return kommande ? `${bas} · ny från ${kommande.validFrom}` : bas;
  }

  statusKlass(t: PostingTemplate): string {
    return mallStatusKlass(t.status);
  }

  titel(v: { text: string }[]): string {
    return v.map((x) => x.text).join(' ');
  }
}
