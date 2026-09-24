import { Injectable, signal } from '@angular/core';

/* ============================================================
   Värdeförråd
   ============================================================ */

export interface Organisation {
  kod: string;
  namn: string;
}

/** Utbetalande och beslutande organisation delar samma värdeförråd. */
export const ORGANISATIONER: Organisation[] = [
  { kod: 'LIV', namn: 'Livsmedelsverket' },
  { kod: 'LST-K', namn: 'Länsstyrelsen i Blekinge län' },
  { kod: 'LST-W', namn: 'Länsstyrelsen i Dalarnas län' },
  { kod: 'LST-I', namn: 'Länsstyrelsen i Gotlands län' },
  { kod: 'LST-X', namn: 'Länsstyrelsen i Gävleborgs län' },
  { kod: 'LST-N', namn: 'Länsstyrelsen i Hallands län' },
  { kod: 'LST-Z', namn: 'Länsstyrelsen i Jämtlands län' },
  { kod: 'LST-F', namn: 'Länsstyrelsen i Jönköpings län' },
  { kod: 'LST-H', namn: 'Länsstyrelsen i Kalmar län' },
  { kod: 'LST-G', namn: 'Länsstyrelsen i Kronobergs län' },
  { kod: 'LST-BD', namn: 'Länsstyrelsen i Norrbottens län' },
  { kod: 'LST-LM', namn: 'Länsstyrelsen i Skåne län' },
  { kod: 'LST-AB', namn: 'Länsstyrelsen i Stockholms län' },
  { kod: 'LST-D', namn: 'Länsstyrelsen i Södermanlands län' },
  { kod: 'LST-C', namn: 'Länsstyrelsen i Uppsala län' },
  { kod: 'LST-S', namn: 'Länsstyrelsen i Värmlands län' },
  { kod: 'LST-AC', namn: 'Länsstyrelsen i Västerbottens län' },
  { kod: 'LST-Y', namn: 'Länsstyrelsen i Västernorrlands län' },
  { kod: 'LST-U', namn: 'Länsstyrelsen i Västmanlands län' },
  { kod: 'LST-O', namn: 'Länsstyrelsen i Västra Götalands län' },
  { kod: 'LST-T', namn: 'Länsstyrelsen i Örebro län' },
  { kod: 'LST-E', namn: 'Länsstyrelsen i Östergötlands län' },
  { kod: 'MIG', namn: 'Migrationsverket' },
  { kod: 'POL', namn: 'Polismyndigheten' },
  { kod: 'REGK', namn: 'Region Blekinge' },
  { kod: 'REGW', namn: 'Region Dalarna' },
  { kod: 'REGI', namn: 'Region Gotland' },
  { kod: 'REGX', namn: 'Region Gävleborg' },
  { kod: 'REGN', namn: 'Region Halland' },
  { kod: 'REGZ', namn: 'Region Jämtland Härjedalen' },
  { kod: 'REGF', namn: 'Region Jönköpings län' },
  { kod: 'REGH', namn: 'Region Kalmar län' },
  { kod: 'REGG', namn: 'Region Kronoberg' },
  { kod: 'REGBD', namn: 'Region Norrbotten' },
  { kod: 'REGLM', namn: 'Region Skåne' },
  { kod: 'REGAB', namn: 'Region Stockholm' },
  { kod: 'REGD', namn: 'Region Sörmland' },
  { kod: 'REGC', namn: 'Region Uppsala' },
  { kod: 'REGS', namn: 'Region Värmland' },
  { kod: 'REGAC', namn: 'Region Västerbotten' },
  { kod: 'REGY', namn: 'Region Västernorrland' },
  { kod: 'REGU', namn: 'Region Västmanland' },
  { kod: 'REGT', namn: 'Region Örebro län' },
  { kod: 'REGE', namn: 'Region Östergötland' },
  { kod: 'TVV', namn: 'Tillväxtverket' },
  { kod: 'REGO', namn: 'Västra Götalandsregionen' },
];

export interface Kodvarde {
  /** Nummer i statsbudgeten, t.ex. "19", "19.1.1" eller "19.1.1.24.1". */
  kod: string;
  namn: string;
}

/** Utgiftsområde 19 finns i tre benämningar; alla matchar anslag som börjar på "19.". */
export const UTGIFTSOMRADEN: Kodvarde[] = [
  { kod: '4', namn: 'Rättsväsendet' },
  { kod: '8', namn: 'Migration' },
  { kod: '13', namn: 'Integration och jämställdhet' },
  { kod: '17', namn: 'Kultur, medier, trossamfund och fritid' },
  { kod: '19', namn: 'Regional utjämning och utveckling' },
  { kod: '19', namn: 'Regional tillväxt' },
  { kod: '19', namn: 'Regional utveckling' },
  { kod: '23', namn: 'Areella näringar, landsbygd och livsmedel' },
  { kod: '24', namn: 'Näringsliv' },
];

export const ANSLAG: Kodvarde[] = [
  { kod: '4.1.17', namn: 'Från EU-budgeten finansierade insatser avseende EU:s inre säkerhet, gränsförvaltning och visering' },
  { kod: '8.1.8', namn: 'Från EU-budgeten finansierade insatser för asylsökande och flyktingar (Ramanslag)' },
  { kod: '13.4.1', namn: 'Åtgärder mot segregation' },
  { kod: '17.1.2', namn: 'Bidrag till allmän kulturverksamhet, utveckling samt internationellt kulturutbyte och samarbete (Ramanslag)' },
  { kod: '19.1.1', namn: 'Regionala utvecklingsåtgärder' },
  { kod: '19.1.2', namn: 'Transportbidrag' },
  { kod: '19.1.3', namn: 'Europeiska regionala utvecklingsfonden och Fonden för en rättvis omställning perioden 2021–2027 (ram)' },
  { kod: '23.1.15', namn: 'Konkurrenskraftig livsmedelssektor' },
  { kod: '23.1.17', namn: 'Åtgärder för landsbygdens miljö och struktur' },
  { kod: '24.1.4', namn: 'Tillväxtverket' },
  { kod: '24.1.5', namn: 'Näringslivsutveckling (Ramanslag)' },
  { kod: '24.1.22', namn: 'Stöd vid korttidsarbete (Ramanslag)' },
  { kod: '24.2.3', namn: 'Exportfrämjande verksamhet (Ramanslag)' },
];

export const ANSLAGSPOSTER: Kodvarde[] = [
  { kod: '4.1.17.2', namn: 'Fonden för integrerad gränsförvaltning - Instrument för gränsförvaltning och visering 2021-2027 (ram)' },
  { kod: '4.1.17.3', namn: 'Inre Säkerhetsfonden - Inre säkerhetsfonden 2021-2027 (ram)' },
  { kod: '8.1.8.1', namn: 'Från EU-budgeten finansierade insatser för asylsökande och flyktingar (ram)' },
  { kod: '17.1.2.18', namn: 'Stöd till produktion av audiovisuella verk' },
  { kod: '19.1.1.1', namn: 'Länsstyrelsen i Stockholms län (ram)' },
  { kod: '19.1.1.2', namn: 'Länsstyrelsen i Uppsala län (ram)' },
  { kod: '19.1.1.3', namn: 'Länsstyrelsen i Södermanlands län (ram)' },
  { kod: '19.1.1.4', namn: 'Länsstyrelsen i Östergötlands län (ram)' },
  { kod: '19.1.1.5', namn: 'Länsstyrelsen i Jönköpings län (ram)' },
  { kod: '19.1.1.6', namn: 'Länsstyrelsen i Kronobergs län (ram)' },
  { kod: '19.1.1.7', namn: 'Länsstyrelsen i Kalmar län (ram)' },
  { kod: '19.1.1.8', namn: 'Länsstyrelsen i Gotlands län (ram)' },
  { kod: '19.1.1.9', namn: 'Länsstyrelsen i Blekinge län (ram)' },
  { kod: '19.1.1.10', namn: 'Länsstyrelsen i Skåne län (ram)' },
  { kod: '19.1.1.11', namn: 'Länsstyrelsen i Hallands län (ram)' },
  { kod: '19.1.1.12', namn: 'Länsstyrelsen i Västra Götalands län (ram)' },
  { kod: '19.1.1.13', namn: 'Länsstyrelsen i Värmlands län (ram)' },
  { kod: '19.1.1.14', namn: 'Länsstyrelsen i Örebro län (ram)' },
  { kod: '19.1.1.15', namn: 'Länsstyrelsen i Västmanlands län (ram)' },
  { kod: '19.1.1.16', namn: 'Länsstyrelsen i Dalarnas län (ram)' },
  { kod: '19.1.1.17', namn: 'Länsstyrelsen i Gävleborgs län (ram)' },
  { kod: '19.1.1.18', namn: 'Länsstyrelsen i Västernorrlands län (ram)' },
  { kod: '19.1.1.19', namn: 'Länsstyrelsen i Jämtlands län (ram)' },
  { kod: '19.1.1.20', namn: 'Länsstyrelsen i Västerbottens län (ram)' },
  { kod: '19.1.1.21', namn: 'Länsstyrelsen i Norrbottens län (ram)' },
  { kod: '19.1.1.22', namn: 'Regionala utv.åtg - del till Kammarkollegiet (ram)' },
  { kod: '19.1.1.23', namn: 'Stöd till socioekonomiskt eftersatta kommuner och områden (ram)' },
  { kod: '19.1.1.24.1', namn: 'Tillväxtverket (ram)' },
  { kod: '19.1.1.24.2', namn: 'Region Kalmar län (ram)' },
  { kod: '19.1.1.24.3', namn: 'Gotlands kommun (ram)' },
  { kod: '19.1.1.24.4', namn: 'Region Skåne (ram)' },
  { kod: '19.1.1.24.5', namn: 'Västra Götalandsregionen (ram)' },
  { kod: '19.1.1.24.6', namn: 'Region Uppsala (ram)' },
  { kod: '19.1.1.24.7', namn: 'Region Östergötland (ram)' },
  { kod: '19.1.1.24.8', namn: 'Region Blekinge (ram)' },
  { kod: '19.1.1.24.9', namn: 'Region Halland (ram)' },
  { kod: '19.1.1.24.10', namn: 'Region Dalarna (ram)' },
  { kod: '19.1.1.24.11', namn: 'Region Sörmland (ram)' },
  { kod: '19.1.1.24.12', namn: 'Region Jönköpings län (ram)' },
  { kod: '19.1.1.24.13', namn: 'Region Örebro län (ram)' },
  { kod: '19.1.1.24.14', namn: 'Region Värmland (ram)' },
  { kod: '19.1.1.24.15', namn: 'Region Gävleborg (ram)' },
  { kod: '19.1.1.24.16', namn: 'Region Kronoberg (ram)' },
  { kod: '19.1.1.24.17', namn: 'Region Västerbotten (ram)' },
  { kod: '19.1.1.24.18', namn: 'Region Jämtland Härjedalen (ram)' },
  { kod: '19.1.1.24.19', namn: 'Region Västmanland (ram)' },
  { kod: '19.1.1.24.20', namn: 'Region Västernorrland (ram)' },
  { kod: '19.1.1.24.21', namn: 'Region Norrbotten (ram)' },
  { kod: '19.1.1.24.22', namn: 'Region Stockholm (ram)' },
  { kod: '19.1.1.25', namn: 'Regionala utv.åtg - Regionalt utvecklingsansvar - till Kammarkollegiet' },
  { kod: '19.1.1.26', namn: 'Regionala utv.åtg – Fonden för en rättvis omställning' },
  { kod: '19.1.2.2', namn: 'Transportbidrag - del till Tillväxtverket (ram)' },
  { kod: '19.1.3.1', namn: 'Europeiska regionala utvecklingsfonden och Fonden för en rättvis omställning perioden 2021-2027 (ram)' },
  { kod: '23.1.15.5', namn: 'Konkurrenskraftig livsmedelssektor -Tillväxtverket' },
  { kod: '23.1.17.6', namn: 'Landsbygdsstöd - Statsbidrag kommuner' },
  { kod: '24.1.4.1', namn: 'Tillväxtverket - del till Tillväxtverket (ram)' },
  { kod: '24.1.5.8', namn: 'Näringslivsutveckling - del till Tillväxtverket (ram)' },
  { kod: '24.1.22.1', namn: 'Stöd vid korttidsarbete' },
  { kod: '24.1.22.2', namn: 'Stöd för kompetensutveckling (ram)' },
  { kod: '24.2.3.10', namn: 'Uppdrag enligt regeringens exportstrategi (ram)' },
];

/** "Tillhör": koden börjar med förälderns kod följt av punkt, så att "4." inte matchar "24.". */
export function tillhor(kod: string, foralderKod: string): boolean {
  return kod.startsWith(foralderKod + '.');
}

/** Anslag som hör till utgiftsområdet (jämförs på numret, oavsett benämning). */
export function anslagFor(utgiftsomradeKod: string): Kodvarde[] {
  return ANSLAG.filter((a) => tillhor(a.kod, utgiftsomradeKod));
}

export function anslagsposterFor(anslagKod: string): Kodvarde[] {
  return ANSLAGSPOSTER.filter((p) => tillhor(p.kod, anslagKod));
}

/** Sorterar koder numeriskt per nivå så att 19.1.1.2 kommer före 19.1.1.10. */
export function jamforKod(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? -1) - (pb[i] ?? -1);
    if (d !== 0) return d;
  }
  return 0;
}

/* ============================================================
   Listor
   ============================================================ */

export type Status = 'Aktiv' | 'Inaktiv';

export interface FinansiellKalla {
  id: number;
  namn: string;
  /** Sparas som "kod|namn" eftersom utgiftsområde 19 har flera benämningar. */
  utgiftsomrade: string;
  anslag: string;
  anslagspost: string;
  status: Status;
}

export interface Kontering {
  id: number;
  finanskod: string;
  kostnadsstalle: string;
  verksamhetskod: string;
}

export interface Finansiering {
  id: number;
  namn: string;
  beskrivning: string;
  finansiellKallaId: number | null;
  utbetalandeOrganisation: string;
  beslutandeOrganisation: string;
  konteringId: number | null;
  status: Status;
}

export function utgiftsomradeNyckel(u: Kodvarde): string {
  return `${u.kod}|${u.namn}`;
}

export function utgiftsomradeKod(nyckel: string): string {
  return nyckel.split('|')[0] ?? '';
}

export function utgiftsomradeEtikett(nyckel: string): string {
  if (!nyckel) return '';
  const [kod, namn] = nyckel.split('|');
  return `${kod} ${namn}`;
}

export function kodvardeEtikett(kod: string, lista: Kodvarde[]): string {
  if (!kod) return '';
  const traff = lista.find((k) => k.kod === kod);
  return traff ? `${traff.kod} ${traff.namn}` : kod;
}

export function organisationEtikett(kod: string): string {
  if (!kod) return '';
  const org = ORGANISATIONER.find((o) => o.kod === kod);
  return org ? `${org.kod} ${org.namn}` : kod;
}

export function konteringEtikett(k: Kontering | undefined): string {
  if (!k) return '';
  return [k.finanskod, k.kostnadsstalle, k.verksamhetskod].map((v) => v || '–').join(' / ');
}

const UO = (kod: string, namn: string) => `${kod}|${namn}`;

const FINANSIELLA_KALLOR: FinansiellKalla[] = [
  { id: 1, namn: 'ERUF 2021–2027', utgiftsomrade: UO('19', 'Regional utveckling'), anslag: '19.1.3', anslagspost: '19.1.3.1', status: 'Aktiv' },
  { id: 2, namn: 'Regionala utvecklingsåtgärder – Tillväxtverket', utgiftsomrade: UO('19', 'Regional utveckling'), anslag: '19.1.1', anslagspost: '19.1.1.24.1', status: 'Aktiv' },
  { id: 3, namn: 'Näringslivsutveckling', utgiftsomrade: UO('24', 'Näringsliv'), anslag: '24.1.5', anslagspost: '24.1.5.8', status: 'Aktiv' },
  { id: 4, namn: 'Inre säkerhetsfonden', utgiftsomrade: UO('4', 'Rättsväsendet'), anslag: '4.1.17', anslagspost: '4.1.17.3', status: 'Aktiv' },
  { id: 5, namn: 'Transportbidrag', utgiftsomrade: UO('19', 'Regional tillväxt'), anslag: '19.1.2', anslagspost: '', status: 'Aktiv' },
  { id: 6, namn: 'Livsmedelssektorn', utgiftsomrade: UO('23', 'Areella näringar, landsbygd och livsmedel'), anslag: '', anslagspost: '', status: 'Aktiv' },
  { id: 7, namn: 'Korttidsarbete 2020', utgiftsomrade: UO('24', 'Näringsliv'), anslag: '24.1.22', anslagspost: '24.1.22.1', status: 'Inaktiv' },
];

const KONTERINGAR: Kontering[] = [
  { id: 1, finanskod: '1010', kostnadsstalle: '4200', verksamhetskod: '6110' },
  { id: 2, finanskod: '1020', kostnadsstalle: '4210', verksamhetskod: '6120' },
  { id: 3, finanskod: '2030', kostnadsstalle: '5100', verksamhetskod: '' },
  { id: 4, finanskod: '3040', kostnadsstalle: '', verksamhetskod: '7100' },
  { id: 5, finanskod: '1030', kostnadsstalle: '4300', verksamhetskod: '6130' },
];

const FINANSIERINGAR: Finansiering[] = [
  { id: 1, namn: 'ERUF Övre Norrland', beskrivning: 'Medel från Europeiska regionala utvecklingsfonden för programområdet Övre Norrland, programperiod 2021–2027.', finansiellKallaId: 1, utbetalandeOrganisation: 'TVV', beslutandeOrganisation: 'TVV', konteringId: 1, status: 'Aktiv' },
  { id: 2, namn: 'Regionalt investeringsstöd Norrbotten', beskrivning: 'Nationella regionala utvecklingsmedel som beslutas av regionen och betalas ut av Tillväxtverket.', finansiellKallaId: 2, utbetalandeOrganisation: 'TVV', beslutandeOrganisation: 'REGBD', konteringId: 2, status: 'Aktiv' },
  { id: 3, namn: 'Transportbidrag Norrland', beskrivning: 'Kompensation för kostnadsnackdelar vid långa transporter i de fyra nordligaste länen.', finansiellKallaId: 5, utbetalandeOrganisation: 'TVV', beslutandeOrganisation: 'TVV', konteringId: null, status: 'Aktiv' },
  { id: 4, namn: 'Affärsutvecklingscheckar Västerbotten', beskrivning: '', finansiellKallaId: 3, utbetalandeOrganisation: 'TVV', beslutandeOrganisation: 'REGAC', konteringId: 3, status: 'Aktiv' },
  { id: 5, namn: 'ISF projektstöd', beskrivning: 'Projektstöd inom Inre säkerhetsfonden 2021–2027.', finansiellKallaId: 4, utbetalandeOrganisation: 'POL', beslutandeOrganisation: 'POL', konteringId: 4, status: 'Aktiv' },
  { id: 6, namn: 'Korttidsstöd 2020', beskrivning: 'Stöd vid korttidsarbete under pandemin. Avslutat.', finansiellKallaId: 7, utbetalandeOrganisation: 'TVV', beslutandeOrganisation: 'TVV', konteringId: 5, status: 'Inaktiv' },
  { id: 7, namn: 'Landsbygdsstöd kommuner', beskrivning: 'Under uppsättning – finansiell källa och kontering saknas ännu.', finansiellKallaId: null, utbetalandeOrganisation: '', beslutandeOrganisation: '', konteringId: null, status: 'Aktiv' },
];

/* ============================================================
   Service
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class FinansieringService {
  readonly finansieringar = signal<Finansiering[]>(FINANSIERINGAR);
  readonly finansiellaKallor = signal<FinansiellKalla[]>(FINANSIELLA_KALLOR);
  readonly konteringar = signal<Kontering[]>(KONTERINGAR);

  readonly organisationer = ORGANISATIONER;
  readonly utgiftsomraden = UTGIFTSOMRADEN;

  private nastaId<T extends { id: number }>(lista: T[]): number {
    return lista.reduce((max, rad) => Math.max(max, rad.id), 0) + 1;
  }

  /** Namnet måste vara unikt i listan (trimmat, oberoende av versaler). */
  namnUpptaget(namn: string, lista: { id: number; namn: string }[], egetId: number | null): boolean {
    const n = namn.trim().toLocaleLowerCase('sv');
    return lista.some((rad) => rad.id !== egetId && rad.namn.trim().toLocaleLowerCase('sv') === n);
  }

  sparaFinansiering(rad: Omit<Finansiering, 'id'> & { id: number | null }): void {
    this.finansieringar.update((lista) =>
      rad.id === null
        ? [...lista, { ...rad, id: this.nastaId(lista) }]
        : lista.map((r) => (r.id === rad.id ? { ...rad, id: rad.id } : r)),
    );
  }

  sparaFinansiellKalla(rad: Omit<FinansiellKalla, 'id'> & { id: number | null }): void {
    this.finansiellaKallor.update((lista) =>
      rad.id === null
        ? [...lista, { ...rad, id: this.nastaId(lista) }]
        : lista.map((r) => (r.id === rad.id ? { ...rad, id: rad.id } : r)),
    );
  }

  sparaKontering(rad: Omit<Kontering, 'id'> & { id: number | null }): void {
    this.konteringar.update((lista) =>
      rad.id === null
        ? [...lista, { ...rad, id: this.nastaId(lista) }]
        : lista.map((r) => (r.id === rad.id ? { ...rad, id: rad.id } : r)),
    );
  }

  hamtaKalla(id: number | null): FinansiellKalla | undefined {
    return id === null ? undefined : this.finansiellaKallor().find((k) => k.id === id);
  }

  hamtaKontering(id: number | null): Kontering | undefined {
    return id === null ? undefined : this.konteringar().find((k) => k.id === id);
  }

  hamtaFinansiering(id: number): Finansiering | undefined {
    return this.finansieringar().find((f) => f.id === id);
  }

  /** Kort beskrivning av en finansiering: källa samt utbetalande/beslutande organisation. */
  sammanfattning(fin: Finansiering): string {
    const delar = [
      this.hamtaKalla(fin.finansiellKallaId)?.namn,
      fin.utbetalandeOrganisation ? `Utbetalas av ${fin.utbetalandeOrganisation}` : '',
      fin.beslutandeOrganisation ? `Beslut ${fin.beslutandeOrganisation}` : '',
    ].filter(Boolean);
    return delar.length ? delar.join(' · ') : 'Källa och organisation saknas';
  }
}
