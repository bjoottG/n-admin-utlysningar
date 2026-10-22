/* ============================================================
   Informationsmodell – Ekonomisk integration (NY), version 3
   Fältnamn på engelska (som i NYPS-koden), allt i gränssnittet på svenska.
   ============================================================ */

/** Agresso: DIM1–DIM7, INVOICE_NO, CURRENCY. Raindance: KODDEL1–KODDEL8, FAKTURAREF, VALUTA. */
export type Category = string;
export type TransactionType = 'GL' | 'AP' | 'AR';
export type Flow = 'UTB' | 'INB';
export type Source = 'underlag' | 'example' | 'assumption';
export type ValueMode = 'SELECTABLE' | 'FIXED' | 'FROM_CASE' | 'FOLLOWS_FLOW';
export type CaseField = 'CASE_ID' | 'COUNTERPART_CODE';
export type ProfileStatus = 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'ENDED';
export type PostingConfigStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type VersionStatus = 'CURRENT' | 'UPCOMING' | 'PREVIOUS';
export type BlockStatus = 'ONGOING' | 'UPCOMING' | 'ENDED';

export interface SystemAttribute {
  id: string;
  name: string;
  description: string;
  allowedCategories: Category[];
}

export interface EconomicSystem {
  id: string;
  name: string;
  vendor: string;
  description: string;
  integrationStatus: 'AVAILABLE' | 'NOT_AVAILABLE';
  integrationStatusText: string;
  attributes: SystemAttribute[];
  attributeDescriptionsSource?: Source;
  /** Ordningen styr kodsträngen. */
  categories: { code: Category; label: string; description: string }[];
  transactionTypes: { code: TransactionType; label: string }[];
  flows: { code: Flow; label: string }[];
  caseFields: { code: CaseField; label: string }[];
  replacedSystemAttributes: { oldName: string; oldCode: string; oldValues: string; replacedBy: string }[];
  source: Source;
}

/** Utbetalande organisation. */
export interface Organisation {
  id: string;
  nypsId: number | null;
  name: string;
  shortName: string;
  source: Source;
  note?: string;
}
export interface DecidingOrganisation {
  id: string;
  name: string;
}
export interface FundingSource {
  id: string;
  shortName: string;
  anslag: string;
  uppdrag: string;
  deluppdrag: string | null;
  kontotyp: string | null;
  source: Source;
}

export interface Notice {
  level: 'info' | 'warning';
  text: string;
}

export interface AllowedValue {
  code: string;
  name?: string;
  /** Namnet kommer från seedens förslag (valueNames) och är ett antagande. */
  nameSource?: Source;
  description?: string;
  validFrom?: string;
  validTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Mapping {
  attributeId: string;
  category: Category;
  bookIn: TransactionType[];
  mode: ValueMode;
  fixedValue?: string;
  caseField?: CaseField;
  values: AllowedValue[];
  importNote?: string;
  modeSource?: Source;
  bookInSource?: Source;
}

export interface BlockedPeriod {
  id: string;
  /** Datum, eller datum och tid ("2026-10-22 14:05"). */
  from: string;
  to: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
  source?: Source;
}

export interface TechnicalProperty {
  key: string;
  label: string;
  value: string | null;
}

export interface IntegrationProfile {
  id: string;
  name: string;
  organisationId: string;
  economicSystemId: string;
  /** Sparad status. Visad status räknas fram med `profilStatus`. */
  status: ProfileStatus;
  validFrom: string;
  validTo: string | null;
  validFromSource?: Source;
  flows: Flow[];
  transactionTypes: TransactionType[];
  mappings: Mapping[];
  technicalProperties: TechnicalProperty[];
  blockedPeriods: BlockedPeriod[];
  notices: Notice[];
  source: Source;
  copyOf?: string;
}

export interface PostingConfigVersion {
  id: string;
  validFrom: string;
  validFromSource?: Source;
  changeReason: string | null;
  changeReasonSource?: Source;
  createdAt: string;
  /** attributeId → kod. Bara för mappningar med läget Väljs i konteringen. */
  values: Record<string, string>;
  /** Tillfälligt – flyttas senare till stödets klassificering. */
  useConsumptionAccount: boolean;
  useConsumptionAccountSource?: Source;
  source: Source;
}

/** "Kontering" i gränssnittet. Namnet räknas fram ur nyckeln. */
export interface PostingConfig {
  id: string;
  profileId: string;
  fundingSourceId: string;
  decidingOrganisationId: string;
  flow: Flow;
  status: PostingConfigStatus;
  description: string | null;
  versions: PostingConfigVersion[];
  notices: Notice[];
  source: Source;
}

export interface EiData {
  seedVersion: number;
  economicSystems: EconomicSystem[];
  organisations: Organisation[];
  decidingOrganisations: DecidingOrganisation[];
  fundingSources: FundingSource[];
  integrationProfiles: IntegrationProfile[];
  postingConfigs: PostingConfig[];
}

/* ---------- Seedens form (före tolkning) ---------- */

export interface SeedMapping extends Omit<Mapping, 'values'> {
  values: string[];
}
export interface SeedProfile
  extends Omit<IntegrationProfile, 'mappings' | 'blockedPeriods' | 'flows' | 'transactionTypes' | 'technicalProperties'> {
  flows?: Flow[];
  transactionTypes?: TransactionType[];
  mappings?: SeedMapping[];
  technicalProperties?: TechnicalProperty[];
  blockedPeriods?: BlockedPeriod[];
}
export interface SeedData {
  meta: { version: number; createdAt: string; sources: Record<Source, string> };
  economicSystems: EconomicSystem[];
  organisations: Organisation[];
  decidingOrganisations: DecidingOrganisation[];
  fundingSources: FundingSource[];
  valueNames: { source: Source } & Record<string, Record<string, string> | Source>;
  integrationProfiles: SeedProfile[];
  postingConfigs: PostingConfig[];
  anonymization: {
    description: string;
    organisationShortNames: Record<string, string>;
    codes: Record<string, Record<string, string>>;
    textReplacements: [string, string][];
    forbiddenWords: string[];
  };
}

/* ============================================================
   Etiketter
   ============================================================ */

export const BOK_ORDNING: TransactionType[] = ['GL', 'AP', 'AR'];
export const FLODE_ORDNING: Flow[] = ['UTB', 'INB'];
export const LAGE_ORDNING: ValueMode[] = ['SELECTABLE', 'FIXED', 'FROM_CASE', 'FOLLOWS_FLOW'];
export const ARENDEFALT_ORDNING: CaseField[] = ['CASE_ID', 'COUNTERPART_CODE'];

export const BOK_NAMN: Record<TransactionType, string> = {
  GL: 'Huvudbok',
  AP: 'Leverantörsreskontra',
  AR: 'Kundreskontra',
};
export const FLODE_NAMN: Record<Flow, string> = { UTB: 'Utbetalning', INB: 'Inbetalning' };

export const LAGE_NAMN: Record<ValueMode, string> = {
  SELECTABLE: 'Väljs i konteringen',
  FIXED: 'Fast värde',
  FROM_CASE: 'Hämtas från ärendet',
  FOLLOWS_FLOW: 'Följer flödet',
};
/** Ursprung i konteringens värdetabell. */
export const URSPRUNG_NAMN: Record<ValueMode, string> = {
  SELECTABLE: 'Vald i konteringen',
  FIXED: 'Fast i profilen',
  FROM_CASE: 'Från ärendet',
  FOLLOWS_FLOW: 'Följer flödet',
};
export const ARENDEFALT_NAMN: Record<CaseField, string> = {
  CASE_ID: 'Ärende-id',
  COUNTERPART_CODE: 'Motpartskod',
};

export const PROFILSTATUS_NAMN: Record<ProfileStatus, string> = {
  DRAFT: 'Utkast',
  PLANNED: 'Planerad',
  ACTIVE: 'Aktiv',
  ENDED: 'Avslutad',
};
export const KONTERINGSSTATUS_NAMN: Record<PostingConfigStatus, string> = {
  DRAFT: 'Utkast',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
};
export const VERSIONSTATUS_NAMN: Record<VersionStatus, string> = {
  CURRENT: 'Gällande',
  UPCOMING: 'Kommande',
  PREVIOUS: 'Tidigare',
};
export const SPARRSTATUS_NAMN: Record<BlockStatus, string> = {
  ONGOING: 'Pågående',
  UPCOMING: 'Kommande',
  ENDED: 'Avslutad',
};
export const INTEGRATION_NAMN: Record<EconomicSystem['integrationStatus'], string> = {
  AVAILABLE: 'Integration finns',
  NOT_AVAILABLE: 'Ingen integration',
};

const GRA = 'bg-surface-neutral text-on-surface-neutral border border-border';
const BLA = 'bg-surface-info text-on-surface-info border border-border-info';
const GRON = 'bg-surface-success text-on-surface-success border border-border-success';
const DAMPAD = 'bg-surface text-text-muted border border-border';
const ROD = 'bg-surface-error text-on-surface-error border border-border-error';

/** Statusetiketter: Utkast grå, Planerad blå, Aktiv grön, Avslutad/Inaktiv dämpad. */
export function profilStatusKlass(s: ProfileStatus): string {
  return { DRAFT: GRA, PLANNED: BLA, ACTIVE: GRON, ENDED: DAMPAD }[s];
}
export function konteringStatusKlass(s: PostingConfigStatus): string {
  return { DRAFT: GRA, ACTIVE: GRON, INACTIVE: DAMPAD }[s];
}
export function versionStatusKlass(s: VersionStatus): string {
  return { CURRENT: GRON, UPCOMING: BLA, PREVIOUS: DAMPAD }[s];
}
export function sparrStatusKlass(s: BlockStatus): string {
  return { ONGOING: ROD, UPCOMING: BLA, ENDED: DAMPAD }[s];
}
export function integrationKlass(s: EconomicSystem['integrationStatus']): string {
  return s === 'AVAILABLE' ? GRON : GRA;
}
export const SPARRAD_KLASS = 'bg-error text-on-error border border-error';

export const KALLA_TEXT: Record<'example' | 'assumption', { etikett: string; tooltip: string }> = {
  example: {
    etikett: 'Exempeldata',
    tooltip: 'Värdet finns inte i underlaget utan är påhittat för att prototypen ska gå att testa.',
  },
  assumption: {
    etikett: 'Antagande',
    tooltip: 'Bygger på en tolkning av underlaget som behöver bekräftas.',
  },
};

export const TILLFALLIGT_TIPS = 'Ligger tillfälligt i konteringen. Flyttas senare till stödets klassificering.';

/* ============================================================
   Datum
   ============================================================ */

function pad2(tal: number): string {
  return String(tal).padStart(2, '0');
}

/** Dagens datum (yyyy-MM-dd) från systemklockan, lokal tid. */
export function idag(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Nu som "yyyy-MM-dd HH:mm" (spärr som startar nu). */
export function nu(): string {
  const d = new Date();
  return `${idag()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Lägger till dagar till ett yyyy-MM-dd-datum. */
export function plusDagar(datum: string, dagar: number): string {
  const [a, m, d] = datum.split('-').map(Number);
  const t = new Date(a, m - 1, d + dagar);
  return `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
}

export function giltighetText(fran: string, till: string | null): string {
  return till ? `${fran} – ${till}` : `${fran} –`;
}

/* ============================================================
   Framräknat (sparas inte)
   ============================================================ */

/** Profilstatus utifrån datum: Planerad → Aktiv när giltig från passerats, → Avslutad när giltig till passerats. */
export function profilStatus(p: IntegrationProfile, dag = idag()): ProfileStatus {
  if (p.status === 'DRAFT') return 'DRAFT';
  if (p.validTo && p.validTo < dag) return 'ENDED';
  if (p.status === 'ENDED') return 'ENDED';
  if (p.validFrom <= dag) return 'ACTIVE';
  return 'PLANNED';
}

/** Gäller profilen (är aktiv) ett visst datum? */
export function profilAktivPa(p: IntegrationProfile, datum: string): boolean {
  return p.status !== 'DRAFT' && p.validFrom <= datum && (!p.validTo || p.validTo >= datum);
}

export function sparrStatus(s: BlockedPeriod, dag = idag()): BlockStatus {
  if (s.from.slice(0, 10) > dag) return 'UPCOMING';
  if (s.to && s.to.slice(0, 10) < dag) return 'ENDED';
  return 'ONGOING';
}

/** Spärren som gäller ett visst datum, om någon. */
export function sparrPa(p: IntegrationProfile, datum = idag()): BlockedPeriod | null {
  return p.blockedPeriods.find((s) => sparrStatus(s, datum) === 'ONGOING') ?? null;
}

export function sorteradeVersioner(k: PostingConfig): PostingConfigVersion[] {
  return [...k.versions].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
}

/** Senaste versionen med giltig från ≤ datum. */
export function versionPa(k: PostingConfig, datum: string): PostingConfigVersion | null {
  const tidigare = sorteradeVersioner(k).filter((v) => v.validFrom <= datum);
  return tidigare.length ? tidigare[tidigare.length - 1] : null;
}

export function gallandeVersion(k: PostingConfig, dag = idag()): PostingConfigVersion | null {
  return versionPa(k, dag);
}

/** Gällande: senaste med giltig från ≤ idag. Kommande: giltig från > idag. Tidigare: övriga. */
export function versionStatus(k: PostingConfig, v: PostingConfigVersion, dag = idag()): VersionStatus {
  if (v.validFrom > dag) return 'UPCOMING';
  return gallandeVersion(k, dag)?.id === v.id ? 'CURRENT' : 'PREVIOUS';
}

export function kommandeVersioner(k: PostingConfig, dag = idag()): PostingConfigVersion[] {
  return sorteradeVersioner(k).filter((v) => v.validFrom > dag);
}

/** Gällande och kommande versioner – de som räknas i "Används i" och i varningar. */
export function relevantaVersioner(k: PostingConfig, dag = idag()): PostingConfigVersion[] {
  const g = gallandeVersion(k, dag);
  return [...(g ? [g] : []), ...kommandeVersioner(k, dag)];
}

/** Sorterar mappningar i ekonomisystemets dimensionsordning. */
export function sorteraMappningar(mappningar: Mapping[], ordning: Category[]): Mapping[] {
  const index = (c: Category) => {
    const i = ordning.indexOf(c);
    return i < 0 ? ordning.length : i;
  };
  return [...mappningar].sort((a, b) => index(a.category) - index(b.category));
}

export function aktivaVarden(m: Mapping): AllowedValue[] {
  return m.values.filter((v) => v.status === 'ACTIVE');
}

/** Reskontraboken för ett flöde: AP vid utbetalning, AR vid inbetalning. */
export function reskontra(flode: Flow): TransactionType {
  return flode === 'UTB' ? 'AP' : 'AR';
}

/** Kort form av tillåtna dimensioner, t.ex. "DIM1–DIM7" eller "KODDEL1–KODDEL8". */
export function kategoriText(k: Category[]): string {
  const grupper = new Map<string, number[]>();
  const ovriga: string[] = [];
  for (const c of k) {
    const m = /^([A-Z]+)(\d+)$/.exec(c);
    if (m) grupper.set(m[1], [...(grupper.get(m[1]) ?? []), Number(m[2])]);
    else ovriga.push(c);
  }
  const delar: string[] = [];
  for (const [prefix, nr] of grupper) {
    nr.sort((a, b) => a - b);
    const sammanhangande = nr.every((n, i) => i === 0 || n === nr[i - 1] + 1);
    delar.push(
      sammanhangande && nr.length > 2
        ? `${prefix}${nr[0]}–${prefix}${nr[nr.length - 1]}`
        : nr.map((n) => `${prefix}${n}`).join(', '),
    );
  }
  return [...delar, ...ovriga].join(', ');
}

/* ---------- Kodsträng (avsnitt 7.4) ---------- */

export type KodDel = { dim: Category; varde: string; platshallare: boolean };
export interface KodRad {
  bok: TransactionType;
  delar: KodDel[];
  /** "AP: profilen har inte boken AP" eller "AR: inga attribut bokförs i AR" (K10). */
  varning?: string;
}

export function kodstrang(
  profil: IntegrationProfile,
  ordning: Category[],
  flode: Flow,
  varden: Record<string, string>,
): KodRad[] {
  const bocker: TransactionType[] = ['GL', reskontra(flode)];
  return bocker.map((bok): KodRad => {
    if (!profil.transactionTypes.includes(bok)) {
      return { bok, delar: [], varning: `${bok}: profilen har inte boken ${bok}` };
    }
    const delar = sorteraMappningar(profil.mappings, ordning)
      .filter((m) => m.bookIn.includes(bok))
      .map((m): KodDel => {
        switch (m.mode) {
          case 'SELECTABLE':
            return varden[m.attributeId]
              ? { dim: m.category, varde: varden[m.attributeId], platshallare: false }
              : { dim: m.category, varde: '‹ej vald›', platshallare: true };
          case 'FIXED':
            return { dim: m.category, varde: m.fixedValue ?? '‹ej vald›', platshallare: !m.fixedValue };
          case 'FROM_CASE':
            return { dim: m.category, varde: `‹${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']}›`, platshallare: true };
          case 'FOLLOWS_FLOW':
            return { dim: m.category, varde: flode, platshallare: false };
        }
      });
    return delar.length ? { bok, delar } : { bok, delar, varning: `${bok}: inga attribut bokförs i ${bok}` };
  });
}

/** Kodsträngen som ren text, en rad per bok. */
export function kodstrangText(rader: KodRad[]): string {
  return rader
    .map((r) => r.varning ?? `${r.bok}: ${r.delar.map((d) => `${d.dim} ${d.varde}`).join(' · ')}`)
    .join('\n');
}

/* ---------- Standardmappning (guiden steg 4 och "Lägg till attribut") ---------- */

/**
 * Förifylld mappning: första lediga tillåtna dimension, Bokförs i GL och läget Väljs i konteringen.
 * Undantag: Ärende-id och Motpart hämtas från ärendet, Valuta får fast värde SEK och Aktivitet följer flödet.
 */
export function standardMappning(
  attribut: SystemAttribute,
  ordning: Category[],
  upptagna: Category[],
  bocker: TransactionType[],
): Mapping {
  const kategori =
    ordning.find((k) => attribut.allowedCategories.includes(k) && !upptagna.includes(k)) ??
    attribut.allowedCategories[0];
  const bookIn: TransactionType[] = bocker.includes('GL') ? ['GL'] : bocker.slice(0, 1);
  const bas = { attributeId: attribut.id, category: kategori, bookIn, values: [] as AllowedValue[] };
  switch (attribut.id) {
    case 'arendeId':
      return { ...bas, mode: 'FROM_CASE', caseField: 'CASE_ID' };
    case 'motpart':
      return { ...bas, mode: 'FROM_CASE', caseField: 'COUNTERPART_CODE' };
    case 'valuta':
      return {
        ...bas,
        mode: 'FIXED',
        fixedValue: 'SEK',
        values: [{ code: 'SEK', name: 'Svenska kronor', validFrom: idag(), status: 'ACTIVE' }],
      };
    case 'aktivitet':
      return {
        ...bas,
        mode: 'FOLLOWS_FLOW',
        values: [
          { code: 'UTB', name: 'Utbetalning', validFrom: idag(), status: 'ACTIVE' },
          { code: 'INB', name: 'Inbetalning', validFrom: idag(), status: 'ACTIVE' },
        ],
      };
    default:
      return { ...bas, mode: 'SELECTABLE' };
  }
}

/** Fel för en mappning (P3–P7) i en profil. */
export function mappningsfel(
  m: Mapping,
  profil: Pick<IntegrationProfile, 'mappings' | 'transactionTypes'>,
  attribut: SystemAttribute | null,
  attributNamn: string,
): string[] {
  const fel: string[] = [];
  if (!m.category) fel.push(`${attributNamn}: Välj en dimension.`);
  else if (profil.mappings.some((x) => x.attributeId !== m.attributeId && x.category === m.category))
    fel.push(`${attributNamn}: ${m.category} används redan av ett annat attribut i profilen.`);
  if (attribut && m.category && !attribut.allowedCategories.includes(m.category))
    fel.push(`${attributNamn}: ${m.category} är inte tillåten för attributet.`);
  if (!m.bookIn.length) fel.push(`${attributNamn}: Välj minst en bok i Bokförs i.`);
  else if (m.bookIn.some((b) => !profil.transactionTypes.includes(b)))
    fel.push(`${attributNamn}: Bokförs i får bara innehålla profilens böcker.`);
  if (m.mode === 'FIXED' && !m.values.some((v) => v.code === m.fixedValue && v.status === 'ACTIVE'))
    fel.push(`${attributNamn}: Välj ett fast värde bland de aktiva värdena i värdelistan.`);
  if (m.mode === 'FROM_CASE' && !m.caseField) fel.push(`${attributNamn}: Välj vilket fält som hämtas från ärendet.`);
  if (m.mode === 'FOLLOWS_FLOW' && m.attributeId !== 'aktivitet')
    fel.push(`${attributNamn}: Följer flödet kan bara användas för Aktivitet.`);
  return fel;
}
