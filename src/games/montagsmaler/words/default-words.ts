/**
 * Integrierter deutscher Wörterpool für Montagsmaler.
 * Alle Wörter sind gut zeichenbar, eindeutig erratbar und familienfreundlich.
 * Format je Kategorie: leicht | mittel | schwer (kommagetrennt).
 */
import type { WordCategory, WordDifficulty, WordEntry } from '../../../shared/types/words';

type Pool = Record<WordCategory, Partial<Record<WordDifficulty, string>>>;

const POOL: Pool = {
  Tiere: {
    leicht:
      'Hund, Katze, Maus, Elefant, Giraffe, Löwe, Tiger, Pferd, Kuh, Schwein, Schaf, Ziege, Hase, Fisch, Vogel, Ente, Huhn, Schlange, Frosch, Schmetterling, Biene, Spinne, Schnecke, Bär, Affe, Krokodil, Zebra, Hai, Wal, Pinguin, Eule, Igel, Fuchs, Wolf, Delfin, Schildkröte, Marienkäfer, Kamel',
    mittel:
      'Känguru, Nashorn, Nilpferd, Krake, Qualle, Papagei, Flamingo, Eichhörnchen, Seepferdchen, Hirsch, Storch, Koala, Panda, Faultier, Fledermaus, Ameise, Raupe, Hummer, Krebs, Robbe, Biber, Esel, Lama, Strauß, Pfau, Dinosaurier',
    schwer: 'Chamäleon, Stachelrochen, Gürteltier, Ameisenbär, Libelle, Glühwürmchen, Erdmännchen, Waschbär',
  },
  Essen: {
    leicht:
      'Apfel, Banane, Birne, Kirsche, Erdbeere, Zitrone, Orange, Weintraube, Wassermelone, Ananas, Karotte, Tomate, Gurke, Kartoffel, Pizza, Brot, Brezel, Käse, Ei, Kuchen, Torte, Eis, Keks, Bonbon, Lolli, Pommes, Burger, Hotdog, Wurst, Nudeln, Suppe, Salat, Milch, Kaffee, Tee, Saft, Honig, Schokolade, Popcorn, Sandwich',
    mittel:
      'Spaghetti, Croissant, Donut, Pfannkuchen, Waffel, Muffin, Sushi, Taco, Döner, Brokkoli, Pilz, Mais, Paprika, Zwiebel, Knoblauch, Kürbis, Avocado, Kokosnuss, Erdnuss, Müsli, Spiegelei, Toast, Lebkuchen, Zuckerwatte, Kaugummi, Milchshake, Bratwurst',
    schwer: 'Fondue, Lasagne, Smoothie, Frühlingsrolle, Ketchup, Senf, Raclette',
  },
  Gegenstände: {
    leicht:
      'Stuhl, Tisch, Bett, Lampe, Uhr, Schlüssel, Schere, Löffel, Gabel, Messer, Teller, Tasse, Flasche, Brille, Hut, Schuh, Socke, Regenschirm, Buch, Stift, Ball, Kerze, Glocke, Spiegel, Tür, Fenster, Telefon, Handy, Fernseher, Kamera, Gitarre, Trommel, Geschenk, Luftballon, Krone, Ring, Schaufel, Hammer, Besen, Koffer',
    mittel:
      'Kühlschrank, Waschmaschine, Staubsauger, Toaster, Wecker, Kopfhörer, Laptop, Tastatur, Fernbedienung, Glühbirne, Batterie, Zahnbürste, Kamm, Föhn, Bügeleisen, Rucksack, Handschuh, Schal, Mütze, Krawatte, Kleid, Hose, Pinsel, Lineal, Radiergummi, Briefumschlag, Briefmarke, Zange, Säge, Leiter, Anker, Kompass, Lupe, Mikrofon, Klavier, Geige, Trompete, Sanduhr, Kissen, Teddybär, Würfel, Puzzle, Drachen, Schaukel, Thermometer, Taschenlampe, Gießkanne, Vase, Bilderrahmen, Sofa, Badewanne, Dusche, Toilette, Waage, Ampel',
    schwer: 'Fallschirm, Teleskop, Mikroskop, Steckdose, Schreibmaschine, Feuerlöscher, Kronleuchter, Hängematte, Zauberstab',
  },
  Berufe: {
    leicht: 'Arzt, Polizist, Feuerwehrmann, Koch, Lehrer, Bäcker, Pilot, Clown, König, Prinzessin, Pirat, Ritter, Zauberer, Astronaut, Bauer, Maler',
    mittel:
      'Zahnarzt, Friseur, Gärtner, Fischer, Mechaniker, Postbote, Kellner, Sänger, Tänzer, Fotograf, Detektiv, Taucher, Schornsteinfeger, Krankenpfleger, Bauarbeiter, Tierarzt, Fußballspieler, Schiedsrichter, Matrose, Kapitän, Musiker, Imker, Elektriker, Schneider, Metzger',
    schwer: 'Dirigent, Archäologe, Jongleur, Pantomime, Programmierer, Richter, Leibwächter',
  },
  Natur: {
    leicht:
      'Sonne, Mond, Stern, Wolke, Regen, Schnee, Blitz, Regenbogen, Baum, Blume, Rose, Gras, Berg, Fluss, Meer, Insel, Strand, Wald, Feuer, Wasser, Stein, Blatt, Kaktus, Tulpe, Sonnenblume',
    mittel:
      'Vulkan, Wasserfall, Höhle, Wüste, Gletscher, Tornado, Welle, Palme, Tannenzapfen, Eichel, Kastanie, Schneeflocke, Eiszapfen, Nebel, Gewitter, Sonnenuntergang, Komet, Planet, Erde, See, Teich, Hügel, Muschel, Koralle, Seerose, Löwenzahn, Kleeblatt, Wurzel, Ast, Sand',
    schwer: 'Polarlicht, Erdbeben, Lawine, Sternschnuppe, Mondfinsternis, Oase, Ebbe, Sonnenfinsternis',
  },
  Fahrzeuge: {
    leicht: 'Auto, Bus, Zug, Flugzeug, Schiff, Boot, Fahrrad, Motorrad, Traktor, Rakete, Hubschrauber, Lastwagen, Taxi, Roller, U-Boot, Heißluftballon',
    mittel:
      'Feuerwehrauto, Krankenwagen, Polizeiauto, Bagger, Kran, Segelboot, Kanu, Skateboard, Schlitten, Kutsche, Straßenbahn, Seilbahn, Wohnmobil, Müllauto, Kinderwagen, Einrad, Tandem, Gondel, Jetski, Rennauto, Raumschiff, Ufo, Dampflok, Mähdrescher, Gabelstapler, Surfbrett',
    schwer: 'Zeppelin, Segelflugzeug, Rikscha, Monstertruck, Floß',
  },
  Aktivitäten: {
    leicht: 'Schwimmen, Laufen, Tanzen, Singen, Schlafen, Lesen, Malen, Kochen, Lachen, Weinen, Springen, Klettern, Angeln, Fußball, Tennis, Skifahren, Zähneputzen, Duschen, Winken',
    mittel:
      'Jonglieren, Reiten, Surfen, Tauchen, Grillen, Zelten, Wandern, Bowling, Golf, Basketball, Boxen, Yoga, Gähnen, Niesen, Schnarchen, Pfeifen, Klatschen, Staubsaugen, Bügeln, Einkaufen, Fotografieren, Telefonieren, Backen, Stricken, Eislaufen, Schneeballschlacht, Kissenschlacht, Seilspringen, Bungeejumping, Karaoke, Picknick, Geburtstag, Hochzeit, Zaubern, Rudern, Bogenschießen',
    schwer: 'Verstecken, Schlafwandeln, Purzelbaum, Handstand, Limbo, Meditieren, Tauziehen, Sackhüpfen',
  },
  Orte: {
    leicht: 'Haus, Schule, Burg, Schloss, Kirche, Zoo, Park, Spielplatz, Bauernhof, Bahnhof, Flughafen, Krankenhaus, Supermarkt, Bäckerei, Kino, Brücke, Turm, Leuchtturm, Zelt, Iglu',
    mittel:
      'Zirkus, Museum, Bibliothek, Stadion, Hafen, Tankstelle, Freizeitpark, Schwimmbad, Baustelle, Garage, Keller, Dachboden, Gefängnis, Pyramide, Eiffelturm, Wolkenkratzer, Windmühle, Riesenrad, Achterbahn, Kreuzung, Restaurant, Café, Campingplatz, Skipiste, Labyrinth, Baumhaus, Hundehütte',
    schwer: 'Freiheitsstatue, Chinesische Mauer, Weltall, Weihnachtsmarkt, Raumstation, Bergwerk, Sauna',
  },
  Sonstiges: {
    leicht:
      'Herz, Geist, Roboter, Drache, Einhorn, Meerjungfrau, Monster, Schneemann, Weihnachtsbaum, Osterei, Engel, Hexe, Vampir, Alien, Superheld, Mumie, Schatzkiste, Fußabdruck, Pflaster, Brief, Musiknote, Smiley, Pfeil',
    mittel:
      'Weihnachtsmann, Osterhase, Zahnfee, Feuerwerk, Seifenblase, Fingerabdruck, Sandburg, Schneeball, Lagerfeuer, Spinnennetz, Vogelscheuche, Konfetti, Glückskeks, Kuckucksuhr, Magnet, Ninja, Cowboy, Zwerg, Riese, Fee, Kobold, Werwolf, Schatzkarte, Flaschenpost, Hufeisen, Marionette, Sparschwein, Zauberhut',
    schwer: 'Hypnose, Albtraum, Zeitmaschine, Doppelgänger, Morgenmuffel, Ohrwurm, Muskelkater, Lampenfieber, Eselsohr, Luftschloss',
  },
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function build(): WordEntry[] {
  const out: WordEntry[] = [];
  for (const [category, byDifficulty] of Object.entries(POOL) as [WordCategory, Pool[WordCategory]][]) {
    for (const [difficulty, csv] of Object.entries(byDifficulty) as [WordDifficulty, string][]) {
      for (const word of csv.split(',').map((w) => w.trim()).filter(Boolean)) {
        out.push({ id: `std-${slug(word)}`, word, category, difficulty });
      }
    }
  }
  return out;
}

export const DEFAULT_WORDS: readonly WordEntry[] = build();
