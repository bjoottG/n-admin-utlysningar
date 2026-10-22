import { Router } from '@angular/router';
import { forbjudnaOrd } from '../delade/datalage';
import { EI_BAS } from './ei-delade';
import { EkonomiskIntegrationService, ProfilFlik } from './ei.service';

export interface Traff {
  url: string;
  ord: string[];
}

const PROFILFLIKAR: ProfilFlik[] = ['oversikt', 'mappning', 'vardelistor', 'konteringar', 'sparr'];

/** Alla vyer i området, med en adress per profilflik, värdelista, kontering och ekonomisystem. */
function allaVyer(service: EkonomiskIntegrationService): string[] {
  return [
    `${EI_BAS}/ekonomisystem`,
    ...service.system().map((s) => `${EI_BAS}/ekonomisystem/${s.id}`),
    `${EI_BAS}/integrationsprofiler`,
    `${EI_BAS}/integrationsprofiler?sparrade=ja`,
    `${EI_BAS}/integrationsprofiler/ny`,
    ...service.organisationer().map((o) => `${EI_BAS}/integrationsprofiler/ny?org=${o.id}`),
    ...service.profiler().flatMap((p) => [
      ...PROFILFLIKAR.map((f) => `${EI_BAS}/integrationsprofiler/${p.id}?flik=${f}`),
      ...p.mappings.map((m) => `${EI_BAS}/integrationsprofiler/${p.id}?flik=vardelistor&attribut=${m.attributeId}`),
      `${EI_BAS}/integrationsprofiler/ny?utgaFran=${p.id}`,
      `${EI_BAS}/konteringar/ny?profil=${p.id}`,
    ]),
    `${EI_BAS}/konteringar`,
    `${EI_BAS}/konteringar/ny`,
    ...service.konteringar().flatMap((k) => [`${EI_BAS}/konteringar/${k.id}`, `${EI_BAS}/konteringar/ny?kopiaAv=${k.id}`]),
  ];
}

/** Text som syns, inklusive tooltips, attribut, sidtitel och adressfält. */
function sidtext(): string {
  const attribut = [...document.querySelectorAll('[title],[aria-label],[placeholder]')]
    .map((el) => ['title', 'aria-label', 'placeholder'].map((a) => el.getAttribute(a) ?? '').join(' '))
    .join(' ');
  return [document.title, decodeURIComponent(location.href), document.body.textContent ?? '', attribut].join('\n');
}

/**
 * Utvecklarfunktion (avsnitt 11.2): går igenom varje vy i området och listar förbjudna ord.
 * Körs i konsolen med `await eiKontrolleraAnonymisering()` i anonymiserat dataläge.
 */
export async function kontrolleraAnonymisering(router: Router, service: EkonomiskIntegrationService): Promise<Traff[]> {
  const traffar: Traff[] = [];
  const start = router.url;
  for (const url of allaVyer(service)) {
    await router.navigateByUrl(url);
    await new Promise((r) => setTimeout(r, 30));
    const ord = forbjudnaOrd(sidtext());
    if (ord.length) traffar.push({ url, ord });
  }
  await router.navigateByUrl(start);
  if (traffar.length) console.table(traffar.map((t) => ({ vy: t.url, ord: t.ord.join(', ') })));
  else console.info(`Anonymiseringskontroll: inga förbjudna ord i ${allaVyer(service).length} vyer.`);
  return traffar;
}
