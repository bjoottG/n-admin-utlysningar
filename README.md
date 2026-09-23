# Nyps Admin – Utlysningar (designförslag)

Förbättrad design av filtreringen av utlysningar i Nyps Admin. Angular 21 + Tailwind CSS v4 med Kompass-designtokens (se `../kompass-tolkens.md`).

## Vad är nytt jämfört med dagens lösning?

Idag måste handläggaren först söka upp en organisation för att överhuvudtaget se några utlysningar. I det här förslaget:

- **Alla utlysningar visas direkt** när man går in på sidan, sorterade på **senast skapad först**.
- **Zebra-tabell** med varannan rad tonad, radmarkering med kryssrutor och "Markera alla".
- **Verktygsrad** ovanför tabellen med sök (fritext över namn, stödform och organisation), filter, ladda ner, skriv ut och "Skapa utlysning".
- **Paginering** (10/25/50 per sida) med tydlig resultaträkning ("Visar 1–10 av 24 utlysningar").
- **Filterpanel** (popover från filterikonen, med "Rensa alla filter" och räknare för aktiva filter) med expanderbara sektioner:
  - **Organisation** – sökbar kryssrutelista med antalsbadge per organisation.
  - **Status** – kryssrutor för Aktiv, Öppen, Aktiv i Nyps och Stängd, med antalsbadge per status.
  - **Datum skapad** – från/till.
  - **Utlysningen går ut** (slutdatum) – från/till.
- **Metainformation om statusar** – "Vad betyder statusarna?" i filterpanelen öppnar en informationsruta, och varje statusbadge i tabellen har en tooltip:
  - **Aktiv** – igång, tillåter inskick även efter stängningsdatum.
  - **Öppen** – synlig för sökande i Min ansökan.
  - **Aktiv i Nyps** – igång, tillåter enbart hantering i Nyps.
  - **Stängd** – hårt stängd, går ej att återöppna.
- Sorterbara kolumner för **Skapad** och **Går ut**, samt markering "Passerat" när slutdatumet har passerats.
- "Återställ filtrering" visar antalet aktiva filter.

## Kravlistan (implementerad 2026-09-08)

- **Automatisk hård stängning**: status härleds — 1 månad efter slutdatum visas utlysningen som Stängd överallt. Aktiva utlysningar med passerat slutdatum visar "Stängs hårt ÅÅÅÅ-MM-DD" i listan och en varningsbanner i detaljvyn (utkast kan skickas in fram till dess; själva stängningsjobbet och utkastgallringen är backendkrav).
- **Kopiera istället för återöppna**: kopiera-knapp per rad och i detaljvyn öppnar guiden förifylld (`/utlysningar/ny?kopieraFran=id`) med tom period; samma interna namn håller ihop **serien**, som listas i detaljvyn under "Omgångar i serien".
- **Detaljvy** `/utlysningar/:id` med redigerbara uppgifter, statuskryssrutor och **informationstexter till höger** — listade med nivå-badge (Organisation/Stödform/Utlysning), inline-redigering och "Lägg till".
- **Omdöpningar**: Ingress → *Utlysningstext*; Beskrivning → informationstexten *Ingress för ansökansformulär* (skapas i guiden, redigeras i detaljvyn).
- **Internt namn**: nya värden kan läggas till i värdeförrådet direkt från guiden och detaljvyn.
- **Finansieringsmedel** kan tas bort i detaljvyn så länge minst ett finns kvar (kryssknappen inaktiveras vid sista).
- **Alltid synligt sökfält** på namn i tabellens verktygsrad.
- **Riktiga länkar** till detaljvyn (namn + penna) — cmd/mittenklick öppnar i ny flik.
- **Egen datumväljare** med måndagsstart (Mån–Sön) används i filterpanelen, guiden och detaljvyn.
- Snabbare laddning är ett backendkrav; gränssnittet förutsätter paginerad hämtning.

## Kom igång

```bash
npm install
npm start
```

Öppna sedan `http://localhost:4200/`.

## Struktur

- `src/styles.css` – Kompass-tokens (Tailwind v4 `@theme`) + basstilar.
- `src/app/utlysning.service.ts` – mockdata och statusmetadata (`STATUS_INFO`).
- `src/app/utlysningar/` – listsidan med filtrering, sortering och paginering (signals).
