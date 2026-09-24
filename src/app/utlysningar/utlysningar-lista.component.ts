import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ETIKETT_INFO,
  STATUS_INFO,
  Utlysning,
  UtlysningEtikett,
  UtlysningService,
  UtlysningStatus,
  formateraStodform,
} from '../utlysning.service';
import { ToppmenyComponent } from '../delade/toppmeny.component';
import { DatumValjareComponent } from '../delade/datum-valjare.component';
import { FinansieringService } from '../finansiering/finansiering.service';

type SortKolumn = 'skapad' | 'startdatum' | 'slutdatum';
type FilterSektion = 'organisation' | 'stodform' | 'status' | 'etikett' | 'skapad' | 'slutdatum';

interface AktivtFilter {
  typ: FilterSektion;
  varde: string;
  etikett: string;
}

@Component({
  selector: 'app-utlysningar-lista',
  imports: [FormsModule, RouterLink, ToppmenyComponent, DatumValjareComponent],
  templateUrl: './utlysningar-lista.component.html',
})
export class UtlysningarListaComponent {
  private readonly service = inject(UtlysningService);
  private readonly elementRef = inject(ElementRef);
  private readonly route = inject(ActivatedRoute);
  private readonly finansieringService = inject(FinansieringService);

  /** Utlysningar (NY): finansieringsmedel ersatt av Finansiering, samt möjlighet att ta bort. */
  readonly nyVariant = this.route.snapshot.data['variant'] === 'ny';
  readonly bas = this.nyVariant ? '/utlysningar-ny' : '/utlysningar';
  readonly sidtitel = this.nyVariant ? 'Utlysningar (NY)' : 'Utlysningar';

  /** Utlysning som väntar på bekräftelse att tas bort. */
  readonly raderaKandidat = signal<Utlysning | null>(null);

  readonly statusInfo = STATUS_INFO;
  readonly etikettInfo = ETIKETT_INFO;
  readonly alla = signal([...this.service.hamtaAlla()]);
  readonly organisationer = this.service.hamtaOrganisationer();
  readonly sidstorlekar = [10, 25, 50];

  // Sök och filterpanel
  readonly fritextSok = signal('');
  readonly filterPanelOppen = signal(false);
  readonly oppnaSektioner = signal<FilterSektion[]>(['organisation']);

  // Filtertillstånd
  readonly organisationSok = signal('');
  readonly valdaOrganisationer = signal<string[]>([]);
  readonly valdStodformVag = signal<string[]>([]);
  readonly skapadFran = signal('');
  readonly skapadTill = signal('');
  readonly slutFran = signal('');
  readonly slutTill = signal('');
  readonly valdaStatusar = signal<UtlysningStatus[]>([]);
  readonly valdaEtiketter = signal<UtlysningEtikett[]>([]);
  readonly statusInfoOppen = signal(false);

  // Sortering, paginering och radmarkering
  readonly sortKolumn = signal<SortKolumn>('skapad');
  readonly sortRiktning = signal<'asc' | 'desc'>('desc');
  readonly sida = signal(1);
  readonly sidstorlek = signal(10);

  readonly filtreradeOrganisationer = computed(() => {
    const sok = this.organisationSok().trim().toLowerCase();
    if (!sok) return this.organisationer;
    return this.organisationer.filter((o) => o.toLowerCase().includes(sok));
  });

  readonly antalPerOrganisation = computed(() => {
    const antal = new Map<string, number>();
    for (const u of this.alla()) {
      antal.set(u.organisation, (antal.get(u.organisation) ?? 0) + 1);
    }
    return antal;
  });

  /** Valbara nivåer i stödträdet under den hittills valda vägen. */
  readonly valbaraStodformNivaer = computed(() => {
    const vald = this.valdStodformVag();
    const nivaer = new Set<string>();
    for (const u of this.alla()) {
      const delar = u.stodform.split(' > ');
      if (vald.length >= delar.length) continue;
      if (vald.every((niva, i) => delar[i] === niva)) {
        nivaer.add(delar[vald.length]);
      }
    }
    return [...nivaer].sort((a, b) => a.localeCompare(b, 'sv'));
  });

  readonly antalPerStatus = computed(() => {
    const antal = new Map<UtlysningStatus, number>();
    for (const u of this.alla()) {
      const s = this.service.status(u);
      antal.set(s, (antal.get(s) ?? 0) + 1);
    }
    return antal;
  });

  readonly antalPerEtikett = computed(() => {
    const antal = new Map<UtlysningEtikett, number>();
    for (const u of this.alla()) {
      const e = this.service.etikett(u);
      if (e) antal.set(e, (antal.get(e) ?? 0) + 1);
    }
    return antal;
  });

  readonly filtrerade = computed(() => {
    const fritext = this.fritextSok().trim().toLowerCase();
    const organisationer = this.valdaOrganisationer();
    const stodformVag = this.valdStodformVag();
    const statusar = this.valdaStatusar();
    const etiketter = this.valdaEtiketter();
    const skapadFran = this.skapadFran();
    const skapadTill = this.skapadTill();
    const slutFran = this.slutFran();
    const slutTill = this.slutTill();

    return this.alla().filter((u) => {
      if (
        fritext &&
        ![u.namn, u.interntNamn, u.stodform, u.organisation].some((falt) =>
          falt.toLowerCase().includes(fritext),
        )
      ) {
        return false;
      }
      if (organisationer.length > 0 && !organisationer.includes(u.organisation)) return false;
      if (stodformVag.length > 0) {
        const delar = u.stodform.split(' > ');
        if (!stodformVag.every((niva, i) => delar[i] === niva)) return false;
      }
      if (statusar.length > 0 && !statusar.includes(this.service.status(u))) return false;
      if (etiketter.length > 0) {
        const e = this.service.etikett(u);
        if (!e || !etiketter.includes(e)) return false;
      }
      if (skapadFran && u.skapad < skapadFran) return false;
      if (skapadTill && u.skapad > skapadTill) return false;
      if (slutFran && u.slutdatum < slutFran) return false;
      if (slutTill && u.slutdatum > slutTill) return false;
      return true;
    });
  });

  readonly sorterade = computed(() => {
    const kolumn = this.sortKolumn();
    const riktning = this.sortRiktning() === 'asc' ? 1 : -1;
    return [...this.filtrerade()].sort((a, b) => a[kolumn].localeCompare(b[kolumn]) * riktning);
  });

  readonly antalSidor = computed(() =>
    Math.max(1, Math.ceil(this.sorterade().length / this.sidstorlek())),
  );

  readonly sidnummer = computed(() =>
    Array.from({ length: this.antalSidor() }, (_, i) => i + 1),
  );

  readonly sidansUtlysningar = computed(() => {
    const start = (this.sida() - 1) * this.sidstorlek();
    return this.sorterade().slice(start, start + this.sidstorlek());
  });

  readonly visarFran = computed(() =>
    this.sorterade().length === 0 ? 0 : (this.sida() - 1) * this.sidstorlek() + 1,
  );

  readonly visarTill = computed(() =>
    Math.min(this.sida() * this.sidstorlek(), this.sorterade().length),
  );

  readonly antalAktivaFilter = computed(() => {
    let antal =
      this.valdaOrganisationer().length + this.valdaStatusar().length + this.valdaEtiketter().length;
    if (this.valdStodformVag().length > 0) antal++;
    if (this.skapadFran() || this.skapadTill()) antal++;
    if (this.slutFran() || this.slutTill()) antal++;
    return antal;
  });

  readonly aktivaFilter = computed<AktivtFilter[]>(() => {
    const filter: AktivtFilter[] = [];
    for (const organisation of this.valdaOrganisationer()) {
      filter.push({ typ: 'organisation', varde: organisation, etikett: organisation });
    }
    if (this.valdStodformVag().length > 0) {
      filter.push({
        typ: 'stodform',
        varde: '',
        etikett: this.formateraStodform(this.valdStodformVag().join(' > ')),
      });
    }
    for (const status of this.valdaStatusar()) {
      filter.push({ typ: 'status', varde: status, etikett: status });
    }
    for (const etikett of this.valdaEtiketter()) {
      filter.push({ typ: 'etikett', varde: etikett, etikett });
    }
    if (this.skapadFran() || this.skapadTill()) {
      filter.push({
        typ: 'skapad',
        varde: '',
        etikett: 'Skapad ' + this.datumIntervall(this.skapadFran(), this.skapadTill()),
      });
    }
    if (this.slutFran() || this.slutTill()) {
      filter.push({
        typ: 'slutdatum',
        varde: '',
        etikett: 'Går ut ' + this.datumIntervall(this.slutFran(), this.slutTill()),
      });
    }
    return filter;
  });

  private datumIntervall(fran: string, till: string): string {
    if (fran && till) return `${fran} – ${till}`;
    return fran ? `från ${fran}` : `till ${till}`;
  }

  taBortFilter(filter: AktivtFilter): void {
    switch (filter.typ) {
      case 'organisation':
        this.toggleOrganisation(filter.varde);
        break;
      case 'stodform':
        this.valdStodformVag.set([]);
        this.sida.set(1);
        break;
      case 'status':
        this.toggleStatus(filter.varde as UtlysningStatus);
        break;
      case 'etikett':
        this.toggleEtikett(filter.varde as UtlysningEtikett);
        break;
      case 'skapad':
        this.skapadFran.set('');
        this.skapadTill.set('');
        this.sida.set(1);
        break;
      case 'slutdatum':
        this.slutFran.set('');
        this.slutTill.set('');
        this.sida.set(1);
        break;
    }
  }


  @HostListener('document:click', ['$event'])
  stangPanelVidKlickUtanfor(event: MouseEvent): void {
    const filterOmrade = this.elementRef.nativeElement.querySelector('#filter-omrade');
    if (filterOmrade && !filterOmrade.contains(event.target as Node)) {
      this.filterPanelOppen.set(false);
    }
  }

  arSektionOppen(sektion: FilterSektion): boolean {
    return this.oppnaSektioner().includes(sektion);
  }

  toggleSektion(sektion: FilterSektion): void {
    this.oppnaSektioner.update((oppna) =>
      oppna.includes(sektion) ? oppna.filter((s) => s !== sektion) : [...oppna, sektion],
    );
  }

  sattFritext(varde: string): void {
    this.fritextSok.set(varde);
    this.sida.set(1);
  }

  antalForOrganisation(organisation: string): number {
    return this.antalPerOrganisation().get(organisation) ?? 0;
  }

  antalForStatus(status: UtlysningStatus): number {
    return this.antalPerStatus().get(status) ?? 0;
  }

  arOrganisationVald(organisation: string): boolean {
    return this.valdaOrganisationer().includes(organisation);
  }

  toggleOrganisation(organisation: string): void {
    this.valdaOrganisationer.update((valda) =>
      valda.includes(organisation)
        ? valda.filter((o) => o !== organisation)
        : [...valda, organisation],
    );
    this.sida.set(1);
  }

  arStatusVald(status: UtlysningStatus): boolean {
    return this.valdaStatusar().includes(status);
  }

  toggleStatus(status: UtlysningStatus): void {
    this.valdaStatusar.update((valda) =>
      valda.includes(status) ? valda.filter((s) => s !== status) : [...valda, status],
    );
    this.sida.set(1);
  }

  arEtikettVald(etikett: UtlysningEtikett): boolean {
    return this.valdaEtiketter().includes(etikett);
  }

  toggleEtikett(etikett: UtlysningEtikett): void {
    this.valdaEtiketter.update((valda) =>
      valda.includes(etikett) ? valda.filter((e) => e !== etikett) : [...valda, etikett],
    );
    this.sida.set(1);
  }

  antalForEtikett(etikett: UtlysningEtikett): number {
    return this.antalPerEtikett().get(etikett) ?? 0;
  }

  sattDatum(falt: 'skapadFran' | 'skapadTill' | 'slutFran' | 'slutTill', varde: string): void {
    this[falt].set(varde);
    this.sida.set(1);
  }

  valStodformNiva(niva: string): void {
    this.valdStodformVag.update((vag) => [...vag, niva]);
    this.sida.set(1);
  }

  /** Klick på en vald nivå tar bort den och alla nivåer under. */
  taBortStodformNiva(index: number): void {
    this.valdStodformVag.update((vag) => vag.slice(0, index));
    this.sida.set(1);
  }

  aterstallFilter(): void {
    this.organisationSok.set('');
    this.valdaOrganisationer.set([]);
    this.valdStodformVag.set([]);
    this.skapadFran.set('');
    this.skapadTill.set('');
    this.slutFran.set('');
    this.slutTill.set('');
    this.valdaStatusar.set([]);
    this.valdaEtiketter.set([]);
    this.sida.set(1);
  }

  sortera(kolumn: SortKolumn): void {
    if (this.sortKolumn() === kolumn) {
      this.sortRiktning.update((r) => (r === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKolumn.set(kolumn);
      this.sortRiktning.set('desc');
    }
    this.sida.set(1);
  }

  gaTillSida(sida: number): void {
    this.sida.set(Math.min(Math.max(1, sida), this.antalSidor()));
  }

  sattSidstorlek(varde: string): void {
    this.sidstorlek.set(Number(varde));
    this.sida.set(1);
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

  formateraStodform(stodform: string): string {
    return formateraStodform(stodform);
  }

  statusFor(utlysning: Utlysning): UtlysningStatus {
    return this.service.status(utlysning);
  }

  etikettFor(utlysning: Utlysning): UtlysningEtikett | null {
    return this.service.etikett(utlysning);
  }

  /* ---------- Utlysningar (NY) ---------- */

  finansieringNamn(utlysning: Utlysning): string[] {
    return (utlysning.finansieringar ?? [])
      .map((id) => this.finansieringService.hamtaFinansiering(id)?.namn)
      .filter((namn): namn is string => !!namn);
  }

  bekraftaRadera(): void {
    const u = this.raderaKandidat();
    if (!u) return;
    this.service.taBort(u.id);
    this.alla.set([...this.service.hamtaAlla()]);
    this.raderaKandidat.set(null);
    if (this.sida() > this.antalSidor()) this.sida.set(Math.max(1, this.antalSidor()));
  }
}
