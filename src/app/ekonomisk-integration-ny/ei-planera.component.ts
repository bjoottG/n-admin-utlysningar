import { Component, computed, inject, input, output, signal } from '@angular/core';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { EiDialogComponent, EiNotisComponent, K } from './ei-delade';
import { IntegrationProfile, idag, plusDagar } from './ei-modell';
import { EkonomiskIntegrationService } from './ei.service';

export interface Aktivering {
  datum: string;
  avslutaId: string | null;
}

/**
 * Planera aktivering… / Aktivera nu (6.2 steg 5, 6.3, 6.10).
 * Status blir Planerad, eller Aktiv om datumet är idag eller tidigare.
 * Har organisationen redan en aktiv profil föreslås den avslutas dagen före. Överlapp blockeras (P9), liksom
 * ekonomisystem utan integration (P13).
 */
@Component({
  selector: 'app-ei-planera',
  imports: [EiDialogComponent, EiNotisComponent, DatumValjareComponent],
  template: `
    <app-ei-dialog [rubrik]="rubrik()" (stang)="stang.emit()">
      @if (!bekrafta()) {
        @if (valjDatum()) {
          <div>
            <label for="ei-planera-datum" [class]="k.etikett">Giltig från</label>
            <app-datum-valjare inputId="ei-planera-datum" etikett="Giltig från" [(varde)]="datum" />
            <p [class]="k.hjalp">Är datumet idag eller tidigare blir profilen Aktiv direkt, annars Planerad.</p>
          </div>
        } @else {
          <p class="text-sm text-text">{{ profil().name }} aktiveras med giltig från {{ datum() }}.</p>
        }
        @if (fel().length) {
          <ul class="space-y-1 list-none m-0 p-0" role="alert">
            @for (f of fel(); track $index) {
              <li [class]="k.fel"><span class="material-symbols-outlined text-[16px]">error</span>{{ f }}</li>
            }
          </ul>
        }
      } @else {
        <p class="text-sm text-text">
          {{ bekrafta()!.name }} avslutas {{ avslutasDatum() }}. Fortsätt?
        </p>
        <p [class]="k.hjalp">Högst en aktiv integrationsprofil per organisation och dag.</p>
        <app-ei-notis>
          Verifikatnummer räknas per integrationsprofil och år. Kontrollera med utvecklarna att nummerserien inte krockar om bytet sker mitt i ett år.
        </app-ei-notis>
      }
      <button fot type="button" (click)="stang.emit()" [class]="k.sekundar">Avbryt</button>
      @if (!bekrafta()) {
        <button fot type="button" (click)="fortsatt()" [class]="k.primar" [disabled]="!datum()">
          {{ valjDatum() ? 'Planera' : 'Aktivera' }}
        </button>
      } @else {
        <button fot type="button" (click)="klar.emit({ datum: datum(), avslutaId: bekrafta()!.id })" [class]="k.primar">Fortsätt</button>
      }
    </app-ei-dialog>
  `,
})
export class EiPlaneraComponent {
  private readonly service = inject(EkonomiskIntegrationService);
  readonly k = K;
  readonly profil = input.required<IntegrationProfile>();
  /** false = "Aktivera nu" (dagens datum, ingen datumväljare). */
  readonly valjDatum = input(true);
  readonly rubrik = input('Planera aktivering');
  readonly klar = output<Aktivering>();
  readonly stang = output<void>();

  readonly datum = signal(idag());
  readonly fel = signal<string[]>([]);
  readonly bekrafta = signal<IntegrationProfile | null>(null);
  readonly avslutasDatum = computed(() => plusDagar(this.datum(), -1));

  ngOnInit(): void {
    const p = this.profil();
    if (this.valjDatum() && p.validFrom > idag()) this.datum.set(p.validFrom);
  }

  fortsatt(): void {
    const { fel, avsluta } = this.service.kontrolleraAktivering(this.profil(), this.datum());
    this.fel.set(fel);
    if (fel.length) return;
    if (avsluta) this.bekrafta.set(avsluta);
    else this.klar.emit({ datum: this.datum(), avslutaId: null });
  }
}
