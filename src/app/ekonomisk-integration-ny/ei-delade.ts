import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToppmenyComponent } from '../delade/toppmeny.component';
import { KALLA_TEXT, KodRad, Source } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';
import { kontrolleraAnonymisering } from './ei-anonymiseringskontroll';

export const EI_BAS = '/ekonomisk-integration-ny';

/* ============================================================
   Etikett för osäker data: Exempeldata / Antagande
   ============================================================ */

@Component({
  selector: 'app-ei-kalla',
  template: `
    @if (text(); as t) {
      <span class="group relative inline-flex align-middle">
        <span
          tabindex="0"
          [attr.aria-describedby]="id"
          class="inline-flex items-center gap-0.5 px-1.5 py-px text-[11px] font-medium leading-4 rounded-sm whitespace-nowrap cursor-help border focus:outline-none focus-visible:shadow-focus"
          [class]="kalla() === 'example'
            ? 'bg-surface-accent text-on-surface-accent border-orange-300'
            : 'bg-surface-primary text-on-surface-primary border-primary-lighter'">
          {{ t.etikett }}
        </span>
        <span
          [id]="id"
          role="tooltip"
          class="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute z-[1070] top-full left-0 mt-1 w-60 px-3 py-2 text-[13px] font-normal leading-snug text-left text-text-inverse bg-surface-inverse shadow-lg whitespace-normal">
          {{ t.tooltip }}
        </span>
      </span>
    }
  `,
})
export class EiKallaComponent {
  private static raknare = 0;
  readonly kalla = input<Source | null | undefined>(null);
  readonly id = `ei-kalla-${++EiKallaComponent.raknare}`;
  readonly text = computed(() => {
    const k = this.kalla();
    return k === 'example' || k === 'assumption' ? KALLA_TEXT[k] : null;
  });
}

/* ============================================================
   Notis (gul varning / blå info)
   ============================================================ */

@Component({
  selector: 'app-ei-notis',
  host: { class: 'block' },
  template: `
    <div class="flex items-start gap-2 px-4 py-3 text-sm border-l-4"
      [class]="niva() === 'warning'
        ? 'bg-surface-warning text-on-surface-warning border-border-warning'
        : niva() === 'error'
          ? 'bg-surface-error text-on-surface-error border-border-error'
          : 'bg-surface-info text-on-surface-info border-border-info'"
      [attr.role]="niva() === 'error' ? 'alert' : null">
      <span class="material-symbols-outlined text-[20px] shrink-0" aria-hidden="true">
        {{ niva() === 'warning' ? 'warning' : niva() === 'error' ? 'block' : 'info' }}
      </span>
      <div class="min-w-0"><ng-content /></div>
    </div>
  `,
})
export class EiNotisComponent {
  readonly niva = input<'info' | 'warning' | 'error'>('info');
}

/* ============================================================
   Dialog och sidopanel
   ============================================================ */

@Component({
  selector: 'app-ei-dialog',
  template: `
    <div class="fixed inset-0 z-[1040] bg-black/40" (click)="stang.emit()" aria-hidden="true"></div>
    <div class="fixed inset-0 z-[1050] flex pointer-events-none"
      [class]="variant() === 'panel' ? 'justify-end' : 'items-center justify-center p-6'">
      <div
        class="pointer-events-auto w-full flex flex-col bg-surface border border-border shadow-2xl"
        [class]="variant() === 'panel' ? 'h-full max-w-[520px]' : 'max-h-[90vh] ' + bredd()"
        [attr.role]="roll()"
        aria-modal="true"
        [attr.aria-labelledby]="id">
        <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-muted">
          <h2 [id]="id" class="text-lg font-semibold text-text">{{ rubrik() }}</h2>
          <button type="button" (click)="stang.emit()" aria-label="Stäng"
            class="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-component-hover">
            <span class="material-symbols-outlined text-[20px] align-middle">close</span>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <ng-content />
        </div>
        <div class="flex items-center justify-end gap-2 px-6 py-4 border-t border-border-muted">
          <ng-content select="[fot]" />
        </div>
      </div>
    </div>
  `,
})
export class EiDialogComponent {
  private static raknare = 0;
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly rubrik = input.required<string>();
  readonly variant = input<'modal' | 'panel'>('modal');
  readonly bredd = input('max-w-[560px]');
  readonly roll = input<'dialog' | 'alertdialog'>('dialog');
  readonly stang = output<void>();
  readonly id = `ei-dialog-${++EiDialogComponent.raknare}`;

  ngAfterViewInit(): void {
    // Flytta fokus in i dialogen (första fältet eller knappen).
    setTimeout(() => {
      const el = this.el.nativeElement.querySelector(
        '[autofocus], input:not([type=hidden]), select, textarea, [fot] button',
      ) as HTMLElement | null;
      el?.focus();
    });
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    this.stang.emit();
  }
}

/* ============================================================
   Kodsträng (avsnitt 7.4)
   ============================================================ */

@Component({
  selector: 'app-ei-kodstrang',
  host: { class: 'block' },
  template: `
    <section class="border border-border bg-surface">
      <h3 class="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-text border-b border-border-muted">
        Kodsträng till {{ system() }} (förhandsvisning)

      </h3>
      <ul class="px-4 py-3 space-y-1.5 font-mono text-[13px] text-text list-none m-0" aria-label="Kodsträng per bok">
        @for (rad of rader(); track rad.bok) {
          <li class="leading-relaxed">
            @if (rad.varning) {
              <span class="inline-flex items-start gap-1 font-sans text-warning-dark">
                <span class="material-symbols-outlined text-[16px] text-warning mt-0.5" aria-hidden="true">warning</span>{{ rad.varning }}
              </span>
            } @else {
              <span class="font-semibold">{{ rad.bok + ':' }}</span>{{ ' ' }}
              @for (d of rad.delar; track d.dim; let sist = $last) {
                {{ d.dim + ' ' }}<span [class]="d.platshallare ? 'italic text-text-muted' : ''">{{ d.varde }}</span>{{ sist ? '' : ' · ' }}
              }
            }
          </li>
        }
      </ul>
      <p class="px-4 pb-3 text-[12px] text-text-muted">Huvudboksraden (GL) och reskontraraden: AP vid utbetalning, AR vid inbetalning.</p>
    </section>
  `,
})
export class EiKodstrangComponent {
  readonly rader = input.required<KodRad[]>();
  readonly system = input('Agresso');
}

/* ============================================================
   Sökbar lista ("kod – namn")
   ============================================================ */

export interface SokAlternativ {
  kod: string;
  namn?: string;
}

@Component({
  selector: 'app-ei-sokbar-lista',
  imports: [FormsModule],
  template: `
    <div class="relative">
      <button
        type="button"
        [id]="inputId()"
        (click)="toggla()"
        (keydown.arrowDown)="oppna(); $event.preventDefault()"
        [attr.aria-expanded]="oppen()"
        aria-haspopup="listbox"
        [attr.aria-invalid]="ogiltig() ? true : null"
        [disabled]="!alternativ().length"
        class="flex items-center justify-between gap-2 w-full px-3 py-2 text-sm border bg-surface text-left outline-none focus:border-border-focus focus:shadow-focus"
        [class]="ogiltig() ? 'border-border-error' : 'border-border'">
        @if (valt(); as v) {
          <span class="truncate">
            <span class="font-mono">{{ v.kod }}</span>
            @if (v.namn) { – {{ v.namn }} } @else { <span class="text-text-muted"> · Namn saknas</span> }
          </span>
        } @else if (varde()) {
          <span class="truncate font-mono">{{ varde() }} <span class="font-sans text-text-muted">(kan inte väljas)</span></span>
        } @else {
          <span class="text-text-subtle">{{ alternativ().length ? '– Välj värde –' : 'Inga värden att välja' }}</span>
        }
        <span class="material-symbols-outlined text-[20px] text-text-muted" aria-hidden="true">arrow_drop_down</span>
      </button>

      @if (oppen()) {
        <div class="absolute z-[1060] mt-1 w-full bg-surface border border-border shadow-lg">
          <div class="p-2 border-b border-border-muted">
            <input
              type="text"
              autocomplete="off"
              [ngModel]="sok()"
              (ngModelChange)="sok.set($event); markerad.set(0)"
              (keydown.arrowDown)="flytta(1); $event.preventDefault()"
              (keydown.arrowUp)="flytta(-1); $event.preventDefault()"
              (keydown.enter)="valjMarkerad(); $event.preventDefault()"
              (keydown.escape)="stang(); $event.stopPropagation()"
              placeholder="Sök kod eller namn …"
              [attr.aria-label]="'Sök ' + etikett()"
              [attr.aria-controls]="inputId() + '-lista'"
              class="sok w-full px-2.5 py-1.5 text-sm border border-border bg-surface outline-none focus:border-border-focus" />
          </div>
          <ul [id]="inputId() + '-lista'" role="listbox" [attr.aria-label]="etikett()" class="max-h-64 overflow-y-auto list-none m-0 p-0 py-1">
            @for (a of filtrerade(); track a.kod; let i = $index) {
              <li
                role="option"
                [attr.aria-selected]="a.kod === varde()"
                (mousedown)="valj(a.kod); $event.preventDefault()"
                (mouseenter)="markerad.set(i)"
                class="px-3 py-1.5 text-sm cursor-pointer"
                [class.bg-component-hover]="i === markerad()">
                <span class="font-mono">{{ a.kod }}</span>
                @if (a.namn) { – {{ a.namn }} } @else { <span class="text-text-muted"> · Namn saknas</span> }
              </li>
            } @empty {
              <li class="px-3 py-2 text-sm text-text-muted">Inga träffar.</li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class EiSokbarListaComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly alternativ = input.required<SokAlternativ[]>();
  readonly varde = model('');
  readonly inputId = input.required<string>();
  readonly etikett = input('värde');
  readonly ogiltig = input(false);

  readonly oppen = signal(false);
  readonly sok = signal('');
  readonly markerad = signal(0);

  readonly valt = computed(() => this.alternativ().find((a) => a.kod === this.varde()) ?? null);
  readonly filtrerade = computed(() => {
    const s = this.sok().trim().toLowerCase();
    return this.alternativ().filter(
      (a) => !s || a.kod.toLowerCase().includes(s) || (a.namn ?? '').toLowerCase().includes(s),
    );
  });

  toggla(): void {
    if (this.oppen()) this.stang();
    else this.oppna();
  }

  oppna(): void {
    if (!this.alternativ().length) return;
    this.sok.set('');
    this.markerad.set(0);
    this.oppen.set(true);
    setTimeout(() => (this.el.nativeElement.querySelector('input.sok') as HTMLInputElement | null)?.focus());
  }

  stang(): void {
    this.oppen.set(false);
    (this.el.nativeElement.querySelector('button') as HTMLButtonElement | null)?.focus();
  }

  flytta(steg: number): void {
    const n = this.filtrerade().length;
    if (n) this.markerad.set((this.markerad() + steg + n) % n);
  }

  valjMarkerad(): void {
    const a = this.filtrerade()[this.markerad()];
    if (a) this.valj(a.kod);
  }

  valj(kod: string): void {
    this.varde.set(kod);
    this.stang();
  }

  @HostListener('document:mousedown', ['$event'])
  utanfor(e: MouseEvent): void {
    if (this.oppen() && !this.el.nativeElement.contains(e.target as Node)) this.oppen.set(false);
  }
}

/* ============================================================
   Ram: brödsmulor, rubrik, banners, flikar
   ============================================================ */

export interface Brodsmula {
  text: string;
  lank?: string;
  query?: Record<string, string>;
}
export type EiFlik = 'ekonomisystem' | 'profiler' | 'konteringar';

@Component({
  selector: 'app-ei-ram',
  imports: [RouterLink, ToppmenyComponent, EiDialogComponent, EiNotisComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-surface-subtle font-sans">
      <app-toppmeny aterstallbar (aterstall)="visaAterstall.set(true)" />

      <nav class="flex items-center flex-wrap gap-1 px-6 py-2.5" aria-label="Brödsmulor">
        <a routerLink="/" class="text-[15px] text-interactive hover:underline">Startsida</a>
        @for (b of allaSmulor(); track $index; let sist = $last) {
          <span class="text-[15px] text-text-muted mx-0.5" aria-hidden="true">/</span>
          @if (b.lank && !sist) {
            <a [routerLink]="b.lank" [queryParams]="b.query ?? null" class="text-[15px] text-interactive hover:underline">{{ b.text }}</a>
          } @else {
            <span class="text-[15px] text-text" [attr.aria-current]="sist ? 'page' : null">{{ b.text }}</span>
          }
        }
      </nav>

      <div class="flex-1 px-6 pb-10">
        @if (service.anonymiserat) {
          <div class="mb-3">
            <app-ei-notis>Anonymiserade exempeldata: myndigheter, regioner och vissa koder har fiktiva namn.</app-ei-notis>
          </div>
        }

        <!-- Global spärrbanner (6.8) -->
        @if (service.sparradeProfiler().length; as n) {
          <div class="mb-3">
            <app-ei-notis niva="error">
              Utbetalningar är spärrade för {{ n }} integrationsprofil(er).
              <a [routerLink]="bas + '/integrationsprofiler'" [queryParams]="{ sparrade: 'ja' }" class="font-medium underline hover:no-underline">Visa spärrade integrationsprofiler</a>
            </app-ei-notis>
          </div>
        }

        <!-- Sidhuvud -->
        <div class="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h1 class="text-2xl font-semibold text-text leading-tight">Ekonomisk integration (NY)</h1>
          @if (service.bekraftelse(); as text) {
            <span class="flex items-center gap-1 text-[13px] text-success" role="status">
              <span class="material-symbols-outlined text-[16px]" aria-hidden="true">check_circle</span>
              {{ text }}
            </span>
          }
        </div>

        <!-- Flikar -->
        <nav class="flex items-stretch border-b border-border mb-5" aria-label="Ekonomisk integration (NY)">
          @for (f of flikar; track f.id) {
            <a [routerLink]="f.lank" [attr.aria-current]="flik() === f.id ? 'page' : null"
              class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors outline-none focus-visible:shadow-focus"
              [class]="flik() === f.id
                ? 'text-text border-primary'
                : 'text-text-secondary border-transparent hover:text-text hover:border-border-strong'">
              {{ f.namn }}
            </a>
          }
        </nav>

        <ng-content />
      </div>
    </div>

    @if (visaAterstall()) {
      <app-ei-dialog rubrik="Återställ exempeldata?" roll="alertdialog" (stang)="visaAterstall.set(false)">
        <p class="text-sm text-text">All ändrad data i Ekonomisk integration (NY) ersätts med exempeldatan. Fortsätt?</p>
        <p [class]="k.hjalp">Gäller bara {{ service.anonymiserat ? 'anonymiserade' : 'riktiga' }} exempeldata. Det andra dataläget påverkas inte.</p>
        <button fot type="button" (click)="visaAterstall.set(false)" [class]="k.sekundar">Avbryt</button>
        <button fot type="button" (click)="aterstall()" [class]="k.primar">Återställ</button>
      </app-ei-dialog>
    }
  `,
})
export class EiRamComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly flik = input.required<EiFlik>();
  readonly brodsmulor = input<Brodsmula[]>([]);
  readonly visaAterstall = signal(false);
  readonly bas = EI_BAS;
  readonly k = K;

  readonly flikar: { id: EiFlik; namn: string; lank: string }[] = [
    { id: 'ekonomisystem', namn: 'Ekonomisystem', lank: `${EI_BAS}/ekonomisystem` },
    { id: 'profiler', namn: 'Integrationsprofiler', lank: `${EI_BAS}/integrationsprofiler` },
    { id: 'konteringar', namn: 'Konteringar', lank: `${EI_BAS}/konteringar` },
  ];

  readonly allaSmulor = computed<Brodsmula[]>(() => {
    const f = this.flikar.find((x) => x.id === this.flik())!;
    return [
      { text: 'Ekonomisk integration (NY)', lank: `${EI_BAS}/ekonomisystem` },
      { text: f.namn, lank: f.lank },
      ...this.brodsmulor(),
    ];
  });

  constructor() {
    // Utvecklarfunktion: `await eiKontrolleraAnonymisering()` i konsolen listar förbjudna ord per vy.
    const router = inject(Router);
    (window as unknown as Record<string, unknown>)['eiKontrolleraAnonymisering'] = () =>
      kontrolleraAnonymisering(router, this.service);
  }

  aterstall(): void {
    this.service.aterstallExempeldata();
    this.visaAterstall.set(false);
  }
}

/* ============================================================
   Gemensamma klasser (Kompass-stil som i övriga prototypen)
   ============================================================ */

export const K = {
  primar:
    'inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-primary text-on-primary hover:bg-primary-hover transition-colors cursor-pointer',
  sekundar:
    'inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-border bg-surface text-text-secondary hover:bg-component-hover transition-colors cursor-pointer',
  sekundarLiten:
    'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border bg-surface text-text-secondary hover:bg-component-hover transition-colors cursor-pointer',
  fara: 'inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-error text-on-error hover:bg-error-hover transition-colors cursor-pointer',
  ikon: 'p-1.5 rounded-full text-interactive hover:bg-component-hover disabled:bg-transparent disabled:text-text-disabled',
  etikett: 'block text-sm font-medium text-text mb-1.5',
  falt: 'w-full px-3 py-2 text-sm text-text border border-border bg-surface outline-none focus:border-border-focus focus:shadow-focus',
  hjalp: 'text-[13px] text-text-muted mt-1',
  fel: 'flex items-center gap-1 mt-1.5 text-[13px] text-error',
  th: 'px-4 py-2.5 font-semibold text-text text-left',
  status: 'inline-block px-2 py-0.5 text-xs font-medium rounded-sm whitespace-nowrap',
  chipLiten: 'inline-block px-1 py-px text-[11px] font-medium rounded-sm',
  chip: 'inline-block px-1.5 py-px font-mono text-[12px] rounded-sm bg-surface-neutral text-on-surface-neutral border border-border',
  lank: 'text-interactive hover:underline',
};
