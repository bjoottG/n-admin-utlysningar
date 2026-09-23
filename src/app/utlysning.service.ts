import { Injectable } from '@angular/core';

export type UtlysningStatus = 'Aktiv' | 'Inaktiv';
export type UtlysningEtikett = 'Kommande' | 'Öppen' | 'Utlöpt' | 'Dold';

export interface StatusInfo {
  status: UtlysningStatus;
  beskrivning: string;
}

export interface EtikettInfo {
  etikett: UtlysningEtikett;
  beskrivning: string;
}

/** Status: Aktiv tills utlysningen stängs i admin. */
export const STATUS_INFO: StatusInfo[] = [
  {
    status: 'Aktiv',
    beskrivning: 'Utlysningen är Aktiv och ärendet kan registreras manuellt i Nyps.',
  },
  {
    status: 'Inaktiv',
    beskrivning: 'Utlysningen är stängd i admin och inaktiv i Nyps.',
  },
];

/** Etiketten härleds ur datumintervallet och Dold-flaggan; inaktiva utlysningar saknar etikett. */
export const ETIKETT_INFO: EtikettInfo[] = [
  {
    etikett: 'Kommande',
    beskrivning: 'Startdatumet har inte inträffat ännu. Utlysningen öppnar i Min ansökan vid startdatumet.',
  },
  {
    etikett: 'Öppen',
    beskrivning: 'Utlysningen är inom datumintervallet och öppen för sökande i Min ansökan.',
  },
  {
    etikett: 'Utlöpt',
    beskrivning:
      'Datumintervallet har passerat. Om den sökande har ett pågående utkast kan det skickas in efter att utlysningen stängts.',
  },
  {
    etikett: 'Dold',
    beskrivning: 'Utlysningen visas inte i Min ansökan – valet gjordes när utlysningen skapades.',
  },
];

export interface Utlysning {
  id: number;
  namn: string;
  interntNamn: string;
  organisation: string;
  /** Stödformsförgrening, nivåer avgränsade med " > ". */
  stodform: string;
  /** Datum då utlysningen skapades (ISO-format). */
  skapad: string;
  /** Datum då utlysningen öppnar. */
  startdatum: string;
  /** Datum då utlysningen går ut (sentinel 9999-12-31 när tillsvidare). */
  slutdatum: string;
  /** Utlysningen gäller tills vidare och har inget slutdatum. */
  tillsvidare?: boolean;
  /** Utlysningen ska inte vara öppen i Min ansökan (hanteras enbart i Nyps). */
  ejOppenIMa?: boolean;
  /** Utlysningen är stängd i admin och därmed inaktiv. */
  stangdIAdmin?: boolean;
  sprak?: string;
  diarienummer?: string;
  diarieSystem?: string;
  startstodformsnod?: string;
  finansieringsmedel?: string[];
  utlysningstext?: string;
  fordjupandeBeskrivning?: string;
}

export type InformationstextNiva = 'Stödform' | 'Utlysning';

/** En informationstext ärvs antingen från stödformen eller från utlysningen. */
export interface Informationstext {
  id: number;
  titel: string;
  niva: InformationstextNiva;
  innehall: string;
  /** Nivå Stödform: gäller utlysningar vars stödform börjar med detta prefix. */
  stodformPrefix?: string;
  /** Nivå Utlysning: gäller endast denna utlysning. */
  utlysningId?: number;
}

/** Politiskt mål 2 i ERUF – återkommande nivå i stödformsförgreningarna. */
const GRONARE_EUROPA =
  'En grönare och koldioxidsnål övergång till en ekonomi med noll nettoutsläpp och ett motståndskraftigt Europa. Det ska göras genom främjande av en ren och rättvis energiomställning, gröna och blå investeringar, den cirkulära ekonomin, begränsning av klimatförändringar, klimatanpassning, riskförebyggande, riskhantering och hållbar mobilitet i städer';

/** Politiskt mål 1 i ERUF. */
const SMART_EUROPA =
  'Ett mer konkurrenskraftigt och smart Europa genom främjande av innovativ och smart ekonomisk omvandling och regional IKT-konnektivitet';

const UTLYSNINGAR: Utlysning[] = [
  { id: 24, namn: 'Grön omställning i industrin hösten 2026', interntNamn: 'GRÖN-H26', organisation: 'Tillväxtverket', stodform: `EU 2027 REG > Östra Mellansverige > ${GRONARE_EUROPA} > Ett grönare och koldioxidsnålare Östra Mellansverige`, skapad: '2026-09-02', startdatum: '2026-09-15', slutdatum: '2026-11-30' },
  { id: 23, namn: 'Digitaliseringscheckar för småföretag', interntNamn: 'DIGI-26', organisation: 'Region Skåne', stodform: 'Företagsstöd > Konsultcheck > Digitalisering', skapad: '2026-08-28', startdatum: '2026-09-01', slutdatum: '2026-10-15' },
  { id: 22, namn: 'Investeringsstöd för landsbygdsföretag', interntNamn: 'INV-LAND-26', organisation: 'Region Norrbotten', stodform: 'Företagsstöd > Regionalt investeringsstöd', skapad: '2026-08-20', startdatum: '2026-08-20', slutdatum: '2026-09-22' },
  { id: 21, namn: 'Stöd till kommersiell service i glesbygd', interntNamn: 'KOMSERV', organisation: 'Region Jämtland Härjedalen', stodform: 'Företagsstöd > Kommersiell service > Stöd till dagligvarubutiker i gles- och landsbygd', skapad: '2026-08-20', startdatum: '2026-08-20', slutdatum: '2026-09-22' },
  { id: 20, namn: 'Innovationsprojekt inom livsmedelskedjan', interntNamn: 'LIVS-INNO-26', organisation: 'Tillväxtverket', stodform: `EU 2027 REG > Nationella regionalfondsprogrammet > ${SMART_EUROPA} > Innovation i livsmedelskedjan`, skapad: '2026-08-13', startdatum: '2026-08-13', slutdatum: '2026-09-16' },
  { id: 19, namn: 'Energieffektivisering i besöksnäringen', interntNamn: 'ENERGI-BES-26', organisation: 'Region Gotland', stodform: 'Företagsstöd > Miljöinvestering > Energieffektivisering', skapad: '2026-07-30', startdatum: '2026-08-01', slutdatum: '2026-12-31', ejOppenIMa: true },
  { id: 18, namn: 'Såddfinansiering för tech-startups', interntNamn: 'SÅDD-26', organisation: 'Västra Götalandsregionen', stodform: 'Företagsstöd > Såddfinansiering', skapad: '2026-07-14', startdatum: '2026-08-01', slutdatum: '2026-10-01' },
  { id: 17, namn: 'Förstudier inför ERUF-ansökningar 2027', interntNamn: 'ERUF-FÖR-27', organisation: 'Tillväxtverket', stodform: `EU 2027 REG > Övre Norrland > ${SMART_EUROPA} > Stärka forskning och innovation`, skapad: '2026-06-25', startdatum: '2026-07-01', slutdatum: '2026-08-31' },
  { id: 16, namn: 'Kompetensutveckling i vård- och omsorgsföretag', interntNamn: 'KOMP-VÅRD-26', organisation: 'Region Kalmar län', stodform: 'Projektmedel > Kompetensförsörjning > Vård och omsorg', skapad: '2026-06-10', startdatum: '2026-06-15', slutdatum: '2026-08-15' },
  { id: 15, namn: 'Exportfrämjande insatser för tillverkningsindustrin', interntNamn: 'EXPORT-26', organisation: 'Region Värmland', stodform: 'Företagsstöd > Internationalisering > Exportfrämjande', skapad: '2026-05-28', startdatum: '2026-06-01', slutdatum: '2026-09-30' },
  { id: 14, namn: 'Cirkulära affärsmodeller i byggsektorn', interntNamn: 'CIRK-BYGG-26', organisation: 'Västra Götalandsregionen', stodform: 'Projektmedel > Regionala utvecklingsmedel > Cirkulär ekonomi', skapad: '2026-05-15', startdatum: '2026-05-20', slutdatum: '2026-11-15' },
  { id: 13, namn: 'Bredbandsutbyggnad i Norrlands inland', interntNamn: 'BREDBAND-26', organisation: 'Region Västerbotten', stodform: 'Projektmedel > Bredbandsstöd', skapad: '2026-04-22', startdatum: '2026-05-01', slutdatum: '2026-10-31' },
  { id: 12, namn: 'Besöksnäring och kulturmiljöer i Dalarna', interntNamn: 'KULTUR-BES-26', organisation: 'Region Dalarna', stodform: 'Projektmedel > Regionala utvecklingsmedel > Besöksnäring och kulturmiljöer', skapad: '2026-04-08', startdatum: '2026-04-15', slutdatum: '2026-06-30', stangdIAdmin: true },
  { id: 11, namn: 'AI-tillämpningar i offentlig sektor', interntNamn: 'AI-OFF-26', organisation: 'Tillväxtverket', stodform: `EU 2027 REG > Nationella regionalfondsprogrammet > ${SMART_EUROPA} > Stärka innovations- och utvecklingskapaciteten samt lärandet i och mellan städer`, skapad: '2026-03-25', startdatum: '2026-04-01', slutdatum: '2026-12-15' },
  { id: 10, namn: 'Riktat omställningsstöd efter varsel', interntNamn: 'OMSTÄLL-26', organisation: 'Region Norrbotten', stodform: 'Företagsstöd > Omställningsstöd', skapad: '2026-03-12', startdatum: '2026-03-12', slutdatum: '2026-09-12' },
  { id: 9, namn: 'Hållbar vattenanvändning i lantbruket', interntNamn: 'VATTEN-26', organisation: 'Region Kalmar län', stodform: 'Företagsstöd > Miljöinvestering > Hållbar vattenanvändning', skapad: '2026-02-18', startdatum: '2026-03-01', slutdatum: '2026-05-31', stangdIAdmin: true },
  { id: 8, namn: 'Filminspelning och kreativa näringar', interntNamn: 'FILM-26', organisation: 'Region Skåne', stodform: 'Projektmedel > Kulturella och kreativa näringar > Film', skapad: '2026-02-05', startdatum: '2026-02-15', slutdatum: '2026-10-30' },
  { id: 7, namn: 'Elektrifiering av tunga transporter', interntNamn: 'ELTRANSPORT-26', organisation: 'Tillväxtverket', stodform: `EU 2027 REG > Nationella regionalfondsprogrammet > ${GRONARE_EUROPA} > Hållbar mobilitet i städer`, skapad: '2026-01-20', startdatum: '2026-02-01', slutdatum: '2026-08-01' },
  { id: 6, namn: 'Vinterturism och säsongsförlängning', interntNamn: 'VINTER-26', organisation: 'Region Jämtland Härjedalen', stodform: 'Företagsstöd > Regionalt investeringsstöd > Besöksnäring', skapad: '2025-12-10', startdatum: '2026-01-01', slutdatum: '2026-03-31' },
  { id: 5, namn: 'Ung företagsamhet i skärgårdskommuner', interntNamn: 'UNG-SKÄR-26', organisation: 'Region Gotland', stodform: 'Projektmedel > Regionala utvecklingsmedel > Ung företagsamhet', skapad: '2025-11-18', startdatum: '2026-01-15', slutdatum: '2026-04-15', stangdIAdmin: true },
  { id: 4, namn: 'Smart specialisering inom skogsnäringen', interntNamn: 'SKOG-SMART-25', organisation: 'Region Västerbotten', stodform: 'Projektmedel > Regionala utvecklingsmedel > Smart specialisering', skapad: '2025-10-22', startdatum: '2025-11-01', slutdatum: '2026-11-01' },
  { id: 3, namn: 'Kombinerad mobilitet på landsbygd', interntNamn: 'MOBIL-25', organisation: 'Region Dalarna', stodform: 'Projektmedel > Hållbara transporter > Kombinerad mobilitet', skapad: '2025-09-15', startdatum: '2025-10-01', slutdatum: '2025-12-31', stangdIAdmin: true },
  { id: 25, namn: 'Stöd till kommersiell service i glesbygd 2025', interntNamn: 'KOMSERV', organisation: 'Region Jämtland Härjedalen', stodform: 'Företagsstöd > Kommersiell service > Stöd till dagligvarubutiker i gles- och landsbygd', skapad: '2025-08-18', startdatum: '2025-08-20', slutdatum: '2025-09-22' },
  { id: 2, namn: 'Automationscheckar för industriföretag', interntNamn: 'AUTO-25', organisation: 'Region Värmland', stodform: 'Företagsstöd > Konsultcheck > Automation', skapad: '2025-08-05', startdatum: '2025-09-01', slutdatum: '2025-11-28', stangdIAdmin: true },
  { id: 1, namn: 'Etableringsstöd för nyanlända företagare', interntNamn: 'ETAB-25', organisation: 'Västra Götalandsregionen', stodform: 'Företagsstöd > Etableringsstöd', skapad: '2025-06-30', startdatum: '2025-08-01', slutdatum: '2025-10-31', stangdIAdmin: true },
];

export interface FinansieringsmedelPost {
  id: number;
  anslag: string;
  uppdrag: string;
  deluppdrag: string;
  kontotyp: string;
}

/** Etiketten som lagras på utlysningen och identifierar posten. */
export function finansieringsmedelEtikett(post: FinansieringsmedelPost): string {
  return `${post.anslag} – ${post.deluppdrag}`;
}

const FINANSIERINGSMEDEL_POSTER: FinansieringsmedelPost[] = [
  { id: 1, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Konsultcheck', kontotyp: 'Bidrag' },
  { id: 2, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Regionalt investeringsstöd', kontotyp: 'Bidrag' },
  { id: 3, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Såddfinansiering', kontotyp: 'Lån' },
  { id: 4, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Mikrobidrag', kontotyp: 'Bidrag' },
  { id: 5, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Omställningsstöd', kontotyp: 'Bidrag' },
  { id: 6, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Regionala företagsstöd', deluppdrag: 'Etableringsstöd', kontotyp: 'Bidrag' },
  { id: 7, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Projektverksamhet', deluppdrag: 'Regionala tillväxtprojekt', kontotyp: 'Bidrag' },
  { id: 8, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Projektverksamhet', deluppdrag: 'Förstudier', kontotyp: 'Bidrag' },
  { id: 9, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Projektverksamhet', deluppdrag: 'Medfinansiering EU-projekt', kontotyp: 'Transferering' },
  { id: 10, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Projektverksamhet', deluppdrag: 'Kompetensförsörjning', kontotyp: 'Bidrag' },
  { id: 11, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Projektverksamhet', deluppdrag: 'Bredbandsutbyggnad', kontotyp: 'Bidrag' },
  { id: 12, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Kommersiell service', deluppdrag: 'Driftstöd dagligvarubutiker', kontotyp: 'Bidrag' },
  { id: 13, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Kommersiell service', deluppdrag: 'Hemsändningsbidrag', kontotyp: 'Bidrag' },
  { id: 14, anslag: '1:1 Regionala utvecklingsåtgärder', uppdrag: 'Kommersiell service', deluppdrag: 'Särskilt driftstöd', kontotyp: 'Bidrag' },
  { id: 15, anslag: '1:2 Transportbidrag', uppdrag: 'Transportbidrag', deluppdrag: 'Uttransporter', kontotyp: 'Bidrag' },
  { id: 16, anslag: '1:2 Transportbidrag', uppdrag: 'Transportbidrag', deluppdrag: 'Intransporter', kontotyp: 'Bidrag' },
  { id: 17, anslag: '1:3 ERUF 2021–2027', uppdrag: 'ERUF programgenomförande', deluppdrag: 'Politiskt mål 1 – Smart Europa', kontotyp: 'Transferering' },
  { id: 18, anslag: '1:3 ERUF 2021–2027', uppdrag: 'ERUF programgenomförande', deluppdrag: 'Politiskt mål 2 – Grönare Europa', kontotyp: 'Transferering' },
  { id: 19, anslag: '1:3 ERUF 2021–2027', uppdrag: 'ERUF programgenomförande', deluppdrag: 'Politiskt mål 3 – Sammanlänkat Europa', kontotyp: 'Transferering' },
  { id: 20, anslag: '1:3 ERUF 2021–2027', uppdrag: 'ERUF programgenomförande', deluppdrag: 'Tekniskt stöd', kontotyp: 'Transferering' },
  { id: 21, anslag: '1:4 ERUF 2014–2020', uppdrag: 'ERUF avslut', deluppdrag: 'Slutbetalningar', kontotyp: 'Transferering' },
  { id: 22, anslag: '2:4 Fonden för en rättvis omställning', uppdrag: 'FRO programgenomförande', deluppdrag: 'Omställningsinsatser', kontotyp: 'Transferering' },
  { id: 23, anslag: '2:4 Fonden för en rättvis omställning', uppdrag: 'FRO programgenomförande', deluppdrag: 'Tekniskt stöd', kontotyp: 'Transferering' },
  { id: 24, anslag: 'Landsbygdsprogrammet', uppdrag: 'Kommersiell service', deluppdrag: 'Investeringsstöd service', kontotyp: 'Bidrag' },
];

function etikettForId(id: number): string {
  return finansieringsmedelEtikett(FINANSIERINGSMEDEL_POSTER.find((p) => p.id === id)!);
}

// Backfyllnad av valfria fält i mockdatan.
for (const u of UTLYSNINGAR) {
  u.sprak ??= 'Svenska';
  u.finansieringsmedel ??= u.stodform.startsWith('EU 2027 REG')
    ? [etikettForId(18), etikettForId(9)]
    : [etikettForId(7)];
  u.utlysningstext ??= '';
  u.fordjupandeBeskrivning ??= '';
  u.startstodformsnod ??= 'Ingen startstödform';
}

/** Typer av informationstexter som finns i Nyps. */
const INFORMATIONSTEXT_TYPER = [
  'Välkomsttext',
  'Bilagetext för ansökan om stöd',
  'Bilagetext för ansökan om utbetalning',
  'Bilagetext för avstämning',
  'Adress för missiv',
  'Intygande text för missiv gällande ansökan om utbetalning',
  'Intygande text för missiv gällande ansökan om stöd',
];

const INFORMATIONSTEXTER: Informationstext[] = [
  {
    id: 1,
    titel: 'Välkomsttext',
    niva: 'Stödform',
    stodformPrefix: 'Företagsstöd',
    innehall:
      'Välkommen att söka företagsstöd via Min ansökan. Läs igenom utlysningens villkor innan du påbörjar din ansökan. När du skickar in en ansökan behandlas dina personuppgifter enligt dataskyddsförordningen (GDPR).',
  },
  {
    id: 2,
    titel: 'Adress för missiv',
    niva: 'Stödform',
    stodformPrefix: 'EU 2027 REG',
    innehall: 'Tillväxtverket, Box 4044, 102 61 Stockholm.',
  },
  {
    id: 3,
    titel: 'Bilagetext för ansökan om stöd',
    niva: 'Stödform',
    stodformPrefix: 'EU 2027 REG',
    innehall:
      'Till ansökan om stöd ska bifogas projektbudget, medfinansieringsintyg och underlag som styrker organisationens firmateckning.',
  },
  {
    id: 4,
    titel: 'Bilagetext för ansökan om utbetalning',
    niva: 'Stödform',
    stodformPrefix: 'Företagsstöd > Konsultcheck',
    innehall:
      'Till ansökan om utbetalning ska bifogas fakturakopior och betalningsbevis för samtliga redovisade kostnader.',
  },
  {
    id: 5,
    titel: 'Intygande text för missiv gällande ansökan om stöd',
    niva: 'Utlysning',
    utlysningId: 24,
    innehall:
      'Jag intygar att de uppgifter som lämnas i ansökan är fullständiga och riktiga och att medel inte söks för kostnader som täcks av annat offentligt stöd.',
  },
  {
    id: 6,
    titel: 'Välkomsttext',
    niva: 'Utlysning',
    utlysningId: 21,
    innehall:
      'Utlysningen riktar sig till dagligvarubutiker i gles- och landsbygd. Ansökan görs av butikens ägare.',
  },
];

let nastaInformationstextId = INFORMATIONSTEXTER.length + 1;

/** Värdeförråd. */
const INTERNA_NAMN: string[] = ['ERUF 2021–2027', 'Livsmedelsstrategin', 'React-EU', 'Regionalt uppdrag'];
const DIARIESYSTEM = ['Public 360', 'Platina', 'W3D3', 'Diabas'];
const SPRAK = ['Svenska', 'Engelska', 'Svenska och engelska'];

export interface StodformNod {
  namn: string;
  barn?: StodformNod[];
}

const POLITISKA_MAL: StodformNod[] = [
  {
    namn: SMART_EUROPA,
    barn: [
      { namn: 'Stärka forskning och innovation' },
      { namn: 'Förbättra den digitala konnektiviteten' },
      { namn: 'Stärka innovations- och utvecklingskapaciteten samt lärandet i och mellan städer' },
    ],
  },
  {
    namn: GRONARE_EUROPA,
    barn: [
      { namn: 'Främja energieffektivitet och minskade växthusgasutsläpp' },
      { namn: 'Främja den cirkulära ekonomin' },
      { namn: 'Hållbar mobilitet i städer' },
      { namn: 'Prioritering: 6 - Hållbar vattenanvändning' },
    ],
  },
  {
    namn: 'Ett mer sammanlänkat Europa genom förbättrad mobilitet och regional IKT-konnektivitet',
    barn: [{ namn: 'Utveckla ett hållbart, klimatanpassat, intelligent och intermodalt transportnät' }],
  },
];

/** Valbara stödformer – trädet man väljer ur när en utlysning skapas. */
const STODTRAD: StodformNod[] = [
  {
    namn: 'Projektmedel',
    barn: [
      {
        namn: 'Nationella projektmedel',
        barn: [
          { namn: 'Projektstöd', barn: [{ namn: 'Basprojekt' }, { namn: 'Ramprojekt' }, { namn: 'Förstudie' }] },
        ],
      },
      {
        namn: 'Regionala utvecklingsmedel',
        barn: [
          { namn: 'Grön omställning' },
          { namn: 'Smart specialisering' },
          { namn: 'Besöksnäring och kulturmiljöer' },
          { namn: 'Ung företagsamhet' },
          { namn: 'Cirkulär ekonomi' },
        ],
      },
      { namn: 'Kompetensförsörjning', barn: [{ namn: 'Vård och omsorg' }] },
      { namn: 'Hållbara transporter', barn: [{ namn: 'Kombinerad mobilitet' }] },
      { namn: 'Bredbandsstöd' },
      { namn: 'Kulturella och kreativa näringar', barn: [{ namn: 'Film' }] },
      { namn: 'Livsmedelsstrategin', barn: [{ namn: 'Innovation i livsmedelskedjan' }] },
    ],
  },
  { namn: 'Verksamhetsbidrag' },
  { namn: 'ERUF ETC' },
  { namn: 'ERUF Regionala program' },
  {
    namn: 'Företagsstöd',
    barn: [
      { namn: 'Konsultcheck', barn: [{ namn: 'Digitalisering' }, { namn: 'Automation' }] },
      { namn: 'Regionalt investeringsstöd', barn: [{ namn: 'Besöksnäring' }] },
      { namn: 'Miljöinvestering', barn: [{ namn: 'Energieffektivisering' }, { namn: 'Hållbar vattenanvändning' }] },
      { namn: 'Såddfinansiering' },
      { namn: 'Omställningsstöd' },
      { namn: 'Etableringsstöd' },
      { namn: 'Internationalisering', barn: [{ namn: 'Exportfrämjande' }] },
      { namn: 'Kommersiell service', barn: [{ namn: 'Stöd till dagligvarubutiker i gles- och landsbygd' }] },
    ],
  },
  { namn: 'Korttidsarbete' },
  { namn: 'Korttidsarbete 2021' },
  { namn: 'Korttidsarbete 2021: juli till september' },
  { namn: 'EU AMIF ärendetyp' },
  { namn: 'Kommersiell service' },
  { namn: 'EU POL ärendetyp' },
  { namn: 'EU 2027 ETC' },
  {
    namn: 'EU 2027 REG',
    barn: [
      { namn: 'Övre Norrland', barn: POLITISKA_MAL },
      { namn: 'Skåne och Blekinge', barn: POLITISKA_MAL },
      { namn: 'Mellersta Norrland', barn: POLITISKA_MAL },
      { namn: 'Småland och Öarna', barn: POLITISKA_MAL },
      { namn: 'Nationella regionalfondsprogrammet', barn: POLITISKA_MAL },
      { namn: 'Norra Mellansverige', barn: POLITISKA_MAL },
      { namn: 'Östra Mellansverige', barn: POLITISKA_MAL },
      { namn: 'Västsverige', barn: POLITISKA_MAL },
      { namn: 'Stockholm', barn: POLITISKA_MAL },
    ],
  },
  { namn: 'EU 2027 FRO' },
  { namn: 'Audio Visual Incentive' },
  { namn: 'TB' },
];

function pad2(tal: number): string {
  return String(tal).padStart(2, '0');
}

/**
 * Trunkerar mitt i texten så att både början och slutet förblir läsbara,
 * t.ex. "En grönare och koldioxidsnål ... mobilitet i städer".
 */
export function trunkera(text: string, maxLangd = 50): string {
  if (text.length <= maxLangd) return text;
  const halva = Math.floor((maxLangd - 5) / 2);
  let start = text.slice(0, halva);
  const sistaMellanslag = start.lastIndexOf(' ');
  if (sistaMellanslag > halva / 2) start = start.slice(0, sistaMellanslag);
  let slut = text.slice(text.length - halva);
  const forstaMellanslag = slut.indexOf(' ');
  if (forstaMellanslag !== -1 && forstaMellanslag < halva / 2) slut = slut.slice(forstaMellanslag + 1);
  return `${start.trimEnd()} ... ${slut.trimStart()}`;
}

/** Visar hela stödformsförgreningen men trunkerar varje nivå som överstiger 50 tecken. */
export function formateraStodform(stodform: string): string {
  return stodform
    .split(' > ')
    .map((niva) => trunkera(niva))
    .join(' > ');
}

/** Dagens datum i lokal tid (yyyy-MM-dd) – inte UTC. */
export function idagLokal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Datumet plus en kalendermånad, klampat mot målmånadens sista dag (31 jan → 28 feb). */
export function plusEnManad(datum: string): string {
  const [ar, manad, dag] = datum.split('-').map(Number);
  const mal = new Date(ar, manad, 1);
  const sistaDag = new Date(ar, manad + 1, 0).getDate();
  return `${mal.getFullYear()}-${pad2(mal.getMonth() + 1)}-${pad2(Math.min(dag, sistaDag))}`;
}

@Injectable({ providedIn: 'root' })
export class UtlysningService {
  hamtaAlla(): Utlysning[] {
    return UTLYSNINGAR;
  }

  hamtaUtlysning(id: number): Utlysning | undefined {
    return UTLYSNINGAR.find((u) => u.id === id);
  }

  uppdatera(id: number, andringar: Partial<Utlysning>): void {
    const utlysning = this.hamtaUtlysning(id);
    if (utlysning) Object.assign(utlysning, andringar);
  }

  laggTill(utlysning: Omit<Utlysning, 'id'>): Utlysning {
    const id = Math.max(...UTLYSNINGAR.map((u) => u.id)) + 1;
    const ny: Utlysning = { id, ...utlysning };
    UTLYSNINGAR.unshift(ny);
    return ny;
  }

  hamtaOrganisationer(): string[] {
    return [...new Set(UTLYSNINGAR.map((u) => u.organisation))].sort((a, b) =>
      a.localeCompare(b, 'sv'),
    );
  }

  hamtaStodtrad(): StodformNod[] {
    return STODTRAD;
  }

  /** Status: Aktiv tills utlysningen stängs i admin. */
  status(utlysning: Utlysning): UtlysningStatus {
    return utlysning.stangdIAdmin ? 'Inaktiv' : 'Aktiv';
  }

  /** Etikett härledd ur datumintervallet och Dold-flaggan; null för inaktiva. */
  etikett(utlysning: Utlysning): UtlysningEtikett | null {
    if (utlysning.stangdIAdmin) return null;
    const idag = idagLokal();
    if (idag < utlysning.startdatum) return 'Kommande';
    if (!utlysning.tillsvidare && idag > utlysning.slutdatum) return 'Utlöpt';
    if (utlysning.ejOppenIMa) return 'Dold';
    return 'Öppen';
  }

  /** Utlysningar i samma serie (samma internt namn), senast skapad först. */
  hamtaSerie(interntNamn: string): Utlysning[] {
    if (!interntNamn.trim()) return [];
    return UTLYSNINGAR.filter((u) => u.interntNamn === interntNamn).sort((a, b) =>
      b.skapad.localeCompare(a.skapad),
    );
  }

  /** Informationstexter som ärvs från stödformen. */
  hamtaArvdaInformationstexter(stodform: string): Informationstext[] {
    return INFORMATIONSTEXTER.filter(
      (t) => t.niva === 'Stödform' && !!t.stodformPrefix && stodform.startsWith(t.stodformPrefix),
    );
  }

  hamtaInformationstexterFor(utlysning: Utlysning): Informationstext[] {
    return [
      ...this.hamtaArvdaInformationstexter(utlysning.stodform),
      ...INFORMATIONSTEXTER.filter((t) => t.niva === 'Utlysning' && t.utlysningId === utlysning.id),
    ];
  }

  uppdateraInformationstext(id: number, innehall: string): void {
    const text = INFORMATIONSTEXTER.find((t) => t.id === id);
    if (text) text.innehall = innehall;
  }

  hamtaInformationstextTyper(): string[] {
    return INFORMATIONSTEXT_TYPER;
  }

  laggTillInformationstext(titel: string, innehall: string, utlysningId: number): Informationstext {
    const ny: Informationstext = { id: nastaInformationstextId++, titel, niva: 'Utlysning', innehall, utlysningId };
    INFORMATIONSTEXTER.push(ny);
    return ny;
  }

  /** Värdeförrådet för interna namn: fasta värden + namn som redan används. */
  hamtaInternaNamn(): string[] {
    return [...new Set([...INTERNA_NAMN, ...UTLYSNINGAR.map((u) => u.interntNamn)])].sort((a, b) =>
      a.localeCompare(b, 'sv'),
    );
  }

  laggTillInterntNamn(namn: string): void {
    const trimmat = namn.trim();
    if (trimmat && !INTERNA_NAMN.includes(trimmat)) INTERNA_NAMN.push(trimmat);
  }

  hamtaDiarieSystem(): string[] {
    return DIARIESYSTEM;
  }

  hamtaSprak(): string[] {
    return SPRAK;
  }

  hamtaFinansieringsmedelPoster(): FinansieringsmedelPost[] {
    return FINANSIERINGSMEDEL_POSTER;
  }

  hamtaFinansieringsmedelPost(etikett: string): FinansieringsmedelPost | undefined {
    return FINANSIERINGSMEDEL_POSTER.find((p) => finansieringsmedelEtikett(p) === etikett);
  }
}
