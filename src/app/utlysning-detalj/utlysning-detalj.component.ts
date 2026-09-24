import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ETIKETT_INFO,
  FinansieringsmedelPost,
  Informationstext,
  InformationstextNiva,
  STATUS_INFO,
  Utlysning,
  UtlysningEtikett,
  UtlysningService,
  UtlysningStatus,
} from '../utlysning.service';
import { ToppmenyComponent } from '../delade/toppmeny.component';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { FinansieringsmedelModalComponent } from '../delade/finansieringsmedel-modal.component';
import { FinansieringModalComponent } from '../delade/finansiering-modal.component';
import { Finansiering, FinansieringService } from '../finansiering/finansiering.service';

const NYTT_INTERNT_NAMN = '__nytt__';

@Component({
  selector: 'app-utlysning-detalj',
  imports: [FormsModule, RouterLink, ToppmenyComponent, DatumValjareComponent, FinansieringsmedelModalComponent, FinansieringModalComponent],
  templateUrl: './utlysning-detalj.component.html',
})
export class UtlysningDetaljComponent {
  private readonly service = inject(UtlysningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly finansieringService = inject(FinansieringService);

  /** Utlysningar (NY): finansieringsmedel ersatt av Finansiering, samt möjlighet att ta bort. */
  readonly nyVariant = this.route.snapshot.data['variant'] === 'ny';
  readonly bas = this.nyVariant ? '/utlysningar-ny' : '/utlysningar';
  readonly listNamn = this.nyVariant ? 'Utlysningar (NY)' : 'Utlysningar';
  readonly visaRaderaDialog = signal(false);

  readonly statusInfo = STATUS_INFO;
  readonly etikettInfo = ETIKETT_INFO;
  readonly nyttInterntNamnVarde = NYTT_INTERNT_NAMN;
  readonly diarieSystemLista = this.service.hamtaDiarieSystem();
  readonly sprakLista = this.service.hamtaSprak();
  readonly visaFinansieringsmedelModal = signal(false);
  readonly visaFinansieringModal = signal(false);

  readonly utlysning = signal<Utlysning | null>(null);

  // Redigerbara uppgifter (lokala kopior, sparas via Spara ändringar)
  readonly namn = signal('');
  readonly diarienummer = signal('');
  readonly diarieSystem = signal('');
  readonly interntNamn = signal('');
  readonly sprak = signal('');

  // Internt namn – värdeförråd med möjlighet att lägga till nya värden
  readonly internaNamn = signal<string[]>([]);
  readonly visaNyttInterntNamn = signal(false);
  readonly nyttInterntNamn = signal('');
  readonly startdatum = signal('');
  readonly slutdatum = signal('');
  readonly tillsvidare = signal(false);
  /** Ska utlysningen vara öppen i Min ansökan? */
  readonly oppenIMa = signal<'ja' | 'nej'>('ja');
  /** Vid Nej: datum då man inte längre kan skapa ärenden i Nyps (tomt = tills vidare). */
  readonly nypsStangDatum = signal('');
  readonly utlysningstext = signal('');
  readonly fordjupandeBeskrivning = signal('');
  readonly finansieringsmedel = signal<string[]>([]);
  readonly finansieringar = signal<number[]>([]);
  readonly sparadNyss = signal(false);

  /** Visas när man försökt spara utan att alla obligatoriska fält är ifyllda. */
  readonly visaValidering = signal(false);

  // Informationstexter (visas i läsläge)
  readonly texter = signal<Informationstext[]>([]);

  readonly status = computed<UtlysningStatus | null>(() => {
    const u = this.utlysning();
    return u ? this.service.status(u) : null;
  });

  readonly etikett = computed<UtlysningEtikett | null>(() => {
    const u = this.utlysning();
    return u ? this.service.etikett(u) : null;
  });

  /** Framhäv kopiera-knappen när utlysningen är inaktiv eller utlöpt. */
  readonly framhevKopiera = computed(
    () => this.status() === 'Inaktiv' || this.etikett() === 'Utlöpt',
  );

  readonly serie = computed(() => {
    const u = this.utlysning();
    return u ? this.service.hamtaSerie(u.interntNamn) : [];
  });

  /** Alla aktuella valideringsfel för obligatoriska fält. */
  readonly valideringsfel = computed<string[]>(() => {
    const fel: string[] = [];
    if (!this.namn().trim()) fel.push('Ange en rubrik');
    if (!this.sprak()) fel.push('Välj språk');
    if (this.oppenIMa() === 'ja') {
      if (!this.startdatum()) fel.push('Ange datum för när utlysningen öppnar i MA');
      if (!this.tillsvidare() && !this.slutdatum()) fel.push('Ange datum för när utlysningen stänger i MA eller kryssa i Tillsvidare');
    } else if (!this.tillsvidare() && !this.nypsStangDatum()) {
      fel.push('Ange datum för när utlysningen stängs i Nyps eller kryssa i Tillsvidare');
    }
    if (this.nyVariant) {
      if (this.finansieringar().length === 0) fel.push('Lägg till minst en finansiering');
    } else if (this.finansieringsmedel().length === 0) {
      fel.push('Lägg till minst ett finansieringsmedel');
    }
    return fel;
  });

  readonly kanSpara = computed(() => this.valideringsfel().length === 0);

  constructor() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      const utlysning = Number.isFinite(id) ? this.service.hamtaUtlysning(id) : undefined;
      if (!utlysning) {
        this.router.navigate([this.bas]);
        return;
      }
      this.ladda(utlysning);
    });
  }

  private ladda(utlysning: Utlysning): void {
    // Kopia så att signalen alltid får en ny referens och härledda värden räknas om efter Spara.
    this.utlysning.set({ ...utlysning });
    this.namn.set(utlysning.namn);
    this.diarienummer.set(utlysning.diarienummer ?? '');
    this.diarieSystem.set(utlysning.diarieSystem ?? '');
    this.interntNamn.set(utlysning.interntNamn);
    this.internaNamn.set(this.service.hamtaInternaNamn());
    this.visaNyttInterntNamn.set(false);
    this.nyttInterntNamn.set('');
    this.sprak.set(utlysning.sprak ?? '');
    this.startdatum.set(utlysning.startdatum);
    this.tillsvidare.set(!!utlysning.tillsvidare);
    this.oppenIMa.set(utlysning.ejOppenIMa ? 'nej' : 'ja');
    this.nypsStangDatum.set(utlysning.ejOppenIMa && !utlysning.tillsvidare ? utlysning.slutdatum : '');
    this.slutdatum.set(utlysning.tillsvidare ? '' : utlysning.slutdatum);
    this.utlysningstext.set(utlysning.utlysningstext ?? '');
    this.fordjupandeBeskrivning.set(utlysning.fordjupandeBeskrivning ?? '');
    this.finansieringsmedel.set([...(utlysning.finansieringsmedel ?? [])]);
    this.finansieringar.set([...(utlysning.finansieringar ?? [])]);
    this.sparadNyss.set(false);
    this.visaValidering.set(false);
    this.laddaTexter(utlysning);
  }

  private laddaTexter(utlysning: Utlysning): void {
    this.texter.set(this.service.hamtaInformationstexterFor(utlysning));
  }

  private skrollaTillSummering(): void {
    setTimeout(() =>
      document.getElementById('valideringssummering')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  spara(): void {
    const u = this.utlysning();
    if (!u) return;
    if (!this.kanSpara()) {
      this.visaValidering.set(true);
      this.skrollaTillSummering();
      return;
    }
    this.service.uppdatera(u.id, {
      namn: this.namn().trim(),
      diarienummer: this.diarienummer(),
      diarieSystem: this.diarieSystem(),
      interntNamn: this.interntNamn() || u.interntNamn,
      sprak: this.sprak(),
      startdatum: this.oppenIMa() === 'ja' ? this.startdatum() : u.skapad,
      slutdatum: this.tillsvidare()
        ? '9999-12-31'
        : this.oppenIMa() === 'ja'
          ? this.slutdatum()
          : this.nypsStangDatum(),
      tillsvidare: this.tillsvidare(),
      ejOppenIMa: this.oppenIMa() === 'nej',
      utlysningstext: this.utlysningstext(),
      fordjupandeBeskrivning: this.fordjupandeBeskrivning(),
      finansieringsmedel: this.finansieringsmedel(),
      finansieringar: this.finansieringar(),
    });
    this.ladda(this.service.hamtaUtlysning(u.id)!);
    this.sparadNyss.set(true);
  }

  angra(): void {
    const u = this.utlysning();
    if (u) this.ladda(u);
  }

  valInterntNamn(varde: string): void {
    if (varde === NYTT_INTERNT_NAMN) {
      this.visaNyttInterntNamn.set(true);
    } else {
      this.interntNamn.set(varde);
    }
  }

  sparaNyttInterntNamn(): void {
    const namn = this.nyttInterntNamn().trim();
    if (!namn) return;
    this.service.laggTillInterntNamn(namn);
    this.internaNamn.set(this.service.hamtaInternaNamn());
    this.interntNamn.set(namn);
    this.visaNyttInterntNamn.set(false);
    this.nyttInterntNamn.set('');
  }

  hanteraFinansieringsmedelVal(nyaVal: string[]): void {
    this.finansieringsmedel.set(nyaVal);
    this.visaFinansieringsmedelModal.set(false);
  }

  taBortFinansieringsmedel(index: number): void {
    if (this.finansieringsmedel().length <= 1) return;
    this.finansieringsmedel.update((medel) => medel.filter((_, i) => i !== index));
  }

  postFor(etikett: string): FinansieringsmedelPost | undefined {
    return this.service.hamtaFinansieringsmedelPost(etikett);
  }

  hanteraFinansieringVal(nyaVal: number[]): void {
    this.finansieringar.set(nyaVal);
    this.visaFinansieringModal.set(false);
  }

  taBortFinansiering(index: number): void {
    if (this.finansieringar().length <= 1) return;
    this.finansieringar.update((ids) => ids.filter((_, i) => i !== index));
  }

  finansieringFor(id: number): Finansiering | undefined {
    return this.finansieringService.hamtaFinansiering(id);
  }

  finansieringSammanfattning(fin: Finansiering): string {
    return this.finansieringService.sammanfattning(fin);
  }

  /** Utlysningar (NY): tar bort utlysningen och går tillbaka till listan. */
  bekraftaRadera(): void {
    const u = this.utlysning();
    if (!u) return;
    this.service.taBort(u.id);
    this.visaRaderaDialog.set(false);
    this.router.navigate([this.bas]);
  }

  nivaKlass(niva: InformationstextNiva): string {
    return niva === 'Stödform'
      ? 'bg-surface-info text-on-surface-info'
      : 'bg-surface-primary text-on-surface-primary';
  }

  /** Badge-etikett: stödformens namn respektive utlysningens namn. */
  nivaEtikett(text: Informationstext): string {
    if (text.niva === 'Stödform') return text.stodformPrefix?.split(' > ')[0] ?? 'Stödform';
    return this.utlysning()?.namn ?? 'Utlysning';
  }

  statusKlass(status: UtlysningStatus): string {
    return status === 'Aktiv'
      ? 'bg-surface-success text-on-surface-success border border-border-success'
      : 'bg-surface-warning text-on-surface-warning border border-border-warning';
  }

  etikettKlass(etikett: UtlysningEtikett): string {
    switch (etikett) {
      case 'Kommande':
        return 'bg-surface-primary text-on-surface-primary border border-primary-light';
      case 'Öppen':
        return 'bg-surface-info text-on-surface-info border border-border-info';
      case 'Utlöpt':
        return 'bg-pink-100 text-pink-800 border border-pink-500';
      case 'Dold':
        return 'bg-cyan-100 text-cyan-800 border border-cyan-500';
    }
  }

  statusBeskrivning(status: UtlysningStatus): string {
    return this.statusInfo.find((s) => s.status === status)?.beskrivning ?? '';
  }

  etikettBeskrivning(etikett: UtlysningEtikett): string {
    return this.etikettInfo.find((e) => e.etikett === etikett)?.beskrivning ?? '';
  }

  statusFor(utlysning: Utlysning): UtlysningStatus {
    return this.service.status(utlysning);
  }

  etikettFor(utlysning: Utlysning): UtlysningEtikett | null {
    return this.service.etikett(utlysning);
  }

}
