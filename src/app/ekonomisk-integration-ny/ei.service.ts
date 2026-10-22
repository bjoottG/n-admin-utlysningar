import { Injectable, computed, signal } from '@angular/core';
import { DataLage, ersattNamnDjupt, lasDataLage } from '../delade/datalage';
import { SEED } from './ei-seed';
import {
  AllowedValue,
  BlockedPeriod,
  Category,
  EconomicSystem,
  EiData,
  FLODE_NAMN,
  Flow,
  IntegrationProfile,
  KodRad,
  Mapping,
  PostingConfig,
  PostingConfigVersion,
  SeedData,
  SystemAttribute,
  TechnicalProperty,
  aktivaVarden,
  giltighetText,
  idag,
  kodstrang,
  nu,
  plusDagar,
  profilAktivPa,
  profilStatus,
  relevantaVersioner,
  reskontra,
  sorteraMappningar,
  sorteradeVersioner,
  sparrPa,
  versionPa,
} from './ei-modell';

const NYCKEL_PREFIX = 'nypsAdmin.ekonomiskIntegrationNy';
/** Data från version 1 (konteringsmallar) – tas bort vid start. */
const GAMMAL_NYCKEL = `${NYCKEL_PREFIX}.data`;
const dataNyckel = (lage: DataLage) => `${NYCKEL_PREFIX}.data.${lage}`;

export type ProfilFlik = 'oversikt' | 'mappning' | 'vardelistor' | 'konteringar' | 'sparr';

export interface ProfilVarning {
  regel: string;
  text: string;
  flik: ProfilFlik;
  attributId?: string;
}
export interface KonteringVarning {
  regel: 'K3' | 'K7' | 'K8' | 'K9' | 'K10';
  text: string;
}

export interface Uppslagsresultat {
  traffar: PostingConfig[];
  kontering: PostingConfig | null;
  version: PostingConfigVersion | null;
  profil: IntegrationProfile | null;
  rader: KodRad[];
  fel: string | null;
  varningar: string[];
}

/* ============================================================
   Tolkning av seed (avsnitt 11)
   ============================================================ */

/** Skapar det anonymiserade datasetet ur seed (avsnitt 11.2). */
export function anonymiseraSeed(seed: SeedData): SeedData {
  const { anonymization: a, ...rest } = structuredClone(seed);
  const kod = (attributId: string, k: string) => a.codes[attributId]?.[k] ?? k;
  rest.organisations = rest.organisations.map((o) => ({
    ...o,
    shortName: a.organisationShortNames[o.id] ?? o.shortName,
    nypsId: null,
  }));
  rest.integrationProfiles = rest.integrationProfiles.map((p) => ({
    ...p,
    mappings: p.mappings?.map((m) => ({
      ...m,
      values: m.values.map((v) => kod(m.attributeId, v)),
      ...(m.fixedValue ? { fixedValue: kod(m.attributeId, m.fixedValue) } : {}),
    })),
  }));
  rest.postingConfigs = rest.postingConfigs.map((k) => ({
    ...k,
    versions: k.versions.map((v) => ({
      ...v,
      values: Object.fromEntries(Object.entries(v.values).map(([attr, x]) => [attr, kod(attr, x)])),
    })),
  }));
  return { ...ersattNamnDjupt(rest), anonymization: a };
}

export function normaliseraSeed(seed: SeedData): EiData {
  const namnSource = seed.valueNames.source;
  const namnFor = (attributId: string, kod: string): string | undefined => {
    const lista = seed.valueNames[attributId];
    return typeof lista === 'object' ? lista[kod] : undefined;
  };

  const profiler: IntegrationProfile[] = seed.integrationProfiles
    .filter((sp) => !sp.copyOf)
    .map((sp) => ({
      ...structuredClone(sp),
      flows: sp.flows ?? [],
      transactionTypes: sp.transactionTypes ?? [],
      technicalProperties: structuredClone(sp.technicalProperties ?? []),
      blockedPeriods: structuredClone(sp.blockedPeriods ?? []),
      mappings: (sp.mappings ?? []).map((m) => ({
        ...m,
        values: m.values.map((kod): AllowedValue => {
          const namn = namnFor(m.attributeId, kod);
          return {
            code: kod,
            ...(namn ? { name: namn, nameSource: namnSource } : {}),
            validFrom: sp.validFrom,
            status: 'ACTIVE',
          };
        }),
      })),
    }));

  // Kopior: djup kopia av flöden, böcker, mappningar, värdelistor och tekniska egenskaper.
  // Kopians egna fält behålls. Spärrperioder kopieras inte.
  for (const sp of seed.integrationProfiles.filter((p) => p.copyOf)) {
    const original = profiler.find((p) => p.id === sp.copyOf);
    if (!original) continue;
    profiler.push({
      ...structuredClone(sp),
      flows: structuredClone(original.flows),
      transactionTypes: structuredClone(original.transactionTypes),
      mappings: structuredClone(original.mappings),
      technicalProperties: structuredClone(original.technicalProperties),
      blockedPeriods: structuredClone(sp.blockedPeriods ?? []),
    });
  }

  return {
    seedVersion: seed.meta.version,
    economicSystems: structuredClone(seed.economicSystems),
    organisations: structuredClone(seed.organisations),
    decidingOrganisations: structuredClone(seed.decidingOrganisations),
    fundingSources: structuredClone(seed.fundingSources),
    integrationProfiles: seed.integrationProfiles.map((sp) => profiler.find((p) => p.id === sp.id)!).filter(Boolean),
    postingConfigs: structuredClone(seed.postingConfigs),
  };
}

export function exempeldata(lage: DataLage): EiData {
  return normaliseraSeed(lage === 'anonymiserade' ? anonymiseraSeed(SEED) : SEED);
}

function lasSparat(lage: DataLage): EiData | null {
  try {
    localStorage.removeItem(GAMMAL_NYCKEL);
    const text = localStorage.getItem(dataNyckel(lage));
    if (!text) return null;
    const data = JSON.parse(text) as EiData;
    return data.seedVersion === SEED.meta.version ? data : null;
  } catch {
    return null;
  }
}

export function nyttId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function overlappar(aFran: string, aTill: string | null, bFran: string, bTill: string | null): boolean {
  const aSlut = aTill ?? '9999-12-31';
  const bSlut = bTill ?? '9999-12-31';
  return aFran <= bSlut && bFran <= aSlut;
}

/* ============================================================
   Tjänst
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class EkonomiskIntegrationService {
  /** Dataläget läses vid start. Byte laddar om sidan (se delade/datalage.ts). */
  readonly lage = lasDataLage();
  readonly anonymiserat = this.lage === 'anonymiserade';
  readonly data = signal<EiData>(lasSparat(this.lage) ?? exempeldata(this.lage));

  readonly system = computed(() => this.data().economicSystems);
  readonly organisationer = computed(() => this.data().organisations);
  readonly beslutandeOrganisationer = computed(() => this.data().decidingOrganisations);
  readonly finansieringsmedel = computed(() => this.data().fundingSources);
  readonly profiler = computed(() => this.data().integrationProfiles);
  readonly konteringar = computed(() => this.data().postingConfigs);

  /** Profiler som är spärrade idag (6.8). */
  readonly sparradeProfiler = computed(() => this.profiler().filter((p) => !!sparrPa(p)));

  /** Kort bekräftelse efter sparning ("Konteringen har sparats."). */
  readonly bekraftelse = signal<string | null>(null);
  private bekraftelseTimer: ReturnType<typeof setTimeout> | undefined;

  /* ---------- Spara / återställ ---------- */

  private uppdatera(fn: (d: EiData) => EiData): void {
    this.data.update(fn);
    try {
      localStorage.setItem(dataNyckel(this.lage), JSON.stringify(this.data()));
    } catch {
      // localStorage kan vara blockerad – ändringarna gäller då bara under sidvisningen
    }
  }

  /** Återställer bara det aktiva dataläget. */
  aterstallExempeldata(): void {
    this.uppdatera(() => exempeldata(this.lage));
    this.visaBekraftelse('Exempeldatan har återställts.');
  }

  visaBekraftelse(text: string): void {
    this.bekraftelse.set(text);
    clearTimeout(this.bekraftelseTimer);
    this.bekraftelseTimer = setTimeout(() => this.bekraftelse.set(null), 4000);
  }

  /* ---------- Uppslag av objekt ---------- */

  hamtaSystem(id: string | null): EconomicSystem | null {
    return this.system().find((s) => s.id === id) ?? null;
  }
  hamtaOrg(id: string | null) {
    return this.organisationer().find((o) => o.id === id) ?? null;
  }
  hamtaBeslutande(id: string | null) {
    return this.beslutandeOrganisationer().find((o) => o.id === id) ?? null;
  }
  hamtaFinansieringsmedel(id: string | null) {
    return this.finansieringsmedel().find((f) => f.id === id) ?? null;
  }
  hamtaProfil(id: string | null) {
    return this.profiler().find((p) => p.id === id) ?? null;
  }
  hamtaKontering(id: string | null) {
    return this.konteringar().find((k) => k.id === id) ?? null;
  }
  hamtaAttribut(profil: IntegrationProfile, attributId: string): SystemAttribute | null {
    return this.hamtaSystem(profil.economicSystemId)?.attributes.find((a) => a.id === attributId) ?? null;
  }
  attributNamn(profil: IntegrationProfile, attributId: string): string {
    return this.hamtaAttribut(profil, attributId)?.name ?? attributId;
  }
  systemNamn(profil: IntegrationProfile | null): string {
    return this.hamtaSystem(profil?.economicSystemId ?? null)?.name ?? '';
  }
  /** Profil från underlaget, alltså en som migreras från dagens system (inte skapad i prototypen). */
  migrerad(profil: IntegrationProfile): boolean {
    return profil.source === 'underlag' && SEED.integrationProfiles.some((p) => p.id === profil.id);
  }
  harIntegration(profil: Pick<IntegrationProfile, 'economicSystemId'>): boolean {
    return this.hamtaSystem(profil.economicSystemId)?.integrationStatus === 'AVAILABLE';
  }

  /** Dimensionsordningen i profilens ekonomisystem. */
  ordning(profil: Pick<IntegrationProfile, 'economicSystemId'>): Category[] {
    return this.hamtaSystem(profil.economicSystemId)?.categories.map((c) => c.code) ?? [];
  }
  sorteradeMappningar(profil: IntegrationProfile): Mapping[] {
    return sorteraMappningar(profil.mappings, this.ordning(profil));
  }
  kodstrang(profil: IntegrationProfile, flode: Flow, varden: Record<string, string>): KodRad[] {
    return kodstrang(profil, this.ordning(profil), flode, varden);
  }

  profilerFor(orgId: string): IntegrationProfile[] {
    return this.profiler().filter((p) => p.organisationId === orgId);
  }
  konteringarFor(profilId: string): PostingConfig[] {
    return this.konteringar().filter((k) => k.profileId === profilId);
  }

  /** Tekniska egenskaper för en ny profil: samma nycklar som andra profiler mot systemet, utan värden. */
  standardEgenskaper(systemId: string): TechnicalProperty[] {
    const forebild = this.profiler().find((p) => p.economicSystemId === systemId && p.technicalProperties.length);
    return (forebild?.technicalProperties ?? []).map((t) => ({ ...t, value: null }));
  }

  /* ---------- Konteringens namn (räknas fram ur nyckeln) ---------- */

  konteringNamn(k: Pick<PostingConfig, 'fundingSourceId' | 'decidingOrganisationId' | 'flow'>): string {
    return [
      this.hamtaFinansieringsmedel(k.fundingSourceId)?.shortName ?? '–',
      this.hamtaBeslutande(k.decidingOrganisationId)?.name ?? '–',
      FLODE_NAMN[k.flow],
    ].join(' · ');
  }

  /** K2: en kontering (Utkast eller Aktiv) med samma nyckel i hela systemet. */
  hittaDubblett(
    nyckel: Pick<PostingConfig, 'fundingSourceId' | 'decidingOrganisationId' | 'flow'>,
    egetId: string | null,
  ): PostingConfig | null {
    return (
      this.konteringar().find(
        (k) =>
          k.id !== egetId &&
          k.status !== 'INACTIVE' &&
          k.fundingSourceId === nyckel.fundingSourceId &&
          k.decidingOrganisationId === nyckel.decidingOrganisationId &&
          k.flow === nyckel.flow,
      ) ?? null
    );
  }

  /* ---------- "Används i" (gällande eller kommande versioner) ---------- */

  konteringarSomAnvanderAttribut(profilId: string, attributId: string): PostingConfig[] {
    return this.konteringarFor(profilId).filter((k) => relevantaVersioner(k).some((v) => !!v.values[attributId]));
  }

  konteringarSomAnvanderVarde(profilId: string, attributId: string, kod: string): PostingConfig[] {
    const s = kod.trim().toLowerCase();
    return this.konteringarFor(profilId).filter((k) =>
      relevantaVersioner(k).some((v) => (v.values[attributId] ?? '').toLowerCase() === s),
    );
  }

  /** Konteringar som påverkas av en ändrad mappning: alla i profilen som inte är inaktiva (P12). */
  paverkadeKonteringar(profilId: string): PostingConfig[] {
    return this.konteringarFor(profilId).filter((k) => k.status !== 'INACTIVE');
  }

  /* ---------- Varningar (avsnitt 8) ---------- */

  konteringVarningar(k: PostingConfig): KonteringVarning[] {
    const profil = this.hamtaProfil(k.profileId);
    if (!profil) return [];
    const ut: KonteringVarning[] = [];
    const lagg = (v: KonteringVarning) => {
      if (!ut.some((x) => x.text === v.text)) ut.push(v);
    };
    const system = this.hamtaSystem(profil.economicSystemId);

    // K9
    if (profilStatus(profil) === 'ENDED') {
      lagg({ regel: 'K9', text: `Integrationsprofilen ${profil.name} är avslutad.` });
    } else if (profil.status === 'DRAFT' && system?.integrationStatus === 'NOT_AVAILABLE') {
      lagg({
        regel: 'K9',
        text: `Integrationsprofilen ${profil.name} är ett utkast mot ${system.name}, som saknar integration. Konteringen kan inte användas vid utbetalning.`,
      });
    }

    // K10
    const bok = reskontra(k.flow);
    if (!profil.transactionTypes.includes(bok)) {
      lagg({ regel: 'K10', text: `Integrationsprofilen har inte boken ${bok}. Reskontraraden kan inte skapas.` });
    } else if (!profil.mappings.some((m) => m.bookIn.includes(bok))) {
      lagg({ regel: 'K10', text: `Inga attribut bokförs i ${bok}. Reskontraraden blir tom.` });
    }

    // K3, K7, K8
    const versioner = relevantaVersioner(k);
    const attKolla = versioner.length ? versioner : sorteradeVersioner(k).slice(-1);
    for (const v of attKolla) {
      for (const m of profil.mappings.filter((x) => x.mode === 'SELECTABLE')) {
        const namn = this.attributNamn(profil, m.attributeId);
        const kod = v.values[m.attributeId];
        if (!kod) {
          if (k.status === 'ACTIVE') {
            lagg({ regel: 'K8', text: `Behöver ses över: ${namn} väljs nu i konteringen men saknar värde.` });
          } else {
            lagg({
              regel: 'K3',
              text: !aktivaVarden(m).length
                ? `${namn} saknar värde, och värdelistan i integrationsprofilen har inga aktiva värden. Konteringen kan inte aktiveras.`
                : `${namn} saknar värde. Alla valbara fält måste ha ett värde innan konteringen kan aktiveras.`,
            });
          }
          continue;
        }
        const varde = m.values.find((x) => x.code === kod);
        if (!varde) {
          lagg({ regel: 'K8', text: `Behöver ses över: ${namn} ${kod} finns inte längre i värdelistan.` });
        } else if (varde.status === 'INACTIVE') {
          lagg({ regel: 'K7', text: `${namn} ${kod} är inaktivt i värdelistan.` });
        }
      }
      for (const attributId of Object.keys(v.values)) {
        const m = profil.mappings.find((x) => x.attributeId === attributId);
        if (!m || m.mode !== 'SELECTABLE') {
          lagg({
            regel: 'K8',
            text: `Behöver ses över: ${this.attributNamn(profil, attributId)} väljs inte längre i konteringen.`,
          });
        }
      }
    }
    return ut;
  }

  profilVarningar(p: IntegrationProfile): ProfilVarning[] {
    const ut: ProfilVarning[] = [];
    for (const m of p.mappings) {
      const namn = this.attributNamn(p, m.attributeId);
      if (m.mode === 'SELECTABLE' && aktivaVarden(m).length === 0) {
        ut.push({ regel: 'P8', text: `${namn}: Inga värden att välja.`, flik: 'vardelistor', attributId: m.attributeId });
      }
      if (m.mode === 'FIXED' && !aktivaVarden(m).some((v) => v.code === m.fixedValue)) {
        ut.push({ regel: 'P6', text: `${namn}: Det fasta värdet finns inte bland de aktiva värdena.`, flik: 'mappning' });
      }
    }
    for (const v of this.bokVarningar(p)) ut.push({ regel: 'P14', text: v, flik: 'oversikt' });
    for (const v of this.overlappOchGlapp(p)) ut.push(v);
    const medVarning = this.konteringarFor(p.id).filter((k) => this.konteringVarningar(k).length > 0).length;
    if (medVarning) {
      ut.push({
        regel: 'K',
        text: `${medVarning} ${medVarning === 1 ? 'kontering har' : 'konteringar har'} varningar.`,
        flik: 'konteringar',
      });
    }
    return ut;
  }

  /** P14: flödet Utbetalning utan boken AP, eller Inbetalning utan AR. */
  bokVarningar(p: Pick<IntegrationProfile, 'flows' | 'transactionTypes'>): string[] {
    const ut: string[] = [];
    if (p.flows.includes('UTB') && !p.transactionTypes.includes('AP'))
      ut.push('Profilen har flödet Utbetalning men inte boken Leverantörsreskontra (AP). Reskontraraden kan inte skapas.');
    if (p.flows.includes('INB') && !p.transactionTypes.includes('AR'))
      ut.push('Profilen har flödet Inbetalning men inte boken Kundreskontra (AR). Reskontraraden kan inte skapas.');
    return ut;
  }

  private overlappOchGlapp(p: IntegrationProfile): ProfilVarning[] {
    if (p.status === 'DRAFT') return [];
    const ut: ProfilVarning[] = [];
    const andra = this.profilerFor(p.organisationId).filter((o) => o.id !== p.id && o.status !== 'DRAFT');
    for (const o of andra) {
      if (overlappar(p.validFrom, p.validTo, o.validFrom, o.validTo)) {
        ut.push({ regel: 'P9', text: `Överlappar med ${o.name} (${giltighetText(o.validFrom, o.validTo)}).`, flik: 'oversikt' });
      }
    }
    const foregaende = andra
      .filter((o) => o.validTo && o.validTo < p.validFrom)
      .sort((a, b) => (b.validTo ?? '').localeCompare(a.validTo ?? ''))[0];
    if (foregaende?.validTo && plusDagar(foregaende.validTo, 1) < p.validFrom) {
      ut.push({
        regel: 'P10',
        text: `Glapp: ${foregaende.name} slutar ${foregaende.validTo} men den här profilen börjar ${p.validFrom}. Däremellan kan organisationen inte betala ut.`,
        flik: 'oversikt',
      });
    }
    return ut;
  }

  /* ---------- Testa uppslag (7.5) ---------- */

  testaUppslag(fundingSourceId: string, decidingOrganisationId: string, flow: Flow, datum: string): Uppslagsresultat {
    const tomt: Uppslagsresultat = { traffar: [], kontering: null, version: null, profil: null, rader: [], fel: null, varningar: [] };
    const traffar = this.konteringar().filter(
      (k) =>
        k.fundingSourceId === fundingSourceId &&
        k.decidingOrganisationId === decidingOrganisationId &&
        k.flow === flow &&
        k.status === 'ACTIVE',
    );
    if (!traffar.length)
      return { ...tomt, fel: 'Ingen kontering matchar. En utbetalning med de här värdena kan inte konteras.' };
    if (traffar.length > 1)
      return { ...tomt, traffar, fel: 'Flera konteringar matchar. Det ska inte kunna hända (regel K2).' };
    const kontering = traffar[0];
    const profil = this.hamtaProfil(kontering.profileId);
    const version = versionPa(kontering, datum);
    if (!version) return { ...tomt, traffar, kontering, profil, fel: `Konteringen har ingen version som gäller ${datum}.` };
    const varningar: string[] = [];
    if (profil && !profilAktivPa(profil, datum)) varningar.push(`Integrationsprofilen är inte aktiv ${datum}.`);
    const sparr = profil ? sparrPa(profil, datum) : null;
    if (sparr) varningar.push(`Integrationsprofilen är spärrad ${datum}. Orsak: ${sparr.reason}`);
    return {
      traffar,
      kontering,
      version,
      profil,
      rader: profil ? this.kodstrang(profil, kontering.flow, version.values) : [],
      fel: null,
      varningar,
    };
  }

  /* ---------- Livscykel (6.10) ---------- */

  /**
   * Kontrollerar om en profil kan börja gälla `datum`.
   * Returnerar fel (blockerar) eller en profil som föreslås avslutas dagen före.
   */
  kontrolleraAktivering(p: IntegrationProfile, datum: string): { fel: string[]; avsluta: IntegrationProfile | null } {
    const fel: string[] = [];
    const system = this.hamtaSystem(p.economicSystemId);
    if (system?.integrationStatus === 'NOT_AVAILABLE') {
      fel.push(`Det finns ingen integration för ${system.name}. Profilen kan bara sparas som utkast.`);
    }
    const tomma = p.mappings
      .filter((m) => m.mode === 'SELECTABLE' && aktivaVarden(m).length === 0)
      .map((m) => this.attributNamn(p, m.attributeId));
    if (tomma.length) {
      fel.push(`${tomma.join(', ')} har inga aktiva värden att välja. Lägg till värden innan profilen aktiveras.`);
    }
    for (const f of this.grundfel(p)) fel.push(f);
    let avsluta: IntegrationProfile | null = null;
    const andra = this.profilerFor(p.organisationId).filter((o) => o.id !== p.id && o.status !== 'DRAFT');
    for (const o of andra) {
      if (!overlappar(datum, p.validTo, o.validFrom, o.validTo)) continue;
      if (profilStatus(o) !== 'ENDED' && o.validFrom < datum && !avsluta) {
        avsluta = o;
      } else {
        fel.push(
          `Överlappar med ${o.name} (${giltighetText(o.validFrom, o.validTo)}). Två integrationsprofiler för samma organisation får inte gälla samma dag.`,
        );
      }
    }
    return { fel, avsluta };
  }

  /** P1 och P2. */
  grundfel(p: Pick<IntegrationProfile, 'id' | 'name' | 'organisationId' | 'flows' | 'transactionTypes'>): string[] {
    const fel: string[] = [];
    if (!p.name.trim()) fel.push('Ange ett namn.');
    else if (this.namnUpptagetProfil(p.name, p.organisationId, p.id))
      fel.push('Namnet används redan av en annan integrationsprofil för organisationen.');
    if (!p.flows.length) fel.push('Välj minst ett flöde.');
    if (!p.transactionTypes.length) fel.push('Välj minst en bok.');
    return fel;
  }

  namnUpptagetProfil(namn: string, orgId: string, egetId: string | null): boolean {
    const n = namn.trim().toLowerCase();
    return this.profilerFor(orgId).some((p) => p.id !== egetId && p.name.trim().toLowerCase() === n);
  }

  /** Sätter giltig från och status (Planerad eller Aktiv). Avslutar ev. föregående profil dagen före. */
  aktivera(profilId: string, datum: string, avslutaId: string | null): void {
    this.uppdatera((d) => ({
      ...d,
      integrationProfiles: d.integrationProfiles.map((p) => {
        if (p.id === profilId) {
          const { validFromSource: _, ...rest } = p;
          return { ...rest, validFrom: datum, status: datum <= idag() ? 'ACTIVE' : 'PLANNED' };
        }
        if (p.id === avslutaId) return { ...p, validTo: plusDagar(datum, -1) };
        return p;
      }),
    }));
  }

  /* ---------- Ändringar: profiler ---------- */

  sparaProfil(p: IntegrationProfile, bekraftelse = 'Integrationsprofilen har sparats.'): void {
    this.uppdatera((d) => ({
      ...d,
      integrationProfiles: d.integrationProfiles.some((x) => x.id === p.id)
        ? d.integrationProfiles.map((x) => (x.id === p.id ? p : x))
        : [...d.integrationProfiles, p],
    }));
    if (bekraftelse) this.visaBekraftelse(bekraftelse);
  }

  andraProfil(id: string, fn: (p: IntegrationProfile) => IntegrationProfile, bekraftelse?: string): void {
    const p = this.hamtaProfil(id);
    if (p) this.sparaProfil(fn(p), bekraftelse);
  }

  andraMappning(profilId: string, attributId: string, fn: (m: Mapping) => Mapping, bekraftelse?: string): void {
    this.andraProfil(
      profilId,
      (p) => ({ ...p, mappings: p.mappings.map((m) => (m.attributeId === attributId ? fn(m) : m)) }),
      bekraftelse,
    );
  }

  taBortProfil(id: string): void {
    this.uppdatera((d) => ({ ...d, integrationProfiles: d.integrationProfiles.filter((p) => p.id !== id) }));
    this.visaBekraftelse('Integrationsprofilen har tagits bort.');
  }

  /** Profiler som "Stoppa alla utbetalningar" påverkar: de som är aktiva idag. */
  readonly aktivaProfiler = computed(() => this.profiler().filter((p) => profilStatus(p) === 'ACTIVE'));

  /** 6.9: en spärrperiod på varje aktiv profil, från nu och tills vidare. */
  stoppaAlla(orsak: string): number {
    const ids = new Set(this.aktivaProfiler().map((p) => p.id));
    const fran = nu();
    this.uppdatera((d) => ({
      ...d,
      integrationProfiles: d.integrationProfiles.map((p) =>
        ids.has(p.id)
          ? {
              ...p,
              blockedPeriods: [
                ...p.blockedPeriods,
                { id: nyttId('sp'), from: fran, to: null, reason: orsak, createdBy: 'Demo Demon', createdAt: idag() } satisfies BlockedPeriod,
              ],
            }
          : p,
      ),
    }));
    this.visaBekraftelse(`Utbetalningar har stoppats för ${ids.size} integrationsprofil(er).`);
    return ids.size;
  }

  /* ---------- Ändringar: konteringar ---------- */

  sparaKontering(k: PostingConfig, bekraftelse = 'Konteringen har sparats.'): void {
    this.uppdatera((d) => ({
      ...d,
      postingConfigs: d.postingConfigs.some((x) => x.id === k.id)
        ? d.postingConfigs.map((x) => (x.id === k.id ? k : x))
        : [...d.postingConfigs, k],
    }));
    if (bekraftelse) this.visaBekraftelse(bekraftelse);
  }

  /** K3: valbara fält som saknar aktivt värde. Tom lista = kan aktiveras. */
  saknadeVarden(profil: IntegrationProfile, values: Record<string, string>): string[] {
    return profil.mappings
      .filter((m) => m.mode === 'SELECTABLE')
      .filter((m) => {
        const kod = values[m.attributeId];
        return !kod || !aktivaVarden(m).some((v) => v.code === kod);
      })
      .map((m) => this.attributNamn(profil, m.attributeId));
  }
}
