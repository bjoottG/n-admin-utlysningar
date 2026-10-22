import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EI_BAS, EiBegreppComponent, EiDialogComponent, EiNotisComponent, EiRamComponent, K } from './ei-delade';
import {
  ARENDEFALT_NAMN,
  BOK_NAMN,
  BOK_ORDNING,
  CaseField,
  Category,
  FLODE_NAMN,
  FLODE_ORDNING,
  Flow,
  LAGE_NAMN,
  LAGE_ORDNING,
  Mapping,
  IntegrationProfile,
  TransactionType,
  ValueMode,
  INTEGRATION_NAMN,
  aktivaVarden,
  idag,
  mappningsfel,
  sorteraMappningar,
  standardMappning,
} from './ei-modell';
import { Aktivering, EiPlaneraComponent } from './ei-planera.component';
import { EkonomiskIntegrationService, nyttId } from './ei.service';

const STEG = ['Grunduppgifter', 'Flöden och böcker', 'Attribut', 'Mappning', 'Granska'];

@Component({
  selector: 'app-ei-profil-guide',
  imports: [FormsModule, EiRamComponent, EiBegreppComponent, EiDialogComponent, EiNotisComponent, EiPlaneraComponent],
  template: `
    <app-ei-ram flik="profiler" [brodsmulor]="[{ text: 'Ny integrationsprofil' }]">
      <div class="max-w-[1100px]">
        <h2 class="flex items-center gap-1 text-xl font-semibold text-text mb-4">Ny integrationsprofil <app-ei-begrepp term="Integrationsprofil" /></h2>

        <!-- Stegindikator -->
        <ol class="flex items-center gap-2 mb-5 list-none p-0 flex-wrap" aria-label="Steg">
          @for (s of stegNamn; track s; let i = $index; let sist = $last) {
            <li class="flex items-center gap-2" [attr.aria-current]="steg() === i + 1 ? 'step' : null">
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold border"
                [class]="steg() === i + 1 ? 'bg-primary text-on-primary border-primary' : steg() > i + 1 ? 'bg-surface-primary text-on-surface-primary border-primary-lighter' : 'bg-surface text-text-muted border-border'">
                @if (steg() > i + 1) { <span class="material-symbols-outlined text-[16px]" aria-hidden="true">check</span><span class="sr-only">Klart:</span> } @else { {{ i + 1 }} }
              </span>
              <span class="text-sm" [class]="steg() === i + 1 ? 'font-semibold text-text' : 'text-text-secondary'">{{ s }}</span>
              @if (!sist) { <span class="w-8 h-px bg-border" aria-hidden="true"></span> }
            </li>
          }
        </ol>

        <section class="bg-surface border border-border p-6 space-y-5">
          @switch (steg()) {
            <!-- 1. Grunduppgifter -->
            @case (1) {
              <h3 class="text-base font-semibold">1. Grunduppgifter</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[760px]">
                <div>
                  <label for="ei-g-org" [class]="k.etikett">Utbetalande organisation <span class="text-error" aria-hidden="true">*</span></label>
                  <select id="ei-g-org" [ngModel]="orgId()" (ngModelChange)="valjOrg($event)" [class]="k.falt">
                    <option value="">– Välj organisation –</option>
                    @for (o of service.organisationer(); track o.id) { <option [value]="o.id">{{ o.name }}</option> }
                  </select>
                </div>
                <div>
                  <label for="ei-g-system" [class]="k.etikett">Ekonomisystem <span class="text-error" aria-hidden="true">*</span></label>
                  <select id="ei-g-system" [ngModel]="systemId()" (ngModelChange)="valjSystem($event)" [class]="k.falt">
                    @for (s of service.system(); track s.id) { <option [value]="s.id">{{ s.name }} ({{ integrationNamn[s.integrationStatus] }})</option> }
                  </select>
                </div>
                @if (!harIntegration()) {
                  <div class="md:col-span-2">
                    <app-ei-notis niva="warning">Det finns ingen integration för {{ systemNamn() }}. Profilen kan bara sparas som utkast.</app-ei-notis>
                  </div>
                }
                <div class="md:col-span-2">
                  <label for="ei-g-namn" [class]="k.etikett">Namn <span class="text-error" aria-hidden="true">*</span></label>
                  <input id="ei-g-namn" type="text" autocomplete="off" [ngModel]="namn()" (ngModelChange)="namn.set($event); namnAndrat.set(true); andrad.set(true)" [class]="k.falt" />
                  <p [class]="k.hjalp">Förslag: "{{ systemNamn() }} – organisationens namn". Unikt inom organisationen.</p>
                </div>
                <div class="md:col-span-2">
                  <label for="ei-g-utga" [class]="k.etikett">Utgå från befintlig profil (valfritt)</label>
                  <select id="ei-g-utga" [ngModel]="utgaFran()" (ngModelChange)="valjUtgaFran($event)" [class]="k.falt">
                    <option value="">– Ingen –</option>
                    @for (p of utgaFranVal(); track p.id) {
                      <option [value]="p.id">{{ service.hamtaOrg(p.organisationId)?.name }} – {{ p.name }}</option>
                    }
                  </select>
                  <p [class]="k.hjalp">Kopierar flöden, böcker, mappningar och värdelistor. Bara profiler mot samma ekonomisystem kan väljas.</p>
                </div>
              </div>
            }

            <!-- 2. Flöden och böcker -->
            @case (2) {
              <h3 class="text-base font-semibold">2. Flöden och böcker</h3>
              <fieldset>
                <legend [class]="k.etikett + ' inline-flex items-center gap-1'">Flöden <app-ei-begrepp term="Flöde" /></legend>
                <div class="flex gap-6">
                  @for (f of floden; track f) {
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" class="w-4 h-4 accent-primary" [checked]="flows().includes(f)" (change)="vaxlaFlode(f)" />
                      {{ flodeNamn[f] }} ({{ f }})
                    </label>
                  }
                </div>
              </fieldset>
              <fieldset>
                <legend [class]="k.etikett + ' inline-flex items-center gap-1'">Böcker <app-ei-begrepp term="Bokförs i" /></legend>
                <div class="flex flex-wrap gap-x-6 gap-y-2">
                  @for (b of bocker; track b) {
                    <label class="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" class="w-4 h-4 accent-primary" [checked]="books().includes(b)" (change)="vaxlaBok(b)" />
                      {{ bokNamn[b] }} ({{ b }})
                    </label>
                  }
                </div>
                <p [class]="k.hjalp">Böckerna bestämmer vilka rader som skickas till ekonomisystemet. Utbetalning kräver AP och inbetalning kräver AR.</p>
              </fieldset>
            }

            <!-- 3. Attribut -->
            @case (3) {
              <h3 class="flex items-center gap-1 text-base font-semibold">3. Attribut <app-ei-begrepp term="Attribut" /></h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                @for (a of systemAttribut(); track a.id) {
                  <label class="flex items-start gap-2 p-3 border border-border-muted text-sm cursor-pointer hover:bg-component-hover">
                    <input type="checkbox" class="w-4 h-4 mt-0.5 accent-primary" [checked]="attribut().includes(a.id)" (change)="vaxlaAttribut(a.id)" />
                    <span><span class="font-medium">{{ a.name }}</span><span class="block text-[13px] text-text-muted">{{ a.description }}</span></span>
                  </label>
                }
              </div>
            }

            <!-- 4. Mappning -->
            @case (4) {
              <h3 class="flex items-center gap-1 text-base font-semibold">4. Mappning <app-ei-begrepp term="Mappning" /></h3>
              <p class="text-sm text-text-secondary">Förifyllt. Värdelistor får vara tomma här och fylls på i profilen efteråt.</p>
              <div class="overflow-x-auto -mx-6">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-y border-border">
                      <th scope="col" [class]="k.th + ' pl-6'">Attribut</th>
                      <th scope="col" [class]="k.th">Dimension</th>
                      <th scope="col" [class]="k.th">Bokförs i</th>
                      <th scope="col" [class]="k.th">Värde i kontering</th>
                      <th scope="col" [class]="k.th + ' pr-6'">Värdelista</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (m of sorterade(); track m.attributeId) {
                      @let namn = attributNamn(m.attributeId);
                      <tr class="border-b border-border-muted align-top">
                        <td class="pl-6 pr-4 py-2.5 font-medium">{{ namn }}</td>
                        <td class="px-4 py-2">
                          <select [attr.aria-label]="'Dimension för ' + namn" [ngModel]="m.category" (ngModelChange)="sattMappning(m.attributeId, { category: $event })" [class]="k.falt + ' font-mono py-1.5'">
                            @for (c of dimensionerFor(m); track c) { <option [value]="c">{{ c }}</option> }
                          </select>
                        </td>
                        <td class="px-4 py-2">
                          <div class="flex gap-1" role="group" [attr.aria-label]="'Bokförs i för ' + namn">
                            @for (b of books(); track b) {
                              <button type="button" (click)="vaxlaMappningBok(m, b)" [attr.aria-pressed]="m.bookIn.includes(b)" [title]="bokNamn[b]"
                                class="px-2 py-1 font-mono text-[12px] border rounded-sm"
                                [class]="m.bookIn.includes(b) ? 'bg-primary text-on-primary border-primary' : 'bg-surface text-text-secondary border-border hover:bg-component-hover'">{{ b }}</button>
                            }
                          </div>
                        </td>
                        <td class="px-4 py-2">
                          <div class="flex flex-wrap gap-2">
                            <select [attr.aria-label]="'Värde i kontering för ' + namn" [ngModel]="m.mode" (ngModelChange)="sattLage(m, $event)" [class]="k.falt + ' py-1.5 w-auto'">
                              @for (l of lagen; track l) {
                                <option [value]="l" [disabled]="l === 'FOLLOWS_FLOW' && m.attributeId !== 'aktivitet'">{{ lageNamn[l] }}</option>
                              }
                            </select>
                            @if (m.mode === 'FIXED') {
                              <select [attr.aria-label]="'Fast värde för ' + namn" [ngModel]="m.fixedValue ?? ''" (ngModelChange)="sattMappning(m.attributeId, { fixedValue: $event })" [class]="k.falt + ' py-1.5 w-auto'">
                                <option value="">– Välj –</option>
                                @for (v of aktivaVarden(m); track v.code) { <option [value]="v.code">{{ v.code }}</option> }
                              </select>
                            }
                            @if (m.mode === 'FROM_CASE') {
                              <select [attr.aria-label]="'Fält från ärendet för ' + namn" [ngModel]="m.caseField" (ngModelChange)="sattMappning(m.attributeId, { caseField: $event })" [class]="k.falt + ' py-1.5 w-auto'">
                                @for (f of arendefalt; track f) { <option [value]="f">{{ arendefaltNamn[f] }}</option> }
                              </select>
                            }
                          </div>
                        </td>
                        <td class="pl-4 pr-6 py-2.5 whitespace-nowrap">
                          @if (m.mode === 'FROM_CASE') { <span class="text-text-subtle">–</span> } @else { {{ aktivaVarden(m).length }} aktiva }
                        </td>
                      </tr>
                    } @empty {
                      <tr><td colspan="5" class="px-6 py-8 text-center text-text-muted">Inga attribut valda. Gå tillbaka till steg 3.</td></tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <!-- 5. Granska -->
            @case (5) {
              <h3 class="text-base font-semibold">5. Granska</h3>
              <dl class="grid grid-cols-[200px_1fr] gap-x-4 gap-y-2 text-sm">
                <dt class="text-text-muted">Namn</dt><dd>{{ namn() }}</dd>
                <dt class="text-text-muted">Utbetalande organisation</dt><dd>{{ service.hamtaOrg(orgId())?.name }}</dd>
                <dt class="text-text-muted">Ekonomisystem</dt><dd>{{ systemNamn() }} <span class="text-text-muted">({{ integrationNamn[service.hamtaSystem(systemId())?.integrationStatus ?? 'NOT_AVAILABLE'] }})</span></dd>
                @if (utgaFran()) { <dt class="text-text-muted">Utgår från</dt><dd>{{ service.hamtaProfil(utgaFran())?.name }}</dd> }
                <dt class="text-text-muted">Flöden</dt><dd>{{ flodeText() }}</dd>
                <dt class="text-text-muted">Böcker</dt><dd>{{ bokText() }}</dd>
                <dt class="text-text-muted">Attribut</dt>
                <dd>
                  <ul class="list-none m-0 p-0 space-y-0.5">
                    @for (m of sorterade(); track m.attributeId) {
                      <li><span class="font-mono text-[12px] inline-block w-24">{{ m.category }}</span>{{ attributNamn(m.attributeId) }} – {{ lageKort(m) }} <span class="text-text-muted">({{ m.bookIn.join(', ') }})</span></li>
                    }
                  </ul>
                </dd>
              </dl>
              <div class="space-y-2">
                <h4 class="text-sm font-semibold">Validering</h4>
                @if (!harIntegration()) {
                  <app-ei-notis niva="warning">Det finns ingen integration för {{ systemNamn() }}. Profilen kan bara sparas som utkast. (P13)</app-ei-notis>
                }
                @if (!allaFel().length && !varningar().length) {
                  <p class="flex items-center gap-1 text-sm text-success"><span class="material-symbols-outlined text-[18px]" aria-hidden="true">check_circle</span>Inga fel eller varningar.</p>
                }
                @for (f of allaFel(); track $index) {
                  <app-ei-notis niva="error">{{ f }}</app-ei-notis>
                }
                @for (v of varningar(); track $index) {
                  <app-ei-notis niva="warning">{{ v }}</app-ei-notis>
                }
              </div>
            }
          }

          @if (stegFel().length && forsok()) {
            <ul class="space-y-1 list-none m-0 p-0" role="alert">
              @for (f of stegFel(); track $index) {
                <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
              }
            </ul>
          }
        </section>

        <div class="flex items-center justify-between gap-2 mt-4">
          <button type="button" (click)="avbryt()" [class]="k.sekundar">Avbryt</button>
          <div class="flex items-center gap-2">
            @if (steg() > 1) {
              <button type="button" (click)="tillbaka()" [class]="k.sekundar">
                <span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>Tillbaka
              </button>
            }
            @if (steg() < 5) {
              <button type="button" (click)="nasta()" [class]="k.primar">Nästa<span class="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span></button>
            } @else {
              <button type="button" (click)="sparaUtkast()" [class]="k.sekundar" [disabled]="allaFel().length > 0">Spara som utkast</button>
              <button type="button" (click)="planeraOppen.set(true)" [class]="k.primar + ' disabled:opacity-50 disabled:cursor-not-allowed'"
                [disabled]="allaFel().length > 0 || !harIntegration()"
                [title]="harIntegration() ? '' : 'Det finns ingen integration för ' + systemNamn() + '. Profilen kan bara sparas som utkast.'">Planera aktivering…</button>
            }
          </div>
        </div>
      </div>
    </app-ei-ram>

    @if (avbrytOppen()) {
      <app-ei-dialog rubrik="Avbryta?" roll="alertdialog" (stang)="avbrytOppen.set(false)">
        <p class="text-sm text-text">Det du har fyllt i sparas inte.</p>
        <button fot type="button" (click)="avbrytOppen.set(false)" [class]="k.sekundar">Fortsätt fylla i</button>
        <button fot type="button" (click)="lamna()" [class]="k.fara">Avbryt guiden</button>
      </app-ei-dialog>
    }

    @if (planeraOppen()) {
      <app-ei-planera [profil]="utkast()" (klar)="planera($event)" (stang)="planeraOppen.set(false)" />
    }
  `,
})
export class EiProfilGuideComponent {
  readonly service = inject(EkonomiskIntegrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly k = K;
  readonly stegNamn = STEG;
  readonly floden = FLODE_ORDNING;
  readonly bocker = BOK_ORDNING;
  readonly flodeNamn = FLODE_NAMN;
  readonly bokNamn = BOK_NAMN;
  readonly lagen = LAGE_ORDNING;
  readonly lageNamn = LAGE_NAMN;
  readonly arendefalt: CaseField[] = ['CASE_ID', 'COUNTERPART_CODE'];
  readonly arendefaltNamn = ARENDEFALT_NAMN;
  readonly aktivaVarden = aktivaVarden;
  readonly integrationNamn = INTEGRATION_NAMN;

  readonly id = nyttId('ip');
  readonly steg = signal(1);
  readonly forsok = signal(false);
  readonly andrad = signal(false);
  readonly avbrytOppen = signal(false);
  readonly planeraOppen = signal(false);

  readonly orgId = signal('');
  readonly systemId = signal('es-agresso');
  readonly namn = signal('');
  readonly namnAndrat = signal(false);
  readonly utgaFran = signal('');
  readonly flows = signal<Flow[]>(['UTB']);
  readonly books = signal<TransactionType[]>(['GL', 'AP']);
  readonly attribut = signal<string[]>([]);
  /** Mappningar per attribut. Behålls när attribut väljs bort och tillbaka. */
  readonly mappningar = signal<Mapping[]>([]);

  constructor() {
    const q = this.route.snapshot.queryParamMap;
    const utga = this.service.hamtaProfil(q.get('utgaFran'));
    if (utga) {
      this.valjOrg(utga.organisationId);
      this.valjUtgaFran(utga.id);
    }
    if (q.get('org') && this.service.hamtaOrg(q.get('org'))) this.valjOrg(q.get('org')!);
    this.andrad.set(false);
  }

  readonly systemAttribut = computed(() => this.service.hamtaSystem(this.systemId())?.attributes ?? []);
  readonly systemNamn = computed(() => this.service.hamtaSystem(this.systemId())?.name ?? '');
  readonly harIntegration = computed(() => this.service.hamtaSystem(this.systemId())?.integrationStatus === 'AVAILABLE');
  readonly ordning = computed(() => this.service.ordning({ economicSystemId: this.systemId() }));
  readonly utgaFranVal = computed(() => this.service.profiler().filter((p) => p.economicSystemId === this.systemId()));

  attributNamn(id: string): string {
    return this.systemAttribut().find((a) => a.id === id)?.name ?? id;
  }

  /** Profilen som den ser ut just nu (för validering, granskning och planering). */
  readonly utkast = computed<IntegrationProfile>(() => ({
    id: this.id,
    name: this.namn().trim(),
    organisationId: this.orgId(),
    economicSystemId: this.systemId(),
    status: 'DRAFT',
    validFrom: idag(),
    validTo: null,
    flows: this.flows(),
    transactionTypes: this.books(),
    mappings: this.mappningar().filter((m) => this.attribut().includes(m.attributeId)),
    technicalProperties: this.egenskaper(),
    blockedPeriods: [],
    notices: [],
    source: 'underlag',
  }));

  /** Tekniska egenskaper: från profilen man utgår från, annars samma nycklar som andra profiler mot systemet. */
  private readonly egenskaper = computed(() => {
    const utga = this.service.hamtaProfil(this.utgaFran());
    return utga ? structuredClone(utga.technicalProperties) : this.service.standardEgenskaper(this.systemId());
  });

  readonly sorterade = computed(() => sorteraMappningar(this.utkast().mappings, this.ordning()));

  /* ---------- Steg 1 ---------- */

  valjOrg(id: string): void {
    this.orgId.set(id);
    this.andrad.set(true);
    this.foreslaNamn();
  }

  valjSystem(id: string): void {
    if (id === this.systemId()) return;
    this.systemId.set(id);
    this.andrad.set(true);
    // Attribut och dimensioner skiljer sig mellan ekonomisystem – börja om från steg 3.
    this.utgaFran.set('');
    this.attribut.set([]);
    this.mappningar.set([]);
    this.foreslaNamn();
  }

  /** Förslag: "{ekonomisystem} – {organisation}", så länge användaren inte har skrivit ett eget namn. */
  private foreslaNamn(): void {
    const org = this.service.hamtaOrg(this.orgId());
    if (org && !this.namnAndrat()) this.namn.set(`${this.systemNamn()} – ${org.name}`);
  }

  valjUtgaFran(id: string): void {
    this.utgaFran.set(id);
    this.andrad.set(true);
    const p = this.service.hamtaProfil(id);
    if (!p) return;
    this.systemId.set(p.economicSystemId);
    this.foreslaNamn();
    this.flows.set([...p.flows]);
    this.books.set([...p.transactionTypes]);
    this.mappningar.set(structuredClone(p.mappings));
    this.attribut.set(p.mappings.map((m) => m.attributeId));
  }

  /* ---------- Steg 2 ---------- */

  vaxlaFlode(f: Flow): void {
    this.andrad.set(true);
    this.flows.update((fs) => FLODE_ORDNING.filter((x) => (x === f ? !fs.includes(f) : fs.includes(x))));
  }

  vaxlaBok(b: TransactionType): void {
    this.andrad.set(true);
    this.books.update((bs) => BOK_ORDNING.filter((x) => (x === b ? !bs.includes(b) : bs.includes(x))));
    // Bokförs i får bara innehålla profilens böcker; minst en.
    const bocker = this.books();
    this.mappningar.update((ms) =>
      ms.map((m) => {
        const kvar = m.bookIn.filter((x) => bocker.includes(x));
        return { ...m, bookIn: kvar.length ? kvar : bocker.slice(0, 1) };
      }),
    );
  }

  /* ---------- Steg 3 ---------- */

  vaxlaAttribut(id: string): void {
    this.andrad.set(true);
    if (this.attribut().includes(id)) {
      this.attribut.update((as) => as.filter((a) => a !== id));
      return;
    }
    this.attribut.update((as) => [...as, id]);
    if (!this.mappningar().some((m) => m.attributeId === id)) {
      const a = this.systemAttribut().find((x) => x.id === id);
      if (!a) return;
      const upptagna = this.utkast().mappings.map((m) => m.category);
      this.mappningar.update((ms) => [...ms, standardMappning(a, this.ordning(), upptagna, this.books())]);
    }
  }

  /* ---------- Steg 4 ---------- */

  dimensionerFor(m: Mapping): Category[] {
    const a = this.systemAttribut().find((x) => x.id === m.attributeId);
    const upptagna = this.utkast().mappings.filter((x) => x.attributeId !== m.attributeId).map((x) => x.category);
    return (a?.allowedCategories ?? []).filter((c) => !upptagna.includes(c) || c === m.category);
  }

  sattMappning(attributId: string, andring: Partial<Mapping>): void {
    this.andrad.set(true);
    this.mappningar.update((ms) => ms.map((m) => (m.attributeId === attributId ? { ...m, ...andring } : m)));
  }

  sattLage(m: Mapping, lage: ValueMode): void {
    this.sattMappning(m.attributeId, {
      mode: lage,
      caseField: lage === 'FROM_CASE' ? (m.caseField ?? 'CASE_ID') : undefined,
      fixedValue: lage === 'FIXED' ? m.fixedValue : undefined,
    });
  }

  vaxlaMappningBok(m: Mapping, b: TransactionType): void {
    const bookIn = m.bookIn.includes(b) ? m.bookIn.filter((x) => x !== b) : BOK_ORDNING.filter((x) => x === b || m.bookIn.includes(x));
    this.sattMappning(m.attributeId, { bookIn });
  }

  /* ---------- Validering ---------- */

  private readonly fel1 = computed(() => {
    const fel: string[] = [];
    if (!this.orgId()) fel.push('Välj utbetalande organisation.');
    if (!this.namn().trim()) fel.push('Ange ett namn.');
    else if (this.orgId() && this.service.namnUpptagetProfil(this.namn(), this.orgId(), null))
      fel.push('Namnet används redan av en annan integrationsprofil för organisationen.');
    if (!this.systemId()) fel.push('Välj ekonomisystem.');
    return fel;
  });

  private readonly fel2 = computed(() => {
    const fel: string[] = [];
    if (!this.flows().length) fel.push('Välj minst ett flöde.');
    if (!this.books().length) fel.push('Välj minst en bok.');
    return fel;
  });

  private readonly fel3 = computed(() => (this.attribut().length ? [] : ['Välj minst ett attribut.']));

  private readonly fel4 = computed(() => {
    const p = this.utkast();
    return p.mappings.flatMap((m) =>
      mappningsfel(m, p, this.systemAttribut().find((a) => a.id === m.attributeId) ?? null, this.attributNamn(m.attributeId)),
    );
  });

  readonly allaFel = computed(() => [...this.fel1(), ...this.fel2(), ...this.fel3(), ...this.fel4()]);

  /** P8: valbara attribut utan aktiva värden. P14: flöde utan motsvarande reskontrabok. */
  readonly varningar = computed(() => [
    ...this.utkast()
      .mappings.filter((m) => m.mode === 'SELECTABLE' && !aktivaVarden(m).length)
      .map((m) => `${this.attributNamn(m.attributeId)}: Inga värden att välja. Lägg till värden innan profilen aktiveras.`),
    ...this.service.bokVarningar(this.utkast()),
  ]);

  readonly stegFel = computed(() => [this.fel1, this.fel2, this.fel3, this.fel4][this.steg() - 1]?.() ?? []);

  flodeText(): string {
    return this.flows().map((f) => `${FLODE_NAMN[f]} (${f})`).join(', ');
  }
  bokText(): string {
    return this.books().map((b) => `${BOK_NAMN[b]} (${b})`).join(', ');
  }
  lageKort(m: Mapping): string {
    if (m.mode === 'FIXED') return `Fast: ${m.fixedValue || '–'}`;
    if (m.mode === 'FROM_CASE') return `Från ärendet: ${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']}`;
    return LAGE_NAMN[m.mode];
  }

  /* ---------- Navigering ---------- */

  nasta(): void {
    this.forsok.set(true);
    if (this.stegFel().length) return;
    this.forsok.set(false);
    this.steg.update((s) => Math.min(5, s + 1));
  }

  tillbaka(): void {
    this.forsok.set(false);
    this.steg.update((s) => Math.max(1, s - 1));
  }

  avbryt(): void {
    if (this.andrad()) this.avbrytOppen.set(true);
    else this.lamna();
  }

  lamna(): void {
    this.avbrytOppen.set(false);
    this.router.navigate([EI_BAS, 'integrationsprofiler']);
  }

  private ren(): IntegrationProfile {
    const p = this.utkast();
    return {
      ...p,
      mappings: p.mappings.map((m) => {
        const r: Mapping = { ...m };
        if (r.mode !== 'FIXED') delete r.fixedValue;
        if (r.mode !== 'FROM_CASE') delete r.caseField;
        return r;
      }),
    };
  }

  sparaUtkast(): void {
    if (this.allaFel().length) return;
    this.service.sparaProfil(this.ren(), 'Integrationsprofilen har sparats som utkast.');
    this.router.navigate([EI_BAS, 'integrationsprofiler', this.id]);
  }

  planera(a: Aktivering): void {
    if (this.allaFel().length || !this.harIntegration()) return;
    this.planeraOppen.set(false);
    this.service.sparaProfil(this.ren(), '');
    this.service.aktivera(this.id, a.datum, a.avslutaId);
    this.service.visaBekraftelse(a.datum <= idag() ? 'Integrationsprofilen har sparats och är aktiv.' : `Integrationsprofilen har sparats. Aktiveringen är planerad till ${a.datum}.`);
    this.router.navigate([EI_BAS, 'integrationsprofiler', this.id]);
  }
}
