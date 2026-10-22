import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { EI_BAS, EiBegreppComponent, EiDialogComponent, EiKallaComponent, EiNotisComponent, K } from './ei-delade';
import { AllowedValue, Mapping, IntegrationProfile, PostingConfig, aktivaVarden, idag } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

type Filter = 'alla' | 'aktiva' | 'inaktiva' | 'oanvanda' | 'namnSaknas';

interface VardeForm {
  /** Kod för värdet som redigeras, null = nytt värde. */
  ursprung: string | null;
  code: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
}

const FILTER: { id: Filter; namn: string }[] = [
  { id: 'alla', namn: 'Alla' },
  { id: 'aktiva', namn: 'Aktiva' },
  { id: 'inaktiva', namn: 'Inaktiva' },
  { id: 'oanvanda', namn: 'Oanvända' },
  { id: 'namnSaknas', namn: 'Namn saknas' },
];

/** Delar upp inklistrad text på komma, semikolon och radbrytning. */
export function tolkaInklistrat(text: string, befintliga: string[]): { nya: string[]; dubbletter: number; tomma: number } {
  const delar = text.split(/\r?\n|[,;]/);
  const sedda = new Set(befintliga.map((k) => k.trim().toLowerCase()));
  const nya: string[] = [];
  let dubbletter = 0;
  let tomma = 0;
  for (const d of delar) {
    const kod = d.trim();
    if (!kod) {
      tomma++;
      continue;
    }
    if (sedda.has(kod.toLowerCase())) {
      dubbletter++;
      continue;
    }
    sedda.add(kod.toLowerCase());
    nya.push(kod);
  }
  // En avslutande radbrytning ger ingen "tom" post.
  if (text.length && /(\r?\n|[,;])$/.test(text) && tomma) tomma--;
  return { nya, dubbletter, tomma: text.trim() ? tomma : 0 };
}

@Component({
  selector: 'app-ei-profil-vardelistor',
  imports: [FormsModule, RouterLink, DatumValjareComponent, EiBegreppComponent, EiDialogComponent, EiKallaComponent, EiNotisComponent],
  template: `
    <div class="grid grid-cols-[240px_1fr] min-h-[420px]">
      <!-- Vänster: attribut med värdelista -->
      <nav class="border-r border-border-muted py-3" aria-label="Attribut med värdelista">
        <h3 class="flex items-center gap-1 px-4 pb-2 text-[13px] font-semibold text-text-muted uppercase tracking-wide">
          Attribut <app-ei-begrepp term="Attribut" />
        </h3>
        <ul class="list-none m-0 p-0">
          @for (m of medLista(); track m.attributeId) {
            <li>
              <a [routerLink]="[]" [queryParams]="{ flik: 'vardelistor', attribut: m.attributeId }" queryParamsHandling="merge"
                [attr.aria-current]="m.attributeId === vald()?.attributeId ? 'true' : null"
                class="flex items-center justify-between gap-2 px-4 py-2 text-sm border-l-2"
                [class]="m.attributeId === vald()?.attributeId ? 'border-primary bg-component-selected text-text font-medium' : 'border-transparent text-text-secondary hover:bg-component-hover'">
                {{ service.attributNamn(profil(), m.attributeId) }}
                <span class="text-[12px] text-text-muted whitespace-nowrap">{{ antalAktiva(m) }} aktiva</span>
              </a>
            </li>
          } @empty {
            <li class="px-4 py-2 text-sm text-text-muted">Inga attribut har värdelista.</li>
          }
        </ul>
      </nav>

      <!-- Höger: värden -->
      <div class="min-w-0">
        @if (vald(); as m) {
          @let namn = service.attributNamn(profil(), m.attributeId);
          <div class="px-5 pt-4 space-y-3">
            <div class="flex items-center justify-between gap-3 flex-wrap">
              <h3 class="flex items-center gap-1 text-base font-semibold text-text">
                Värdelista: {{ namn }} <app-ei-begrepp term="Värdelista" />
              </h3>
              <div class="flex items-center gap-2">
                <button type="button" (click)="oppnaKlistra()" [class]="k.sekundarLiten">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">content_paste</span>Klistra in flera
                </button>
                <button type="button" (click)="nyttVarde()" [class]="k.primar">
                  <span class="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>Lägg till värde
                </button>
              </div>
            </div>
            @if (m.importNote) {
              <app-ei-notis>{{ m.importNote }}</app-ei-notis>
            }
            @if (m.mode === 'FIXED') {
              <p class="text-[13px] text-text-secondary">Läget är Fast värde: <span class="font-mono">{{ m.fixedValue }}</span> används i alla konteringar.</p>
            }
            @if (m.mode === 'FOLLOWS_FLOW') {
              <p class="text-[13px] text-text-secondary">Läget är Följer flödet: värdet blir konteringens flöde.</p>
            }
            <div class="flex items-center gap-3 flex-wrap">
              <div class="flex border border-border" role="group" aria-label="Filter">
                @for (f of filterLista; track f.id) {
                  <button type="button" (click)="filter.set(f.id)" [attr.aria-pressed]="filter() === f.id"
                    class="px-3 py-1.5 text-sm border-r border-border last:border-r-0"
                    [class]="filter() === f.id ? 'bg-primary text-on-primary' : 'bg-surface text-text-secondary hover:bg-component-hover'">
                    {{ f.namn }} <span class="text-[12px] opacity-80">{{ antalIFilter(f.id) }}</span>
                  </button>
                }
              </div>
              <div class="relative w-full max-w-[280px]">
                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted pointer-events-none" aria-hidden="true">search</span>
                <input type="text" autocomplete="off" aria-label="Sök kod eller namn" placeholder="Sök kod eller namn …"
                  [ngModel]="sok()" (ngModelChange)="sok.set($event)" [class]="k.falt + ' pl-9'" />
              </div>
            </div>
          </div>

          <div class="overflow-x-auto mt-3">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-y border-border">
                  <th scope="col" [class]="k.th + ' pl-5'">Kod</th>
                  <th scope="col" [class]="k.th">Namn</th>
                  <th scope="col" [class]="k.th">Beskrivning</th>
                  <th scope="col" [class]="k.th + ' whitespace-nowrap'">Giltig från</th>
                  <th scope="col" [class]="k.th + ' whitespace-nowrap'">Giltig till</th>
                  <th scope="col" [class]="k.th">Status</th>
                  <th scope="col" [class]="k.th">Används i</th>
                  <th scope="col" class="pl-4 pr-5 py-2.5"><span class="sr-only">Åtgärder</span></th>
                </tr>
              </thead>
              <tbody>
                @for (v of synligaVarden(); track v.code) {
                  @let anv = anvands(v);
                  <tr class="border-b border-border-muted odd:bg-surface-subtle hover:bg-component-hover">
                    <td class="pl-5 pr-4 py-2.5 align-top font-mono text-[13px] whitespace-nowrap">{{ v.code }}</td>
                    <td class="px-4 py-2.5 align-top">
                      @if (v.name) {
                        {{ v.name }} <app-ei-kalla class="ml-1" [kalla]="v.nameSource" />
                      } @else {
                        <span class="text-text-subtle italic">Namn saknas</span>
                      }
                    </td>
                    <td class="px-4 py-2.5 align-top text-text-secondary">{{ v.description || '' }}</td>
                    <td class="px-4 py-2.5 align-top whitespace-nowrap">{{ v.validFrom || '–' }}</td>
                    <td class="px-4 py-2.5 align-top whitespace-nowrap">{{ v.validTo || '–' }}</td>
                    <td class="px-4 py-2.5 align-top">
                      <span [class]="k.status + ' ' + (v.status === 'ACTIVE' ? 'bg-surface-success text-on-surface-success border border-border-success' : 'bg-surface text-text-muted border border-border')">
                        {{ v.status === 'ACTIVE' ? 'Aktiv' : 'Inaktiv' }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 align-top">
                      @for (t of anv; track t.id; let sist = $last) {
                        <a [routerLink]="bas + '/konteringar/' + t.id" [class]="k.lank">{{ service.konteringNamn(t) }}</a>@if (!sist) {<span class="text-text-muted">, </span>}
                      } @empty {
                        <span class="text-text-subtle">–</span>
                      }
                    </td>
                    <td class="pl-4 pr-5 py-1.5 align-top text-right whitespace-nowrap">
                      <button type="button" (click)="redigeraVarde(v)" [attr.aria-label]="'Redigera ' + v.code" title="Redigera" [class]="k.ikon">
                        <span class="material-symbols-outlined text-[20px] align-middle">edit</span>
                      </button>
                      <button type="button" (click)="vaxlaStatus(v)" [attr.aria-label]="(v.status === 'ACTIVE' ? 'Inaktivera ' : 'Aktivera ') + v.code"
                        [title]="v.status === 'ACTIVE' ? 'Inaktivera' : 'Aktivera'" [class]="k.ikon">
                        <span class="material-symbols-outlined text-[20px] align-middle">{{ v.status === 'ACTIVE' ? 'toggle_on' : 'toggle_off' }}</span>
                      </button>
                      <button type="button" (click)="taBort.set(v)" [disabled]="anv.length > 0" [attr.aria-label]="'Ta bort ' + v.code"
                        [title]="anv.length ? 'Värdet används och kan inte tas bort' : 'Ta bort'" [class]="k.ikon">
                        <span class="material-symbols-outlined text-[20px] align-middle">delete</span>
                      </button>
                    </td>
                  </tr>
                } @empty {
                  <tr><td colspan="8" class="px-6 py-10 text-center text-text-muted">
                    {{ m.values.length ? 'Inga värden matchar filtret.' : 'Inga värden. Lägg till värden eller klistra in flera.' }}
                  </td></tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="px-5 py-10 text-sm text-text-muted">Välj ett attribut.</p>
        }
      </div>
    </div>

    <!-- Lägg till / redigera värde -->
    @if (form(); as f) {
      <app-ei-dialog [rubrik]="f.ursprung === null ? 'Lägg till värde' : 'Redigera värde ' + f.ursprung" (stang)="form.set(null)">
        <div>
          <label for="ei-v-kod" [class]="k.etikett">Kod <span class="text-error" aria-hidden="true">*</span></label>
          <input id="ei-v-kod" type="text" autocomplete="off" [ngModel]="f.code" (ngModelChange)="sattForm({ code: $event })"
            [readonly]="f.ursprung !== null" [attr.aria-invalid]="visaFel(formFel().code) ? true : null"
            [class]="k.falt + ' font-mono read-only:bg-surface-muted'" [class.border-border-error]="visaFel(formFel().code)" />
          @if (visaFel(formFel().code); as fel) {
            <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ fel }}</p>
          } @else if (f.ursprung !== null) {
            <p [class]="k.hjalp">Koden kan inte ändras.</p>
          }
        </div>
        <div>
          <label for="ei-v-namn" [class]="k.etikett">Namn</label>
          <input id="ei-v-namn" type="text" autocomplete="off" [ngModel]="f.name" (ngModelChange)="sattForm({ name: $event })" [class]="k.falt" />
        </div>
        <div>
          <label for="ei-v-besk" [class]="k.etikett">Beskrivning</label>
          <textarea id="ei-v-besk" rows="2" [ngModel]="f.description" (ngModelChange)="sattForm({ description: $event })" [class]="k.falt + ' resize-y'"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="ei-v-fran" [class]="k.etikett">Giltig från</label>
            <app-datum-valjare inputId="ei-v-fran" etikett="Giltig från" [varde]="f.validFrom" (vardeChange)="sattForm({ validFrom: $event })" />
          </div>
          <div>
            <label for="ei-v-till" [class]="k.etikett">Giltig till</label>
            <app-datum-valjare inputId="ei-v-till" etikett="Giltig till" [varde]="f.validTo" (vardeChange)="sattForm({ validTo: $event })" />
            @if (visaFel(formFel().validTo); as fel) {
              <p [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ fel }}</p>
            }
          </div>
        </div>
        <button fot type="button" (click)="form.set(null)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="sparaForm()" [class]="k.primar">Spara</button>
      </app-ei-dialog>
    }

    <!-- Klistra in flera -->
    @if (klistraOppen()) {
      <app-ei-dialog rubrik="Klistra in flera värden" (stang)="klistraOppen.set(false)">
        <div>
          <label for="ei-klistra" [class]="k.etikett">Koder</label>
          <textarea id="ei-klistra" rows="8" [ngModel]="klistraText()" (ngModelChange)="klistraText.set($event)" [class]="k.falt + ' font-mono resize-y'"></textarea>
          <p [class]="k.hjalp">Separera koderna med komma, semikolon eller radbrytning. Namn kan läggas till efteråt.</p>
        </div>
        <p class="text-sm text-text" aria-live="polite">
          {{ inklistrat().nya.length }} nya, {{ inklistrat().dubbletter }} dubbletter hoppas över, {{ inklistrat().tomma }} tomma hoppas över
        </p>
        <button fot type="button" (click)="klistraOppen.set(false)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="laggTillInklistrat()" [class]="k.primar" [disabled]="!inklistrat().nya.length">Lägg till</button>
      </app-ei-dialog>
    }

    <!-- Inaktivera värde som används (V3) / fast värde -->
    @if (inaktivera(); as i) {
      <app-ei-dialog [rubrik]="'Inaktivera ' + i.varde.code + '?'" roll="alertdialog" (stang)="inaktivera.set(null)">
        @if (i.arFast) {
          <p [class]="k.fel + ' text-sm'"><span class="material-symbols-outlined text-[18px]">block</span>Värdet är profilens fasta värde och kan inte inaktiveras. Ändra läget under Mappning först.</p>
        } @else {
          <app-ei-notis niva="warning">
            Värdet används i {{ i.konteringar.length }} kontering(ar): {{ konteringsnamn(i.konteringar) }}. Det ligger kvar där men kan inte väljas i nya konteringar eller versioner.
          </app-ei-notis>
        }
        <button fot type="button" (click)="inaktivera.set(null)" [class]="k.sekundar">{{ i.arFast ? 'Stäng' : 'Avbryt' }}</button>
        @if (!i.arFast) {
          <button fot type="button" (click)="sattStatus(i.varde, 'INACTIVE')" [class]="k.primar">Inaktivera</button>
        }
      </app-ei-dialog>
    }

    <!-- Ta bort värde -->
    @if (taBort(); as v) {
      <app-ei-dialog [rubrik]="'Ta bort ' + v.code + '?'" roll="alertdialog" (stang)="taBort.set(null)">
        <p class="text-sm text-text">Värdet <span class="font-mono">{{ v.code }}</span> tas bort från värdelistan.</p>
        <button fot type="button" (click)="taBort.set(null)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="bekraftaTaBort(v)" [class]="k.fara">Ta bort</button>
      </app-ei-dialog>
    }
  `,
})
export class EiProfilVardelistorComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly filterLista = FILTER;

  readonly profil = input.required<IntegrationProfile>();
  readonly attributId = input<string | null>(null);

  readonly filter = signal<Filter>('alla');
  readonly sok = signal('');
  readonly form = signal<VardeForm | null>(null);
  readonly forsokSpara = signal(false);
  readonly klistraOppen = signal(false);
  readonly klistraText = signal('');
  readonly inaktivera = signal<{ varde: AllowedValue; konteringar: PostingConfig[]; arFast: boolean } | null>(null);
  readonly taBort = signal<AllowedValue | null>(null);

  readonly medLista = computed(() => this.service.sorteradeMappningar(this.profil()).filter((m) => m.mode !== 'FROM_CASE'));
  readonly vald = computed<Mapping | null>(
    () => this.medLista().find((m) => m.attributeId === this.attributId()) ?? this.medLista()[0] ?? null,
  );

  /** Användning per kod för valt attribut. */
  private readonly anvandning = computed(() => {
    const m = this.vald();
    const karta = new Map<string, PostingConfig[]>();
    if (!m) return karta;
    for (const v of m.values) {
      karta.set(v.code, this.service.konteringarSomAnvanderVarde(this.profil().id, m.attributeId, v.code));
    }
    return karta;
  });

  anvands(v: AllowedValue): PostingConfig[] {
    return this.anvandning().get(v.code) ?? [];
  }

  private matcharFilter(v: AllowedValue, f: Filter): boolean {
    switch (f) {
      case 'alla':
        return true;
      case 'aktiva':
        return v.status === 'ACTIVE';
      case 'inaktiva':
        return v.status === 'INACTIVE';
      case 'oanvanda':
        return this.anvands(v).length === 0;
      case 'namnSaknas':
        return !v.name;
    }
  }

  antalIFilter(f: Filter): number {
    return (this.vald()?.values ?? []).filter((v) => this.matcharFilter(v, f)).length;
  }

  readonly synligaVarden = computed(() => {
    const s = this.sok().trim().toLowerCase();
    return (this.vald()?.values ?? []).filter(
      (v) =>
        this.matcharFilter(v, this.filter()) &&
        (!s || v.code.toLowerCase().includes(s) || (v.name ?? '').toLowerCase().includes(s)),
    );
  });

  antalAktiva(m: Mapping): number {
    return aktivaVarden(m).length;
  }

  konteringsnamn(konteringar: PostingConfig[]): string {
    return konteringar.map((k) => this.service.konteringNamn(k)).join(', ');
  }

  /* ---------- Ändra värdelistan ---------- */

  private andraVarden(fn: (v: AllowedValue[]) => AllowedValue[], bekraftelse: string): void {
    const m = this.vald();
    if (!m) return;
    this.service.andraMappning(this.profil().id, m.attributeId, (x) => ({ ...x, values: fn(x.values) }), bekraftelse);
  }

  nyttVarde(): void {
    this.forsokSpara.set(false);
    this.form.set({ ursprung: null, code: '', name: '', description: '', validFrom: idag(), validTo: '' });
  }

  redigeraVarde(v: AllowedValue): void {
    this.forsokSpara.set(false);
    this.form.set({
      ursprung: v.code,
      code: v.code,
      name: v.name ?? '',
      description: v.description ?? '',
      validFrom: v.validFrom ?? '',
      validTo: v.validTo ?? '',
    });
  }

  sattForm(andring: Partial<VardeForm>): void {
    this.form.update((f) => (f ? { ...f, ...andring } : f));
  }

  /** V1 och V2. */
  readonly formFel = computed(() => {
    const f = this.form();
    const fel: { code?: string; validTo?: string } = {};
    if (!f) return fel;
    const kod = f.code.trim().toLowerCase();
    if (!kod) fel.code = 'Ange en kod.';
    else if (f.ursprung === null && (this.vald()?.values ?? []).some((v) => v.code.trim().toLowerCase() === kod))
      fel.code = 'Koden finns redan i värdelistan.';
    if (f.validFrom && f.validTo && f.validTo < f.validFrom) fel.validTo = 'Giltig till kan inte vara före giltig från.';
    return fel;
  });

  visaFel(fel: string | undefined): string | undefined {
    return this.forsokSpara() ? fel : undefined;
  }

  sparaForm(): void {
    this.forsokSpara.set(true);
    const f = this.form();
    if (!f || Object.keys(this.formFel()).length) return;
    const delar: Partial<AllowedValue> = {
      ...(f.name.trim() ? { name: f.name.trim() } : {}),
      ...(f.description.trim() ? { description: f.description.trim() } : {}),
      ...(f.validFrom ? { validFrom: f.validFrom } : {}),
      ...(f.validTo ? { validTo: f.validTo } : {}),
    };
    if (f.ursprung === null) {
      this.andraVarden((vs) => [...vs, { code: f.code.trim(), status: 'ACTIVE', ...delar }], `Värdet ${f.code.trim()} har lagts till.`);
    } else {
      this.andraVarden(
        (vs) =>
          vs.map((v) => {
            if (v.code !== f.ursprung) return v;
            const namnAndrat = (v.name ?? '') !== f.name.trim();
            return { code: v.code, status: v.status, ...delar, ...(namnAndrat || !v.nameSource ? {} : { nameSource: v.nameSource }) };
          }),
        'Värdet har sparats.',
      );
    }
    this.form.set(null);
  }

  oppnaKlistra(): void {
    this.klistraText.set('');
    this.klistraOppen.set(true);
  }

  readonly inklistrat = computed(() =>
    tolkaInklistrat(this.klistraText(), (this.vald()?.values ?? []).map((v) => v.code)),
  );

  laggTillInklistrat(): void {
    const nya = this.inklistrat().nya;
    this.andraVarden(
      (vs) => [...vs, ...nya.map((code): AllowedValue => ({ code, status: 'ACTIVE', validFrom: idag() }))],
      `${nya.length} ${nya.length === 1 ? 'värde har' : 'värden har'} lagts till.`,
    );
    this.klistraOppen.set(false);
  }

  vaxlaStatus(v: AllowedValue): void {
    if (v.status === 'INACTIVE') {
      this.sattStatus(v, 'ACTIVE');
      return;
    }
    const m = this.vald();
    const arFast = m?.mode === 'FIXED' && m.fixedValue === v.code;
    const konteringar = this.anvands(v);
    if (arFast || konteringar.length) this.inaktivera.set({ varde: v, konteringar, arFast });
    else this.sattStatus(v, 'INACTIVE');
  }

  sattStatus(v: AllowedValue, status: AllowedValue['status']): void {
    this.inaktivera.set(null);
    this.andraVarden(
      (vs) => vs.map((x) => (x.code === v.code ? { ...x, status } : x)),
      `Värdet ${v.code} har ${status === 'ACTIVE' ? 'aktiverats' : 'inaktiverats'}.`,
    );
  }

  bekraftaTaBort(v: AllowedValue): void {
    this.taBort.set(null);
    if (this.anvands(v).length) return; // V4
    this.andraVarden((vs) => vs.filter((x) => x.code !== v.code), `Värdet ${v.code} har tagits bort.`);
  }
}
