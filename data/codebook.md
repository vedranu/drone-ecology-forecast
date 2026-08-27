# Codebook — dronovi u ekologiji i zaštiti okoliša (bibliometrijski i registarski podaci)

Datum dohvata: 26. kolovoza 2026. (OpenAlex API, upiti izvedeni s računala vedran-pc; sandbox nema pristup API-ju).
Datoteke: `openalex_drone_env_annual.csv` (glavni skup), `registry_indicators.csv` (pomoćni skup), `raw_openalex_counts.csv` (dugi format, izvorni ispis).

## 1. Izvor i način dohvata

- Baza: OpenAlex (https://openalex.org), javni REST API, endpoint `/works`, agregacija `group_by=publication_year`.
- Filtri zajednički svim upitima: `type:article|review` (isključeni preprinti, poglavlja, disertacije, paratekst), `publication_year:2000-2026`.
- Polje pretrage: `title_and_abstract.search` — Booleov upit nad naslovom i sažetkom (OpenAlex primjenjuje stemming; pretraga ne razlikuje velika/mala slova).
- Reproducibilnost: svaki upit je jedan HTTP GET; primjer:
  `https://api.openalex.org/works?filter=title_and_abstract.search:<UPIT>,publication_year:2000-2026,type:article|review&group_by=publication_year&per-page=50&mailto=<e-mail>`
- OpenAlex je "živa" baza: broj zapisa za istu godinu mijenja se retroaktivno (naknadno indeksiranje). Datum dohvata je dio metapodataka analize i mora se navesti u radu.

## 2. Definicije upita (Booleovi izrazi)

**D (dron):**
`(drone OR drones OR UAV OR UAVs OR UAS OR "unmanned aerial" OR "unmanned aircraft" OR RPAS OR "remotely piloted aircraft")`

**E (ekologija / zaštita okoliša):**
`(ecology OR ecological OR wildlife OR biodiversity OR "nature conservation" OR "environmental monitoring" OR habitat OR habitats OR ecosystem OR ecosystems OR forest OR forests OR vegetation OR "water quality" OR "air quality" OR "air pollution" OR "greenhouse gas" OR methane OR "protected area" OR wetland OR wetlands OR coastal OR marine OR wildfire)`

| Serija (stupac) | Upit | Uloga |
|---|---|---|
| `core_drone_env` | D AND E | **Brojnik** — glavna zavisna varijabla |
| `strict_noagri` | D AND E NOT (crop OR crops OR yield OR agriculture OR agricultural OR wheat OR maize OR rice OR soybean OR vineyard OR phenotyping OR weed OR weeds) | Stroža inačica brojnika (bez poljoprivrede) — analiza osjetljivosti; dohvat 27. 8. 2026. |
| `env_only` | E | **Nazivnik 1** — ista metoda pretrage, isto polje; preporučeni nazivnik za udio |
| `field23_envsci` | `primary_topic.field.id:23` (Environmental Science, OpenAlex/Scopus ASJC polje) | Nazivnik 2 — klasifikacijski, neovisan o ključnim riječima |
| `all_works` | bez tekstualnog filtra | Nazivnik 3 — ukupna produkcija (kontrola rasta baze) |
| `drone_only` | D | Kontekst — sva dronska literatura; omjer `core/drone_only` = udio ekologije u dronskoj literaturi |
| `sub_fauna` | D AND (wildlife OR fauna OR bird OR birds OR seabird OR seabirds OR mammal OR mammals OR ungulate OR ungulates OR deer OR elephant OR elephants OR "animal population" OR "population census" OR nest OR nests OR "animal counting" OR "wildlife survey") | Poddomena 1: brojanje/popis faune |
| `sub_forest` | D AND (forest OR forests OR forestry OR "bark beetle" OR "tree health" OR canopy OR "tree mortality" OR deforestation OR "forest inventory") | Poddomena 2: šume / zdravlje šuma |
| `sub_water` | D AND ("water quality" OR "algal bloom" OR cyanobacteria OR chlorophyll OR turbidity OR seagrass OR "benthic habitat" OR lake OR lakes OR river OR rivers OR wetland OR wetlands OR coastal OR "coral reef") | Poddomena 3: vode / bentos |
| `sub_air` | D AND ("air quality" OR "air pollution" OR methane OR "greenhouse gas" OR "gas emissions" OR landfill OR "particulate matter" OR "gas leak") | Poddomena 4: zrak / emisije plinova |
| `sub_wildfire` | D AND (wildfire OR wildfires OR "forest fire" OR "forest fires" OR "fire detection" OR "fire monitoring") | Poddomena 5: požari |
| `sub_conservation` | D AND ("nature conservation" OR "protected area" OR "protected areas" OR "national park" OR biodiversity OR "anti-poaching" OR poaching) | Poddomena 6: zaštićena područja / krivolov |
| `HR_core` | D AND E, `authorships.countries:HR` | Radovi s barem jednim hrvatskim autorom (2005–2025; prije 2016. = 0) |
| `HR_all` | `authorships.countries:HR` | Nazivnik za HR (2005–2025) |
| `complete_year` | 1 = puna godina; 0 = 2026. (nepotpuna, dohvat 26. 8. 2026.) | **2026. se ne koristi u fitu** |

Poddomene se **preklapaju** (jedan rad može biti u više poddomena) i **nisu podskup** `core_drone_env` u strogom smislu (poddomenski upit ne zahtijeva E). Zbroj poddomena ≠ core.

## 3. Varijable (skala, jedinica)

| Varijabla | Skala | Jedinica | Napomena |
|---|---|---|---|
| `year` | intervalna | kalendarska godina objave (`publication_year` u OpenAlexu) | 2000–2026 |
| sve serije brojanja | omjerna (count) | broj radova | nenegativni cijeli brojevi; očekivana predisperzija |
| izvedeno: `share_env = core_drone_env / env_only * 1000` | omjerna | radova na 1000 | računa se u skripti |
| izvedeno: `share_drone = core_drone_env / drone_only` | omjerna | udio | računa se u skripti |

## 4. Poznata ograničenja (obvezno u Limitations)

1. Skok u svim serijama za 2025. (npr. `env_only` +39 % u odnosu na 2024.) je dijelom artefakt indeksiranja OpenAlexa (bolja pokrivenost sažetaka za nova izdanja i naknadni unos). Normalizacija nazivnikom to ublažava, ali ne uklanja; skripta provodi analizu osjetljivosti bez 2025.
2. Pojmovi "drone/drones" hvataju i entomološku literaturu (trutovi), "UAS" i akronime izvan zrakoplovstva. Ručna provjera (odjeljak 4a) daje strogu preciznost 42 % i 80 % uključujući susjedne primjene (uglavnom precizna poljoprivreda).
3. Pojam "forest/vegetation" u E uvodi dio agronomske i šumarsko-gospodarske literature; `sub_forest` treba tumačiti kao "šumarstvo u širem smislu".
4. OpenAlex nije Scopus/WoS: širi je (uključuje više regionalnih časopisa i Zenodo zapise), pa su apsolutni brojevi veći nego što bi ih dao Scopus. Trendovi i udjeli su usporedivi; apsolutne brojke nisu.
5. `type:article` u OpenAlexu obuhvaća i mnoge konferencijske radove (nema pouzdane razlike article/proceedings).

## 4a. Ručna provjera preciznosti (27. 8. 2026.)

Slučajni uzorak 100 zapisa (2005.–2025., seed 20260826) i 50 zapisa (2005.–2015., seed 20260827); kodiranje A (strogo relevantan) / B (UAV u susjednoj primjeni, uglavnom poljoprivreda) / C (šum). Rezultat: P(A) = 0,42 [0,33; 0,52], P(A∪B) = 0,80 [0,71; 0,87]; rano razdoblje P(A) = 0,54 [0,40; 0,67], razlika neznačajna (z = 1,39, p = 0,16). Strogi upit bez poljoprivrednih pojmova: CAGR 27,9 % (vs. 29,3 %). Datoteke: `validation/Provjera_preciznosti_upita.xlsx` (kriteriji, uzorci s prijedlogom oznaka i stupcem za konačnu ocjenu, formule), `validation/*.json` (sirovi API odgovori).

## 5. Pomoćni skup `registry_indicators.csv`

Stupci: `indicator, geo, year, value, source_note`. Heterogeni izvori (FAA, AESA, EASA, HACZ); godišnje FAA vrijednosti izvedene su iz objavljenih mjesečnih prosjeka (×12) i treba ih tretirati kao približne. Eurostat **nema** vremensku seriju o dronovima (provjereno 26. 8. 2026.; postoji samo metodološki radni dokument KS-TC-22-004 o web-inteligenciji za dronsku industriju, bez tabličnih podataka). Eurostat je stoga neupotrebljiv kao izvor za ovaj rad, osim za opće nazivnike (npr. R&D izdaci), koji nisu uključeni.

## 6. Struktura ostalih agregata (26. 8. 2026., core 2005–2025, N = 20 344)

- Zemlje (prvih 5, broj radova s barem jednim autorom): Kina 4 410; SAD 3 470; UK 1 015; Njemačka 855; Indija 813. Ukupno 182 zemlje.
- Časopisi (prvih 5): Remote Sensing 1 709; Drones 494; ISPRS Archives 423; Sensors 355; Forests 307.
- Primarno polje (OpenAlex): Environmental Science 10 865; Engineering 3 200; Earth & Planetary 1 939; Agricultural & Biological 1 775; Computer Science 1 010.
- Otvoreni pristup: 14 679 OA (72,2 %), 5 665 ne-OA.
- Citiranost: 910 radova s > 99 citata; 2 306 s > 49; 8 354 s > 9.
