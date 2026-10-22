import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EI_BAS, EiBegreppComponent, EiDialogComponent, EiKallaComponent, K } from './ei-delade';
import {
  ARENDEFALT_NAMN,
  BOK_NAMN,
  BOK_ORDNING,
  CaseField,
  Category,
  LAGE_NAMN,
  LAGE_ORDNING,
  Mapping,
  IntegrationProfile,
  PostingConfig,
  TransactionType,
  ValueMode,
  aktivaVarden,
  mappningsfel,
  profilStatus,
  standardMappning,
} from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

@Component({
  selector: 'app-ei-profil-mappning',
  imports: [FormsModule, RouterLink, EiBegreppComponent, EiKallaComponent, EiDialogComponent],
  template: `
    <div class="flex items-center justify-between gap-4 flex-wrap px-5 py-4">
      <p class="text-sm text-text-secondary max-w-[80ch]">
        En rad per attribut, sorterad i ekonomisystemets dimensionsordning. Redigera med pennan.
      </p>
      <button type="button" (click)="oppnaLaggTill()" [class]="k.sekundarLiten" [disabled]="!saknadeAttribut().length">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
        Lägg till attribut
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-y border-border">
            <th scope="col" [class]="k.th + ' pl-5'"><span class="inline-flex items-center gap-1">Attribut <app-ei-begrepp term="Attribut" /></span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Dimension <app-ei-begrepp term="Dimension" /></span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Bokförs i <app-ei-begrepp term="Bokförs i" /></span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Värde i kontering <app-ei-begrepp term="Värde i kontering" /></span></th>
            <th scope="col" [class]="k.th"><span class="inline-flex items-center gap-1">Värdelista <app-ei-begrepp term="Värdelista" /></span></th>
            <th scope="col" [class]="k.th">Används i</th>
            <th scope="col" class="pl-4 pr-5 py-2.5 w-24"><span class="sr-only">Åtgärder</span></th>
          </tr>
        </thead>
        <tbody>
          @for (m of mappningar(); track m.attributeId) {
            @let namn = service.attributNamn(profil(), m.attributeId);
            @let varning = radVarning(m);
            <tr class="border-b border-border-muted odd:bg-surface-subtle hover:bg-component-hover">
              <td class="pl-5 pr-4 py-3 align-top font-medium">
                {{ namn }}
                @if (varning) {
                  <span class="flex items-center gap-1 mt-0.5 text-[13px] font-normal text-warning-dark">
                    <span class="material-symbols-outlined text-[16px] text-warning" aria-hidden="true">warning</span>{{ varning }}
                  </span>
                }
              </td>
              <td class="px-4 py-3 align-top font-mono text-[13px]">{{ m.category }}</td>
              <td class="px-4 py-3 align-top">
                <span class="inline-flex flex-wrap items-center gap-1">
                  @for (b of m.bookIn; track b) { <span [class]="k.chip" [title]="bokNamn[b]">{{ b }}</span> }
                  <app-ei-kalla [kalla]="m.bookInSource" />
                </span>
              </td>
              <td class="px-4 py-3 align-top">
                {{ lageText(m) }}
                <app-ei-kalla class="ml-1" [kalla]="m.modeSource" />
              </td>
              <td class="px-4 py-3 align-top whitespace-nowrap">
                @if (m.mode === 'FROM_CASE') {
                  <span class="text-text-subtle">–</span>
                } @else {
                  <a [routerLink]="[]" [queryParams]="{ flik: 'vardelistor', attribut: m.attributeId }" [class]="k.lank">{{ antalAktiva(m) }} aktiva</a>
                }
              </td>
              <td class="px-4 py-3 align-top whitespace-nowrap">
                @if (m.mode === 'SELECTABLE') {
                  @let n = anvands(m).length;
                  @if (n) {
                    <button type="button" (click)="visaAnvands.set(m.attributeId)" [class]="k.lank">{{ n }} {{ n === 1 ? 'kontering' : 'konteringar' }}</button>
                  } @else { <span class="text-text-subtle">–</span> }
                } @else {
                  <span class="text-text-subtle">–</span>
                }
              </td>
              <td class="pl-4 pr-5 py-2 align-top text-right whitespace-nowrap">
                <button type="button" (click)="redigera(m)" [attr.aria-label]="'Redigera ' + namn" title="Redigera" [class]="k.ikon">
                  <span class="material-symbols-outlined text-[20px] align-middle">edit</span>
                </button>
                <button type="button" (click)="taBort.set(m)" [attr.aria-label]="'Ta bort ' + namn" title="Ta bort" [class]="k.ikon">
                  <span class="material-symbols-outlined text-[20px] align-middle">delete</span>
                </button>
              </td>
            </tr>
          } @empty {
            <tr><td colspan="7" class="px-6 py-10 text-center text-text-muted">Profilen har inga attribut ännu. Lägg till attribut.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Sidopanel: redigera mappning -->
    @if (utkast(); as u) {
      @let namn = service.attributNamn(profil(), u.attributeId);
      <app-ei-dialog variant="panel" [rubrik]="(arNy() ? 'Lägg till ' : 'Redigera ') + namn" (stang)="stangPanel()">
        <div>
          <span [class]="k.etikett">Attribut</span>
          <p class="text-sm text-text">{{ namn }}</p>
          <p [class]="k.hjalp">{{ service.hamtaAttribut(profil(), u.attributeId)?.description }}</p>
        </div>

        <div>
          <label for="ei-m-dim" [class]="k.etikett">Dimension</label>
          <select id="ei-m-dim" [class]="k.falt + ' font-mono'" [ngModel]="u.category" (ngModelChange)="satt({ category: $event })">
            @for (c of valbaraDimensioner(); track c) {
              <option [value]="c">{{ c }}</option>
            }
          </select>
          <p [class]="k.hjalp">Bara dimensioner som är tillåtna för attributet och inte redan används i profilen.</p>
        </div>

        <fieldset>
          <legend [class]="k.etikett">Bokförs i</legend>
          <div class="flex flex-wrap gap-2">
            @for (b of profilBocker(); track b) {
              <button type="button" (click)="vaxlaBok(b)" [attr.aria-pressed]="u.bookIn.includes(b)"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-full transition-colors"
                [class]="u.bookIn.includes(b) ? 'bg-surface-primary border-primary text-on-surface-primary' : 'bg-surface border-border text-text-secondary hover:bg-component-hover'">
                @if (u.bookIn.includes(b)) { <span class="material-symbols-outlined text-[16px]" aria-hidden="true">check</span> }
                {{ bokNamn[b] }} ({{ b }})
              </button>
            }
          </div>
          <p [class]="k.hjalp">Minst en bok. Bara profilens böcker kan väljas.</p>
        </fieldset>

        <fieldset>
          <legend [class]="k.etikett">Värde i kontering</legend>
          <div class="space-y-2">
            @for (l of lagen; track l) {
              @let sparrad = l === 'FOLLOWS_FLOW' && u.attributeId !== 'aktivitet';
              <label class="flex items-start gap-2 text-sm" [class]="sparrad ? 'text-text-disabled cursor-not-allowed' : 'text-text cursor-pointer'">
                <input type="radio" name="ei-m-lage" class="w-4 h-4 mt-0.5 accent-primary" [checked]="u.mode === l" [disabled]="sparrad" (change)="sattLage(l)" />
                <span>
                  {{ lageNamn[l] }}
                  @if (sparrad) { <span class="block text-[13px]">Bara tillgängligt för Aktivitet.</span> }
                </span>
              </label>
              @if (u.mode === l && l === 'FIXED') {
                <div class="ml-6">
                  <label for="ei-m-fast" class="sr-only">Fast värde</label>
                  <select id="ei-m-fast" [class]="k.falt" [ngModel]="u.fixedValue ?? ''" (ngModelChange)="satt({ fixedValue: $event })">
                    <option value="">– Välj värde –</option>
                    @for (v of aktivaVarden(u); track v.code) {
                      <option [value]="v.code">{{ v.code }}{{ v.name ? ' – ' + v.name : ' · Namn saknas' }}</option>
                    }
                  </select>
                  @if (!aktivaVarden(u).length) {
                    <p [class]="k.hjalp">Värdelistan har inga aktiva värden. Lägg till värden under Värdelistor först.</p>
                  }
                </div>
              }
              @if (u.mode === l && l === 'FROM_CASE') {
                <div class="ml-6 flex items-center gap-5">
                  @for (f of arendefalt; track f) {
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="ei-m-arende" class="w-4 h-4 accent-primary" [checked]="u.caseField === f" (change)="satt({ caseField: f })" />
                      {{ arendefaltNamn[f] }}
                    </label>
                  }
                </div>
              }
            }
          </div>
        </fieldset>

        @if (andrarValbarhet()) {
          <p class="flex items-start gap-1.5 text-[13px] text-warning-dark">
            <span class="material-symbols-outlined text-[16px] text-warning" aria-hidden="true">warning</span>
            Attributet {{ u.mode === 'SELECTABLE' ? 'blir valbart' : 'slutar vara valbart' }} i konteringarna. Berörda konteringar får varningen "Behöver ses över".
          </p>
        }

        @if (forsokSpara() && fel().length) {
          <ul class="space-y-1 list-none m-0 p-0" role="alert">
            @for (f of fel(); track $index) {
              <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
            }
          </ul>
        }

        <button fot type="button" (click)="stangPanel()" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="sparaPanel()" [class]="k.primar">Spara</button>
      </app-ei-dialog>
    }

    <!-- Lägg till attribut -->
    @if (laggTillOppen()) {
      <app-ei-dialog rubrik="Lägg till attribut" (stang)="laggTillOppen.set(false)">
        <p class="text-sm text-text-secondary">Attribut i ekonomisystemet som profilen inte har:</p>
        <div class="space-y-2">
          @for (a of saknadeAttribut(); track a.id) {
            <label class="flex items-start gap-2 text-sm cursor-pointer">
              <input type="radio" name="ei-nytt-attribut" class="w-4 h-4 mt-0.5 accent-primary" [checked]="nyttAttribut() === a.id" (change)="nyttAttribut.set(a.id)" />
              <span><span class="font-medium">{{ a.name }}</span><span class="block text-[13px] text-text-muted">{{ a.description }}</span></span>
            </label>
          }
        </div>
        <button fot type="button" (click)="laggTillOppen.set(false)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="laggTill()" [class]="k.primar" [disabled]="!nyttAttribut()">Nästa</button>
      </app-ei-dialog>
    }

    <!-- P12: bekräfta påverkan -->
    @if (paverkan(); as p) {
      <app-ei-dialog rubrik="Bekräfta ändringen" roll="alertdialog" (stang)="paverkan.set(null)">
        <p class="text-sm text-text">
          Ändringen påverkar {{ paverkade().length }} {{ paverkade().length === 1 ? 'kontering' : 'konteringar' }} och alla kommande utbetalningar som använder profilen.
        </p>
        @if (paverkade().length) {
          <ul class="list-disc pl-5 text-sm text-text space-y-0.5">
            @for (t of paverkade(); track t.id) { <li>{{ service.konteringNamn(t) }}</li> }
          </ul>
        }
        <button fot type="button" (click)="paverkan.set(null)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="sparaProfil(p.profil, p.text)" [class]="k.primar">Spara ändringen</button>
      </app-ei-dialog>
    }

    <!-- Ta bort attribut (P11) -->
    @if (taBort(); as m) {
      @let namn = service.attributNamn(profil(), m.attributeId);
      @let n = service.konteringarSomAnvanderAttribut(profil().id, m.attributeId).length;
      <app-ei-dialog [rubrik]="'Ta bort ' + namn + '?'" roll="alertdialog" (stang)="taBort.set(null)">
        @if (n) {
          <p [class]="k.fel + ' text-sm'"><span class="material-symbols-outlined text-[18px]">block</span>Används i {{ n }} {{ n === 1 ? 'kontering' : 'konteringar' }}. Ta bort det från konteringarna först.</p>
        } @else {
          <p class="text-sm text-text">{{ namn }} och dess värdelista tas bort från profilen.</p>
        }
        <button fot type="button" (click)="taBort.set(null)" [class]="k.sekundar">{{ n ? 'Stäng' : 'Avbryt' }}</button>
        @if (!n) {
          <button fot type="button" (click)="bekraftaTaBort(m)" [class]="k.fara">Ta bort</button>
        }
      </app-ei-dialog>
    }

    <!-- Används i -->
    @if (visaAnvands(); as a) {
      <app-ei-dialog [rubrik]="service.attributNamn(profil(), a) + ' används i'" (stang)="visaAnvands.set(null)">
        <ul class="text-sm space-y-1 list-none p-0 m-0">
          @for (t of service.konteringarSomAnvanderAttribut(profil().id, a); track t.id) {
            <li><a [routerLink]="bas + '/konteringar/' + t.id" [class]="k.lank">{{ service.konteringNamn(t) }}</a></li>
          }
        </ul>
        <button fot type="button" (click)="visaAnvands.set(null)" [class]="k.sekundar">Stäng</button>
      </app-ei-dialog>
    }
  `,
})
export class EiProfilMappningComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly bokNamn = BOK_NAMN;
  readonly lagen = LAGE_ORDNING;
  readonly lageNamn = LAGE_NAMN;
  readonly arendefalt: CaseField[] = ['CASE_ID', 'COUNTERPART_CODE'];
  readonly arendefaltNamn = ARENDEFALT_NAMN;
  readonly aktivaVarden = aktivaVarden;

  readonly profil = input.required<IntegrationProfile>();

  readonly utkast = signal<Mapping | null>(null);
  readonly arNy = signal(false);
  readonly forsokSpara = signal(false);
  readonly laggTillOppen = signal(false);
  readonly nyttAttribut = signal('');
  readonly paverkan = signal<{ profil: IntegrationProfile; text: string } | null>(null);
  readonly taBort = signal<Mapping | null>(null);
  readonly visaAnvands = signal<string | null>(null);

  readonly mappningar = computed(() => this.service.sorteradeMappningar(this.profil()));
  readonly profilBocker = computed(() => BOK_ORDNING.filter((b) => this.profil().transactionTypes.includes(b)));
  readonly paverkade = computed<PostingConfig[]>(() => this.service.paverkadeKonteringar(this.profil().id));

  readonly saknadeAttribut = computed(() => {
    const p = this.profil();
    const finns = new Set(p.mappings.map((m) => m.attributeId));
    return (this.service.hamtaSystem(p.economicSystemId)?.attributes ?? []).filter((a) => !finns.has(a.id));
  });

  readonly valbaraDimensioner = computed<Category[]>(() => {
    const u = this.utkast();
    if (!u) return [];
    const attribut = this.service.hamtaAttribut(this.profil(), u.attributeId);
    const upptagna = this.profil().mappings.filter((m) => m.attributeId !== u.attributeId).map((m) => m.category);
    return (attribut?.allowedCategories ?? []).filter((c) => !upptagna.includes(c));
  });

  readonly andrarValbarhet = computed(() => {
    const u = this.utkast();
    if (!u || this.arNy()) return false;
    const fore = this.profil().mappings.find((m) => m.attributeId === u.attributeId);
    return !!fore && (fore.mode === 'SELECTABLE') !== (u.mode === 'SELECTABLE');
  });

  readonly fel = computed(() => {
    const u = this.utkast();
    if (!u) return [];
    const p = this.profil();
    const mappningar = this.arNy() ? [...p.mappings, u] : p.mappings.map((m) => (m.attributeId === u.attributeId ? u : m));
    return mappningsfel(u, { ...p, mappings: mappningar }, this.service.hamtaAttribut(p, u.attributeId), this.service.attributNamn(p, u.attributeId));
  });

  /* ---------- Rader ---------- */

  lageText(m: Mapping): string {
    switch (m.mode) {
      case 'FIXED':
        return `Fast: ${m.fixedValue ?? '–'}`;
      case 'FROM_CASE':
        return `Från ärendet: ${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']}`;
      default:
        return LAGE_NAMN[m.mode];
    }
  }

  antalAktiva(m: Mapping): number {
    return aktivaVarden(m).length;
  }

  anvands(m: Mapping): PostingConfig[] {
    return this.service.konteringarSomAnvanderAttribut(this.profil().id, m.attributeId);
  }

  radVarning(m: Mapping): string | null {
    if (m.mode === 'SELECTABLE' && !aktivaVarden(m).length) return 'Inga värden att välja';
    if (m.mode === 'FIXED' && !aktivaVarden(m).some((v) => v.code === m.fixedValue)) return 'Det fasta värdet är inte aktivt';
    return null;
  }

  /* ---------- Sidopanel ---------- */

  redigera(m: Mapping): void {
    this.arNy.set(false);
    this.forsokSpara.set(false);
    this.utkast.set(structuredClone(m));
  }

  oppnaLaggTill(): void {
    this.nyttAttribut.set(this.saknadeAttribut()[0]?.id ?? '');
    this.laggTillOppen.set(true);
  }

  laggTill(): void {
    const p = this.profil();
    const attribut = this.saknadeAttribut().find((a) => a.id === this.nyttAttribut());
    if (!attribut) return;
    this.laggTillOppen.set(false);
    this.arNy.set(true);
    this.forsokSpara.set(false);
    this.utkast.set(standardMappning(attribut, this.service.ordning(p), p.mappings.map((m) => m.category), p.transactionTypes));
  }

  stangPanel(): void {
    this.utkast.set(null);
  }

  satt(andring: Partial<Mapping>): void {
    this.utkast.update((u) => (u ? { ...u, ...andring } : u));
  }

  sattLage(l: ValueMode): void {
    this.utkast.update((u) =>
      u ? { ...u, mode: l, caseField: l === 'FROM_CASE' ? (u.caseField ?? 'CASE_ID') : u.caseField } : u,
    );
  }

  vaxlaBok(b: TransactionType): void {
    this.utkast.update((u) =>
      u
        ? {
            ...u,
            bookIn: u.bookIn.includes(b)
              ? u.bookIn.filter((x) => x !== b)
              : BOK_ORDNING.filter((x) => x === b || u.bookIn.includes(x)),
          }
        : u,
    );
  }

  sparaPanel(): void {
    this.forsokSpara.set(true);
    const u = this.utkast();
    if (!u || this.fel().length) return;
    const ren: Mapping = { ...u };
    if (ren.mode !== 'FIXED') delete ren.fixedValue;
    if (ren.mode !== 'FROM_CASE') delete ren.caseField;
    const ursprung = this.profil().mappings.find((m) => m.attributeId === u.attributeId);
    // Ändrat läge/böcker är inte längre det antagna värdet från underlaget.
    if (ursprung && ursprung.mode !== ren.mode) delete ren.modeSource;
    if (ursprung && ursprung.bookIn.join() !== ren.bookIn.join()) delete ren.bookInSource;
    const p = this.profil();
    const ny: IntegrationProfile = {
      ...p,
      mappings: this.arNy() ? [...p.mappings, ren] : p.mappings.map((m) => (m.attributeId === ren.attributeId ? ren : m)),
    };
    this.utkast.set(null);
    this.kravBekraftelse(ny, this.arNy() ? 'Attributet har lagts till.' : 'Mappningen har sparats.');
  }

  /* ---------- Ta bort ---------- */

  bekraftaTaBort(m: Mapping): void {
    const p = this.profil();
    this.taBort.set(null);
    this.kravBekraftelse(
      { ...p, mappings: p.mappings.filter((x) => x.attributeId !== m.attributeId) },
      'Attributet har tagits bort från profilen.',
    );
  }

  /* ---------- P12 ---------- */

  private kravBekraftelse(ny: IntegrationProfile, text: string): void {
    const status = profilStatus(this.profil());
    if (status === 'ACTIVE' || status === 'PLANNED') this.paverkan.set({ profil: ny, text });
    else this.sparaProfil(ny, text);
  }

  sparaProfil(ny: IntegrationProfile, text: string): void {
    this.paverkan.set(null);
    this.service.sparaProfil(ny, text);
  }
}
