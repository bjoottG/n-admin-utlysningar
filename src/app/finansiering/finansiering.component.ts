import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToppmenyComponent } from '../delade/toppmeny.component';
import {
  ANSLAG,
  ANSLAGSPOSTER,
  Finansiering,
  FinansiellKalla,
  FinansieringService,
  Kodvarde,
  Kontering,
  Status,
  anslagFor,
  anslagsposterFor,
  jamforKod,
  kodvardeEtikett,
  konteringEtikett,
  organisationEtikett,
  utgiftsomradeEtikett,
  utgiftsomradeKod,
  utgiftsomradeNyckel,
} from './finansiering.service';

export type Flik = 'finansiering' | 'kalla' | 'kontering';

const FLIKAR: { id: Flik; namn: string }[] = [
  { id: 'finansiering', namn: 'Finansiering' },
  { id: 'kalla', namn: 'Finansiell källa' },
  { id: 'kontering', namn: 'Kontering' },
];

type FinansieringForm = Omit<Finansiering, 'id'> & { id: number | null };
type KallaForm = Omit<FinansiellKalla, 'id'> & { id: number | null };
type KonteringForm = Omit<Kontering, 'id'> & { id: number | null };

@Component({
  selector: 'app-finansiering',
  imports: [FormsModule, RouterLink, ToppmenyComponent],
  templateUrl: './finansiering.component.html',
})
export class FinansieringComponent {
  readonly service = inject(FinansieringService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly flikar = FLIKAR;
  readonly organisationer = this.service.organisationer;
  readonly utgiftsomraden = this.service.utgiftsomraden;

  readonly flik = signal<Flik>(this.lasFlikFranUrl());
  readonly sok = signal('');

  // Formulär – högst ett är öppet åt gången
  readonly finForm = signal<FinansieringForm | null>(null);
  readonly kallaForm = signal<KallaForm | null>(null);
  readonly kontForm = signal<KonteringForm | null>(null);
  readonly forsokSpara = signal(false);

  /* ---------- Flikar ---------- */

  private lasFlikFranUrl(): Flik {
    const v = this.route.snapshot.queryParamMap.get('flik');
    return FLIKAR.some((f) => f.id === v) ? (v as Flik) : 'finansiering';
  }

  valjFlik(flik: Flik): void {
    this.flik.set(flik);
    this.sok.set('');
    this.stangDialog();
    this.router.navigate([], { queryParams: { flik }, replaceUrl: true });
  }

  readonly aktivFlikNamn = computed(() => FLIKAR.find((f) => f.id === this.flik())?.namn ?? '');

  /* ---------- Listor (filtrerade på sök) ---------- */

  private matchar(falt: string[]): boolean {
    const s = this.sok().trim().toLowerCase();
    return !s || falt.some((f) => f.toLowerCase().includes(s));
  }

  readonly finansieringar = computed(() =>
    this.service
      .finansieringar()
      .filter((r) =>
        this.matchar([
          r.namn,
          r.beskrivning,
          this.kallaNamn(r.finansiellKallaId),
          organisationEtikett(r.utbetalandeOrganisation),
          organisationEtikett(r.beslutandeOrganisation),
          this.konteringNamn(r.konteringId),
          r.status,
        ]),
      ),
  );

  readonly kallor = computed(() =>
    this.service
      .finansiellaKallor()
      .filter((r) =>
        this.matchar([
          r.namn,
          utgiftsomradeEtikett(r.utgiftsomrade),
          kodvardeEtikett(r.anslag, ANSLAG),
          kodvardeEtikett(r.anslagspost, ANSLAGSPOSTER),
          r.status,
        ]),
      ),
  );

  readonly konteringar = computed(() =>
    this.service
      .konteringar()
      .filter((r) => this.matchar([r.finanskod, r.kostnadsstalle, r.verksamhetskod])),
  );

  readonly antalIFlik = computed(() => {
    switch (this.flik()) {
      case 'finansiering':
        return { visade: this.finansieringar().length, totalt: this.service.finansieringar().length };
      case 'kalla':
        return { visade: this.kallor().length, totalt: this.service.finansiellaKallor().length };
      case 'kontering':
        return { visade: this.konteringar().length, totalt: this.service.konteringar().length };
    }
  });

  /* ---------- Etiketter ---------- */

  kallaNamn(id: number | null): string {
    return this.service.hamtaKalla(id)?.namn ?? '';
  }

  konteringNamn(id: number | null): string {
    return konteringEtikett(this.service.hamtaKontering(id));
  }

  orgEtikett(kod: string): string {
    return organisationEtikett(kod);
  }

  orgNamn(kod: string): string {
    return this.organisationer.find((o) => o.kod === kod)?.namn ?? '';
  }

  uoEtikett(nyckel: string): string {
    return utgiftsomradeEtikett(nyckel);
  }

  uoNyckel(u: Kodvarde): string {
    return utgiftsomradeNyckel(u);
  }

  anslagEtikett(kod: string): string {
    return kodvardeEtikett(kod, ANSLAG);
  }

  anslagspostEtikett(kod: string): string {
    return kodvardeEtikett(kod, ANSLAGSPOSTER);
  }

  anvandsIFinansieringar(kallaId: number): number {
    return this.service.finansieringar().filter((f) => f.finansiellKallaId === kallaId).length;
  }

  konteringAnvands(konteringId: number): number {
    return this.service.finansieringar().filter((f) => f.konteringId === konteringId).length;
  }

  statusKlass(status: Status): string {
    return status === 'Aktiv'
      ? 'bg-surface-success text-on-surface-success border border-border-success'
      : 'bg-surface-neutral text-on-surface-neutral border border-border';
  }

  /* ---------- Dialog: öppna/stäng ---------- */

  readonly dialogOppen = computed(
    () => this.finForm() !== null || this.kallaForm() !== null || this.kontForm() !== null,
  );

  readonly dialogRubrik = computed(() => {
    const ny = (this.finForm() ?? this.kallaForm() ?? this.kontForm())?.id === null;
    return `${ny ? 'Lägg till' : 'Redigera'} ${this.aktivFlikNamn().toLowerCase()}`;
  });

  laggTill(): void {
    this.forsokSpara.set(false);
    switch (this.flik()) {
      case 'finansiering':
        this.finForm.set({
          id: null,
          namn: '',
          beskrivning: '',
          finansiellKallaId: null,
          utbetalandeOrganisation: '',
          beslutandeOrganisation: '',
          konteringId: null,
          status: 'Aktiv',
        });
        break;
      case 'kalla':
        this.kallaForm.set({ id: null, namn: '', utgiftsomrade: '', anslag: '', anslagspost: '', status: 'Aktiv' });
        break;
      case 'kontering':
        this.kontForm.set({ id: null, finanskod: '', kostnadsstalle: '', verksamhetskod: '' });
        break;
    }
  }

  redigeraFinansiering(rad: Finansiering): void {
    this.forsokSpara.set(false);
    this.finForm.set({ ...rad });
  }

  redigeraKalla(rad: FinansiellKalla): void {
    this.forsokSpara.set(false);
    this.kallaForm.set({ ...rad });
  }

  redigeraKontering(rad: Kontering): void {
    this.forsokSpara.set(false);
    this.kontForm.set({ ...rad });
  }

  stangDialog(): void {
    this.finForm.set(null);
    this.kallaForm.set(null);
    this.kontForm.set(null);
    this.forsokSpara.set(false);
  }

  @HostListener('document:keydown.escape')
  stangMedEscape(): void {
    if (this.dialogOppen()) this.stangDialog();
  }

  /* ---------- Dialog: uppdatera fält ---------- */

  sattFin<K extends keyof FinansieringForm>(falt: K, varde: FinansieringForm[K]): void {
    this.finForm.update((f) => (f ? { ...f, [falt]: varde } : f));
  }

  sattKont<K extends keyof KonteringForm>(falt: K, varde: KonteringForm[K]): void {
    this.kontForm.update((f) => (f ? { ...f, [falt]: varde } : f));
  }

  sattKallaNamn(namn: string): void {
    this.kallaForm.update((f) => (f ? { ...f, namn } : f));
  }

  sattKallaStatus(status: Status): void {
    this.kallaForm.update((f) => (f ? { ...f, status } : f));
  }

  /** Utgiftsområde styr vilka anslag som får väljas; byte nollställer underliggande val. */
  sattUtgiftsomrade(nyckel: string): void {
    this.kallaForm.update((f) => {
      if (!f) return f;
      const sammaNummer = utgiftsomradeKod(nyckel) === utgiftsomradeKod(f.utgiftsomrade);
      return sammaNummer
        ? { ...f, utgiftsomrade: nyckel }
        : { ...f, utgiftsomrade: nyckel, anslag: '', anslagspost: '' };
    });
  }

  sattAnslag(kod: string): void {
    this.kallaForm.update((f) => (f ? { ...f, anslag: kod, anslagspost: '' } : f));
  }

  sattAnslagspost(kod: string): void {
    this.kallaForm.update((f) => (f ? { ...f, anslagspost: kod } : f));
  }

  /** Anslag som tillhör valt utgiftsområde (börjar med samma nummer). */
  readonly valbaraAnslag = computed(() => {
    const uo = utgiftsomradeKod(this.kallaForm()?.utgiftsomrade ?? '');
    return uo ? anslagFor(uo).sort((a, b) => jamforKod(a.kod, b.kod)) : [];
  });

  /** Anslagsposter som tillhör valt anslag. */
  readonly valbaraAnslagsposter = computed(() => {
    const anslag = this.kallaForm()?.anslag ?? '';
    return anslag ? anslagsposterFor(anslag).sort((a, b) => jamforKod(a.kod, b.kod)) : [];
  });

  /* ---------- Validering ---------- */

  readonly finFel = computed(() => {
    const f = this.finForm();
    const fel: Partial<Record<keyof FinansieringForm, string>> = {};
    if (!f) return fel;
    if (!f.namn.trim()) fel.namn = 'Ange ett namn.';
    else if (this.service.namnUpptaget(f.namn, this.service.finansieringar(), f.id))
      fel.namn = 'Namnet används redan av en annan finansiering.';
    return fel;
  });

  readonly kallaFel = computed(() => {
    const f = this.kallaForm();
    const fel: Partial<Record<keyof KallaForm, string>> = {};
    if (!f) return fel;
    if (!f.namn.trim()) fel.namn = 'Ange ett namn.';
    else if (this.service.namnUpptaget(f.namn, this.service.finansiellaKallor(), f.id))
      fel.namn = 'Namnet används redan av en annan finansiell källa.';
    return fel;
  });

  readonly kontFel = computed(() => {
    const f = this.kontForm();
    const fel: Partial<Record<keyof KonteringForm, string>> = {};
    if (!f) return fel;
    if (!f.finanskod.trim() && !f.kostnadsstalle.trim() && !f.verksamhetskod.trim())
      fel.finanskod = 'Fyll i minst ett av fälten.';
    return fel;
  });

  readonly kanSpara = computed(() => {
    if (this.finForm()) return Object.keys(this.finFel()).length === 0;
    if (this.kallaForm()) return Object.keys(this.kallaFel()).length === 0;
    if (this.kontForm()) return Object.keys(this.kontFel()).length === 0;
    return false;
  });

  visaFel(fel: string | undefined): string | undefined {
    return this.forsokSpara() ? fel : undefined;
  }

  spara(): void {
    this.forsokSpara.set(true);
    if (!this.kanSpara()) return;
    const fin = this.finForm();
    const kalla = this.kallaForm();
    const kont = this.kontForm();
    if (fin) this.service.sparaFinansiering({ ...fin, namn: fin.namn.trim(), beskrivning: fin.beskrivning.trim() });
    if (kalla) this.service.sparaFinansiellKalla({ ...kalla, namn: kalla.namn.trim() });
    if (kont)
      this.service.sparaKontering({
        ...kont,
        finanskod: kont.finanskod.trim(),
        kostnadsstalle: kont.kostnadsstalle.trim(),
        verksamhetskod: kont.verksamhetskod.trim(),
      });
    this.stangDialog();
  }
}
