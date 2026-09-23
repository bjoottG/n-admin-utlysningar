import { Component } from '@angular/core';

@Component({
  selector: 'app-toppmeny',
  template: `
    <header class="flex items-center bg-neutral-1000 text-white shrink-0 h-12">
      <div class="flex items-center gap-3 px-4 h-full border-r border-white/10">
        <svg viewBox="0 0 32 32" class="w-7 h-7 shrink-0">
          <rect x="2" y="10" width="12" height="12" fill="#34A1F4"/>
          <rect x="14" y="10" width="12" height="12" fill="#004376"/>
          <rect x="8" y="18" width="12" height="12" fill="#0065B0"/>
        </svg>
        <span class="text-[15px] font-semibold whitespace-nowrap">NYPS Admin</span>
      </div>
      <nav class="flex items-stretch h-full flex-1">
        <a class="flex items-center gap-1 px-5 h-full text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
          Administrationsområden
          <span class="material-symbols-outlined text-[20px]">arrow_drop_down</span>
        </a>
      </nav>
      <a class="flex items-center gap-1.5 px-5 h-full text-sm text-gray-300 hover:bg-white/10 cursor-pointer">
        <span class="material-symbols-outlined text-[20px]">person</span>
        Demo Demon
        <span class="material-symbols-outlined text-[20px]">arrow_drop_down</span>
      </a>
    </header>
  `,
})
export class ToppmenyComponent {}
