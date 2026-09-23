import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  FinansieringsmedelPost,
  Informationstext,
  InformationstextNiva,
  StodformNod,
  UtlysningService,
  idagLokal,
} from '../utlysning.service';
import { ToppmenyComponent } from '../delade/toppmeny.component';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { FinansieringsmedelModalComponent } from '../delade/finansieringsmedel-modal.component';

interface Steg {
  nr: number;
  titel: string;
}

const NYTT_INTERNT_NAMN = '__nytt__';

@Component({
  selector: 'app-skapa-utlysning',
  imports: [FormsModule, RouterLink, ToppmenyComponent, DatumValjareComponent, FinansieringsmedelModalComponent],
  templateUrl: './skapa-utlysning.component.html',
})
export class SkapaUtlysningComponent {
  private readonly service = inject(UtlysningService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly stegLista: Steg[] = [
    { nr: 1, titel: 'Organisation' },
    { nr: 2, titel: 'Stödform' },
    { nr: 3, titel: 'Uppgifter' },
  ];

  readonly nyttInterntNamnVarde = NYTT_INTERNT_NAMN;
  readonly organisationer = this.service.hamtaOrganisationer();
  readonly stodtrad = this.service.hamtaStodtrad();
  readonly diarieSystemLista = this.service.hamtaDiarieSystem();
  readonly sprakLista = this.service.hamtaSprak();
  readonly visaFinansieringsmedelModal = signal(false);

  readonly steg = signal(1);

  // Kopieringsläge (ny omgång i en serie)
  readonly kopieraLage = signal(false);
  readonly kopieraKallaNamn = signal('');

  /** Visas när man försökt skapa utan att alla obligatoriska fält är ifyllda. */
  readonly visaValidering = signal(false);

  // Steg 1: Organisation
  readonly organisationSok = signal('');
  readonly valdOrganisation = signal<string | null>(null);

  readonly filtreradeOrganisationer = computed(() => {
    const sok = this.organisationSok().trim().toLowerCase();
    if (!sok) return this.organisationer;
    return this.organisationer.filter((o) => o.toLowerCase().includes(sok));
  });

  // Steg 2: Stödform (drill-down i stödträdet)
  readonly stodformVag = signal<string[]>([]);

  readonly aktuellaNoder = computed<StodformNod[]>(() => {
    let noder = this.stodtrad;
    for (const niva of this.stodformVag()) {
      const traff = noder.find((n) => n.namn === niva);
      noder = traff?.barn ?? [];
    }
    return noder;
  });

  /** Vägen är komplett när en lövnod i stödträdet är vald. */
  readonly stodformKomplett = computed(
    () => this.stodformVag().length > 0 && this.aktuellaNoder().length === 0,
  );

  // Steg 3: Uppgifter
  readonly utlysningsnamn = signal('');
  readonly diarienummer = signal('');
  readonly diarieSystem = signal('');
  readonly interntNamn = signal('');
  readonly sprak = signal('');
  readonly periodFranDatum = signal(idagLokal());
  readonly periodFranTid = signal('00:01');
  readonly periodTillDatum = signal(idagLokal());
  readonly periodTillTid = signal('23:59');
  readonly tillsvidare = signal(false);
  /** Ska utlysningen vara öppen i Min ansökan? */
  readonly oppenIMa = signal<'ja' | 'nej'>('ja');
  /** Vid Nej: datum då man inte längre kan skapa ärenden i Nyps (tomt = tills vidare). */
  readonly nypsStangDatum = signal('');
  readonly finansieringsmedel = signal<string[]>([]);
  readonly utlysningstext = signal('');
  readonly fordjupandeBeskrivning = signal('');

  // Internt namn – värdeförråd med möjlighet att lägga till nya värden
  readonly internaNamn = signal(this.service.hamtaInternaNamn());
  readonly visaNyttInterntNamn = signal(false);
  readonly nyttInterntNamn = signal('');

  readonly harFinansieringsmedel = computed(() => this.finansieringsmedel().length > 0);

  /** Informationstexter som ärvs från den valda stödformen. */
  readonly arvdaInformationstexter = computed<Informationstext[]>(() => {
    if (!this.stodformKomplett()) return [];
    return this.service.hamtaArvdaInformationstexter(this.stodformVag().join(' > '));
  });

  /** Alla aktuella valideringsfel för obligatoriska fält. */
  readonly valideringsfel = computed<string[]>(() => {
    const fel: string[] = [];
    if (!this.utlysningsnamn().trim()) fel.push('Ange en rubrik');
    if (!this.sprak()) fel.push('Välj språk');
    if (this.oppenIMa() === 'ja') {
      if (!this.periodFranDatum()) fel.push('Ange datum för när utlysningen öppnar i MA');
      if (!this.tillsvidare() && !this.periodTillDatum()) fel.push('Ange datum för när utlysningen stänger i MA eller kryssa i Tillsvidare');
    } else if (!this.tillsvidare() && !this.nypsStangDatum()) {
      fel.push('Ange datum för när utlysningen stängs i Nyps eller kryssa i Tillsvidare');
    }
    if (!this.harFinansieringsmedel()) fel.push('Lägg till minst ett finansieringsmedel');
    return fel;
  });

  readonly uppgifterGiltiga = computed(() => this.valideringsfel().length === 0);

  readonly kanGaVidare = computed(() => {
    switch (this.steg()) {
      case 1:
        return this.valdOrganisation() !== null;
      case 2:
        return this.stodformKomplett();
      default:
        return this.uppgifterGiltiga();
    }
  });

  constructor() {
    const kopieraFran = Number(this.route.snapshot.queryParamMap.get('kopieraFran'));
    const kalla = Number.isFinite(kopieraFran) ? this.service.hamtaUtlysning(kopieraFran) : undefined;
    if (kalla) {
      this.kopieraLage.set(true);
      this.kopieraKallaNamn.set(kalla.namn);
      this.valdOrganisation.set(kalla.organisation);
      this.stodformVag.set(kalla.stodform.split(' > '));
      this.utlysningsnamn.set(kalla.namn);
      this.diarieSystem.set(kalla.diarieSystem ?? '');
      this.interntNamn.set(kalla.interntNamn);
      this.sprak.set(kalla.sprak ?? '');
      this.finansieringsmedel.set([...(kalla.finansieringsmedel ?? [])]);
      this.utlysningstext.set(kalla.utlysningstext ?? '');
      this.fordjupandeBeskrivning.set(kalla.fordjupandeBeskrivning ?? '');
      this.oppenIMa.set(kalla.ejOppenIMa ? 'nej' : 'ja');
      this.steg.set(3);
    }
  }

  valOrganisation(organisation: string): void {
    this.valdOrganisation.set(organisation);
  }

  valStodformNiva(niva: string): void {
    this.stodformVag.update((vag) => [...vag, niva]);
  }

  taBortStodformNiva(index: number): void {
    this.stodformVag.update((vag) => vag.slice(0, index));
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
    this.finansieringsmedel.update((medel) => medel.filter((_, i) => i !== index));
  }

  postFor(etikett: string): FinansieringsmedelPost | undefined {
    return this.service.hamtaFinansieringsmedelPost(etikett);
  }

  nivaKlass(niva: InformationstextNiva): string {
    return niva === 'Stödform'
      ? 'bg-surface-info text-on-surface-info'
      : 'bg-surface-primary text-on-surface-primary';
  }

  /** Badge-etikett: stödformens namn respektive utlysningens namn. */
  nivaEtikett(text: Informationstext): string {
    if (text.niva === 'Stödform') return text.stodformPrefix?.split(' > ')[0] ?? 'Stödform';
    return this.utlysningsnamn().trim() || 'Utlysning';
  }

  gaTillSteg(steg: number): void {
    if (steg < this.steg()) this.steg.set(steg);
  }

  nasta(): void {
    if (this.kanGaVidare() && this.steg() < 3) this.steg.update((s) => s + 1);
  }

  tillbaka(): void {
    if (this.steg() > 1) this.steg.update((s) => s - 1);
  }

  private skrollaTillSummering(): void {
    setTimeout(() =>
      document.getElementById('valideringssummering')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  }

  skapa(): void {
    if (!this.uppgifterGiltiga()) {
      this.visaValidering.set(true);
      this.skrollaTillSummering();
      return;
    }
    const skapad = this.service.laggTill({
      namn: this.utlysningsnamn().trim(),
      interntNamn: this.interntNamn() || this.utlysningsnamn().trim().toUpperCase().slice(0, 12),
      organisation: this.valdOrganisation()!,
      stodform: this.stodformVag().join(' > '),
      skapad: idagLokal(),
      startdatum: this.oppenIMa() === 'ja' ? this.periodFranDatum() : idagLokal(),
      slutdatum: this.tillsvidare()
        ? '9999-12-31'
        : this.oppenIMa() === 'ja'
          ? this.periodTillDatum()
          : this.nypsStangDatum(),
      tillsvidare: this.tillsvidare(),
      ejOppenIMa: this.oppenIMa() === 'nej',
      sprak: this.sprak(),
      diarienummer: this.diarienummer(),
      diarieSystem: this.diarieSystem(),
      finansieringsmedel: this.finansieringsmedel(),
      utlysningstext: this.utlysningstext(),
      fordjupandeBeskrivning: this.fordjupandeBeskrivning(),
    });
    this.router.navigate(['/utlysningar', skapad.id]);
  }
}
