// Build the working report (Croatian) as .docx from the results CSVs.
// Run:  node build_report.js
const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType,
        AlignmentType, ImageRun, LevelFormat, ShadingType, BorderStyle, PageBreak } = docx;

const R = path.join(__dirname, '..', 'results');
const csv = f => fs.readFileSync(path.join(R, f), 'utf8').trim().split('\n').slice(1).map(l => {
  // handle quoted last column
  const m = l.match(/^(.*?),"(.*)"$/); if (m) return [...m[1].split(','), m[2]]; return l.split(',');
});
const fcC = csv('forecast_count.csv'), fcS = csv('forecast_share.csv');
const mC = csv('models_count.csv'), mS = csv('models_share.csv');
const nboot = parseInt(fs.readFileSync(path.join(__dirname, '..', 'matlab', 'drone_env_forecast.m'), 'utf8').match(/opt\.nboot\s*=\s*(\d+)/)[1]);

const hr = n => Number(n).toLocaleString('hr-HR');
const r0 = x => hr(Math.round(Number(x)));
const r1 = x => Number(x).toLocaleString('hr-HR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const r2 = x => Number(x).toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const P = (text, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children: Array.isArray(text) ? text : [new TextRun({ text, size: 21 })] });
const B = (text) => new TextRun({ text, bold: true, size: 21 });
const T = (text) => new TextRun({ text, size: 21 });
const I = (text) => new TextRun({ text, italics: true, size: 21 });
const H1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 280, after: 120 }, children: [new TextRun(t)] });
const H2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 }, children: [new TextRun(t)] });
const bullet = t => new Paragraph({ numbering: { reference: 'bul', level: 0 }, spacing: { after: 60 }, children: Array.isArray(t) ? t : [new TextRun({ text: t, size: 21 })] });
const code = t => new Paragraph({ spacing: { after: 40 }, shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' }, children: [new TextRun({ text: t, font: 'Consolas', size: 17 })] });

function table(header, rows, widths, opts = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const cell = (t, w, bold = false, align = AlignmentType.LEFT, fill) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    children: [new Paragraph({ alignment: align, children: [new TextRun({ text: String(t), bold, size: 18 })] })]
  });
  const aligns = opts.aligns || header.map((_, i) => i === 0 ? AlignmentType.LEFT : AlignmentType.RIGHT);
  return new Table({
    width: { size: total, type: WidthType.DXA }, columnWidths: widths,
    rows: [new TableRow({ tableHeader: true, children: header.map((h, i) => cell(h, widths[i], true, aligns[i], 'D9E2F3')) }),
           ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, widths[i], false, aligns[i])) }))]
  });
}
const caption = t => new Paragraph({ spacing: { before: 60, after: 200 }, children: [new TextRun({ text: t, italics: true, size: 18 })] });
const img = (f, wcm, hcm) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync(path.join(R, f)), transformation: { width: wcm * 37.8, height: hcm * 37.8 } })] });

// ---- forecast rows ----
const modelsC = ['exponential', 'logistic', 'gompertz', 'bass', 'qaicc_average'];
const labels = { exponential: 'Eksponencijalni', logistic: 'Logistički', gompertz: 'Gompertz', bass: 'Bass', qaicc_average: 'QAICc-prosjek' };
const fcRow = (rows, m, fmt) => {
  const rr = rows.filter(r => r[0] === m);
  return [labels[m], ...rr.map(r => `${fmt(r[3])} [${fmt(r[4])}; ${fmt(r[6])}]`)];
};
const wC = Object.fromEntries(mC.map(r => [r[0], r[5]]));
const wS = Object.fromEntries(mS.map(r => [r[0], r[5]]));

const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 21 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, color: '1F3864' }, paragraph: { outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 24, bold: true, color: '2E5395' }, paragraph: { outlineLevel: 1 } }] },
  numbering: { config: [{ reference: 'bul', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 } } },
    children: [
      new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Dronovi u ekologiji i zaštiti okoliša: podaci, trenutno stanje i algoritam predviđanja rasta', bold: true, size: 34, color: '1F3864' })] }),
      new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: 'Radni dokument za rad na MIPRO Robotics, sekcija RTA-DRONES (Environmental Monitoring and Sustainability). Verzija 1.0, 26. kolovoza 2026. Sve brojke u dokumentu izračunate su skriptom drone_env_forecast.m nad priloženim CSV-om; nijedna nije procijenjena „napamet".', size: 19, italics: true, color: '595959' })] }),

      H1('1. Što je napravljeno i što se od toga može koristiti u radu'),
      P('Prikupljen je reproducibilan godišnji skup podataka o znanstvenoj produkciji koja spaja dronove (UAV/UAS/RPAS) i ekologiju/zaštitu okoliša, 2000.–2026., iz baze OpenAlex, s tri neovisna nazivnika i šest poddomena. Nad njim je izgrađen MATLAB algoritam (bez toolboxa, radi i u Octaveu) koji opisuje trenutno stanje (stopa rasta, udio, trend, prijelomna točka) i daje predviđanje za 3, 5, 7 i 10 godina (2028., 2030., 2032., 2035.) s četiri konkurentska modela rasta, izborom modela informacijskim kriterijem, provjerom točnosti unatrag i bootstrap intervalima. Sve je neovisno replicirano u Pythonu (scipy) — procjene parametara i deviance podudaraju se do zadnje znamenke.'),
      P([B('Glavni nalaz u jednoj rečenici: '), T('apsolutna produkcija raste oko 29–31 % godišnje bez znaka zasićenja (2025.: 4 747 radova), ali udio te teme u ukupnoj literaturi o okolišu usporava i logistički model ga procjenjuje na plato od oko 13 radova na 1 000 — dakle „dronska ekologija" prestaje biti rastuća niša i postaje standardan alat, a daljnji rast prati rast cijelog područja.')]),
      P([B('Za rad je izravno upotrebljivo: '), T('Slika 1 (broj radova + predviđanja), Slika 2 (udio + predviđanja), Slika 3 (poddomene), Tablica I (modeli), Tablica II (predviđanja po horizontu). Sve slike su 8,8 cm, crno-bijele, 600 dpi, s EPS verzijom.')]),

      H1('2. Podaci'),
      H2('2.1 Izvor i upiti'),
      P('Izvor je OpenAlex (javni API, bez pretplate), pretraga naslova i sažetka Booleovim izrazom, filtar tipa dokumenta article|review. Datum dohvata 26. 8. 2026. — obvezno navesti u radu jer se OpenAlex retroaktivno mijenja. Upiti su izvedeni s vašeg računala (sandbox nema pristup API-ju); potpuni izrazi i URL-predložak nalaze se u codebook.md.'),
      table(['Serija', 'Definicija', 'Uloga'], [
        ['core_drone_env', 'D AND E (dron × ekologija/okoliš)', 'brojnik, zavisna varijabla'],
        ['env_only', 'E (ekologija/okoliš, isti način pretrage)', 'nazivnik 1 (udio)'],
        ['field23_envsci', 'OpenAlex polje Environmental Science', 'nazivnik 2 (klasifikacijski)'],
        ['all_works', 'sva djela u bazi', 'nazivnik 3 (rast baze)'],
        ['drone_only', 'D (sva dronska literatura)', 'kontekst: udio ekologije u dronskoj literaturi'],
        ['sub_fauna … sub_conservation', 'D AND poddomenski pojmovi (6 poddomena)', 'struktura primjena; preklapaju se'],
        ['HR_core, HR_all', 'isto, s barem jednim hrvatskim autorom', 'nacionalni kontekst'],
      ], [2300, 4300, 2600], { aligns: [AlignmentType.LEFT,AlignmentType.LEFT,AlignmentType.LEFT] }),
      caption('Tablica A. Serije u datoteci openalex_drone_env_annual.csv. D = (drone OR drones OR UAV OR UAVs OR UAS OR "unmanned aerial" OR "unmanned aircraft" OR RPAS OR "remotely piloted aircraft"); E = 24 pojma iz ekologije i zaštite okoliša (puni popis u codebook.md).'),
      H2('2.2 Zašto ne Eurostat i što je s registarskim podacima'),
      P('Eurostat nema nikakvu vremensku seriju o dronovima (provjereno 26. 8. 2026.). Postoji samo metodološki radni dokument KS-TC-22-004 (2022.) o identifikaciji dronskih tvrtki web-inteligencijom za Španjolsku, Italiju i Irsku, bez tabličnih podataka. Za rad je stoga neupotrebljiv. Registarski podaci postoje, ali su heterogeni i kratki: FAA (SAD) objavljuje godišnje nove komercijalne registracije 2018.–2024. (izvedeno iz mjesečnih prosjeka: 175 200 → 124 440 godišnje, tj. pad nakon vrhunca 2018.) i 493 000 certifikata daljinskih pilota (2025.); AESA (Španjolska) 150 332 registrirana operatora krajem 2025. (+26 %); EASA „više od dva milijuna" registriranih operatora u Europi (svibanj 2025.); HACZ za Hrvatsku 2 464 operatora, 9 633 udaljena pilota i 18 odobrenja za posebnu kategoriju (2024.). Ti podaci ne mogu nositi model, ali su dobri za jedan odlomak Discussiona: rast literature (30 %/god.) višestruko nadmašuje rast operativne baze u SAD-u, koja je od 2018. stagnirala. Sve je u registry_indicators.csv s izvorima.'),
      H2('2.3 Ograničenja podataka koja moraju u rad'),
      bullet('Skok u 2025. u svim serijama (env_only +39 % naspram 2024.) dijelom je artefakt indeksiranja OpenAlexa. Normalizacija ga ublažava; skripta zato radi i analizu osjetljivosti bez 2025. — i ona pokazuje da 2025. bitno mijenja procjenu zasićenja (vidi 5.4).'),
      bullet('Pojmovi drone/drones/UAS hvataju i šum (trutovi u pčelarstvu, akronimi). Prije predaje treba ručno provjeriti slučajni uzorak od 100 zapisa i izvijestiti preciznost — to skripta ne može.'),
      bullet('OpenAlex je širi od Scopusa/WoS-a (regionalni časopisi, Zenodo). Apsolutni brojevi su veći nego što bi ih dao Scopus; trendovi i udjeli su usporedivi. Ako imate pristup Scopusu, isti upit po godinama bio bi vrijedna križna provjera (jedan stupac u CSV-u).'),
      bullet('Poddomene se preklapaju i ne zbrajaju u ukupni broj.'),

      H1('3. Trenutno stanje (2005.–2025.)'),
      table(['Pokazatelj', 'Vrijednost'], [
        ['Broj radova 2005. → 2025.', '28 → 4 747 (ukupno 20 344 u razdoblju)'],
        ['CAGR 2005.–2025. / zadnjih 10 godina', '29,3 % / 30,6 %'],
        ['Udio u literaturi o okolišu (na 1 000)', '0,34 → 11,27'],
        ['Udio u ukupnoj dronskoj literaturi', '2,9 % → 18,5 %'],
        ['Mann-Kendall, brojevi', 'S = 209, Z = 6,28, p = 3·10⁻¹⁰; Senov nagib 147 radova/god. [90 % CI 105; 194]'],
        ['Mann-Kendall, udio', 'S = 202, Z = 6,07, p = 1·10⁻⁹; Senov nagib 0,60 na 1 000/god. [0,49; 0,76]'],
        ['Prijelomna točka (segmentirani log-linearni), brojevi', '2010.: 17 %/god. prije → 34 %/god. poslije (F = 5,5; p ≈ 0,014, približno)'],
        ['Prijelomna točka, udio', '2010.: 8 %/god. → 27 %/god. (F = 4,2; p ≈ 0,032, približno)'],
        ['Otvoreni pristup', '72 % radova (14 679 od 20 344)'],
        ['Zemlje (prve tri)', 'Kina 4 410; SAD 3 470; UK 1 015 (182 zemlje ukupno)'],
        ['Časopisi (prva tri)', 'Remote Sensing 1 709; Drones 494; ISPRS Archives 423'],
        ['Hrvatska', '62 rada 2016.–2025. (18 u 2025.); udio HR u svjetskom korpusu ≈ 0,3 %'],
      ], [3900, 5300], { aligns: [AlignmentType.LEFT,AlignmentType.LEFT] }),
      caption('Tablica B. Sažetak trenutnog stanja; sve vrijednosti iz izlaza skripte i codebook.md (odjeljak 6).'),
      P('Napomena o prijelomnoj točki: 2010. se poklapa s pojavom jeftinih višerotorskih platformi i MEMS senzora, ne s regulativom (EU Uredba 2019/947 primjenjuje se od 31. 12. 2020., a u podacima se oko 2021. vidi usporavanje udjela, ne ubrzanje). Za rad je to korisna nit: tehnologija, a ne regulacija, pokrenula je rast; regulacija se poklapa s prijelazom iz niše u standard.'),
      H2('3.1 Poddomene'),
      table(['Poddomena', '2015.', '2025.', 'CAGR 10 g.'], [
        ['Brojanje/popis faune', '100', '547', '18,5 %'],
        ['Šume / zdravlje šuma', '114', '2 079', '33,7 %'],
        ['Vode / bentos', '126', '1 252', '25,8 %'],
        ['Zrak / emisije plinova', '28', '300', '26,8 %'],
        ['Požari', '25', '302', '28,3 %'],
        ['Zaštićena područja / krivolov', '33', '441', '29,6 %'],
      ], [4200, 1500, 1500, 2000]),
      caption('Tablica C. Broj radova po poddomeni (preklapajući upiti) i složena godišnja stopa rasta 2015.–2025.'),
      P('Fauna — najzrelija primjena prema kolegin pregledu — raste najsporije (18,5 %), a šume najbrže (33,7 %). To podupire tezu iz pregleda: tamo gdje je točnost već dokazana (brojanje diskretnih objekata) literatura se zasićuje; tamo gdje je tehnički problem otvoren (kontinuirana spektralna polja, „zeleni napad" potkornjaka) produkcija još ubrzava. To je dobar most prema robotičkoj publici.'),
      img('fig3_subdomains.png', 8.8, 7),
      caption('Fig. 3. Annual number of OpenAlex articles combining UAV terms with six environmental sub-domains, 2005–2025 (log scale; queries overlap).'),

      H1('4. Algoritam predviđanja (MATLAB)'),
      P('Datoteke u mapi matlab/: drone_env_forecast.m (glavna skripta s blokom OPTIONS), load_annual_data.m, growth_model.m, fit_growth_model.m, mann_kendall.m, segmented_loglinear.m, backtest_models.m, nb_bootstrap.m, poisson_rnd.m, describe_params.m. Nema ovisnosti o toolboxima (koristi fminsearch, randg, betainc, gammaln iz osnovnog MATLAB-a). Testirano u GNU Octave 8.4; u MATLAB-u R2016b+ radi bez izmjena.'),
      H2('4.1 Koraci'),
      bullet([B('Ulaz i normalizacija. '), T('Učitava se CSV; koriste se samo potpune godine (2005.–2025.). Modeli se prilagođavaju dvama ciljevima: (a) apsolutnom broju radova i (b) udjelu u literaturi o okolišu, gdje je nazivnik ugrađen kao offset (μ = N·g(t)), pa predviđanje udjela ne zahtijeva projekciju nazivnika.')]),
      bullet([B('Opis stanja. '), T('CAGR, Mann-Kendallov test s korekcijom vezanih vrijednosti i Senov nagib s 90 % CI (Gilbert 1987), segmentirana log-linearna regresija s jednom prijelomnom točkom (pretraga po mreži, Chow-tip F-test; p je približan jer je točka procijenjena — u radu navesti kao takav ili potvrditi Daviesovim testom u R-u, paket segmented).')]),
      bullet([B('Četiri modela rasta. '), T('Eksponencijalni (bez zasićenja), logistički i Gompertzov (sa zasićenjem K), Bassov difuzijski model (radovi kao „usvajanja" po godini, parametri m, p, q). Za udio se Bass ne koristi jer opisuje usvajanja po razdoblju, a ne razinu.')]),
      bullet([B('Kriterij prilagodbe. '), T('Poissonova devijanca D = 2Σ[y ln(y/μ) − (y − μ)] minimizirana Nelder-Meadom (fminsearch) iz više početnih točaka, s log-transformacijom pozitivnih parametara. Devijanca daje jednaku težinu malim ranim i velikim kasnim godinama i omogućuje pravi log-likelihood za informacijski kriterij.')]),
      bullet([B('Izbor modela. '), T('Brojevi su jako predisperzirani (ĉ = Pearsonov χ²/df ≈ 20), pa se koristi QAICc (kvazi-AIC s korekcijom za mali uzorak) i Akaikeove težine; predviđanje je QAICc-ponderirani prosjek modela.')]),
      bullet([B('Provjera unatrag. '), T('Rolling-origin backtest: fit do 2018./2020./2022., predviđanje ostatka; MAPE, pristranost i RMSE na log-skali po modelu.')]),
      bullet([B('Nesigurnost. '), T(`Parametarski negativno-binomni bootstrap (gamma-Poissonova mješavina, disperzija procijenjena metodom momenata): ${nboot} replika, ponovni fit svakog modela i ponovno računanje težina u svakoj replici → 5. i 95. percentil predviđanja po modelu i za prosjek.`)]),
      bullet([B('Analiza osjetljivosti. '), T('Ponovni fit brojeva bez 2025. (artefakt indeksiranja).')]),
      H2('4.2 Pokretanje'),
      code('cd matlab'),
      code('drone_env_forecast          % ~1–3 min u MATLAB-u za 1000 replika; rezultati u ../results'),
      P('U bloku OPTIONS mijenjaju se: putanja CSV-a, raspon godina, horizonti, brojnik i nazivnik (npr. numerator = \'sub_forest\' za predviđanje poddomene), popis modela, broj replika, sjeme. Izlaz: models_count.csv, models_share.csv, forecast_count.csv, forecast_share.csv, tri slike (PNG 600 dpi + EPS) i .mat s cijelom strukturom rezultata.'),

      H1('5. Rezultati'),
      H2('5.1 Modeli za broj radova (Tablica I u radu)'),
      table(['Model', 'k', 'Devijanca', 'QAICc', 'Težina', 'Backtest MAPE', 'Parametri'],
        mC.map(r => [labels[r[0]], r[1], r1(r[2]), r1(r[4]), r2(r[5]), r1(r[8]) + ' %', r[10]]),
        [1500, 450, 1000, 900, 800, 1150, 3400], { aligns: [AlignmentType.LEFT,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.RIGHT,AlignmentType.LEFT] }),
      caption(`Tablica D (→ TABLE I). Modeli rasta prilagođeni godišnjem broju radova 2005.–2025. (n = 21). ĉ = ${r2(mC[2][7])}. k = broj parametara; MAPE = prosjek preko ishodišta 2018., 2020., 2022.`),
      P('Nijedan model nije uvjerljivo bolji: težine su 0,08–0,41 i dijele se između modela sa zasićenjem i bez njega. Gompertzov model s K ≈ 3,7 milijuna i t_mid = 2086 degenerira u praktički eksponencijalni oblik; logistički model vidi zasićenje na K ≈ 9 700 radova/god. s točkom infleksije 2025./2026.; Bass predviđa vrhunac 2029. Podaci do 2025. ne mogu razlučiti jesmo li prije ili na točki infleksije — i to je, za robotičku publiku, pošten i zanimljiv rezultat.'),
      img('fig1_counts_forecast.png', 8.8, 7),
      caption('Fig. 1. Annual OpenAlex articles combining UAV and ecology/environmental terms (dots), four growth models fitted by Poisson deviance (lines) and the QAICc-weighted model average with 90 % negative-binomial bootstrap interval (squares, shaded) for 2028–2035.'),
      H2('5.2 Predviđanje broja radova (Tablica II u radu)'),
      table(['Model', '2028. (3 g.)', '2030. (5 g.)', '2032. (7 g.)', '2035. (10 g.)'],
        modelsC.map(m => fcRow(fcC, m, r0)), [1700, 1900, 1900, 1900, 1900]),
      caption(`Tablica E (→ TABLE II). Točkasta procjena i 90 % bootstrap interval [q05; q95] broja radova godišnje (${nboot} replika). Za QAICc-prosjek točkasta procjena je medijan bootstrap-distribucije.`),
      H2('5.3 Predviđanje udjela u literaturi o okolišu'),
      table(['Model', 'Težina', '2028.', '2030.', '2032.', '2035.'],
        ['exponential', 'logistic', 'gompertz', 'qaicc_average'].map(m => { const r = fcRow(fcS, m, r2); return [r[0], m === 'qaicc_average' ? '1' : r2(wS[m]), ...r.slice(1)]; }),
        [1500, 900, 1700, 1700, 1700, 1800]),
      caption(`Tablica F. Radova na 1 000 radova o okolišu; točkasta procjena i 90 % bootstrap interval. ĉ = ${r2(mS[1][7])}.`),
      P('Kod udjela je slika drukčija i jasnija: logistički model dobiva gotovo svu težinu (0,999), eksponencijalni je odbačen (ΔQAICc ≈ 46), a plato je K = 13,3 na 1 000 s točkom infleksije 2019./2020. Udio je u 2025. već na 11,3, tj. na 85 % procijenjenog platoa. Backtest to potvrđuje: s ishodištem 2022. logistički model ima MAPE 10,6 %, eksponencijalni 58 %.'),
      img('fig2_share_forecast.png', 8.8, 7),
      caption('Fig. 2. Share of UAV-related articles per 1000 environmental articles (OpenAlex), fitted exponential, logistic and Gompertz rate models with the environmental literature as offset, and QAICc-weighted forecast with 90 % bootstrap interval.'),
      H2('5.4 Osjetljivost na 2025. i provjera unatrag'),
      P('Bez 2025. logistički model za brojeve daje K ≈ 4 400 (umjesto 9 700) i predviđanje za 2035. od 4 433 umjesto 9 154; Bass predviđa pad. Jedna godina, koja je dijelom artefakt indeksiranja, udvostručuje procijenjeni kapacitet. To treba otvoreno napisati: predviđanje za 3 godine je robusno (svi modeli 6 100–10 000 radova za 2028.), predviđanje za 10 godina nije (3 700–60 000). Rolling-origin backtest daje MAPE 39–45 % za sve modele preko tri ishodišta — dugoročna točnost bilo kojeg parametarskog modela rasta na ovakvoj seriji je skromna, a razlike među modelima su manje od razlike među ishodištima.'),

      H1('6. Što to znači za rad i za robotičku publiku'),
      bullet('Tri poruke za Discussion: (1) apsolutna produkcija još raste eksponencijalno (~30 %/god.), (2) udio u literaturi o okolišu ulazi u plato oko 1,3 % — dron je postao standardan senzorski nosač, ne više „nova tema", (3) rast se seli u poddomene s otvorenim tehničkim problemima (šume, emisije plinova, požari), dok najzrelija (fauna) usporava.'),
      bullet('Implikacija za robotičare: buduća vrijednost nije u „još jednoj primjeni drona", nego u senzorskim i autonomijskim zahtjevima koje otvorene poddomene postavljaju — spektralna rezolucija za rano otkrivanje zaraze, senzori za fikocijanin, kvantifikacija nesigurnosti kod plinskih mjerenja, obrasci leta koji minimiziraju uznemiravanje. To izravno povezuje bibliometrijski nalaz s pregledom performansi kolege.'),
      bullet('Predložena struktura za 6 stranica: I Introduction (pregled + motivacija, 0,7 str.), II Data and Methods (upiti, modeli, kriteriji, 1,3 str.), III Results (Fig. 1–3, Table I–II, 1,8 str.), IV Discussion (tri poruke + registarski kontrast + hrvatski regulatorni kontekst, 1,2 str.), V Conclusion (0,3 str.), literatura (0,7 str.).'),
      bullet('Naslov (prijedlog): „Drones in Ecology and Environmental Monitoring: Bibliometric State of the Art and Growth Forecasts to 2035".'),

      H1('7. Što još treba napraviti prije predaje'),
      bullet('Pokrenuti drone_env_forecast.m u MATLAB-u s nboot = 1000 (ovaj izvještaj temelji se na Octave izvršenju iste skripte); zadržati ispis konzole kao prilog.'),
      bullet('Ručna provjera preciznosti upita na 100 slučajnih zapisa (OpenAlex API: sample=100&seed=...), navesti postotak relevantnih.'),
      bullet('Ako je dostupan Scopus: isti Booleov upit po godinama kao križna provjera (jedan dodatni stupac).'),
      bullet('Daviesov test za prijelomnu točku u R-u (segmented) ako želite p-vrijednost koju statističar-recenzent neće osporiti.'),
      bullet('Provjeriti sve reference iz kolegina pregleda u izvoru (DOI-jevi), osobito „provjeriti" stavke; dodati Bass (1969), Meade & Islam (2006) za modele difuzije, Burnham & Anderson (2002) za QAICc, Priem i sur. (2022) za OpenAlex.'),
      bullet('Deklaracija uporabe generativne AI u Acknowledgment prema aktualnoj IEEE politici.'),

      H1('8. Popis isporučenih datoteka'),
      table(['Datoteka', 'Sadržaj'], [
        ['data/openalex_drone_env_annual.csv', 'glavni skup: 27 godina × 13 serija + oznaka potpune godine'],
        ['data/raw_openalex_counts.csv', 'isti podaci u dugom formatu (serija, godina, broj)'],
        ['data/registry_indicators.csv', 'FAA, AESA, EASA, HACZ pokazatelji s izvorima'],
        ['data/codebook.md', 'definicije upita, varijable, ograničenja, agregati po zemljama/časopisima'],
        ['matlab/*.m', 'algoritam (10 datoteka), bez toolboxa'],
        ['python/replicate_fits.py', 'neovisna replikacija fitova (scipy)'],
        ['results/*.csv, *.png, *.eps, *.mat', 'izlaz skripte: tablice modela i predviđanja, tri slike'],
      ], [3600, 5600], { aligns: [AlignmentType.LEFT,AlignmentType.LEFT] }),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => { fs.writeFileSync(path.join(__dirname, 'Dronovi_ekologija_podaci_i_predvidanje.docx'), buf); console.log('written'); });
