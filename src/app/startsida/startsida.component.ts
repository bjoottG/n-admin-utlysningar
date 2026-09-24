import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToppmenyComponent } from '../delade/toppmeny.component';

interface Omrade {
  titel: string;
  beskrivning: string;
  /** Route i prototypen. Saknas → området är ännu inte utbyggt. */
  lank?: string;
}

const OMRADEN: Omrade[] = [
  {
    titel: 'Finansieringsmedel',
    beskrivning:
      'Här hanteras finansieringsmedlen som läggs till under respektive utlysning och i den ekonomiska integrationen.',
  },
  {
    titel: 'Finansiering',
    beskrivning:
      'Här hanteras finansieringar samt de finansiella källor och konteringar som finansieringarna kopplas till.',
    lank: '/finansiering',
  },
  {
    titel: 'Ekonomisk integration',
    beskrivning:
      'Här hanteras den ekonomiska integrationen för finansieringsmedel mellan Nyps och ekonomisystemet.',
  },
  {
    titel: 'Utlysningar',
    beskrivning: 'Här hanteras utlysningar för de olika organisationerna.',
    lank: '/utlysningar',
  },
  {
    titel: 'Utlysningar (NY)',
    beskrivning:
      'Ny version av utlysningslistan där finansieringsmedel ersatts av Finansiering. Utlysningar kan läggas till, redigeras och tas bort.',
    lank: '/utlysningar-ny',
  },
  {
    titel: 'Informationstexter',
    beskrivning:
      'Här hanteras informationstexter som presenteras i Min ansökan, på organisationsnivå, stödform eller utlysning.',
  },
  {
    titel: 'Systemmeddelanden',
    beskrivning:
      'Här hanteras interna namn för de olika organisationerna. Namnen kan användas för gruppering av utlysningar och uppföljning i Diver.',
  },
  {
    titel: 'Interna namn',
    beskrivning:
      'Här hanteras interna namn för de olika organisationerna. Namnen kan användas för gruppering av utlysningar och uppföljning i Diver.',
  },
  {
    titel: 'Diarieföringssystem',
    beskrivning: 'Här hanteras system som används för diarieföring av utlysningar.',
  },
];

@Component({
  selector: 'app-startsida',
  imports: [RouterLink, ToppmenyComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-surface font-sans">
      <app-toppmeny />

      <main class="flex-1 w-full max-w-[1040px] mx-auto px-6 pt-6 pb-12">
        <h1 class="text-3xl font-semibold text-text leading-tight">Administrationsområden</h1>
        <p class="text-sm text-text-secondary mt-2">
          Här kan du gå vidare till de områden som kan administreras med hjälp av Nyps Admin
        </p>

        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6 list-none p-0 m-0">
          @for (omrade of omraden; track omrade.titel) {
            <li class="flex">
              @if (omrade.lank) {
                <a
                  [routerLink]="omrade.lank"
                  class="group flex flex-col w-full min-h-[148px] p-4 bg-surface border border-border hover:border-border-strong hover:shadow-sm transition-[border-color,box-shadow] focus:outline-none focus-visible:border-border-focus focus-visible:shadow-focus">
                  <h2 class="text-lg font-semibold text-text leading-snug">{{ omrade.titel }}</h2>
                  <p class="text-sm text-text-secondary leading-normal mt-1.5">{{ omrade.beskrivning }}</p>
                  <span class="mt-auto pt-3 self-end flex items-center text-interactive" aria-hidden="true">
                    <span class="material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
                  </span>
                </a>
              } @else {
                <div
                  class="flex flex-col w-full min-h-[148px] p-4 bg-surface border border-border"
                  title="Ingår inte i prototypen">
                  <h2 class="text-lg font-semibold text-text leading-snug">{{ omrade.titel }}</h2>
                  <p class="text-sm text-text-secondary leading-normal mt-1.5">{{ omrade.beskrivning }}</p>
                  <span class="mt-auto pt-3 self-end flex items-center text-interactive" aria-hidden="true">
                    <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </span>
                </div>
              }
            </li>
          }
        </ul>
      </main>
    </div>
  `,
})
export class StartsidaComponent {
  readonly omraden = OMRADEN;
}
