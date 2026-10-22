import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataLage, bytDataLage, lasDataLage } from './datalage';

@Component({
  selector: 'app-toppmeny',
  imports: [RouterLink],
  template: `
    <header class="flex items-center bg-neutral-1000 text-white shrink-0 h-12">
      <a routerLink="/" class="flex items-center gap-3 px-4 h-full border-r border-white/10 hover:bg-white/10">
        <svg viewBox="0 0 32 32" class="w-7 h-7 shrink-0">
          <rect x="2" y="10" width="12" height="12" fill="#34A1F4"/>
          <rect x="14" y="10" width="12" height="12" fill="#004376"/>
          <rect x="8" y="18" width="12" height="12" fill="#0065B0"/>
        </svg>
        <span class="text-[15px] font-semibold whitespace-nowrap">NYPS Admin</span>
      </a>
      <nav class="flex items-stretch h-full flex-1">
        <a routerLink="/" class="flex items-center gap-1 px-5 h-full text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
          Administrationsområden
          <span class="material-symbols-outlined text-[20px]">arrow_drop_down</span>
        </a>
      </nav>

      <!-- Dataläge (avsnitt 11.2) -->
      <div class="group relative flex items-center gap-2 px-4 h-full border-l border-white/10">
        @if (lage === 'anonymiserade') {
          <span class="px-1.5 py-px text-[11px] font-semibold rounded-sm bg-orange-300 text-neutral-1000 whitespace-nowrap">Anonymiserad</span>
        }
        <span id="datalage-etikett" class="text-[13px] text-gray-300 whitespace-nowrap">Exempeldata:</span>
        <div class="flex border border-white/30" role="group" aria-labelledby="datalage-etikett" aria-describedby="datalage-tips">
          @for (l of lagen; track l.id) {
            <button type="button" (click)="byt(l.id)" [attr.aria-pressed]="lage === l.id"
              class="px-2.5 py-1 text-[13px] whitespace-nowrap outline-none focus-visible:shadow-focus"
              [class]="lage === l.id ? 'bg-white text-neutral-1000 font-medium' : 'text-gray-300 hover:bg-white/10'">
              {{ l.namn }}
            </button>
          }
        </div>
        <span id="datalage-tips" role="tooltip"
          class="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute z-[1070] top-full right-2 mt-1 w-64 px-3 py-2 text-[13px] leading-snug text-text-inverse bg-surface-inverse shadow-lg">
          Ändringar sparas separat för varje dataläge.
        </span>
      </div>

      <a class="flex items-center gap-1.5 px-5 h-full text-sm text-gray-300 hover:bg-white/10 cursor-pointer border-l border-white/10">
        <span class="material-symbols-outlined text-[20px]">person</span>
        Demo Demon
        <span class="material-symbols-outlined text-[20px]">arrow_drop_down</span>
      </a>
    </header>
  `,
})
export class ToppmenyComponent {
  readonly lage = lasDataLage();
  readonly lagen: { id: DataLage; namn: string }[] = [
    { id: 'riktiga', namn: 'Riktiga' },
    { id: 'anonymiserade', namn: 'Anonymiserade' },
  ];

  byt(lage: DataLage): void {
    bytDataLage(lage);
  }
}
