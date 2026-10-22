import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import {
  EI_BAS,
  EiDialogComponent,
  EiKodstrangComponent,
  EiNotisComponent,
  K,
} from './ei-delade';
import { FLODE_NAMN, FLODE_ORDNING, Flow, idag } from './ei-modell';
import { EkonomiskIntegrationService, Uppslagsresultat } from './ei.service';

/** Testa uppslag (7.5) – hur systemet hittar konteringen vid en utbetalning. */
@Component({
  selector: 'app-ei-testa-uppslag',
  imports: [FormsModule, RouterLink, DatumValjareComponent, EiDialogComponent, EiKodstrangComponent, EiNotisComponent],
  template: `
    <app-ei-dialog variant="panel" rubrik="Testa uppslag" (stang)="stang.emit()">
      <p class="text-sm text-text-secondary">
        Vid en utbetalning letar systemet upp den aktiva konteringen med ärendets finansieringsmedel, beslutande organisation och flöde.
        Den version som gäller på utbetalningsdagen används.

      </p>
      <form (ngSubmit)="testa()" class="space-y-4">
        <div>
          <label for="ei-u-fm" [class]="k.etikett">Finansieringsmedel</label>
          <select id="ei-u-fm" name="fm" [ngModel]="fm()" (ngModelChange)="fm.set($event); resultat.set(null)" [class]="k.falt">
            <option value="">– Välj finansieringsmedel –</option>
            @for (f of service.finansieringsmedel(); track f.id) { <option [value]="f.id">{{ f.shortName }}</option> }
          </select>
        </div>
        <div>
          <label for="ei-u-beslut" [class]="k.etikett">Beslutande organisation</label>
          <select id="ei-u-beslut" name="beslut" [ngModel]="beslut()" (ngModelChange)="beslut.set($event); resultat.set(null)" [class]="k.falt">
            <option value="">– Välj beslutande organisation –</option>
            @for (b of service.beslutandeOrganisationer(); track b.id) { <option [value]="b.id">{{ b.name }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <fieldset>
            <legend [class]="k.etikett">Flöde</legend>
            <div class="flex items-center gap-4 h-[38px]">
              @for (f of floden; track f) {
                <label class="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="ei-u-flode" class="w-4 h-4 accent-primary" [checked]="flode() === f" (change)="flode.set(f); resultat.set(null)" />
                  {{ flodeNamn[f] }}
                </label>
              }
            </div>
          </fieldset>
          <div>
            <label for="ei-u-datum" [class]="k.etikett">Datum</label>
            <app-datum-valjare inputId="ei-u-datum" etikett="Datum" [varde]="datum()" (vardeChange)="datum.set($event); resultat.set(null)" />
          </div>
        </div>
        <button type="submit" [class]="k.primar + ' disabled:opacity-50'" [disabled]="!kanTesta()">
          <span class="material-symbols-outlined text-[18px]" aria-hidden="true">search</span>Testa
        </button>
      </form>

      @if (resultat(); as r) {
        <section class="space-y-3 pt-2 border-t border-border-muted" aria-live="polite">
          <h3 class="text-sm font-semibold">Resultat</h3>
          @if (r.fel) {
            <app-ei-notis niva="error">{{ r.fel }}</app-ei-notis>
            @if (r.traffar.length > 1) {
              <ul class="list-disc pl-5 text-sm">
                @for (t of r.traffar; track t.id) {
                  <li><a [routerLink]="bas + '/konteringar/' + t.id" [class]="k.lank" (click)="stang.emit()">{{ service.konteringNamn(t) }}</a></li>
                }
              </ul>
            }
          } @else if (r.kontering && r.version) {
            <dl class="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt class="text-text-muted">Kontering</dt>
              <dd><a [routerLink]="bas + '/konteringar/' + r.kontering.id" [class]="k.lank" (click)="stang.emit()">{{ service.konteringNamn(r.kontering) }}</a></dd>
              <dt class="text-text-muted">Version</dt>
              <dd>Giltig från {{ r.version.validFrom }}</dd>
              <dt class="text-text-muted">Integrationsprofil</dt>
              <dd>
                @if (r.profil) {
                  <a [routerLink]="bas + '/integrationsprofiler/' + r.profil.id" [class]="k.lank" (click)="stang.emit()">{{ r.profil.name }}</a>
                }
              </dd>
            </dl>
            @for (v of r.varningar; track v) {
              <app-ei-notis niva="warning">{{ v }}</app-ei-notis>
            }
            <app-ei-kodstrang [rader]="r.rader" [system]="service.systemNamn(r.profil)" />
          }
          <app-ei-notis>Öppen fråga: det är inte klarlagt vad som händer i dagens system när ingen kontering hittas.</app-ei-notis>
        </section>
      }

      <button fot type="button" (click)="stang.emit()" [class]="k.sekundar">Stäng</button>
    </app-ei-dialog>
  `,
})
export class EiTestaUppslagComponent {
  readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly bas = EI_BAS;
  readonly floden = FLODE_ORDNING;
  readonly flodeNamn = FLODE_NAMN;

  /** Förifylld nyckel, t.ex. från en kontering. */
  readonly start = input<{ fundingSourceId: string; decidingOrganisationId: string; flow: Flow } | null>(null);
  readonly stang = output<void>();

  readonly fm = signal('');
  readonly beslut = signal('');
  readonly flode = signal<Flow>('UTB');
  readonly datum = signal(idag());
  readonly resultat = signal<Uppslagsresultat | null>(null);

  readonly kanTesta = computed(() => !!this.fm() && !!this.beslut() && !!this.datum());

  ngOnInit(): void {
    const s = this.start();
    if (s) {
      this.fm.set(s.fundingSourceId);
      this.beslut.set(s.decidingOrganisationId);
      this.flode.set(s.flow);
    }
  }

  testa(): void {
    if (!this.kanTesta()) return;
    this.resultat.set(this.service.testaUppslag(this.fm(), this.beslut(), this.flode(), this.datum()));
  }
}
