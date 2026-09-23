import { Component, ElementRef, HostListener, computed, inject, input, model, signal } from '@angular/core';

const VECKODAGAR = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
const MANADER = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

function pad2(tal: number): string {
  return String(tal).padStart(2, '0');
}

/**
 * Egen datumväljare med veckostart på måndag (Kompass).
 * Värdet är en yyyy-MM-dd-sträng eller tom sträng.
 */
@Component({
  selector: 'app-datum-valjare',
  template: `
    <div class="relative">
      <button
        type="button"
        (click)="toggla()"
        [attr.id]="inputId() || null"
        [attr.aria-label]="etikett() || null"
        [attr.aria-expanded]="oppen()"
        aria-haspopup="dialog"
        class="flex items-center justify-between gap-2 w-full px-2.5 py-2 text-sm border border-border bg-surface text-left outline-none focus:border-border-focus focus:shadow-focus">
        <span [class.text-text]="varde()" [class.text-text-subtle]="!varde()">{{ varde() || placeholder() }}</span>
        <span class="material-symbols-outlined text-[18px] text-text-muted">calendar_month</span>
      </button>

      @if (oppen()) {
        <div class="absolute z-[1070] mt-1 w-66 bg-surface border border-border shadow-lg p-3" role="dialog" aria-label="Datumväljare">
          <div class="flex items-center justify-between mb-2">
            <button type="button" (click)="bytManad(-1)" aria-label="Föregående månad" class="p-1 rounded-full text-interactive hover:bg-component-hover">
              <span class="material-symbols-outlined text-[18px] align-middle">chevron_left</span>
            </button>
            <span class="text-sm font-semibold text-text" aria-live="polite">{{ manadsrubrik() }}</span>
            <button type="button" (click)="bytManad(1)" aria-label="Nästa månad" class="p-1 rounded-full text-interactive hover:bg-component-hover">
              <span class="material-symbols-outlined text-[18px] align-middle">chevron_right</span>
            </button>
          </div>

          <div class="grid grid-cols-7 mb-1">
            @for (veckodag of veckodagar; track veckodag) {
              <span class="text-center text-[11px] font-semibold text-text-muted py-1">{{ veckodag }}</span>
            }
          </div>

          <div class="grid grid-cols-7 gap-y-0.5">
            @for (cell of dagceller(); track $index) {
              @if (cell === null) {
                <span></span>
              } @else {
                <button
                  type="button"
                  (click)="valj(cell)"
                  [attr.aria-label]="'Välj ' + datumFor(cell)"
                  class="w-8 h-8 mx-auto flex items-center justify-center text-sm rounded-full"
                  [class.bg-primary]="datumFor(cell) === varde()"
                  [class.text-on-primary]="datumFor(cell) === varde()"
                  [class.border]="datumFor(cell) === idag && datumFor(cell) !== varde()"
                  [class.border-primary]="datumFor(cell) === idag && datumFor(cell) !== varde()"
                  [class.text-primary]="datumFor(cell) === idag && datumFor(cell) !== varde()"
                  [class.text-text]="datumFor(cell) !== varde() && datumFor(cell) !== idag"
                  [class.hover:bg-component-hover]="datumFor(cell) !== varde()">
                  {{ cell }}
                </button>
              }
            }
          </div>

          <div class="flex items-center justify-between mt-2 pt-2 border-t border-border-muted">
            <button type="button" (click)="valjIdag()" class="text-[13px] text-interactive underline hover:text-interactive-hover">Idag</button>
            <button type="button" (click)="rensa()" class="text-[13px] text-interactive underline hover:text-interactive-hover">Rensa</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class DatumValjareComponent {
  private readonly elementRef = inject(ElementRef);

  readonly varde = model('');
  readonly placeholder = input('åååå-mm-dd');
  readonly inputId = input('');
  readonly etikett = input('');

  readonly oppen = signal(false);
  readonly visadAr = signal(new Date().getFullYear());
  readonly visadManad = signal(new Date().getMonth() + 1); // 1–12

  readonly veckodagar = VECKODAGAR;
  readonly idag = `${new Date().getFullYear()}-${pad2(new Date().getMonth() + 1)}-${pad2(new Date().getDate())}`;

  readonly manadsrubrik = computed(() => `${MANADER[this.visadManad() - 1]} ${this.visadAr()}`);

  /** Kalenderns celler: tomma platser före den 1:a (måndagsindexerat) följt av månadens dagar. */
  readonly dagceller = computed<(number | null)[]>(() => {
    const forsta = new Date(this.visadAr(), this.visadManad() - 1, 1);
    const offset = (forsta.getDay() + 6) % 7;
    const antalDagar = new Date(this.visadAr(), this.visadManad(), 0).getDate();
    return [
      ...Array.from({ length: offset }, () => null),
      ...Array.from({ length: antalDagar }, (_, i) => i + 1),
    ];
  });

  @HostListener('document:click', ['$event'])
  stangVidKlickUtanfor(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.oppen.set(false);
    }
  }

  toggla(): void {
    if (!this.oppen()) {
      const [ar, manad] = (this.varde() || this.idag).split('-').map(Number);
      this.visadAr.set(ar);
      this.visadManad.set(manad);
    }
    this.oppen.update((o) => !o);
  }

  bytManad(riktning: number): void {
    const datum = new Date(this.visadAr(), this.visadManad() - 1 + riktning, 1);
    this.visadAr.set(datum.getFullYear());
    this.visadManad.set(datum.getMonth() + 1);
  }

  datumFor(dag: number): string {
    return `${this.visadAr()}-${pad2(this.visadManad())}-${pad2(dag)}`;
  }

  valj(dag: number): void {
    this.varde.set(this.datumFor(dag));
    this.oppen.set(false);
  }

  valjIdag(): void {
    this.varde.set(this.idag);
    this.oppen.set(false);
  }

  rensa(): void {
    this.varde.set('');
    this.oppen.set(false);
  }
}
