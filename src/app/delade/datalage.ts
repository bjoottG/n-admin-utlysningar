/* ============================================================
   Dataläge – riktiga eller anonymiserade exempeldata (avsnitt 11.2)
   Valet sparas per webbläsare och läses vid start. Byte laddar om sidan,
   så att alla delar av prototypen läser in rätt data.
   ============================================================ */

export type DataLage = 'riktiga' | 'anonymiserade';

const NYCKEL = 'nypsAdmin.dataLage';

export function lasDataLage(): DataLage {
  try {
    return localStorage.getItem(NYCKEL) === 'anonymiserade' ? 'anonymiserade' : 'riktiga';
  } catch {
    return 'riktiga';
  }
}

export function arAnonymiserat(): boolean {
  return lasDataLage() === 'anonymiserade';
}

export function bytDataLage(lage: DataLage): void {
  if (lage === lasDataLage()) return;
  try {
    localStorage.setItem(NYCKEL, lage);
  } catch {
    // localStorage kan vara blockerad – då går det inte att byta läge
    return;
  }
  location.reload();
}

/** Tabellen anonymization i seed (avsnitt 11.3). */
export const ANONYMISERING = {
  description: 'Används för att skapa det anonymiserade dataläget. Se avsnitt 11.2.',
  organisationShortNames: {
    'org-01': 'HM',
    'org-02': 'LMO',
    'org-03': 'FM1',
    'org-04': 'FM2',
    'org-05': 'REG A',
  } as Record<string, string>,
  codes: {
    kostnadsstalle: {
      SAMAC: 'REG07',
      SAMBD: 'REG16',
      SAMC: 'REG18',
      SAMD: 'REG11',
      SAME: 'REG05',
      SAMF: 'REG20',
      SAMG: 'REG17',
      FORBH: 'REG14',
      FORBI: 'REG13',
      SAMK: 'REG03',
      FORBLM: 'REG09',
      SAMN: 'REG21',
      FORBO: 'REG01',
      SAMS: 'REG15',
      SAMT: 'REG04',
      SAMU: 'REG08',
      SAMW: 'REG02',
      SAMX: 'REG06',
      SAMY: 'REG10',
      SAMZ: 'REG19',
      SAMAB: 'REG12',
      SAMI: 'REG22',
    },
  } as Record<string, Record<string, string>>,
  textReplacements: [
    ['Länsstyrelsen i Jämtlands län', 'Länsmyndigheten Omega'],
    ['Region Jämtland Härjedalen', 'Region Alfa'],
    ['Västra Götalandsregionen', 'Region Epsilon'],
    ['Region Västernorrland', 'Region Beta'],
    ['Region Kalmar Län', 'Region Lambda'],
    ['Migrationsverket', 'Fackmyndigheten Ett'],
    ['Polismyndigheten', 'Fackmyndigheten Två'],
    ['Region Värmland', 'Region Delta'],
    ['Region Blekinge', 'Region Iota'],
    ['Tillväxtverket', 'Huvudmyndigheten'],
    ['Region Dalarna', 'Region Gamma'],
    ['Region Halland', 'Region Theta'],
    ['Länsstyrelsen', 'Länsmyndigheten Omega'],
    ['Mellersta Norrland', 'Programområde 2'],
  ] as [string, string][],
  forbiddenWords: [
    'Tillväxtverket', 'Länsstyrelsen', 'Migrationsverket', 'Polismyndigheten', 'Jämtland', 'Härjedalen',
    'Västernorrland', 'Dalarna', 'Värmland', 'Götaland', 'Halland', 'Blekinge', 'Kalmar', 'Norrland',
    'TVV', 'LST Z', 'MIGR', 'POLIS', 'REGION Z', 'SAMAC', 'SAMBD', 'SAMC', 'SAMD', 'SAME', 'SAMF', 'SAMG',
    'FORBH', 'FORBI', 'SAMK', 'FORBLM', 'SAMN', 'FORBO', 'SAMS', 'SAMT', 'SAMU', 'SAMW', 'SAMX', 'SAMY',
    'SAMZ', 'SAMAB', 'SAMI',
  ],
};

function escapa(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tillämpar textReplacements i angiven ordning (längsta först).
 * `skiftlageOkansligt` används för övriga delar av prototypen, där t.ex. "Region Kalmar län" skrivs med litet l.
 */
export function ersattNamn(text: string, skiftlageOkansligt = false): string {
  let ut = text;
  for (const [fran, till] of ANONYMISERING.textReplacements) {
    ut = skiftlageOkansligt ? ut.replace(new RegExp(escapa(fran), 'gi'), till) : ut.split(fran).join(till);
  }
  return ut;
}

/** Namn i anonymiserat läge, annars oförändrat. För statiska texter i gränssnittet. */
export function namnILage(text: string): string {
  return arAnonymiserat() ? ersattNamn(text) : text;
}

/** Djup kopia där alla strängar har gått genom namntabellen. */
export function ersattNamnDjupt<T>(data: T, skiftlageOkansligt = false): T {
  const gaIgenom = (v: unknown): unknown => {
    if (typeof v === 'string') return ersattNamn(v, skiftlageOkansligt);
    if (Array.isArray(v)) return v.map(gaIgenom);
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, gaIgenom(x)]));
    }
    return v;
  };
  return gaIgenom(data) as T;
}

/** För data i övriga delar av prototypen: namntabellen används bara i anonymiserat läge. */
export function anonymiseraOmAktivt<T>(data: T): T {
  return arAnonymiserat() ? ersattNamnDjupt(data, true) : data;
}

/**
 * Söker efter förbjudna ord. Koder och kortnamn i versaler (t.ex. SAMY, TVV) matchas som hela ord,
 * övriga ord (t.ex. Jämtland) som delsträng oberoende av skiftläge.
 */
export function forbjudnaOrd(text: string): string[] {
  const traffar: string[] = [];
  for (const ord of ANONYMISERING.forbiddenWords) {
    const versaler = ord === ord.toUpperCase();
    const re = versaler
      ? new RegExp(`(^|[^A-Za-zÅÄÖåäö0-9])${escapa(ord)}(?![A-Za-zÅÄÖåäö0-9])`)
      : new RegExp(escapa(ord), 'i');
    if (re.test(text)) traffar.push(ord);
  }
  return traffar;
}
