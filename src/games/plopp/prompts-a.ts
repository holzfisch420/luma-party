/**
 * Aufgaben Teil 1: Tiere & Natur, Essen & Trinken, Länder & Orte.
 * Format: Antworten kommagetrennt, Schreibvarianten mit „|“ (die erste wird angezeigt).
 */
import type { PromptSource } from './prompt-types';

export const PROMPTS_A: PromptSource[] = [
  // ------------------------------------------------------------------ Tiere & Natur
  {
    id: 'tier',
    text: 'Ein Tier',
    pack: 'natur',
    letters: true,
    answers:
      'Aal, Adler, Affe, Alpaka, Ameise, Ameisenbär, Amsel, Anakonda, Antilope, Auerhahn, Axolotl, Bachforelle, Bär, Barrakuda, Biber, Biene, Bison, Blauwal, Blindschleiche, Buntspecht, Buffalo|Büffel, Bussard, Chamäleon, Chinchilla, Dachs, Dackel, Damhirsch, Delfin|Delphin, Dingo, Dodo, Dohle, Dompfaff, Dromedar, Drossel, Eber, Echse, Eichhörnchen, Eidechse, Eisbär|Polarbär, Eisvogel, Elch, Elefant, Elster, Emu, Ente, Erdmännchen, Esel, Eule, Falke, Faultier, Fasan, Fledermaus, Fliege, Floh, Flamingo, Flusspferd|Nilpferd, Forelle, Frettchen, Frosch, Fuchs, Gans, Gazelle, Gecko, Geier, Gemse|Gämse, Gepard, Gibbon, Giraffe, Glühwürmchen, Gnu, Goldfisch, Gorilla, Gottesanbeterin, Grille, Grizzly|Grizzlybär, Gürteltier, Habicht, Hahn, Hai, Hamster, Hase, Hecht, Heuschrecke, Hering, Hirsch, Huhn|Henne, Hummel, Hummer, Hund, Hyäne, Ibis, Igel, Iltis, Impala, Jaguar, Kabeljau, Käfer, Kakadu, Kakerlake, Kamel, Kanarienvogel, Känguru, Karpfen, Katze, Kaulquappe, Kiwi, Koala, Kobra, Kolibri, Komodowaran, Kondor, Kormoran, Krabbe, Krähe, Kranich, Krake|Oktopus|Tintenfisch, Krebs, Krokodil, Kröte, Kuckuck, Kuh, Lachs, Lama, Languste, Laus, Lemming, Lemur, Leopard, Libelle, Löwe, Luchs, Makrele, Mammut, Manta|Mantarochen, Marder, Marienkäfer, Maulwurf, Maus, Meerschweinchen, Mops, Möwe, Mücke, Murmeltier, Muschel, Nachtigall, Narwal, Nashorn, Nasenbär, Natter, Nerz, Okapi, Opossum, Orang-Utan, Orca|Schwertwal, Otter, Panda, Panther, Papagei, Pavian, Pelikan, Pfau, Pferd, Pinguin, Piranha, Pony, Puma, Pute|Truthahn, Python, Qualle, Rabe, Ratte, Raupe, Reh, Reiher, Rentier, Robbe, Rochen, Rotkehlchen, Salamander, Sardine, Schaf, Schakal, Schildkröte, Schimpanse, Schlange, Schmetterling, Schnabeltier, Schnecke, Schwalbe, Schwan, Schwein, Seehund, Seelöwe, Seepferdchen, Seestern, Skorpion, Specht, Spatz, Spinne, Stachelschwein, Star, Steinbock, Stier, Storch, Strauß, Stinktier, Tapir, Taube, Thunfisch, Tiger, Tukan, Uhu, Vogel, Vogelspinne, Wal, Walross, Waschbär, Wasserbüffel, Wespe, Wiesel, Wildschwein, Wolf, Wombat, Wurm|Regenwurm, Yak, Zander, Zebra, Ziege, Zebu, Zecke, Ziesel, Zitteraal',
  },
  {
    id: 'meerestier',
    text: 'Ein Tier, das im Wasser lebt',
    pack: 'natur',
    answers:
      'Aal, Anglerfisch, Auster, Barrakuda, Blauwal, Buckelwal, Clownfisch, Delfin|Delphin, Dorsch|Kabeljau, Forelle, Garnele|Shrimp|Crevette, Goldfisch, Hai, Hammerhai, Hecht, Hering, Hummer, Karpfen, Koralle, Krabbe, Krake|Oktopus|Tintenfisch, Krebs, Kugelfisch, Lachs, Languste, Makrele, Manta|Mantarochen, Muschel, Narwal, Orca|Schwertwal, Otter|Seeotter, Pinguin, Piranha, Pottwal, Qualle, Robbe, Rochen, Sardine, Schildkröte|Meeresschildkröte, Seehund, Seeigel, Seelöwe, Seepferdchen, Seestern, Seekuh, Seegurke, Stachelrochen, Stör, Thunfisch, Walross, Weißer Hai, Wels, Zander, Zitteraal, Schwertfisch, Barsch, Scholle, Flunder, Heilbutt, Moräne, Kalmar, Sepia, Nemo, Axolotl, Biber, Nilpferd|Flusspferd, Krokodil, Frosch, Kaulquappe, Ente, Schwan, Pelikan, Krill, Plankton, Belugawal|Beluga, Delfinhai, Kofferfisch, Feuerfisch, Doktorfisch, Papageifisch, Barbe, Guppy, Neonfisch, Koi',
  },
  {
    id: 'vogel',
    text: 'Ein Vogel',
    pack: 'natur',
    answers:
      'Adler, Amsel, Albatros, Auerhahn, Blaumeise, Bussard, Buchfink, Dohle, Dompfaff|Gimpel, Drossel, Elster, Emu, Ente, Eisvogel, Eule, Falke, Fasan, Fink, Flamingo, Gans, Geier, Graureiher, Habicht, Hahn, Huhn|Henne, Ibis, Kakadu, Kanarienvogel, Kiwi, Kolibri, Kondor, Kormoran, Krähe, Kranich, Kuckuck, Lerche, Meise, Möwe, Nachtigall, Nandu, Papagei, Pelikan, Pfau, Pinguin, Pute|Truthahn, Rabe, Reiher, Rotkehlchen, Schwalbe, Schwan, Specht, Spatz|Sperling, Star, Storch, Strauß, Taube, Tukan, Uhu, Wachtel, Wellensittich, Wiedehopf, Zaunkönig, Kauz, Waldkauz, Sittich, Ara, Bachstelze, Kiebitz, Rebhuhn, Kernbeißer, Seeadler, Steinadler, Wanderfalke, Turmfalke, Milan, Rotmilan, Dodo, Kasuar, Marabu, Stieglitz|Distelfink, Zeisig, Schneeeule, Papageitaucher, Lachmöwe, Haubentaucher, Blässhuhn, Schnepfe',
  },
  {
    id: 'insekt',
    text: 'Ein Insekt oder Krabbeltier',
    pack: 'natur',
    answers:
      'Ameise, Assel, Biene, Bremse, Borkenkäfer, Floh, Fliege, Glühwürmchen, Gottesanbeterin, Grille, Heuschrecke|Grashüpfer, Hornisse, Hummel, Käfer, Kakerlake, Kellerassel, Laus, Libelle, Maikäfer, Marienkäfer, Milbe, Motte, Mücke|Stechmücke|Gelse, Ohrwurm, Raupe, Schabe, Schmetterling, Schnake, Silberfischchen, Skorpion, Spinne, Stabheuschrecke, Termite, Tausendfüßler, Vogelspinne, Wanze, Wespe, Zecke, Zikade, Hirschkäfer, Mistkäfer, Kartoffelkäfer, Nachtfalter, Zitronenfalter, Tagpfauenauge, Bettwanze, Fruchtfliege, Pferdebremse, Wasserläufer, Weberknecht, Schnecke, Regenwurm|Wurm, Made, Larve, Blattlaus, Holzwurm, Florfliege',
  },
  {
    id: 'haustier',
    text: 'Ein Haustier oder Bauernhoftier',
    pack: 'natur',
    answers:
      'Hund, Katze, Hamster, Meerschweinchen, Kaninchen|Hase, Wellensittich, Kanarienvogel, Goldfisch, Schildkröte, Maus, Ratte, Frettchen, Chinchilla, Degu, Rennmaus, Papagei, Axolotl, Gecko, Bartagame, Schlange, Vogelspinne, Pferd, Pony, Esel, Kuh, Rind, Stier, Ochse, Kalb, Schwein, Ferkel, Schaf, Lamm, Ziege, Huhn|Henne, Hahn, Küken, Ente, Gans, Pute|Truthahn, Lama, Alpaka, Taube, Fisch, Koi, Guppy, Wachtel, Biene, Hängebauchschwein, Mops, Dackel, Pudel, Schäferhund, Labrador, Golden Retriever, Husky, Chihuahua, Bulldogge, Dalmatiner, Beagle, Border Collie, Rottweiler, Dobermann, Pitbull, Maine Coon, Perserkatze, Siamkatze, Sphynx',
  },
  {
    id: 'hunderasse',
    text: 'Eine Hunderasse',
    pack: 'natur',
    answers:
      'Akita, Australian Shepherd|Aussie, Basset, Beagle, Berner Sennenhund, Bernhardiner, Bichon Frisé, Bloodhound, Border Collie, Boston Terrier, Boxer, Bulldogge|Englische Bulldogge|Französische Bulldogge, Bullterrier, Cane Corso, Cavalier King Charles, Chihuahua, Chow-Chow, Cocker Spaniel, Collie, Corgi, Dackel|Dachshund, Dalmatiner, Deutsche Dogge|Dogge, Dobermann, Golden Retriever, Greyhound|Windhund, Havaneser, Husky, Irish Setter, Jack Russell, Labrador, Leonberger, Malteser, Malinois, Mops, Neufundländer, Pekinese, Pinscher, Pitbull, Pomeranian|Zwergspitz, Pudel, Rhodesian Ridgeback, Rottweiler, Samojede, Schäferhund, Schnauzer, Shar-Pei, Shiba Inu, Shih Tzu, Spitz, Staffordshire, Terrier, Weimaraner, Westie|West Highland Terrier, Whippet, Yorkshire Terrier|Yorkie, Appenzeller, Entlebucher, Bobtail, Afghane, Barsoi, Dingo, Wolfshund, Eurasier, Kangal, Vizsla, Magyar Vizsla, Pointer, Setter, Spaniel, Retriever, Sheltie',
  },
  {
    id: 'baum',
    text: 'Ein Baum oder eine Pflanze',
    pack: 'natur',
    answers:
      'Ahorn, Apfelbaum, Birke, Buche, Eiche, Eibe, Erle, Esche, Fichte, Kiefer|Föhre, Lärche, Linde, Tanne, Ulme, Weide, Pappel, Kastanie, Kirschbaum, Palme, Mammutbaum, Zeder, Zypresse, Olivenbaum, Bambus, Kaktus, Aloe Vera, Efeu, Farn, Moos, Gras, Klee, Löwenzahn, Brennnessel, Distel, Rose, Tulpe, Sonnenblume, Gänseblümchen, Lilie, Orchidee, Nelke, Veilchen, Vergissmeinnicht, Lavendel, Mohn, Krokus, Narzisse|Osterglocke, Schneeglöckchen, Hyazinthe, Dahlie, Edelweiss|Edelweiß, Enzian, Margerite, Kornblume, Hortensie, Flieder, Jasmin, Lotus|Lotusblume, Seerose, Venusfliegenfalle, Bonsai, Ficus, Basilikum, Minze, Petersilie, Rosmarin, Thymian, Salbei, Schnittlauch, Hanf|Cannabis, Mistel, Stechpalme, Heidekraut, Schilf, Bananenstaude, Weinrebe, Hopfen, Tabak, Baumwolle, Kokospalme, Affenbrotbaum|Baobab, Eukalyptus, Magnolie, Platane, Walnussbaum, Haselnuss|Haselstrauch, Holunder, Brombeere, Himbeere, Lorbeer',
  },
  {
    id: 'blume',
    text: 'Eine Blume',
    pack: 'natur',
    answers:
      'Rose, Tulpe, Sonnenblume, Gänseblümchen, Lilie, Orchidee, Nelke, Veilchen, Vergissmeinnicht, Lavendel, Mohn|Mohnblume, Krokus, Narzisse|Osterglocke, Schneeglöckchen, Hyazinthe, Dahlie, Edelweiss|Edelweiß, Enzian, Margerite, Kornblume, Hortensie, Flieder, Jasmin, Lotus|Lotusblume, Seerose, Löwenzahn, Begonie, Geranie, Petunie, Primel, Stiefmütterchen, Ringelblume, Kamille, Klatschmohn, Iris|Schwertlilie, Gerbera, Chrysantheme, Aster, Pfingstrose, Magnolie, Kirschblüte, Hibiskus, Kaktusblüte, Amaryllis, Weihnachtsstern, Zinnie, Freesie, Fuchsie, Lupine, Rittersporn, Glockenblume, Maiglöckchen, Anemone, Azalee, Rhododendron, Kamelie, Clematis, Malve, Mohnrose, Studentenblume|Tagetes, Alpenrose, Sumpfdotterblume, Butterblume|Hahnenfuß, Wicke, Duftwicke, Gladiole, Ranunkel, Calla, Frangipani, Passionsblume, Kapuzinerkresse, Lotosblume, Strohblume, Vanilleblume, Zaubernuss',
  },
  {
    id: 'wetter',
    text: 'Etwas, das mit Wetter zu tun hat',
    pack: 'natur',
    answers:
      'Regen, Schnee, Hagel, Sturm, Gewitter, Blitz, Donner, Nebel, Wind, Sonne, Sonnenschein, Wolke, Regenbogen, Tornado|Windhose, Hurrikan|Hurrikan, Taifun, Orkan, Glatteis, Frost, Raureif, Tau, Nieselregen, Platzregen, Wolkenbruch, Schneesturm, Lawine, Hitze, Hitzewelle, Dürre, Monsun, Föhn, Brise, Böe, Graupel, Schneeregen, Eisregen, Smog, Dunst, Luftdruck, Hochdruck, Tiefdruck|Tief, Hoch, Temperatur, Luftfeuchtigkeit, Wetterbericht, Meteorologe, Thermometer, Barometer, Regenschirm, Gummistiefel, Sonnenbrand, Unwetter, Wetterleuchten, Kaltfront, Warmfront, Polarlicht|Nordlicht, Schauer, Sprühregen, Wirbelsturm, Zyklon, Blizzard, Schneeflocke, Eiszapfen, Pfütze, Überschwemmung|Hochwasser, Klimawandel, UV-Index, Gewitterwolke, Wetterfrosch',
  },

  // ------------------------------------------------------------------ Essen & Trinken
  {
    id: 'obst',
    text: 'Eine Frucht',
    pack: 'essen',
    letters: true,
    answers:
      'Apfel, Aprikose|Marille, Ananas, Avocado, Banane, Birne, Blaubeere|Heidelbeere, Brombeere, Clementine, Cranberry, Dattel, Drachenfrucht|Pitaya, Erdbeere, Feige, Granatapfel, Grapefruit, Guave, Hagebutte, Himbeere, Holunder, Honigmelone, Johannisbeere|Ribisel|Träubeli, Kaki, Kaktusfeige, Kirsche, Kiwi, Kokosnuss, Kumquat, Limette, Litschi, Mandarine, Mango, Maracuja|Passionsfrucht, Melone, Mirabelle, Nektarine, Orange|Apfelsine, Papaya, Pfirsich, Pflaume|Zwetschge|Zwetschke, Physalis, Preiselbeere, Quitte, Rhabarber, Rosine, Sanddorn, Stachelbeere, Sternfrucht|Karambole, Traube|Weintraube, Wassermelone, Zitrone, Jackfrucht, Durian, Rambutan, Mangostan, Kiwano, Pomelo, Blutorange, Moltebeere, Maulbeere, Olive, Tomate, Acai, Goji|Gojibeere, Cherimoya, Longan, Mispel, Schlehe, Kornelkirsche, Feijoa, Tamarinde, Zitronatzitrone, Yuzu',
  },
  {
    id: 'gemuese',
    text: 'Ein Gemüse',
    pack: 'essen',
    letters: true,
    answers:
      'Artischocke, Aubergine|Melanzani, Avocado, Blumenkohl|Karfiol, Bohne|Grüne Bohne, Brokkoli, Chicorée, Chinakohl, Erbse, Fenchel, Grünkohl, Gurke, Ingwer, Karotte|Möhre|Rüebli|Mohrrübe, Kartoffel|Erdapfel|Härdöpfel, Knoblauch, Kohl, Kohlrabi, Kürbis, Lauch|Porree, Linse, Mais, Mangold, Meerrettich|Kren, Okra, Paprika|Peperoni, Pastinake, Peperoncino|Chili, Radieschen, Rettich, Rosenkohl, Rote Bete|Rande|Randen|Rote Rübe, Rotkohl|Blaukraut|Rotkraut, Rucola, Salat|Kopfsalat|Eisbergsalat, Schwarzwurzel, Sellerie, Spargel, Spinat, Steckrübe, Süßkartoffel|Süsskartoffel, Tomate, Topinambur, Weißkohl|Weisskohl|Weißkraut, Wirsing, Zucchini, Zwiebel, Frühlingszwiebel, Schalotte, Kichererbse, Edamame, Pak Choi, Champignon|Pilz, Steinpilz, Pfifferling|Eierschwamm, Bambussprossen, Sojabohne, Kresse, Feldsalat|Nüsslisalat|Vogerlsalat, Endivie, Löwenzahn, Bärlauch, Maniok, Yamswurzel, Petersilienwurzel, Romanesco, Wasabi, Jalapeño, Gurkerl|Essiggurke',
  },
  {
    id: 'gericht',
    text: 'Ein Gericht oder eine Speise',
    pack: 'essen',
    answers:
      'Pizza, Pasta|Nudeln, Spaghetti, Lasagne, Risotto, Burger|Hamburger|Cheeseburger, Pommes|Pommes Frites|Fritten, Döner|Döner Kebab|Kebab, Dürüm, Falafel, Sushi, Ramen, Curry, Chili con Carne, Tacos|Taco, Burrito, Nachos, Quesadilla, Paella, Gulasch, Schnitzel|Wiener Schnitzel, Rösti, Fondue, Raclette, Älplermagronen, Zürcher Geschnetzeltes|Geschnetzeltes, Bratwurst|Wurst, Currywurst, Sauerkraut, Spätzle|Käsespätzle, Maultaschen, Knödel|Klöße, Rouladen, Sauerbraten, Eintopf, Suppe, Tomatensuppe, Kartoffelsalat, Salat, Steak, Pancakes|Pfannkuchen|Palatschinken, Crêpes|Crêpe, Waffeln|Waffel, Omelett, Rührei, Spiegelei, Toast, Sandwich, Hot Dog|Hotdog, Frühlingsrolle, Dim Sum, Pekingente, Gyoza, Pho, Pad Thai, Bibimbap, Kimchi, Shakshuka, Hummus, Moussaka, Gyros, Souvlaki, Tzatziki, Börek, Lahmacun, Pide, Couscous, Tajine, Ceviche, Fish and Chips, Flammkuchen, Quiche, Ratatouille, Bouillabaisse, Croque Monsieur, Kaiserschmarrn, Germknödel, Schupfnudeln, Leberkäse, Weißwurst|Weisswurst, Haxe|Schweinshaxe, Brezel|Breze, Bolognese, Carbonara, Gnocchi, Ravioli, Tortellini, Calzone, Bruschetta, Antipasti, Tiramisu, Poke Bowl|Poke, Wrap, Bagel, Club Sandwich, Mac and Cheese, Chicken Nuggets|Nuggets, Chicken Wings|Wings, Spare Ribs|Ribs, Pulled Pork, Fajitas, Enchiladas, Gazpacho, Minestrone, Pelmeni, Pierogi, Borschtsch, Bigos, Cevapcici, Langos, Raclette',
  },
  {
    id: 'suessigkeit',
    text: 'Eine Süßigkeit oder ein Dessert',
    pack: 'essen',
    answers:
      'Schokolade, Gummibärchen|Gummibär, Lakritze|Lakritz, Bonbon|Täfeli, Lolli|Lutscher, Kaugummi, Marshmallow, Zuckerwatte, Popcorn, Eis|Glace|Speiseeis, Keks|Guetzli|Plätzchen, Kuchen, Torte, Muffin, Cupcake, Brownie, Donut|Berliner|Krapfen, Waffel, Crêpe, Pudding, Tiramisu, Panna Cotta, Mousse au Chocolat, Crème Brûlée, Käsekuchen|Cheesecake, Apfelstrudel|Strudel, Schwarzwälder Kirschtorte, Sachertorte, Macarons|Macaron, Praline, Trüffel, Nougat, Marzipan, Karamell, Toffee, Fudge, Honig, Lebkuchen, Spekulatius, Stollen, Zimtstern, Baklava, Churros, Eclair, Windbeutel, Profiterol, Croissant, Zimtschnecke, Kaiserschmarrn, Milchreis, Grießbrei, Rote Grütze, Sorbet, Frozen Yogurt, Smoothie Bowl, Wackelpudding|Götterspeise, Kinderschokolade, Smarties, M&Ms, Twix, Snickers, Mars, Bounty, Kitkat, Duplo, Ferrero Rocher, Raffaello, Toblerone, Haribo, Nutella, Oreo, Pick Up, Kinder Bueno, Hanuta, Milka, Lindt, Ragusa, Mohrenkopf|Schokokuss|Schaumkuss, Meringue|Baiser, Cantuccini, Biscotti, Amarettini, Brausepulver, Ahoj-Brause, Center Shock, Mentos, Tic Tac, Rocher',
  },
  {
    id: 'getraenk',
    text: 'Ein Getränk',
    pack: 'essen',
    answers:
      'Wasser|Mineralwasser|Sprudel, Cola|Coca-Cola, Fanta, Sprite, Pepsi, Eistee|Ice Tea, Limonade|Limo, Apfelsaft, Orangensaft|O-Saft, Multivitaminsaft, Traubensaft, Tomatensaft, Saft, Schorle|Apfelschorle|Saftschorle, Kaffee, Espresso, Cappuccino, Latte Macchiato|Latte, Flat White, Americano, Mocca|Mokka, Tee, Grüntee|Grüner Tee, Schwarztee, Chai, Matcha, Kakao|Heiße Schokolade|Ovomaltine, Milch, Milchshake|Shake, Smoothie, Bubble Tea, Energydrink|Red Bull|Monster, Rivella, Almdudler, Fritz-Kola, Club-Mate|Mate, Ginger Ale, Tonic Water|Tonic, Bitter Lemon, Kombucha, Kefir, Ayran, Lassi, Bier, Weißbier|Weizen, Pils, Radler|Panaché|Alsterwasser, Wein, Rotwein, Weißwein|Weisswein, Rosé, Sekt, Prosecco, Champagner, Glühwein, Cidre|Most, Whisky, Wodka, Rum, Gin, Tequila, Schnaps, Likör, Jägermeister, Aperol Spritz|Aperol|Spritz, Hugo, Mojito, Caipirinha, Pina Colada, Sex on the Beach, Cuba Libre, Gin Tonic, Margarita, Sangria, Eierlikör, Baileys, Absinth, Sake, Ouzo, Raki, Grappa, Kirsch|Kirschwasser, Pflümli, Williams, Jacky Cola, Vodka Bull, Long Island Iced Tea, Moscow Mule, Negroni, Martini, Daiquiri, Bowle, Punsch, Holunderblütensirup|Sirup, Kokoswasser, Hafermilch, Mandelmilch, Sojamilch, Buttermilch',
  },
  {
    id: 'kaese',
    text: 'Ein Käse oder ein Milchprodukt',
    pack: 'essen',
    answers:
      'Emmentaler, Gruyère|Greyerzer, Appenzeller, Tilsiter, Raclette|Raclettekäse, Sbrinz, Tête de Moine, Vacherin, Gouda, Edamer, Cheddar, Camembert, Brie, Roquefort, Gorgonzola, Parmesan|Parmigiano, Grana Padano, Pecorino, Mozzarella, Burrata, Ricotta, Mascarpone, Feta|Schafskäse, Halloumi, Manchego, Gauda, Leerdammer, Butterkäse, Bergkäse, Harzer, Limburger, Hüttenkäse|Cottage Cheese, Frischkäse|Philadelphia, Quark|Topfen, Joghurt|Jogurt, Skyr, Kefir, Buttermilch, Sahne|Rahm|Obers, Schlagsahne|Schlagrahm, Saure Sahne|Sauerrahm, Crème fraîche, Schmand, Butter, Milch, Kondensmilch, Molke, Ziegenkäse, Weichkäse, Hartkäse, Schmelzkäse, Scheiblettenkäse, Comté, Taleggio, Fontina, Provolone, Stilton, Gruyere, Raclette, Mutschli, Vacherin Mont-d\'Or, Babybel, Kiri, Bresso, La Vache qui rit',
  },
  {
    id: 'gewuerz',
    text: 'Ein Gewürz oder Kraut',
    pack: 'essen',
    answers:
      'Salz, Pfeffer, Paprika|Paprikapulver, Curry|Currypulver, Kurkuma, Zimt, Muskat|Muskatnuss, Nelke|Gewürznelke, Kardamom, Kreuzkümmel|Cumin, Kümmel, Koriander, Ingwer, Knoblauch, Chili|Cayennepfeffer, Vanille, Safran, Anis, Sternanis, Fenchel, Senf, Senfkörner, Lorbeer|Lorbeerblatt, Wacholder, Piment, Oregano, Basilikum, Thymian, Rosmarin, Salbei, Petersilie, Schnittlauch, Dill, Minze|Pfefferminze, Estragon, Majoran, Liebstöckel|Maggikraut, Bärlauch, Kerbel, Zitronengras, Kresse, Sesam, Mohn, Bockshornklee, Garam Masala, Ras el Hanout, Za\'atar, Sumach, Tonkabohne, Meerrettich|Kren, Wasabi, Kapern, Zitronenmelisse, Borretsch, Lavendel, Herbes de Provence|Kräuter der Provence, Fünf-Gewürze-Pulver, Chiliflocken, Knoblauchpulver, Zwiebelpulver, Rauchsalz, Fleur de Sel, Himalayasalz, Pfefferkörner, Szechuanpfeffer, Rosa Pfeffer, Langer Pfeffer, Kakao',
  },
  {
    id: 'fastfood',
    text: 'Eine Fast-Food-Kette oder ein Restaurant-Typ',
    pack: 'essen',
    answers:
      "McDonald's|McDonalds|Mäckes|Mekkes, Burger King, KFC|Kentucky Fried Chicken, Subway, Pizza Hut, Domino's|Dominos, Starbucks, Taco Bell, Wendy's|Wendys, Five Guys, Dunkin' Donuts|Dunkin Donuts|Dunkin, Nordsee, Vapiano, Hans im Glück, Burgermeister, L'Osteria|Osteria, Block House, Dean & David, Coop Restaurant, Migros Restaurant, Manor Food, Holy Cow, Tibits, Hiltl, Chipotle, In-N-Out, Popeyes, Chick-fil-A, Shake Shack, Papa John's, Wienerwald, Kochlöffel, Backwerk, Ditsch, Le Crobag, Tim Hortons, Krispy Kreme, Costa Coffee, Pret a Manger, Nando's, Wingstop, Peter Pane, Jim Block, Max Burgers, Yo! Sushi, Wagamama, Ikea Restaurant|Ikea, Imbiss|Imbissbude, Dönerbude|Dönerladen, Pizzeria, Trattoria, Sushibar, Steakhouse, Diner, Bistro, Kantine|Mensa, Brasserie, Café|Kaffeehaus, Bäckerei|Beck, Würstchenbude|Wurststand, Food Truck, Burgerladen, Asia-Imbiss|Asiate, Chinarestaurant|Chinese, Thai-Restaurant, Inder|Indisches Restaurant, Grieche, Italiener, Mexikaner, Tapasbar, Biergarten, Raststätte|Autobahnraststätte, Beiz|Kneipe|Wirtshaus",
  },

  // ------------------------------------------------------------------ Länder & Orte
  {
    id: 'land',
    text: 'Ein Land',
    pack: 'welt',
    letters: true,
    answers:
      'Afghanistan, Ägypten, Albanien, Algerien, Andorra, Angola, Argentinien, Armenien, Aserbaidschan, Äthiopien, Australien, Bahamas, Bangladesch, Barbados, Belarus|Weißrussland, Belgien, Belize, Benin, Bhutan, Bolivien, Bosnien|Bosnien und Herzegowina, Botswana, Brasilien, Bulgarien, Burkina Faso, Burundi, Chile, China, Costa Rica, Dänemark, Deutschland, Dominikanische Republik, Dschibuti, Ecuador, Elfenbeinküste, El Salvador, Eritrea, Estland, Eswatini|Swasiland, Fidschi, Finnland, Frankreich, Gabun, Gambia, Georgien, Ghana, Grenada, Griechenland, Großbritannien|Grossbritannien|England|Vereinigtes Königreich|UK, Guatemala, Guinea, Guyana, Haiti, Honduras, Indien, Indonesien, Irak, Iran, Irland, Island, Israel, Italien, Jamaika, Japan, Jemen, Jordanien, Kambodscha, Kamerun, Kanada, Kap Verde, Kasachstan, Katar, Kenia, Kirgistan, Kolumbien, Komoren, Kongo, Kosovo, Kroatien, Kuba, Kuwait, Laos, Lesotho, Lettland, Libanon, Liberia, Libyen, Liechtenstein, Litauen, Luxemburg, Madagaskar, Malawi, Malaysia, Malediven, Mali, Malta, Marokko, Mauretanien, Mauritius, Mexiko, Moldau|Moldawien, Monaco, Mongolei, Montenegro, Mosambik, Myanmar|Burma, Namibia, Nepal, Neuseeland, Nicaragua, Niederlande|Holland, Niger, Nigeria, Nordkorea, Nordmazedonien|Mazedonien, Norwegen, Oman, Österreich, Pakistan, Palästina, Panama, Papua-Neuguinea, Paraguay, Peru, Philippinen, Polen, Portugal, Ruanda, Rumänien, Russland, Sambia, Samoa, San Marino, Saudi-Arabien, Schottland, Schweden, Schweiz, Senegal, Serbien, Seychellen, Sierra Leone, Simbabwe, Singapur, Slowakei, Slowenien, Somalia, Spanien, Sri Lanka, Südafrika, Sudan, Südkorea|Korea, Südsudan, Suriname, Syrien, Tadschikistan, Taiwan, Tansania, Thailand, Togo, Tonga, Trinidad und Tobago|Trinidad, Tschad, Tschechien, Tunesien, Türkei, Turkmenistan, Tuvalu, Uganda, Ukraine, Ungarn, Uruguay, Usbekistan, Vanuatu, Vatikan|Vatikanstadt, Venezuela, Vereinigte Arabische Emirate|VAE|Emirate, USA|Amerika|Vereinigte Staaten, Vietnam, Wales, Zentralafrikanische Republik, Zypern',
  },
  {
    id: 'hauptstadt',
    text: 'Eine Hauptstadt',
    pack: 'welt',
    answers:
      'Berlin, Bern, Wien, Paris, London, Rom, Madrid, Lissabon, Amsterdam, Brüssel, Luxemburg, Vaduz, Kopenhagen, Oslo, Stockholm, Helsinki, Reykjavik, Dublin, Warschau, Prag, Bratislava, Budapest, Ljubljana, Zagreb, Belgrad, Sarajevo, Podgorica, Tirana, Skopje, Sofia, Bukarest, Athen, Ankara, Moskau, Kiew|Kyjiw, Minsk, Vilnius, Riga, Tallinn, Chisinau, Valletta, Nikosia, Monaco, San Marino, Andorra la Vella, Washington|Washington D.C., Ottawa, Mexiko-Stadt|Mexico City, Havanna, Brasília|Brasilia, Buenos Aires, Santiago|Santiago de Chile, Lima, Bogotá|Bogota, Caracas, Quito, La Paz|Sucre, Montevideo, Asunción, Panama-Stadt, San José, Kingston, Kairo, Rabat, Algier, Tunis, Tripolis, Nairobi, Addis Abeba, Abuja, Accra, Dakar, Pretoria|Kapstadt, Kinshasa, Luanda, Harare, Lusaka, Kampala, Kigali, Dodoma, Antananarivo, Peking|Beijing, Tokio|Tokyo, Seoul, Pjöngjang, Taipeh, Hanoi, Bangkok, Vientiane, Phnom Penh, Kuala Lumpur, Singapur, Jakarta, Manila, Neu-Delhi|Delhi, Islamabad, Kabul, Teheran, Bagdad, Damaskus, Beirut, Amman, Jerusalem, Riad, Doha, Abu Dhabi, Maskat, Sanaa, Kuwait-Stadt, Baku, Tiflis, Jerewan, Astana, Taschkent, Bischkek, Duschanbe, Ulaanbaatar|Ulan Bator, Kathmandu, Thimphu, Dhaka, Colombo, Malé, Canberra, Wellington, Suva, Edinburgh, Cardiff, Belfast',
  },
  {
    id: 'stadt',
    text: 'Eine Stadt',
    pack: 'welt',
    letters: true,
    answers:
      'Aachen, Aarau, Amsterdam, Antwerpen, Athen, Augsburg, Baden, Bangkok, Barcelona, Basel, Bellinzona, Berlin, Bern, Biel|Biel/Bienne, Bielefeld, Bochum, Bologna, Bonn, Bordeaux, Boston, Bratislava, Braunschweig, Bremen, Brüssel, Budapest, Buenos Aires, Chicago, Chur, Davos, Delhi, Dortmund, Dresden, Dubai, Dublin, Duisburg, Düsseldorf, Edinburgh, Erfurt, Essen, Florenz, Frankfurt, Freiburg, Fribourg|Freiburg im Üechtland, Genf|Genève, Genua, Graz, Hamburg, Hannover, Heidelberg, Helsinki, Hongkong, Innsbruck, Interlaken, Istanbul, Jerusalem, Kairo, Kapstadt, Karlsruhe, Kassel, Kiel, Köln, Konstanz, Kopenhagen, Krakau, Kreuzlingen, La Chaux-de-Fonds, Las Vegas, Lausanne, Leipzig, Lissabon, Liverpool, Locarno, London, Los Angeles, Lugano, Luzern, Lyon, Madrid, Mailand, Mainz, Manchester, Mannheim, Marseille, Melbourne, Miami, Montreal, Moskau, München, Münster, Neapel, Neuenburg|Neuchâtel, New York, Nizza, Nürnberg, Olten, Oslo, Paris, Peking, Porto, Potsdam, Prag, Regensburg, Reykjavik, Rio de Janeiro|Rio, Rom, Rostock, Rotterdam, Salzburg, San Francisco, Sankt Gallen|St. Gallen, Schaffhausen, Seoul, Sevilla, Shanghai, Singapur, Sion|Sitten, Solothurn, Stockholm, Stuttgart, Sydney, Thun, Tokio|Tokyo, Toronto, Trier, Turin, Ulm, Uster, Valencia, Vancouver, Venedig, Warschau, Washington, Wien, Wiesbaden, Winterthur, Würzburg, Zermatt, Zug, Zürich, Zagreb, Lyon, Lille, Toulouse, Nantes, Straßburg|Strassburg, Dijon, Linz, Klagenfurt, Bregenz, Villach, St. Pölten, Wels, Kiew, Minsk, Riga, Vilnius, Tallinn, Danzig, Breslau, Posen, Brünn, Pilsen, Ljubljana, Split, Dubrovnik, Belgrad, Sofia, Bukarest, Thessaloniki, Izmir, Antalya, Ankara, Tel Aviv, Doha, Abu Dhabi, Riad, Mumbai, Bangalore, Kolkata, Osaka, Kyoto, Busan, Taipeh, Hanoi, Manila, Jakarta, Bali|Denpasar, Perth, Auckland, Lima, Bogotá, Santiago, Havanna, Mexiko-Stadt, Cancún, Seattle, Denver, Dallas, Houston, Atlanta, Detroit, Philadelphia, Orlando, New Orleans, Nashville, Austin, Phoenix, San Diego, Portland, Quebec, Calgary, Marrakesch, Casablanca, Tunis, Nairobi, Lagos, Johannesburg',
  },
  {
    id: 'schweizerort',
    text: 'Ein Ort in der Schweiz',
    pack: 'welt',
    answers:
      'Zürich, Bern, Basel, Genf, Lausanne, Luzern, St. Gallen|Sankt Gallen, Winterthur, Lugano, Biel, Thun, Chur, Zug, Aarau, Baden, Olten, Solothurn, Schaffhausen, Frauenfeld, Kreuzlingen, Wil, Rapperswil, Uster, Dübendorf, Dietikon, Kloten, Wetzikon, Wädenswil, Horgen, Meilen, Küsnacht, Thalwil, Bülach, Opfikon, Schlieren, Emmen, Kriens, Sursee, Zofingen, Lenzburg, Brugg, Wohlen, Burgdorf, Langenthal, Interlaken, Spiez, Grindelwald, Wengen, Mürren, Gstaad, Zermatt, Saas-Fee, Visp, Brig, Sion|Sitten, Sierre|Siders, Martigny, Montreux, Vevey, Nyon, Yverdon, Neuchâtel|Neuenburg, La Chaux-de-Fonds, Fribourg|Freiburg, Bulle, Delémont|Delsberg, Porrentruy, Bellinzona, Locarno, Ascona, Mendrisio, Chiasso, Airolo, Andermatt, Altdorf, Schwyz, Einsiedeln, Brunnen, Stans, Sarnen, Engelberg, Glarus, Appenzell, Herisau, Davos, Klosters, St. Moritz|Sankt Moritz, Pontresina, Arosa, Lenzerheide, Flims, Laax, Scuol, Samnaun, Vaduz, Weinfelden, Arbon, Romanshorn, Amriswil, Gossau, Rorschach, Buchs, Sargans, Bad Ragaz, Pfäffikon, Lachen, Rheinfelden, Liestal, Pratteln, Allschwil, Muttenz, Reinach, Riehen, Grenchen, Langnau, Adelboden, Lauterbrunnen, Kandersteg, Verbier, Crans-Montana, Leukerbad, Villars, Les Diablerets',
  },
  {
    id: 'sehenswuerdigkeit',
    text: 'Eine berühmte Sehenswürdigkeit',
    pack: 'welt',
    answers:
      'Eiffelturm, Freiheitsstatue, Big Ben, Tower Bridge, Buckingham Palace, London Eye, Stonehenge, Kolosseum, Schiefer Turm von Pisa|Schiefer Turm|Turm von Pisa, Trevi-Brunnen, Petersdom, Sixtinische Kapelle, Akropolis, Parthenon, Sagrada Família|Sagrada Familia, Alhambra, Brandenburger Tor, Reichstag, Kölner Dom, Neuschwanstein|Schloss Neuschwanstein, Berliner Mauer, Matterhorn, Rheinfall, Kapellbrücke, Jet d\'Eau, Zytglogge, Jungfraujoch, Chillon|Schloss Chillon, Grossmünster, Schloss Schönbrunn|Schönbrunn, Stephansdom, Prater, Louvre, Mona Lisa, Notre-Dame, Arc de Triomphe|Triumphbogen, Mont-Saint-Michel, Versailles|Schloss Versailles, Kreml, Roter Platz, Basilius-Kathedrale, Hagia Sophia, Blaue Moschee, Pyramiden|Pyramiden von Gizeh, Sphinx, Taj Mahal, Chinesische Mauer, Verbotene Stadt, Terrakotta-Armee, Angkor Wat, Petronas Towers, Burj Khalifa, Burj al Arab, Petra, Klagemauer, Machu Picchu, Christusstatue|Cristo Redentor, Chichén Itzá, Golden Gate Bridge, Empire State Building, Times Square, Central Park, Hollywood Sign|Hollywood-Schriftzug, Grand Canyon, Niagarafälle, Mount Rushmore, Weißes Haus|Weisses Haus, Space Needle, Opernhaus Sydney|Sydney Opera House, Uluru|Ayers Rock, Fuji|Mount Fuji, Tokyo Tower, Victoriafälle, Kilimandscharo, Mount Everest, Atomium, Manneken Pis, Little Mermaid|Kleine Meerjungfrau, Atomium, Rialtobrücke, Markusplatz, Dogenpalast, Uffizien, Ponte Vecchio, Pantheon, Akropolis, Moai|Osterinsel, Galápagos, Iguazú-Fälle, Neuschwanstein, Elbphilharmonie, Hofbräuhaus, Oktoberfest, Allianz Arena, Camp Nou, Wembley, Santorini, Dubrovnik, Burg Hohenzollern, Zugspitze, Loch Ness',
  },
  {
    id: 'gebirge',
    text: 'Ein Berg, Fluss oder See',
    pack: 'welt',
    answers:
      'Matterhorn, Eiger, Mönch, Jungfrau, Pilatus, Rigi, Säntis, Titlis, Dufourspitze, Piz Bernina, Mont Blanc, Zugspitze, Watzmann, Großglockner|Grossglockner, Mount Everest|Everest, K2, Kilimandscharo, Mount Fuji|Fuji, Vesuv, Ätna, Olymp, Aconcagua, Denali, Mont Ventoux, Feldberg, Brocken, Stanserhorn, Niesen, Uetliberg, Rhein, Rhone|Rhône, Aare, Reuss, Limmat, Inn, Ticino|Tessin, Saane, Thur, Emme, Donau, Elbe, Main, Mosel, Neckar, Oder, Weser, Isar, Ruhr, Spree, Themse, Seine, Loire, Po, Tiber, Ebro, Tejo, Wolga, Dnepr, Nil, Amazonas, Mississippi, Hudson, Colorado, Jangtse, Ganges, Mekong, Euphrat, Tigris, Kongo, Sambesi, Genfersee|Genfer See|Lac Léman, Bodensee, Zürichsee, Vierwaldstättersee, Thunersee, Brienzersee, Neuenburgersee, Lago Maggiore, Luganersee, Walensee, Zugersee, Hallwilersee, Sempachersee, Gardasee, Comer See|Comersee, Chiemsee, Starnberger See, Müritz, Wolfgangsee, Attersee, Plattensee|Balaton, Loch Ness, Baikalsee, Victoriasee, Titicacasee, Kaspisches Meer, Totes Meer, Oberer See, Eriesee, Ontariosee, Sils, Silsersee, Oeschinensee, Caumasee, Blausee, Lauerzersee, Ägerisee',
  },
  {
    id: 'kontinentmeer',
    text: 'Ein Meer, Ozean oder eine Insel',
    pack: 'welt',
    answers:
      'Atlantik|Atlantischer Ozean, Pazifik|Pazifischer Ozean|Stiller Ozean, Indischer Ozean|Indik, Arktischer Ozean|Nordpolarmeer, Südpolarmeer, Mittelmeer, Nordsee, Ostsee, Schwarzes Meer, Rotes Meer, Totes Meer, Karibik|Karibisches Meer, Adria|Adriatisches Meer, Ägäis, Ionisches Meer, Tyrrhenisches Meer, Kaspisches Meer, Arabisches Meer, Golf von Mexiko, Persischer Golf, Beringmeer, Barentssee, Gelbes Meer, Japanisches Meer, Südchinesisches Meer, Tasmansee, Korallenmeer, Sargassosee, Irische See, Ärmelkanal|Kanal, Mallorca, Ibiza, Menorca, Teneriffa, Gran Canaria, Lanzarote, Fuerteventura, Sizilien, Sardinien, Korsika, Kreta, Rhodos, Korfu, Santorini, Mykonos, Zypern, Malta, Capri, Elba, Rügen, Sylt, Helgoland, Usedom, Föhr, Norderney, Borkum, Island, Grönland, Irland, Großbritannien, Spitzbergen, Färöer, Madeira, Azoren, Kanaren|Kanarische Inseln, Balearen, Bali, Java, Sumatra, Borneo, Phuket, Koh Samui, Sri Lanka, Malediven, Seychellen, Mauritius, Madagaskar, Sansibar, Hawaii, Tahiti, Fidschi, Neuseeland, Tasmanien, Japan, Hokkaido, Okinawa, Taiwan, Philippinen, Kuba, Jamaika, Bahamas, Barbados, Puerto Rico, Bermuda, Galápagos, Osterinsel, Manhattan, Long Island, Mainau, Reichenau, Lindau, Ufenau, Isola Bella',
  },
  {
    id: 'sprache',
    text: 'Eine Sprache',
    pack: 'welt',
    answers:
      'Deutsch, Schweizerdeutsch|Schwiizerdütsch|Mundart, Englisch, Französisch, Italienisch, Rätoromanisch|Romanisch, Spanisch, Portugiesisch, Niederländisch|Holländisch, Flämisch, Dänisch, Schwedisch, Norwegisch, Isländisch, Finnisch, Estnisch, Lettisch, Litauisch, Polnisch, Tschechisch, Slowakisch, Ungarisch, Rumänisch, Bulgarisch, Serbisch, Kroatisch, Bosnisch, Slowenisch, Albanisch, Mazedonisch, Griechisch, Türkisch, Russisch, Ukrainisch, Weißrussisch, Georgisch, Armenisch, Aserbaidschanisch, Kurdisch, Persisch|Farsi, Arabisch, Hebräisch, Hindi, Urdu, Bengali, Punjabi, Tamil, Nepali, Chinesisch|Mandarin, Kantonesisch, Japanisch, Koreanisch, Vietnamesisch, Thailändisch|Thai, Indonesisch, Malaiisch, Tagalog|Filipino, Swahili, Amharisch, Somali, Yoruba, Zulu, Afrikaans, Latein, Altgriechisch, Sanskrit, Esperanto, Klingonisch, Elbisch, Irisch|Gälisch, Schottisch-Gälisch, Walisisch, Bretonisch, Baskisch, Katalanisch, Galicisch, Luxemburgisch, Jiddisch, Plattdeutsch, Bairisch, Schwäbisch, Sächsisch, Kölsch, Berlinerisch, Gebärdensprache, Maltesisch, Mongolisch, Tibetisch, Quechua, Hawaiianisch, Maori, Inuktitut, Romani',
  },
];
