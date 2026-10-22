import { Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiKallaComponent, K } from './ei-delade';
import {
  FLODE_NAMN,
  KONTERINGSSTATUS_NAMN,
  PostingConfig,
  gallandeVersion,
  kommandeVersioner,
  konteringStatusKlass,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

/** Lista med konteringar (7.1) – används i Del 3 och på profilens flik Konteringar. */
@Component({
  selector: 'app-ei-kontering-tabell',
  imports: [RouterLink, EiKallaComponent],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-border">
            <th scope="col" [class]="k.th + ' pl-5'"><span class="inline-flex items-center gap-1">Kontering</span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Finansieringsmedel</span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Beslutande organisation</span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Flöde</span></th>
            @if (visaProfil()) {
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Utbetalande organisation</span></th>
              <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Integrationsprofil</span></th>
            }
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Gällande version</span></th>
            <th scope="col" [class]="k.th">Status</th>
            <th scope="col" [class]="k.th + ' pr-5'">Varningar</th>
          </tr>
        </thead>
        <tbody>
          @for (t of konteringar(); track t.id) {
            @let profil = service.hamtaProfil(t.profileId);
            @let fm = service.hamtaFinansieringsmedel(t.fundingSourceId);
            <tr class="border-b border-border-muted odd:bg-surface-subtle hover:bg-component-hover">
              <td class="pl-5 pr-4 py-3 align-top">
                <a [routerLink]="bas + '/konteringar/' + t.id" class="font-medium" [class]="k.lank">{{ service.konteringNamn(t) }}</a>
                <app-ei-kalla class="ml-1.5" [kalla]="t.source" />
              </td>
              <td class="px-4 py-3 align-top">
                {{ fm?.shortName ?? '–' }}
                @if (fm?.kontotyp) { <span class="block text-[12px] text-text-muted">Kontotyp: {{ fm!.kontotyp }}</span> }
              </td>
              <td class="px-4 py-3 align-top">{{ service.hamtaBeslutande(t.decidingOrganisationId)?.name ?? '–' }}</td>
              <td class="px-4 py-3 align-top whitespace-nowrap">{{ flode[t.flow] }} <span class="font-mono text-[12px] text-text-muted">({{ t.flow }})</span></td>
              @if (visaProfil()) {
                <td class="px-4 py-3 align-top">{{ service.hamtaOrg(profil?.organisationId ?? null)?.name ?? '–' }}</td>
                <td class="px-4 py-3 align-top">
                  @if (profil) {
                    <a [routerLink]="bas + '/integrationsprofiler/' + profil.id" [class]="k.lank">{{ profil.name }}</a>
                  }
                </td>
              }
              <td class="px-4 py-3 align-top">{{ versionText(t) }}</td>
              <td class="px-4 py-3 align-top">
                <span [class]="k.status + ' ' + statusKlass(t)">{{ statusNamn[t.status] }}</span>
              </td>
              <td class="pl-4 pr-5 py-3 align-top">
                @let v = service.konteringVarningar(t);
                @if (v.length) {
                  <a [routerLink]="bas + '/konteringar/' + t.id"
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
            <tr><td [attr.colspan]="visaProfil() ? 9 : 7" class="px-6 py-10 text-center text-sm text-text-muted">{{ tomText() }}</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class EiKonteringTabellComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly flode = FLODE_NAMN;
  readonly statusNamn = KONTERINGSSTATUS_NAMN;

  readonly konteringar = input.required<PostingConfig[]>();
  readonly visaProfil = input(true);
  readonly tomText = input('Inga konteringar matchar filtret.');

  versionText(t: PostingConfig): string {
    const g = gallandeVersion(t);
    const kommande = kommandeVersioner(t)[0];
    const bas = g ? `Giltig från ${g.validFrom}` : 'Ingen gällande version';
    return kommande ? `${bas} · ny från ${kommande.validFrom}` : bas;
  }

  statusKlass(t: PostingConfig): string {
    return konteringStatusKlass(t.status);
  }

  titel(v: { text: string }[]): string {
    return v.map((x) => x.text).join(' ');
  }
}
