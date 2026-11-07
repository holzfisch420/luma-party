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
      'Känguru, Nashorn, Nilpferd, Krake, Qualle, Papagei, Flamingo, Eichhörnchen, Seepferdchen, Hirsch, Storch, Koala, Panda, Faultier, Fledermaus, Ameise, Raupe, Hummer, Krebs, Robbe, Biber, Esel, Lama, Strauß, Pfau, Dinosaurier, Axolotl, Ameisenigel, Tapir, Okapi, Narwal, Pelikan, Kolibri, Specht, Maulwurf, Murmeltier, Wiesel, Dachs, Skorpion, Tausendfüßler, Gottesanbeterin, Seestern, Anglerfisch, Pfeilgiftfrosch, Hammerhai, Walross',
    schwer: 'Chamäleon, Stachelrochen, Gürteltier, Ameisenbär, Libelle, Glühwürmchen, Erdmännchen, Waschbär, Zecke, Brieftaube, Mistkäfer, Einsiedlerkrebs, Kugelfisch, Schnabeltier, Gnu, Komodowaran, Wanderfalke, Siebenschläfer, Kakerlake, Blindschleiche, Leguan, Seeelefant, Zitteraal, Faltenwespe, Hamsterrad, Ameisenhaufen, Bienenstock, Vogelnest',
  },
  Essen: {
    leicht:
      'Apfel, Banane, Birne, Kirsche, Erdbeere, Zitrone, Orange, Weintraube, Wassermelone, Ananas, Karotte, Tomate, Gurke, Kartoffel, Pizza, Brot, Brezel, Käse, Ei, Kuchen, Torte, Eis, Keks, Bonbon, Lolli, Pommes, Burger, Hotdog, Wurst, Nudeln, Suppe, Salat, Milch, Kaffee, Tee, Saft, Honig, Schokolade, Popcorn, Sandwich',
    mittel:
      'Spaghetti, Croissant, Donut, Pfannkuchen, Waffel, Muffin, Sushi, Taco, Döner, Brokkoli, Pilz, Mais, Paprika, Zwiebel, Knoblauch, Kürbis, Avocado, Kokosnuss, Erdnuss, Müsli, Spiegelei, Toast, Lebkuchen, Zuckerwatte, Kaugummi, Milchshake, Bratwurst, Rührei, Gulasch, Schnitzel, Zimtschnecke, Frikadelle, Kartoffelpüree, Nachos, Burrito, Tiramisu, Wackelpudding, Rosinenbrötchen, Bananensplit, Kaiserschmarrn, Ravioli',
    schwer: 'Fondue, Lasagne, Smoothie, Frühlingsrolle, Ketchup, Senf, Raclette, Rösti, Älplermagronen, Birchermüesli, Zopf, Fischstäbchen, Sauerkraut, Gummibärchen, Fruchtspieß, Leberkäse, Grießbrei, Eierlikör, Currywurst, Weißwurst, Spätzle, Maultaschen, Schwarzwälder Kirschtorte, Fleischfondue, Tortellini, Salzstange, Studentenfutter',
  },
  Gegenstände: {
    leicht:
      'Stuhl, Tisch, Bett, Lampe, Uhr, Schlüssel, Schere, Löffel, Gabel, Messer, Teller, Tasse, Flasche, Brille, Hut, Schuh, Socke, Regenschirm, Buch, Stift, Ball, Kerze, Glocke, Spiegel, Tür, Fenster, Telefon, Handy, Fernseher, Kamera, Gitarre, Trommel, Geschenk, Luftballon, Krone, Ring, Schaufel, Hammer, Besen, Koffer',
    mittel:
      'Kühlschrank, Waschmaschine, Staubsauger, Toaster, Wecker, Kopfhörer, Laptop, Tastatur, Fernbedienung, Glühbirne, Batterie, Zahnbürste, Kamm, Föhn, Bügeleisen, Rucksack, Handschuh, Schal, Mütze, Krawatte, Kleid, Hose, Pinsel, Lineal, Radiergummi, Briefumschlag, Briefmarke, Zange, Säge, Leiter, Anker, Kompass, Lupe, Mikrofon, Klavier, Geige, Trompete, Sanduhr, Kissen, Teddybär, Würfel, Puzzle, Drachen, Schaukel, Thermometer, Taschenlampe, Gießkanne, Vase, Bilderrahmen, Sofa, Badewanne, Dusche, Toilette, Waage, Ampel, Nähmaschine, Plattenspieler, Bumerang, Akkuschrauber, Rasenmäher, Schubkarre, Stethoskop, Lautsprecher, Joystick, Kreisel, Jojo, Brecheisen, Wasserwaage, Mausefalle, Vogelhaus',
    schwer: 'Fallschirm, Teleskop, Mikroskop, Steckdose, Schreibmaschine, Feuerlöscher, Kronleuchter, Hängematte, Zauberstab, Metronom, Kartenspiel, Wünschelrute, Fliegenklatsche, Korkenzieher, Nussknacker, Waffeleisen, Kaffeemaschine, Schnorchel, Taucherbrille, Steinschleuder, Kettensäge, Rettungsring, Windspiel, Traumfänger, Stimmgabel, Lötkolben, Schneekugel, Spieluhr, Wäscheklammer, Klobürste, Duschvorhang, Wärmflasche, Mülltonne',
  },
  Berufe: {
    leicht: 'Arzt, Polizist, Feuerwehrmann, Koch, Lehrer, Bäcker, Pilot, Clown, König, Prinzessin, Pirat, Ritter, Zauberer, Astronaut, Bauer, Maler',
    mittel:
      'Zahnarzt, Friseur, Gärtner, Fischer, Mechaniker, Postbote, Kellner, Sänger, Tänzer, Fotograf, Detektiv, Taucher, Schornsteinfeger, Krankenpfleger, Bauarbeiter, Tierarzt, Fußballspieler, Schiedsrichter, Matrose, Kapitän, Musiker, Imker, Elektriker, Schneider, Metzger, Bergführer, Bodyguard, Tierpfleger, Zirkusdirektor, Bademeister, Hausmeister, Bibliothekar, Apotheker, Förster, Stuntman',
    schwer: 'Dirigent, Archäologe, Jongleur, Pantomime, Programmierer, Richter, Leibwächter, Hufschmied, Bestatter, Uhrmacher, Glaser, Dachdecker, Hellseher, Bauchredner, Kaminfeger, Fluglotse, Synchronsprecher, Sommelier, Influencer, Türsteher, Hochseilartist, Schlangenbeschwörer, Wahrsagerin, Erfinder, Meteorologe, Politiker, Kassierer',
  },
  Natur: {
    leicht:
      'Sonne, Mond, Stern, Wolke, Regen, Schnee, Blitz, Regenbogen, Baum, Blume, Rose, Gras, Berg, Fluss, Meer, Insel, Strand, Wald, Feuer, Wasser, Stein, Blatt, Kaktus, Tulpe, Sonnenblume',
    mittel:
      'Vulkan, Wasserfall, Höhle, Wüste, Gletscher, Tornado, Welle, Palme, Tannenzapfen, Eichel, Kastanie, Schneeflocke, Eiszapfen, Nebel, Gewitter, Sonnenuntergang, Komet, Planet, Erde, See, Teich, Hügel, Muschel, Koralle, Seerose, Löwenzahn, Kleeblatt, Wurzel, Ast, Sand, Mondsichel, Morgentau, Sandsturm, Treibsand, Geysir, Tropfsteinhöhle, Moos, Pilzkreis, Dornenbusch, Brennnessel',
    schwer: 'Polarlicht, Erdbeben, Lawine, Sternschnuppe, Mondfinsternis, Oase, Ebbe, Sonnenfinsternis, Klimawandel, Schwerkraft, Ebbe und Flut, Echo, Jahreszeiten, Herbstlaub, Frühling, Hagel, Raureif, Windstille, Hitzewelle, Gezeiten, Fata Morgana, Urknall, Schwarzes Loch, Milchstraße, Sternbild, Erosion, Photosynthese, Waldbrand',
  },
  Fahrzeuge: {
    leicht: 'Auto, Bus, Zug, Flugzeug, Schiff, Boot, Fahrrad, Motorrad, Traktor, Rakete, Hubschrauber, Lastwagen, Taxi, Roller, U-Boot, Heißluftballon',
    mittel:
      'Feuerwehrauto, Krankenwagen, Polizeiauto, Bagger, Kran, Segelboot, Kanu, Skateboard, Schlitten, Kutsche, Straßenbahn, Seilbahn, Wohnmobil, Müllauto, Kinderwagen, Einrad, Tandem, Gondel, Jetski, Rennauto, Raumschiff, Ufo, Dampflok, Mähdrescher, Gabelstapler, Surfbrett, Pistenbully, Sattelschlepper, Abschleppwagen, Hovercraft, Panzer, Draisine, Quad, Bobschlitten, Doppeldecker, Containerschiff',
    schwer: 'Zeppelin, Segelflugzeug, Rikscha, Monstertruck, Floß, Tretboot, Rollstuhl, Segway, Postauto, Schaufelraddampfer, Mondfahrzeug, Kehrmaschine, Betonmischer, Drohne, Seifenkiste, Cabrio, Oldtimer, Flugzeugträger, Pferdekutsche, Hundeschlitten, Sessellift, Rolltreppe, Fahrstuhl, Gleitschirm, Space Shuttle',
  },
  Aktivitäten: {
    leicht: 'Schwimmen, Laufen, Tanzen, Singen, Schlafen, Lesen, Malen, Kochen, Lachen, Weinen, Springen, Klettern, Angeln, Fußball, Tennis, Skifahren, Zähneputzen, Duschen, Winken',
    mittel:
      'Jonglieren, Reiten, Surfen, Tauchen, Grillen, Zelten, Wandern, Bowling, Golf, Basketball, Boxen, Yoga, Gähnen, Niesen, Schnarchen, Pfeifen, Klatschen, Staubsaugen, Bügeln, Einkaufen, Fotografieren, Telefonieren, Backen, Stricken, Eislaufen, Schneeballschlacht, Kissenschlacht, Seilspringen, Bungeejumping, Karaoke, Picknick, Geburtstag, Hochzeit, Zaubern, Rudern, Bogenschießen, Fallschirmspringen, Bergsteigen, Wellenreiten, Breakdance, Fechten, Turmspringen, Schachspielen, Tischtennis, Minigolf, Kitesurfen, Dart',
    schwer: 'Verstecken, Schlafwandeln, Purzelbaum, Handstand, Limbo, Meditieren, Tauziehen, Sackhüpfen, Schwarzfahren, Aufräumen, Ausschlafen, Verschlafen, Umziehen, Flirten, Streiten, Verhandeln, Staunen, Zögern, Schummeln, Lästern, Prokrastinieren, Bauchklatscher, Moonwalk, Luftgitarre, Selfie, Fernsehen, Rasenmähen, Heimweh, Pflanzen gießen, Wäsche aufhängen, Schlange stehen, Abwaschen',
  },
  Orte: {
    leicht: 'Haus, Schule, Burg, Schloss, Kirche, Zoo, Park, Spielplatz, Bauernhof, Bahnhof, Flughafen, Krankenhaus, Supermarkt, Bäckerei, Kino, Brücke, Turm, Leuchtturm, Zelt, Iglu',
    mittel:
      'Zirkus, Museum, Bibliothek, Stadion, Hafen, Tankstelle, Freizeitpark, Schwimmbad, Baustelle, Garage, Keller, Dachboden, Gefängnis, Pyramide, Eiffelturm, Wolkenkratzer, Windmühle, Riesenrad, Achterbahn, Kreuzung, Restaurant, Café, Campingplatz, Skipiste, Labyrinth, Baumhaus, Hundehütte, Autobahn, Friedhof, Rathaus, Parlament, Kaserne, Sternwarte, Aquarium, Botanischer Garten, Fußgängerzone, Waschanlage, Kreisverkehr, Bushaltestelle',
    schwer: 'Freiheitsstatue, Chinesische Mauer, Weltall, Weihnachtsmarkt, Raumstation, Bergwerk, Sauna, Matterhorn, Bermudadreieck, Atlantis, Kolosseum, Schiefer Turm von Pisa, Stonehenge, Nordpol, Südpol, Mount Everest, Niagarafälle, Venedig, Großstadt, Geisterbahn, Spiegelkabinett, Fundbüro, Wartezimmer, Umkleidekabine, Notausgang, Grenzübergang, Sackgasse',
  },
  Redewendungen: {
    mittel:
      'Tomaten auf den Augen, Schmetterlinge im Bauch, Kopf in den Wolken, Ins Fettnäpfchen treten, Den Nagel auf den Kopf treffen, Auf dem Holzweg, Katze im Sack, Eulen nach Athen tragen, Zwei Fliegen mit einer Klappe, Haare auf den Zähnen, Ein Brett vor dem Kopf, Wie ein Elefant im Porzellanladen',
    schwer:
      'Jemandem einen Bären aufbinden, Die Kuh vom Eis holen, Mit dem falschen Fuß aufstehen, Da steppt der Bär, Den Wald vor lauter Bäumen nicht sehen, Ins kalte Wasser springen, Die Katze aus dem Sack lassen, Öl ins Feuer gießen, Auf großem Fuß leben, Jemandem den Kopf waschen, Eine Extrawurst bekommen, Unter einer Decke stecken, Alles in Butter, Kalte Füße bekommen, Den Löffel abgeben, Ein Auge zudrücken, Das Kind mit dem Bade ausschütten, Hals- und Beinbruch, Einen Vogel haben, Die Nadel im Heuhaufen',
  },
  Begriffe: {
    mittel:
      'Liebe, Angst, Freundschaft, Glück, Pech, Geheimnis, Musik, Zeit, Geld, Urlaub, Hunger, Durst, Langeweile, Eifersucht, Mut, Stille, Lärm, Erinnerung, Traum, Wochenende',
    schwer:
      'Freiheit, Demokratie, Gerechtigkeit, Inflation, Internet, Gravitation, Evolution, Unendlichkeit, Ironie, Nostalgie, Fernweh, Schadenfreude, Gewissen, Vertrauen, Zufall, Karma, Déjà-vu, Stress, Burnout, Wahlkampf, Datenschutz, Fake News, Künstliche Intelligenz, Globalisierung, Bürokratie, Inspiration, Midlife-Crisis, Feierabend, Sommerzeit, Gruppenzwang',
  },
  'Geeker-Vocab': {
    mittel:
      'Bong, Hash, Baggie, Hotbox, Pipe, Papes, Filter, Cannabis, Joint, Blunt, Grinder, Feuerzeug, Tabak, Weed, Kiffen, Rauchwolke, Aschenbecher, Long Papes, Bauen, Bröseln, Vaporizer, Space Cake, Stash, Rote Augen, Augentropfen, Hanfblatt, Munchies, Hustenanfall, Rauchring, Couch',
    schwer:
      'Maka, Weezy, Pueblo, Ott, Dübel, Tip, Kush, Dab, Edibles, Rolling Tray, Lungenzug, Fressflash, Couchlock, Kopfkino, Purple Haze, Ticker, Ofen, Sticky Fingers, Wake and Bake, Puff Puff Pass',
  },
  Deutschrap: {
    mittel:
      'Yung Hurn, Jonny5, Zackavelli, Kroka Koka, Nizi19, Lucio101, Fergy53, RIN, Ufo361, Money Boy, LGoony, Crack Ignaz, Haiyti, Pashanim, Ski Aggu, Makko, t-low, Ion Miles, Kasimir1441, OG Keemo, Bonez MC, RAF Camora, Gzuz, Apache 207, Haftbefehl, Luciano, Shindy, Capital Bra, Badmómzjay, Symba',
    schwer: '1019, Young Krillin, Bausa, Sira, Brudi030, Monk, BHZ, Yin Kalle, Nimo, Bushido, Sido, Kool Savas, Cro, Casper, Marteria',
  },
  'Englischer Rap': {
    mittel:
      'Travis Scott, Playboi Carti, Ken Carson, Young Thug, Lil Uzi Vert, Nettspend, OsamaSon, Trippie Redd, Che, Gunna, Future, Slayr, Lil Yachty, Kanye West, Tupac, Snoop Dogg, The Weeknd, Drake, Kendrick Lamar, Metro Boomin, Destroy Lonely, Don Toliver, Lil Baby, 21 Savage, Kid Cudi, Quavo, Juice WRLD, XXXTentacion, Eminem, Dr. Dre',
    schwer:
      'Yeat, Homixide Gang, Sheck Wes, A$AP Rocky, Rich Homie Quan, Lil Tecca, Ski Mask the Slump God, Offset, Takeoff, Pharrell, Jay-Z, Nicki Minaj, Ty Dolla Sign, Wiz Khalifa, 50 Cent, Daft Punk, Ariana Grande, Lil Wayne, Swae Lee, Lil Durk',
  },
  Sonstiges: {
    leicht:
      'Herz, Geist, Roboter, Drache, Einhorn, Meerjungfrau, Monster, Schneemann, Weihnachtsbaum, Osterei, Engel, Hexe, Vampir, Alien, Superheld, Mumie, Schatzkiste, Fußabdruck, Pflaster, Brief, Musiknote, Smiley, Pfeil',
    mittel:
      'Weihnachtsmann, Osterhase, Zahnfee, Feuerwerk, Seifenblase, Fingerabdruck, Sandburg, Schneeball, Lagerfeuer, Spinnennetz, Vogelscheuche, Konfetti, Glückskeks, Kuckucksuhr, Magnet, Ninja, Cowboy, Zwerg, Riese, Fee, Kobold, Werwolf, Schatzkarte, Flaschenpost, Hufeisen, Marionette, Sparschwein, Zauberhut, Pinocchio, Rotkäppchen, Dornröschen, Aschenputtel, Rapunzel, Frankenstein, Yeti, Sphinx, Medusa, Zyklop, Phönix, Pegasus',
    schwer: 'Hypnose, Albtraum, Zeitmaschine, Doppelgänger, Morgenmuffel, Ohrwurm, Muskelkater, Lampenfieber, Eselsohr, Luftschloss, Schneewittchen, Hänsel und Gretel, Froschkönig, Rumpelstilzchen, Trojanisches Pferd, Loch Ness, Bigfoot, Zombie, Poltergeist, Schutzengel, Sandmännchen, Christkind, Nikolaus, Krampus, Gespenst',
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
