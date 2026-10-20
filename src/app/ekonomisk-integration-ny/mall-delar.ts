import { Component, computed, inject, input, model } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiSokbarListaComponent, K, SokAlternativ } from './ei-delade';
import { ARENDEFALT_NAMN, Flow, Mapping, PostingProfile, aktivaVarden, sorteradeMappningar } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

/* ============================================================
   Värden att välja – ett fält per mappning med läget Väljs i konteringsmallen
   ============================================================ */

@Component({
  selector: 'app-ei-vardefalt',
  imports: [RouterLink, EiSokbarListaComponent],
  template: `
    @if (valbara().length) {
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (m of valbara(); track m.attributeId) {
          @let namn = service.attributNamn(profil(), m.attributeId);
          @let fel = felFor(m);
          <div>
            <label [for]="idPrefix() + m.attributeId" [class]="k.etikett">
              {{ namn }} <span class="font-mono text-[12px] font-normal text-text-muted">{{ m.category }}</span>
            </label>
            <app-ei-sokbar-lista
              [inputId]="idPrefix() + m.attributeId"
              [etikett]="namn"
              [alternativ]="alternativ(m)"
              [ogiltig]="!!fel"
              [varde]="values()[m.attributeId] || ''"
              (vardeChange)="satt(m.attributeId, $event)" />
            @if (!alternativ(m).length) {
              <p [class]="k.hjalp">
                Inga värden att välja. Lägg till värden i integrationsprofilen.
                <a [routerLink]="bas + '/integrationsprofiler/' + profil().id" [queryParams]="{ flik: 'vardelistor', attribut: m.attributeId }" [class]="k.lank">Gå till värdelistan</a>
              </p>
            } @else if (fel) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ fel }}</p>
            }
          </div>
        }
      </div>
    } @else {
      <p class="text-sm text-text-secondary">Alla värden sätts av integrationsprofilen. Granska och spara.</p>
    }
  `,
})
export class EiVardefaltComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly profil = input.required<PostingProfile>();
  readonly values = model.required<Record<string, string>>();
  /** Visa fel för saknade värden (M2) och inaktiva värden. */
  readonly visaFel = input(false);
  readonly idPrefix = input('ei-val-');

  readonly valbara = computed(() => sorteradeMappningar(this.profil()).filter((m) => m.mode === 'SELECTABLE'));

  alternativ(m: Mapping): SokAlternativ[] {
    return aktivaVarden(m).map((v) => ({ kod: v.code, namn: v.name }));
  }

  felFor(m: Mapping): string | null {
    const kod = this.values()[m.attributeId];
    if (kod && !aktivaVarden(m).some((v) => v.code === kod)) return `${kod} är inaktivt och kan inte väljas.`;
    if (this.visaFel() && !kod) return 'Välj ett värde.';
    return null;
  }

  satt(attributId: string, kod: string): void {
    this.values.update((v) => ({ ...v, [attributId]: kod }));
  }
}

/* ============================================================
   Från profilen (hopfälld, skrivskyddad)
   ============================================================ */

@Component({
  selector: 'app-ei-fran-profilen',
  imports: [RouterLink],
  template: `
    <details class="border border-border bg-surface group">
      <summary class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold cursor-pointer list-none hover:bg-component-hover">
        <span class="material-symbols-outlined text-[20px] -rotate-90 group-open:rotate-0 transition-transform" aria-hidden="true">expand_more</span>
        Från profilen ({{ rader().length }})
      </summary>
      <div class="px-4 pb-3">
        @if (rader().length) {
          <table class="w-full text-sm">
            <tbody>
              @for (r of rader(); track r.namn) {
                <tr class="border-t border-border-muted">
                  <th scope="row" class="py-1.5 pr-4 text-left font-medium w-1/3">{{ r.namn }}</th>
                  <td class="py-1.5 pr-4 font-mono text-[13px]">{{ r.varde }}</td>
                  <td class="py-1.5 text-text-muted">{{ r.lage }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="text-sm text-text-muted">Profilen har inga fasta värden.</p>
        }
        <p [class]="k.hjalp">
          Ändras i integrationsprofilen.
          <a [routerLink]="bas + '/integrationsprofiler/' + profil().id" [queryParams]="{ flik: 'mappning' }" [class]="k.lank">Gå till mappningen</a>
        </p>
      </div>
    </details>
  `,
})
export class EiFranProfilenComponent {
  private readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly profil = input.required<PostingProfile>();
  readonly flode = input<Flow>('UTB');

  readonly rader = computed(() => {
    const p = this.profil();
    return sorteradeMappningar(p)
      .filter((m) => m.mode === 'FIXED' || m.mode === 'FOLLOWS_FLOW')
      .map((m) => ({
        namn: this.service.attributNamn(p, m.attributeId),
        varde: m.mode === 'FIXED' ? (m.fixedValue ?? '–') : this.flode(),
        lage: m.mode === 'FIXED' ? 'Fast värde' : 'Följer flödet',
      }));
  });
}

/* ============================================================
   Vid utbetalning (skrivskyddad)
   ============================================================ */

@Component({
  selector: 'app-ei-vid-utbetalning',
  template: `
    <section class="border border-border bg-surface px-4 py-3">
      <h3 class="text-sm font-semibold mb-2">Vid utbetalning</h3>
      <ul class="text-sm space-y-1 list-none m-0 p-0">
        @for (r of franArendet(); track r) {
          <li>{{ r }}: hämtas från ärendet</li>
        }
        <li>
          Konsumtionskonto: hämtas från finansieringsmedlet.
          @if (finansieringsmedel(); as f) {
            <span class="text-text-secondary">{{ f.kontotyp ? 'Kontotyp: ' + f.kontotyp : 'Kontotyp saknas' }}</span>
          }
        </li>
        @if (gammalt()) {
          <li class="text-text-secondary">I gamla konfigurationen: Konsumtionskonto {{ gammalt() }}</li>
        }
      </ul>
    </section>
  `,
})
export class EiVidUtbetalningComponent {
  private readonly service = inject(EkonomiskIntegrationService);
  readonly profil = input.required<PostingProfile>();
  readonly finansieringsmedelId = input<string | null>(null);
  readonly gammalt = input<'Ja' | 'Nej' | null>(null);

  readonly finansieringsmedel = computed(() => this.service.hamtaFinansieringsmedel(this.finansieringsmedelId()));
  readonly franArendet = computed(() => {
    const p = this.profil();
    return sorteradeMappningar(p)
      .filter((m) => m.mode === 'FROM_CASE')
      .map((m) => `${this.service.attributNamn(p, m.attributeId)} (${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']})`);
  });
}
