import { Injectable, computed, signal } from '@angular/core';
import { SEED } from './ei-seed';
import {
  AllowedValue,
  EiData,
  Mapping,
  PostingProfile,
  PostingTemplate,
  SeedData,
  SystemAttribute,
  aktivaVarden,
  giltighetText,
  idag,
  plusDagar,
  profilStatus,
  relevantaVersioner,
  sorteradeVersioner,
} from './ei-modell';

const DATA_NYCKEL = 'nypsAdmin.ekonomiskIntegrationNy.data';
const TRAPPA_NYCKEL = 'nypsAdmin.ekonomiskIntegrationNy.trappaHopfalld';

export type ProfilFlik = 'oversikt' | 'mappning' | 'vardelistor' | 'mallar' | 'sparr';

export interface ProfilVarning {
  regel: string;
  text: string;
  flik: ProfilFlik;
  attributId?: string;
}
export interface MallVarning {
  regel: 'M2' | 'M6' | 'M7' | 'M8';
  text: string;
}

/* ============================================================
   Tolkning av seed (avsnitt 11)
   ============================================================ */

export function normaliseraSeed(seed: SeedData): EiData {
  const namnSource = seed.valueNames.source;
  const namnFor = (attributId: string, kod: string): string | undefined => {
    const lista = seed.valueNames[attributId];
    return typeof lista === 'object' ? lista[kod] : undefined;
  };

  const profiler: PostingProfile[] = seed.postingProfiles
    .filter((sp) => !sp.copyOf)
    .map((sp) => ({
      ...sp,
      flows: sp.flows ?? [],
      transactionTypes: sp.transactionTypes ?? [],
      blockedPeriods: sp.blockedPeriods ?? [],
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

  // Kopior: djup kopia av flöden, böcker, mappningar och värdelistor – kopians egna fält behålls.
  for (const sp of seed.postingProfiles.filter((p) => p.copyOf)) {
    const original = profiler.find((p) => p.id === sp.copyOf);
    if (!original) continue;
    profiler.push({
      ...sp,
      flows: structuredClone(original.flows),
      transactionTypes: structuredClone(original.transactionTypes),
      mappings: structuredClone(original.mappings),
      blockedPeriods: sp.blockedPeriods ?? [],
    });
  }

  return {
    seedVersion: seed.meta.version,
    economicSystems: structuredClone(seed.economicSystems),
    organisations: structuredClone(seed.organisations),
    decidingOrganisations: structuredClone(seed.decidingOrganisations),
    fundingSources: structuredClone(seed.fundingSources),
    // Behåll seedens ordning (kopian låg sist i seed men ska ligga på sin plats).
    postingProfiles: seed.postingProfiles.map((sp) => profiler.find((p) => p.id === sp.id)!).filter(Boolean),
    postingTemplates: structuredClone(seed.postingTemplates),
  };
}

function lasSparat(): EiData | null {
  try {
    const text = localStorage.getItem(DATA_NYCKEL);
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

/* ============================================================
   Tjänst
   ============================================================ */

@Injectable({ providedIn: 'root' })
export class EkonomiskIntegrationService {
  readonly data = signal<EiData>(lasSparat() ?? normaliseraSeed(SEED));

  readonly system = computed(() => this.data().economicSystems);
  readonly organisationer = computed(() => this.data().organisations);
  readonly beslutandeOrganisationer = computed(() => this.data().decidingOrganisations);
  readonly finansieringsmedel = computed(() => this.data().fundingSources);
  readonly profiler = computed(() => this.data().postingProfiles);
  readonly mallar = computed(() => this.data().postingTemplates);

  /** Kort bekräftelse efter sparning ("Konteringsmallen har sparats."). */
  readonly bekraftelse = signal<string | null>(null);
  private bekraftelseTimer: ReturnType<typeof setTimeout> | undefined;

  readonly trappaHopfalld = signal(this.lasTrappa());

  /* ---------- Spara / återställ ---------- */

  private uppdatera(fn: (d: EiData) => EiData): void {
    this.data.update(fn);
    try {
      localStorage.setItem(DATA_NYCKEL, JSON.stringify(this.data()));
    } catch {
      // localStorage kan vara blockerad – ändringarna gäller då bara under sidvisningen
    }
  }

  aterstallExempeldata(): void {
    this.uppdatera(() => normaliseraSeed(SEED));
    this.visaBekraftelse('Exempeldatan har återställts.');
  }

  visaBekraftelse(text: string): void {
    this.bekraftelse.set(text);
    clearTimeout(this.bekraftelseTimer);
    this.bekraftelseTimer = setTimeout(() => this.bekraftelse.set(null), 4000);
  }

  private lasTrappa(): boolean {
    try {
      return localStorage.getItem(TRAPPA_NYCKEL) === 'ja';
    } catch {
      return false;
    }
  }

  vaxlaTrappa(): void {
    this.trappaHopfalld.update((v) => !v);
    try {
      localStorage.setItem(TRAPPA_NYCKEL, this.trappaHopfalld() ? 'ja' : 'nej');
    } catch {
      // ignoreras
    }
  }

  /* ---------- Uppslag ---------- */

  hamtaSystem(id: string) {
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
  hamtaMall(id: string | null) {
    return this.mallar().find((t) => t.id === id) ?? null;
  }
  hamtaAttribut(profil: PostingProfile, attributId: string): SystemAttribute | null {
    return this.hamtaSystem(profil.economicSystemId)?.attributes.find((a) => a.id === attributId) ?? null;
  }
  attributNamn(profil: PostingProfile, attributId: string): string {
    return this.hamtaAttribut(profil, attributId)?.name ?? attributId;
  }

  profilerFor(orgId: string): PostingProfile[] {
    return this.profiler().filter((p) => p.organisationId === orgId);
  }
  mallarFor(profilId: string): PostingTemplate[] {
    return this.mallar().filter((t) => t.profileId === profilId);
  }

  /* ---------- "Används i" (gällande eller kommande versioner) ---------- */

  mallarSomAnvanderAttribut(profilId: string, attributId: string): PostingTemplate[] {
    return this.mallarFor(profilId).filter((t) =>
      relevantaVersioner(t).some((v) => !!v.values[attributId]),
    );
  }

  mallarSomAnvanderVarde(profilId: string, attributId: string, kod: string): PostingTemplate[] {
    const k = kod.trim().toLowerCase();
    return this.mallarFor(profilId).filter((t) =>
      relevantaVersioner(t).some((v) => (v.values[attributId] ?? '').toLowerCase() === k),
    );
  }

  /** Mallar som påverkas av en ändrad mappning: alla i profilen som inte är inaktiva (P12). */
  paverkadeMallar(profilId: string): PostingTemplate[] {
    return this.mallarFor(profilId).filter((t) => t.status !== 'INACTIVE');
  }

  /* ---------- Varningar (avsnitt 8) ---------- */

  mallVarningar(t: PostingTemplate): MallVarning[] {
    const profil = this.hamtaProfil(t.profileId);
    if (!profil) return [];
    const ut: MallVarning[] = [];
    const lagg = (v: MallVarning) => {
      if (!ut.some((x) => x.text === v.text)) ut.push(v);
    };
    if (profilStatus(profil) === 'ENDED') {
      lagg({ regel: 'M8', text: `Integrationsprofilen ${profil.name} är avslutad.` });
    }
    const versioner = relevantaVersioner(t);
    const attKolla = versioner.length ? versioner : sorteradeVersioner(t).slice(-1);
    for (const v of attKolla) {
      for (const m of profil.mappings.filter((x) => x.mode === 'SELECTABLE')) {
        const namn = this.attributNamn(profil, m.attributeId);
        const kod = v.values[m.attributeId];
        if (!kod) {
          if (t.status === 'ACTIVE') {
            lagg({ regel: 'M7', text: `Behöver ses över: ${namn} väljs nu i konteringsmallen men saknar värde.` });
          } else {
            const tom = aktivaVarden(m).length === 0;
            lagg({
              regel: 'M2',
              text: tom
                ? `${namn} saknar värde, och värdelistan i integrationsprofilen har inga aktiva värden.`
                : `${namn} saknar värde. Alla valbara fält måste ha ett värde innan konteringsmallen kan aktiveras.`,
            });
          }
          continue;
        }
        const varde = m.values.find((x) => x.code === kod);
        if (!varde) {
          lagg({ regel: 'M7', text: `Behöver ses över: ${namn} ${kod} finns inte längre i värdelistan.` });
        } else if (varde.status === 'INACTIVE') {
          lagg({ regel: 'M6', text: `${namn} ${kod} är inaktivt i värdelistan.` });
        }
      }
      for (const attributId of Object.keys(v.values)) {
        const m = profil.mappings.find((x) => x.attributeId === attributId);
        if (!m || m.mode !== 'SELECTABLE') {
          lagg({
            regel: 'M7',
            text: `Behöver ses över: ${this.attributNamn(profil, attributId)} väljs inte längre i konteringsmallen.`,
          });
        }
      }
    }
    return ut;
  }

  profilVarningar(p: PostingProfile): ProfilVarning[] {
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
    for (const fel of this.overlappOchGlapp(p)) ut.push(fel);
    const mallarMedVarning = this.mallarFor(p.id).filter((t) => this.mallVarningar(t).length > 0).length;
    if (mallarMedVarning) {
      ut.push({
        regel: 'M',
        text: `${mallarMedVarning} ${mallarMedVarning === 1 ? 'konteringsmall har' : 'konteringsmallar har'} varningar.`,
        flik: 'mallar',
      });
    }
    return ut;
  }

  private overlappOchGlapp(p: PostingProfile): ProfilVarning[] {
    if (p.status === 'DRAFT') return [];
    const ut: ProfilVarning[] = [];
    const andra = this.profilerFor(p.organisationId).filter((o) => o.id !== p.id && o.status !== 'DRAFT');
    for (const o of andra) {
      if (overlappar(p.validFrom, p.validTo, o.validFrom, o.validTo)) {
        ut.push({
          regel: 'P9',
          text: `Överlappar med ${o.name} (${giltighetText(o.validFrom, o.validTo)}).`,
          flik: 'oversikt',
        });
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

  /* ---------- Livscykel (6.8) ---------- */

  /**
   * Kontrollerar om en profil kan börja gälla `datum`.
   * Returnerar fel (blockerar) eller en profil som föreslås avslutas dagen före.
   */
  kontrolleraAktivering(
    p: PostingProfile,
    datum: string,
  ): { fel: string[]; avsluta: PostingProfile | null } {
    const fel: string[] = [];
    const tomma = p.mappings
      .filter((m) => m.mode === 'SELECTABLE' && aktivaVarden(m).length === 0)
      .map((m) => this.attributNamn(p, m.attributeId));
    if (tomma.length) {
      fel.push(`${tomma.join(', ')} har inga aktiva värden att välja. Lägg till värden innan profilen aktiveras.`);
    }
    for (const fp of this.grundfel(p)) fel.push(fp);
    let avsluta: PostingProfile | null = null;
    const andra = this.profilerFor(p.organisationId).filter(
      (o) => o.id !== p.id && o.status !== 'DRAFT' && profilStatus(o) !== 'ENDED',
    );
    for (const o of andra) {
      if (!overlappar(datum, p.validTo, o.validFrom, o.validTo)) continue;
      if (o.validFrom < datum && !avsluta) {
        avsluta = o;
      } else {
        fel.push(
          `Överlappar med ${o.name} (${giltighetText(o.validFrom, o.validTo)}). Två integrationsprofiler för samma organisation får inte gälla samma dag.`,
        );
      }
    }
    // Avslutade profiler som fortfarande överlappar blockerar också.
    for (const o of this.profilerFor(p.organisationId).filter(
      (o) => o.id !== p.id && o.status !== 'DRAFT' && profilStatus(o) === 'ENDED',
    )) {
      if (overlappar(datum, p.validTo, o.validFrom, o.validTo)) {
        fel.push(`Överlappar med ${o.name} (${giltighetText(o.validFrom, o.validTo)}).`);
      }
    }
    return { fel, avsluta };
  }

  /** P1 och P2. */
  grundfel(p: Pick<PostingProfile, 'id' | 'name' | 'organisationId' | 'flows' | 'transactionTypes'>): string[] {
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
      postingProfiles: d.postingProfiles.map((p) => {
        if (p.id === profilId) return { ...p, validFrom: datum, status: datum <= idag() ? 'ACTIVE' : 'PLANNED' };
        if (p.id === avslutaId) return { ...p, validTo: plusDagar(datum, -1) };
        return p;
      }),
    }));
  }

  /* ---------- Ändringar: profiler ---------- */

  sparaProfil(p: PostingProfile, bekraftelse = 'Integrationsprofilen har sparats.'): void {
    this.uppdatera((d) => ({
      ...d,
      postingProfiles: d.postingProfiles.some((x) => x.id === p.id)
        ? d.postingProfiles.map((x) => (x.id === p.id ? p : x))
        : [...d.postingProfiles, p],
    }));
    if (bekraftelse) this.visaBekraftelse(bekraftelse);
  }

  andraProfil(id: string, fn: (p: PostingProfile) => PostingProfile, bekraftelse?: string): void {
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
    this.uppdatera((d) => ({ ...d, postingProfiles: d.postingProfiles.filter((p) => p.id !== id) }));
    this.visaBekraftelse('Integrationsprofilen har tagits bort.');
  }

  /* ---------- Ändringar: konteringsmallar ---------- */

  sparaMall(t: PostingTemplate, bekraftelse = 'Konteringsmallen har sparats.'): void {
    this.uppdatera((d) => ({
      ...d,
      postingTemplates: d.postingTemplates.some((x) => x.id === t.id)
        ? d.postingTemplates.map((x) => (x.id === t.id ? t : x))
        : [...d.postingTemplates, t],
    }));
    if (bekraftelse) this.visaBekraftelse(bekraftelse);
  }

  namnUpptagetMall(namn: string, profilId: string, egetId: string | null): boolean {
    const n = namn.trim().toLowerCase();
    return this.mallarFor(profilId).some((t) => t.id !== egetId && t.name.trim().toLowerCase() === n);
  }

  /** M2: valbara fält som saknar aktivt värde i versionen. Tom lista = kan aktiveras. */
  saknadeVarden(profil: PostingProfile, values: Record<string, string>): string[] {
    return profil.mappings
      .filter((m) => m.mode === 'SELECTABLE')
      .filter((m) => {
        const kod = values[m.attributeId];
        return !kod || !aktivaVarden(m).some((v) => v.code === kod);
      })
      .map((m) => this.attributNamn(profil, m.attributeId));
  }
}

export function overlappar(aFran: string, aTill: string | null, bFran: string, bTill: string | null): boolean {
  const aSlut = aTill ?? '9999-12-31';
  const bSlut = bTill ?? '9999-12-31';
  return aFran <= bSlut && bFran <= aSlut;
}
