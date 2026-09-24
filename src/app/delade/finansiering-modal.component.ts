import { Component, HostListener, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Finansiering, FinansieringService } from '../finansiering/finansiering.service';

/**
 * Modal för att välja finansiering till en utlysning (Utlysningar (NY)):
 * sökbar tabell över finansieringarna från administrationsområdet Finansiering.
 */
@Component({
  selector: 'app-finansiering-modal',
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-[1040] bg-black/40" (click)="stang.emit()" aria-hidden="true"></div>

    <div class="fixed inset-0 z-[1050] flex items-center justify-center p-6 pointer-events-none">
      <div
        class="pointer-events-auto w-full max-w-[900px] max-h-[85vh] flex flex-col bg-surface border border-border shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Lägg till finansiering">

        <div class="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-muted">
          <div>
            <h2 class="text-lg font-semibold text-text">Lägg till finansiering</h2>
            <p class="text-[13px] text-text-muted mt-0.5">Kryssa i de finansieringar som ska gälla för utlysningen. Listan hämtas från administrationsområdet Finansiering.</p>
          </div>
          <button type="button" (click)="stang.emit()" aria-label="Stäng"
            class="p-1.5 rounded-full text-text-muted hover:text-text hover:bg-component-hover">
            <span class="material-symbols-outlined text-[20px] align-middle">close</span>
          </button>
        </div>

        <div class="px-6 py-3 border-b border-border-muted">
          <div class="relative max-w-[400px]">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[20px] text-text-muted pointer-events-none">search</span>
            <input type="text" placeholder="Sök finansiering, källa eller organisation …" autocomplete="off" aria-label="Sök finansiering"
              [ngModel]="sok()" (ngModelChange)="sok.set($event)"
              class="w-full pl-9 pr-3 py-2 text-sm text-text border border-border bg-surface placeholder:text-text-subtle outline-none focus:border-border-focus focus:shadow-focus" />
          </div>
        </div>

        <div class="flex-1 overflow-y-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left">
                <th scope="col" class="pl-6 pr-2 py-2.5 w-12"><span class="sr-only">Välj</span></th>
                <th scope="col" class="px-4 py-2.5 font-semibold text-text">Finansiering</th>
                <th scope="col" class="px-4 py-2.5 font-semibold text-text">Finansiell källa</th>
                <th scope="col" class="px-4 py-2.5 font-semibold text-text whitespace-nowrap">Utbetalande</th>
                <th scope="col" class="px-4 py-2.5 font-semibold text-text whitespace-nowrap">Beslutande</th>
                <th scope="col" class="px-4 py-2.5 font-semibold text-text">Status</th>
              </tr>
            </thead>
            <tbody>
              @for (fin of filtrerade(); track fin.id) {
                <tr (click)="toggle(fin)" class="border-b border-border-muted cursor-pointer"
                  [class]="arVald(fin) ? 'bg-component-selected' : 'odd:bg-surface-subtle hover:bg-component-hover'">
                  <td class="pl-6 pr-2 py-2.5">
                    <input type="checkbox" [attr.aria-label]="'Välj ' + fin.namn" [checked]="arVald(fin)"
                      (click)="$event.stopPropagation()" (change)="toggle(fin)" class="w-4 h-4 accent-primary align-middle" />
                  </td>
                  <td class="px-4 py-2.5">
                    <p class="font-medium text-text">{{ fin.namn }}</p>
                    @if (fin.beskrivning) { <p class="text-xs text-text-muted mt-0.5 line-clamp-1">{{ fin.beskrivning }}</p> }
                  </td>
                  <td class="px-4 py-2.5 text-text">{{ service.hamtaKalla(fin.finansiellKallaId)?.namn || '–' }}</td>
                  <td class="px-4 py-2.5 text-text">{{ fin.utbetalandeOrganisation || '–' }}</td>
                  <td class="px-4 py-2.5 text-text">{{ fin.beslutandeOrganisation || '–' }}</td>
                  <td class="px-4 py-2.5">
                    <span class="inline-block px-2 py-0.5 text-xs font-medium rounded-sm whitespace-nowrap"
                      [class]="fin.status === 'Aktiv' ? 'bg-surface-success text-on-surface-success border border-border-success' : 'bg-surface-neutral text-on-surface-neutral border border-border'">{{ fin.status }}</span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-10 text-center text-sm text-text-muted">Inga finansieringar matchar ”{{ sok() }}”.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-muted">
          <p class="text-sm text-text-secondary">
            <span class="font-semibold text-text">{{ lokaltValda().length }}</span> valda
            @if (kravMinstEtt() && lokaltValda().length === 0) {
              <span class="text-error"> – minst en finansiering krävs</span>
            }
          </p>
          <div class="flex items-center gap-2">
            <button type="button" (click)="stang.emit()"
              class="px-4 py-2 text-sm border border-border text-text-secondary hover:bg-component-hover transition-colors">Avbryt</button>
            <button type="button" (click)="sparaVal()" [disabled]="!kanSpara()"
              class="px-4 py-2 text-sm bg-primary text-on-primary hover:bg-primary-hover transition-colors">Spara val</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FinansieringModalComponent implements OnInit {
  readonly service = inject(FinansieringService);

  readonly valda = input<number[]>([]);
  readonly kravMinstEtt = input(false);
  readonly stang = output<void>();
  readonly bekrafta = output<number[]>();

  readonly sok = signal('');
  readonly lokaltValda = signal<number[]>([]);

  ngOnInit(): void {
    this.lokaltValda.set([...this.valda()]);
  }

  /** Aktiva finansieringar, plus inaktiva som redan är valda på utlysningen. */
  readonly filtrerade = computed(() => {
    const sok = this.sok().trim().toLowerCase();
    return this.service
      .finansieringar()
      .filter((f) => f.status === 'Aktiv' || this.lokaltValda().includes(f.id))
      .filter((f) => {
        if (!sok) return true;
        const kalla = this.service.hamtaKalla(f.finansiellKallaId)?.namn ?? '';
        return [f.namn, f.beskrivning, kalla, f.utbetalandeOrganisation, f.beslutandeOrganisation].some((v) =>
          v.toLowerCase().includes(sok),
        );
      });
  });

  readonly kanSpara = computed(() => !this.kravMinstEtt() || this.lokaltValda().length > 0);

  @HostListener('document:keydown.escape')
  stangMedEscape(): void {
    this.stang.emit();
  }

  arVald(fin: Finansiering): boolean {
    return this.lokaltValda().includes(fin.id);
  }

  toggle(fin: Finansiering): void {
    this.lokaltValda.update((v) => (v.includes(fin.id) ? v.filter((id) => id !== fin.id) : [...v, fin.id]));
  }

  sparaVal(): void {
    if (!this.kanSpara()) return;
    this.bekrafta.emit(this.lokaltValda());
  }
}
