import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, CanActivateFn, Router } from '@angular/router';

const LOSENORD = 'demo456';
const NYCKEL = 'nypsAdminUpplast';

export function arUpplast(): boolean {
  try {
    return sessionStorage.getItem(NYCKEL) === 'ja';
  } catch {
    return false;
  }
}

/** Skyddar prototypens vyer: utan upplåsning skickas man till lössenordssidan. */
export const lasGuard: CanActivateFn = (_route, state) => {
  if (arUpplast()) return true;
  const router = inject(Router);
  return router.createUrlTree(['/las'], { queryParams: { mal: state.url } });
};

@Component({
  selector: 'app-las',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-surface-subtle font-sans px-6">
      <div class="w-full max-w-[400px] bg-surface border border-border px-8 py-10">
        <div class="flex items-center justify-center gap-3 mb-6">
          <svg viewBox="0 0 32 32" class="w-9 h-9 shrink-0">
            <rect x="2" y="10" width="12" height="12" fill="#34A1F4"/>
            <rect x="14" y="10" width="12" height="12" fill="#004376"/>
            <rect x="8" y="18" width="12" height="12" fill="#0065B0"/>
          </svg>
          <span class="text-xl font-semibold text-text">NYPS Admin</span>
        </div>

        <h1 class="text-lg font-semibold text-text text-center">Prototyp</h1>
        <p class="text-sm text-text-secondary text-center mt-1 mb-6">
          Ange lösenordet för att öppna prototypen.
        </p>

        <form (ngSubmit)="lasUpp()">
          <label for="losenord" class="block text-sm font-medium text-text mb-1.5">Lösenord</label>
          <input
            id="losenord"
            type="password"
            autocomplete="off"
            [ngModel]="losenord()"
            (ngModelChange)="losenord.set($event); fel.set(false)"
            name="losenord"
            class="w-full px-3 py-2 text-sm text-text border border-border bg-surface outline-none focus:border-border-focus focus:shadow-focus" />
          @if (fel()) {
            <p class="flex items-center gap-1 mt-1.5 text-[13px] text-error">
              <span class="material-symbols-outlined text-[16px]">error</span>
              Fel lösenord. Försök igen.
            </p>
          }
          <button
            type="submit"
            class="flex items-center justify-center gap-1.5 w-full mt-4 px-4 py-2.5 text-sm bg-primary text-on-primary hover:bg-primary-hover transition-colors">
            <span class="material-symbols-outlined text-[18px]">lock_open</span>
            Öppna prototypen
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LasComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly losenord = signal('');
  readonly fel = signal(false);

  lasUpp(): void {
    if (this.losenord() !== LOSENORD) {
      this.fel.set(true);
      return;
    }
    try {
      sessionStorage.setItem(NYCKEL, 'ja');
    } catch {
      // sessionStorage kan vara blockerad – släpp igenom ändå under sidvisningen
    }
    const mal = this.route.snapshot.queryParamMap.get('mal') || '/';
    this.router.navigateByUrl(mal);
  }
}
