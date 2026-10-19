/* ============================================================
   Informationsmodell – Ekonomisk integration (NY)
   Fältnamn på engelska (som i NYPS-koden), allt i gränssnittet på svenska.
   ============================================================ */

export type Category = 'DIM1' | 'DIM2' | 'DIM3' | 'DIM4' | 'DIM5' | 'DIM6' | 'DIM7' | 'INVOICE_NO' | 'CURRENCY';
export type TransactionType = 'GL' | 'AP' | 'AR';
export type Flow = 'UTB' | 'INB';
export type Source = 'underlag' | 'example' | 'assumption';
export type ValueMode = 'SELECTABLE' | 'FIXED' | 'FROM_CASE' | 'FOLLOWS_FLOW';
export type CaseField = 'CASE_ID' | 'COUNTERPART_CODE';
export type ProfileStatus = 'DRAFT' | 'PLANNED' | 'ACTIVE' | 'ENDED';
export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type VersionStatus = 'CURRENT' | 'UPCOMING' | 'PREVIOUS';

export interface SystemAttribute {
  id: string;
  name: string;
  description: string;
  allowedCategories: Category[];
}

export interface EconomicSystem {
  id: string;
  name: string;
  description: string;
  attributes: SystemAttribute[];
  attributeDescriptionsSource?: Source;
  categories: { code: Category; label: string; description: string }[];
  transactionTypes: { code: TransactionType; label: string }[];
  flows: { code: Flow; label: string }[];
  caseFields: { code: CaseField; label: string }[];
  replacedSystemAttributes: { oldName: string; oldCode: string; oldValues: string; replacedBy: string }[];
}

/** Utbetalande organisation. */
export interface Organisation {
  id: string;
  nypsId: number | null;
  name: string;
  shortName: string;
}
/** Beslutande organisation (bara information). */
export interface DecidingOrganisation {
  id: string;
  name: string;
}
/** Finansieringsmedel (bara information). */
export interface FundingSource {
  id: string;
  anslag: string;
  uppdrag: string;
  deluppdrag: string | null;
  kontotyp: string | null;
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
  from: string;
  to: string | null;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface PostingProfile {
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
  blockedPeriods: BlockedPeriod[];
  notices: Notice[];
  source: Source;
  copyOf?: string;
}

export interface TemplateVersion {
  id: string;
  validFrom: string;
  validFromSource?: Source;
  changeReason: string | null;
  changeReasonSource?: Source;
  createdAt: string;
  /** attributeId → kod. Bara för mappningar med läget Väljs i konteringsmallen. */
  values: Record<string, string>;
  source: Source;
}

export interface PostingTemplate {
  id: string;
  name: string;
  profileId: string;
  flow: Flow;
  status: TemplateStatus;
  intendedFor: { fundingSourceId: string | null; decidingOrganisationId: string | null };
  legacyConsumptionAccount: 'Ja' | 'Nej' | null;
  versions: TemplateVersion[];
  notices: Notice[];
  source: Source;
}

export interface EiData {
  seedVersion: number;
  economicSystems: EconomicSystem[];
  organisations: Organisation[];
  decidingOrganisations: DecidingOrganisation[];
  fundingSources: FundingSource[];
  postingProfiles: PostingProfile[];
  postingTemplates: PostingTemplate[];
}

/* ---------- Seedens form (före tolkning) ---------- */

export interface SeedMapping extends Omit<Mapping, 'values'> {
  values: string[];
}
export interface SeedProfile
  extends Omit<PostingProfile, 'mappings' | 'blockedPeriods' | 'flows' | 'transactionTypes'> {
  flows?: Flow[];
  transactionTypes?: TransactionType[];
  mappings?: SeedMapping[];
  blockedPeriods?: BlockedPeriod[];
}
export interface SeedData {
  meta: { version: number; createdAt: string; sources: Record<Source, string> };
  economicSystems: EconomicSystem[];
  organisations: Organisation[];
  decidingOrganisations: DecidingOrganisation[];
  fundingSources: FundingSource[];
  valueNames: { source: Source } & Record<string, Record<string, string> | Source>;
  postingProfiles: SeedProfile[];
  postingTemplates: PostingTemplate[];
}

/* ============================================================
   Etiketter
   ============================================================ */

export const KATEGORI_ORDNING: Category[] = [
  'DIM1', 'DIM2', 'DIM3', 'DIM4', 'DIM5', 'DIM6', 'DIM7', 'INVOICE_NO', 'CURRENCY',
];
export const BOK_ORDNING: TransactionType[] = ['GL', 'AP', 'AR'];
export const FLODE_ORDNING: Flow[] = ['UTB', 'INB'];
export const LAGE_ORDNING: ValueMode[] = ['SELECTABLE', 'FIXED', 'FROM_CASE', 'FOLLOWS_FLOW'];

export const BOK_NAMN: Record<TransactionType, string> = {
  GL: 'Huvudbok',
  AP: 'Leverantörsreskontra',
  AR: 'Kundreskontra',
};
export const FLODE_NAMN: Record<Flow, string> = { UTB: 'Utbetalning', INB: 'Inbetalning' };

export const LAGE_NAMN: Record<ValueMode, string> = {
  SELECTABLE: 'Väljs i konteringsmallen',
  FIXED: 'Fast värde',
  FROM_CASE: 'Hämtas från ärendet',
  FOLLOWS_FLOW: 'Följer flödet',
};
/** Ursprung i konteringsmallens värdetabell. */
export const URSPRUNG_NAMN: Record<ValueMode, string> = {
  SELECTABLE: 'Vald i mallen',
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
export const MALLSTATUS_NAMN: Record<TemplateStatus, string> = {
  DRAFT: 'Utkast',
  ACTIVE: 'Aktiv',
  INACTIVE: 'Inaktiv',
};
export const VERSIONSTATUS_NAMN: Record<VersionStatus, string> = {
  CURRENT: 'Gällande',
  UPCOMING: 'Kommande',
  PREVIOUS: 'Tidigare',
};

/** Statusetiketter: Utkast grå, Planerad blå, Aktiv grön, Avslutad/Inaktiv dämpad. */
export function profilStatusKlass(s: ProfileStatus): string {
  switch (s) {
    case 'DRAFT':
      return 'bg-surface-neutral text-on-surface-neutral border border-border';
    case 'PLANNED':
      return 'bg-surface-info text-on-surface-info border border-border-info';
    case 'ACTIVE':
      return 'bg-surface-success text-on-surface-success border border-border-success';
    case 'ENDED':
      return 'bg-surface text-text-muted border border-border';
  }
}
export function mallStatusKlass(s: TemplateStatus): string {
  switch (s) {
    case 'DRAFT':
      return 'bg-surface-neutral text-on-surface-neutral border border-border';
    case 'ACTIVE':
      return 'bg-surface-success text-on-surface-success border border-border-success';
    case 'INACTIVE':
      return 'bg-surface text-text-muted border border-border';
  }
}
export function versionStatusKlass(s: VersionStatus): string {
  switch (s) {
    case 'CURRENT':
      return 'bg-surface-success text-on-surface-success border border-border-success';
    case 'UPCOMING':
      return 'bg-surface-info text-on-surface-info border border-border-info';
    case 'PREVIOUS':
      return 'bg-surface text-text-muted border border-border';
  }
}

/** Begrepp (avsnitt 2) – visas som informationsikon vid rubriker och kolumnrubriker. */
export const BEGREPP: Record<string, string> = {
  Ekonomisystem: 'Vad ett ekonomisystem kan ta emot. Sätts av utvecklare.',
  Konteringsprofil: 'Hur en utbetalande organisation konterar i sitt ekonomisystem.',
  Mappning:
    'En rad i profilen: ett attribut kopplat till en Agresso-dimension, med böcker, värdeläge och värdelista.',
  Attribut: 'Ett konteringsbegrepp, till exempel Verksamhet.',
  'Agresso-dimension': 'Plats i kodsträngen: DIM1–DIM7, INVOICE_NO, CURRENCY.',
  'Bokförs i':
    'Vilka böcker attributet följer med till: Huvudbok (GL), Leverantörsreskontra (AP), Kundreskontra (AR). Flerval.',
  Värdelista: 'De tillåtna värdena för ett attribut i en profil.',
  'Värde i kontering':
    'Hur attributets värde bestäms: Väljs i konteringsmallen, Fast värde, Hämtas från ärendet eller Följer flödet.',
  Flöde: 'Utbetalning (UTB) eller Inbetalning (INB).',
  Konteringsmall: 'En namngiven uppsättning valda värden inom en profil, med versioner.',
  Version:
    'En konteringsmall har versioner med "giltig från". Den version som gäller på utbetalningsdagen används.',
  Kodsträng: 'Förhandsvisning av raden som skickas till Agresso, en per bok.',
  'Utbetalande organisation': 'Organisationen som betalar ut och äger konteringsprofilen.',
  'Beslutande organisation': 'Organisationen som beslutar om stödet. Bara ett informationsfält i prototypen.',
};

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
export function profilStatus(p: PostingProfile, dag = idag()): ProfileStatus {
  if (p.status === 'DRAFT') return 'DRAFT';
  if (p.validTo && p.validTo < dag) return 'ENDED';
  if (p.status === 'ENDED') return 'ENDED';
  if (p.validFrom <= dag) return 'ACTIVE';
  return 'PLANNED';
}

export function sorteradeVersioner(t: PostingTemplate): TemplateVersion[] {
  return [...t.versions].sort((a, b) => a.validFrom.localeCompare(b.validFrom));
}

/** Gällande: senaste med giltig från ≤ idag. Kommande: giltig från > idag. Tidigare: övriga. */
export function versionStatus(t: PostingTemplate, v: TemplateVersion, dag = idag()): VersionStatus {
  if (v.validFrom > dag) return 'UPCOMING';
  return gallandeVersion(t, dag)?.id === v.id ? 'CURRENT' : 'PREVIOUS';
}

export function gallandeVersion(t: PostingTemplate, dag = idag()): TemplateVersion | null {
  const tidigare = sorteradeVersioner(t).filter((v) => v.validFrom <= dag);
  return tidigare.length ? tidigare[tidigare.length - 1] : null;
}

export function kommandeVersioner(t: PostingTemplate, dag = idag()): TemplateVersion[] {
  return sorteradeVersioner(t).filter((v) => v.validFrom > dag);
}

/** Gällande och kommande versioner – de som räknas i "Används i" och i varningar. */
export function relevantaVersioner(t: PostingTemplate, dag = idag()): TemplateVersion[] {
  const g = gallandeVersion(t, dag);
  return [...(g ? [g] : []), ...kommandeVersioner(t, dag)];
}

export function sorteradeMappningar(p: PostingProfile): Mapping[] {
  return [...p.mappings].sort(
    (a, b) => KATEGORI_ORDNING.indexOf(a.category) - KATEGORI_ORDNING.indexOf(b.category),
  );
}

export function aktivaVarden(m: Mapping): AllowedValue[] {
  return m.values.filter((v) => v.status === 'ACTIVE');
}

/* ---------- Kodsträng (avsnitt 7.4) ---------- */

export type KodDel = { dim: Category; varde: string; platshallare: boolean };
export interface KodRad {
  bok: TransactionType;
  delar: KodDel[];
}

export function kodstrang(
  profil: PostingProfile,
  flode: Flow,
  varden: Record<string, string>,
): KodRad[] {
  const bocker = BOK_ORDNING.filter((b) => profil.transactionTypes.includes(b));
  return bocker.map((bok) => ({
    bok,
    delar: sorteradeMappningar(profil)
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
            return {
              dim: m.category,
              varde: `‹${ARENDEFALT_NAMN[m.caseField ?? 'CASE_ID']}›`,
              platshallare: true,
            };
          case 'FOLLOWS_FLOW':
            return { dim: m.category, varde: flode, platshallare: false };
        }
      }),
  }));
}

/** Kodsträngen som ren text, en rad per bok. */
export function kodstrangText(rader: KodRad[]): string {
  return rader
    .map((r) =>
      r.delar.length
        ? `${r.bok}: ${r.delar.map((d) => `${d.dim} ${d.varde}`).join(' · ')}`
        : `${r.bok}: används inte av något attribut`,
    )
    .join('\n');
}

/* ---------- Standardmappning (guiden steg 4 och "Lägg till attribut") ---------- */

/**
 * Förifylld mappning: första lediga tillåtna dimension, Bokförs i GL och läget Väljs i konteringsmallen.
 * Undantag: Ärende-id och Motpart hämtas från ärendet, Valuta får fast värde SEK och Aktivitet följer flödet.
 */
export function standardMappning(
  attribut: SystemAttribute,
  upptagna: Category[],
  bocker: TransactionType[],
): Mapping {
  const kategori =
    KATEGORI_ORDNING.find((k) => attribut.allowedCategories.includes(k) && !upptagna.includes(k)) ??
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
  profil: Pick<PostingProfile, 'mappings' | 'transactionTypes'>,
  attribut: SystemAttribute | null,
  attributNamn: string,
): string[] {
  const fel: string[] = [];
  if (!m.category) fel.push(`${attributNamn}: Välj en Agresso-dimension.`);
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
