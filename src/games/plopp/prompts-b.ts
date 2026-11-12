/**
 * Aufgaben Teil 2: Alltag & Wissen, Sport & Freizeit.
 */
import type { PromptSource } from './prompt-types';

export const PROMPTS_B: PromptSource[] = [
  // ------------------------------------------------------------------ Alltag & Wissen
  {
    id: 'beruf',
    text: 'Ein Beruf',
    pack: 'alltag',
    letters: true,
    answers:
      'Anwalt|Anwältin|Rechtsanwalt, Apotheker, Architekt, Arzt|Ärztin|Doktor, Astronaut, Bäcker, Bankangestellter|Banker, Bauarbeiter, Bauer|Landwirt, Bergführer, Bibliothekar, Bildhauer, Biologe, Bodyguard|Leibwächter, Briefträger|Pöstler|Postbote, Buchhalter, Busfahrer, Chauffeur, Chemiker, Coiffeur|Friseur|Frisör, Dachdecker, Designer, Detektiv, Dirigent, Dolmetscher|Übersetzer, Elektriker, Erzieher|Kindergärtner, Fahrlehrer, Feuerwehrmann|Feuerwehrfrau, Fischer, Fitnesstrainer, Fleischer|Metzger, Florist|Blumenhändler, Fluglotse, Förster, Fotograf, Gärtner, Geologe, Glaser, Goldschmied, Grafiker, Hebamme, Hausmeister|Abwart, Historiker, Hotelier, Imker, Influencer, Informatiker|Programmierer|Softwareentwickler, Ingenieur, Journalist, Juwelier, Kameramann, Kapitän, Kassierer, Kellner|Servicekraft, Kindergärtnerin, Koch|Köchin, Konditor, Krankenpfleger|Pflegefachfrau|Krankenschwester, Künstler, Lehrer|Lehrerin, Lokführer, Maler, Maurer, Mechaniker|Automechaniker, Model, Moderator, Musiker, Notar, Optiker, Pfarrer|Priester, Physiker, Physiotherapeut, Pilot, Politiker, Polizist, Professor, Psychologe, Rapper, Richter, Sänger, Schauspieler, Schneider, Schornsteinfeger|Kaminfeger, Schreiner|Tischler, Schuhmacher, Schweißer, Sekretär, Soldat, Sozialarbeiter, Steuerberater, Stewardess|Flugbegleiter, Streamer, Taxifahrer, Tänzer, Tätowierer, Tierarzt, Tierpfleger, Töpfer, Tourguide|Reiseleiter, Trainer, Uhrmacher, Verkäufer, Winzer, Wissenschaftler, YouTuber, Zahnarzt, Zimmermann, Zauberer, Zöllner, DJ, Barkeeper, Bestatter, Clown, Croupier, Detailhandelsfachmann, Fahrradkurier, Hausarzt, Kosmetikerin, Lagerist, Logistiker, Matrose, Pizzabäcker, Sanitäter, Schiedsrichter, Security|Türsteher, Skilehrer, Stuntman, Tankwart, Lastwagenfahrer|LKW-Fahrer, Müllmann|Kehrichtmann, Gemeindepräsident, Bürgermeister, Kanzler, Präsident, König, Papst',
  },
  {
    id: 'vorname',
    text: 'Ein Vorname',
    pack: 'alltag',
    letters: true,
    answers:
      'Aaron, Adrian, Alessandro, Alex|Alexander, Ali, Amelie, Andrea, Andreas, Anna, Anja, Anton, Ben|Benjamin, Bernd, Bianca, Carla, Carlo, Caroline, Chantal, Chiara, Christian, Christina, Clara, Daniel, David, Denise, Dennis, Dominik, Elena, Elias, Elif, Elisa, Ella, Emil, Emilia, Emily, Emma, Eric|Erik, Eva, Fabian, Felix, Finn, Florian, Franziska, Gabriel, Gina, Hannah|Hanna, Hans, Helena, Henry, Hugo, Ida, Ines, Isabel, Jan, Jana, Jannik, Jasmin, Jennifer, Jessica, Jonas, Jonathan, Josef, Julia, Julian, Justin, Kai, Karl, Karin, Katharina, Kevin, Kim, Klaus, Lara, Laura, Lea, Lena, Leo, Leon, Levin, Liam, Lina, Linus, Lisa, Livia, Louis, Luca|Luka, Lucas|Lukas, Luis, Luisa, Malik, Manuel, Marc|Mark, Maria, Marie, Marco|Marko, Mario, Martin, Mats, Matteo, Max|Maximilian, Mehmet, Mia, Michael, Mila, Milan, Mira, Moritz, Nadine, Natalie, Nico|Niko, Nina, Noah, Noa, Noel, Nora, Olivia, Oliver, Oskar, Patrick, Paul, Paula, Peter, Philipp, Pia, Rafael|Raphael, Rebecca, Robin, Ronja, Sabrina, Samuel, Sandra, Sara|Sarah, Sebastian, Selin, Simon, Sofia|Sophia|Sophie, Stefan|Stephan, Svenja, Tamara, Thomas, Tim, Timo, Tobias, Tom, Ursula, Valentin, Vanessa, Victoria, Vincent, Werner, Xaver, Yannick, Yara, Yusuf, Zoe|Zoé, Ömer, Ayla, Can, Deniz, Ece, Emir, Leyla, Luan, Nevio, Ylvi, Elin, Ilias, Aurora, Malia, Lio, Nael, Ronaldo, Lionel, Diego, Pablo, Juan, Carlos, José, Sergio, Igor, Ivan, Olga, Anastasia, Natascha, Dragan, Milos, Ana, Ivana, Luana, Yasmin, Fatima, Aisha, Omar, Hassan, Ahmed, Mohammed|Mohamed, Ibrahim, Kian, Arian, Amir, Leonie, Jule, Merle, Greta, Frida, Mathilda, Romy, Juna, Lotta, Ylvie, Malea',
  },
  {
    id: 'kleidung',
    text: 'Ein Kleidungsstück oder Accessoire',
    pack: 'alltag',
    answers:
      'Hose|Jeans, T-Shirt|Shirt, Pullover|Pulli, Hoodie|Kapuzenpulli, Jacke, Mantel, Hemd, Bluse, Rock, Kleid, Anzug, Krawatte, Fliege, Gürtel, Socken|Socke, Strumpfhose, Unterhose|Boxershorts|Slip, BH, Unterhemd, Schlafanzug|Pyjama, Bademantel, Badehose, Bikini, Badeanzug, Shorts|kurze Hose, Leggings, Jogginghose|Trainerhose, Weste, Strickjacke, Cardigan, Blazer, Smoking, Overall, Latzhose, Regenjacke, Daunenjacke, Lederjacke, Windjacke, Poncho, Schal, Halstuch, Mütze|Kappe|Beanie, Cap|Baseballcap, Hut, Sonnenhut, Zylinder, Stirnband, Handschuhe|Handschuh, Fäustlinge, Schuhe|Schuh, Sneaker|Turnschuhe, Stiefel, Gummistiefel, Sandalen, Flip-Flops|Flipflops, Hausschuhe|Pantoffeln|Finken, Pumps, High Heels|Stöckelschuhe, Ballerinas, Crocs, Uhr|Armbanduhr, Brille, Sonnenbrille, Kette|Halskette, Armband, Ring, Ohrringe|Ohrring, Piercing, Rucksack, Handtasche|Tasche, Bauchtasche, Portemonnaie|Geldbeutel|Portmonee, Haargummi, Haarspange, Krone, Tiara, Fliegerbrille, Trikot, Kimono, Sari, Dirndl, Lederhose, Tracht, Toga, Tunika, Kaftan, Burka, Kopftuch, Turban, Sombrero, Baskenmütze, Balaclava|Sturmhaube, Grillz, Durag, Tanktop, Crop Top, Polo|Poloshirt, Rollkragenpullover, Chinos, Cargohose, Jeansjacke, Trenchcoat, Parka, Fleecejacke, Body, Korsett, Strapse',
  },
  {
    id: 'koerper',
    text: 'Ein Körperteil',
    pack: 'alltag',
    answers:
      'Kopf, Haare|Haar, Stirn, Auge|Augen, Augenbraue, Wimper|Wimpern, Augenlid, Nase, Nasenloch, Ohr|Ohren, Ohrläppchen, Mund, Lippe|Lippen, Zahn|Zähne, Zunge, Gaumen, Kinn, Wange|Backe, Kiefer, Hals, Nacken, Kehle|Kehlkopf, Schulter, Arm, Oberarm, Ellbogen|Ellenbogen, Unterarm, Handgelenk, Hand, Handfläche, Finger, Daumen, Zeigefinger, Mittelfinger, Ringfinger, kleiner Finger, Fingernagel|Nagel, Brust, Bauch, Bauchnabel|Nabel, Rücken, Wirbelsäule, Hüfte, Po|Hintern|Gesäß|Füdli, Bein, Oberschenkel, Knie, Kniescheibe, Schienbein, Wade, Knöchel, Ferse, Fuß|Fuss, Zehe|Zeh, Sohle|Fußsohle, Herz, Lunge, Leber, Niere, Magen, Darm, Blase, Milz, Gehirn|Hirn, Blut, Ader|Vene|Arterie, Muskel, Knochen, Rippe, Schädel, Becken, Sehne, Haut, Achsel|Achselhöhle, Taille, Leiste, Nerv, Gallenblase, Bauchspeicheldrüse, Schilddrüse, Mandeln, Blinddarm, Trommelfell, Netzhaut, Pupille, Iris, Bizeps, Trizeps, Sixpack, Doppelkinn, Grübchen, Sommersprossen, Muttermal, Faust, Speiseröhre, Luftröhre, Zwerchfell, Steißbein, Schlüsselbein, Schulterblatt, Oberkörper, Rumpf',
  },
  {
    id: 'farbe',
    text: 'Eine Farbe',
    pack: 'alltag',
    answers:
      'Rot, Blau, Gelb, Grün, Orange, Lila|Violett, Pink|Rosa, Schwarz, Weiß|Weiss, Grau, Braun, Beige, Türkis, Cyan, Magenta, Gold, Silber, Bronze, Kupfer, Hellblau, Dunkelblau, Marineblau|Navy, Babyblau, Himmelblau, Königsblau, Petrol, Mint|Mintgrün, Olivgrün|Oliv, Hellgrün, Dunkelgrün, Smaragdgrün, Neongrün, Limette, Ocker, Senfgelb, Zitronengelb, Creme, Elfenbein, Lachs, Koralle, Bordeaux|Weinrot, Karminrot, Kirschrot, Scharlachrot, Purpur, Flieder, Lavendel, Aubergine, Fuchsia, Apricot, Pfirsich, Sand, Khaki, Taupe, Anthrazit, Schiefergrau, Silbergrau, Kastanienbraun, Schokobraun, Mokka, Karamell, Bernstein, Rost|Rostrot, Ziegelrot, Indigo, Ultramarin, Azur, Kobaltblau, Aquamarin, Jade, Tannengrün, Schilfgrün, Pastellgelb, Neonpink, Neonorange, Altrosa, Puderrosa, Mauve',
  },
  {
    id: 'haushalt',
    text: 'Ein Gegenstand in der Küche oder im Haushalt',
    pack: 'alltag',
    answers:
      'Topf, Pfanne, Wok, Teller, Tasse, Becher, Glas, Gabel, Messer, Löffel, Kelle|Schöpfkelle, Schneebesen, Sieb, Reibe|Raffel, Schäler|Sparschäler, Schneidebrett, Nudelholz|Wallholz, Backblech, Schüssel, Salatschüssel, Kanne, Teekanne, Wasserkocher, Kaffeemaschine, Toaster, Mixer, Pürierstab|Stabmixer, Küchenmaschine, Mikrowelle, Backofen|Ofen, Herd, Kühlschrank, Gefrierschrank|Tiefkühler, Spülmaschine|Geschirrspüler, Spülbecken|Spüle|Lavabo, Wasserhahn, Schwamm, Lappen, Geschirrtuch, Spülmittel, Mülleimer|Abfalleimer|Ghüdereimer, Besen, Schaufel, Staubsauger, Wischmopp|Mopp, Eimer|Kübel, Bügeleisen, Bügelbrett, Waschmaschine, Wäscheklammer, Wäscheständer, Tumbler|Wäschetrockner|Trockner, Fön|Föhn|Haartrockner, Zahnbürste, Zahnpasta, Seife, Shampoo, Handtuch, Toilettenpapier|Klopapier|WC-Papier, Kamm, Bürste, Spiegel, Lampe, Glühbirne, Kerze, Feuerzeug, Streichholz, Schere, Klebeband, Batterie, Fernbedienung, Fernseher, Sofa|Couch, Tisch, Stuhl, Bett, Kissen, Decke|Bettdecke, Schrank|Kleiderschrank, Regal, Teppich, Vorhang, Uhr|Wecker, Bilderrahmen, Pflanze|Zimmerpflanze, Vase, Korkenzieher, Flaschenöffner, Dosenöffner, Knoblauchpresse, Eierbecher, Salzstreuer, Pfefferstreuer|Pfeffermühle, Alufolie, Frischhaltefolie, Backpapier, Tupperdose|Tupper, Thermoskanne, Trinkflasche, Brotkasten, Eiswürfelform, Messbecher, Küchenwaage|Waage, Teesieb, Zitruspresse, Spatel|Pfannenwender, Grillzange, Topflappen, Schürze, Fliegenklatsche, Mausefalle, Rauchmelder, Steckdose, Verlängerungskabel, Ladekabel',
  },
  {
    id: 'werkzeug',
    text: 'Ein Werkzeug',
    pack: 'alltag',
    answers:
      'Hammer, Schraubenzieher|Schraubendreher, Zange|Kombizange, Säge, Bohrmaschine|Bohrer, Akkuschrauber, Schraubenschlüssel|Gabelschlüssel, Inbusschlüssel|Inbus, Wasserwaage, Meterstab|Zollstock|Doppelmeter, Maßband|Messband, Feile, Raspel, Hobel, Meißel|Meissel, Axt|Beil, Spaten, Schaufel, Rechen|Harke, Schubkarre, Gartenschere, Rasenmäher, Heckenschere, Motorsäge|Kettensäge, Stichsäge, Kreissäge, Bandsäge, Fuchsschwanz, Flex|Winkelschleifer, Schleifpapier, Schleifmaschine, Lötkolben, Schweißgerät, Heißklebepistole, Tacker, Nagel|Nägel, Schraube, Dübel, Mutter, Unterlegscheibe, Leiter, Schraubstock, Zwinge|Schraubzwinge, Brecheisen|Kuhfuß|Brechstange, Vorschlaghammer, Gummihammer, Pinsel, Farbrolle|Malerrolle, Spachtel, Kelle|Maurerkelle, Cutter|Teppichmesser|Japanmesser, Taschenmesser|Sackmesser, Multitool, Seitenschneider, Abisolierzange, Rohrzange, Ratsche, Drehmomentschlüssel, Wagenheber, Kompressor, Hochdruckreiniger, Laubbläser, Pickel|Spitzhacke, Sense, Sichel, Mistgabel|Heugabel, Gießkanne, Zirkel, Lineal, Winkel, Taschenlampe, Stirnlampe, Schutzbrille, Arbeitshandschuhe, Werkbank, Werkzeugkasten, Klebepistole, Ahle, Körner',
  },
  {
    id: 'fahrzeug',
    text: 'Ein Fahrzeug',
    pack: 'alltag',
    answers:
      'Auto, Bus, Lastwagen|LKW|Lkw, Motorrad|Töff, Roller|Scooter|Vespa, Mofa|Töffli, Fahrrad|Velo|Rad, E-Bike, Tretroller|Trotinett|Kickboard, E-Scooter, Skateboard, Longboard, Inlineskates|Rollerblades, Einrad, Tandem, Rikscha, Tuk-Tuk, Taxi, Limousine, Cabrio, Wohnmobil|Camper, Wohnwagen, Traktor, Bagger, Kran, Gabelstapler, Mähdrescher, Planierraupe|Bulldozer, Betonmischer, Müllwagen|Kehrichtwagen, Feuerwehrauto, Krankenwagen|Ambulanz, Polizeiauto, Panzer, Jeep, Pick-up, Quad, Gokart|Go-Kart, Formel-1-Auto|Rennwagen, Monstertruck, Zug|Eisenbahn, S-Bahn, U-Bahn|Metro, Straßenbahn|Tram|Trambahn, ICE, TGV, Dampflok, Seilbahn|Gondel, Sessellift, Skilift, Zahnradbahn, Standseilbahn, Flugzeug, Jet, Hubschrauber|Helikopter, Heißluftballon, Zeppelin, Segelflugzeug, Gleitschirm|Paraglider, Drachen|Hängegleiter, Drohne, Rakete, Raumschiff, Spaceshuttle, Ufo, Schiff, Boot, Segelboot, Ruderboot, Kanu, Kajak, Schlauchboot, Tretboot, Motorboot, Jetski, Yacht|Jacht, Fähre, Kreuzfahrtschiff, Containerschiff, Frachter, Tanker, U-Boot, Flugzeugträger, Floß, Gondel|Venezianische Gondel, Surfbrett, SUP|Stand-up-Paddle, Schlitten|Bob, Snowmobil|Schneemobil, Pistenbully|Pistenfahrzeug, Hundeschlitten, Kutsche, Pferdekutsche, Segway, Hoverboard, Rollstuhl, Kinderwagen, Bobbycar, Dreirad, Laufrad, Postauto',
  },
  {
    id: 'automarke',
    text: 'Eine Automarke',
    pack: 'alltag',
    answers:
      'Audi, BMW, Mercedes|Mercedes-Benz, Volkswagen|VW, Porsche, Opel, Ford, Toyota, Honda, Nissan, Mazda, Mitsubishi, Subaru, Suzuki, Lexus, Hyundai, Kia, Renault, Peugeot, Citroën|Citroen, Dacia, Fiat, Alfa Romeo, Lancia, Maserati, Ferrari, Lamborghini, Bugatti, Pagani, Seat, Cupra, Skoda|Škoda, Volvo, Saab, Tesla, Chevrolet, Cadillac, Dodge, Chrysler, Jeep, Lincoln, Buick, GMC, Hummer, Rolls-Royce, Bentley, Aston Martin, Jaguar, Land Rover|Range Rover, Mini, Lotus, McLaren, Smart, Maybach, Genesis, Infiniti, Acura, Polestar, BYD, Nio, Lucid, Rivian, Koenigsegg, Lada, Trabant|Trabi, DS, Alpine, Abarth, MG, Ssangyong, Daihatsu, Isuzu, Rimac, Hongqi, Geely, Lynk & Co, Wiesmann, Morgan, Pontiac, Plymouth, DeLorean',
  },
  {
    id: 'marke',
    text: 'Eine bekannte Marke',
    pack: 'alltag',
    answers:
      'Nike, Adidas, Puma, Reebok, New Balance, Converse, Vans, Asics, Under Armour, The North Face, Patagonia, Jack Wolfskin, Mammut, Levi\'s|Levis, Tommy Hilfiger, Calvin Klein, Ralph Lauren, Lacoste, Hugo Boss|Boss, Gucci, Prada, Louis Vuitton|LV, Chanel, Dior, Versace, Balenciaga, Burberry, Hermès|Hermes, Armani, Moncler, Stone Island, Off-White, Supreme, Palace, Stüssy, Carhartt, Dickies, Champion, Fila, Kappa, Ellesse, Zara, H&M, Primark, Uniqlo, Shein, Apple, Samsung, Google, Microsoft, Sony, Nintendo, PlayStation, Xbox, LG, Huawei, Xiaomi, Dell, HP, Lenovo, Asus, Canon, Nikon, GoPro, Bose, JBL, Beats, Coca-Cola|Coca Cola|Coke, Pepsi, Red Bull, Monster, Nestlé|Nestle, Lindt, Toblerone, Milka, Ferrero, Haribo, Kinder, Nutella, Kellogg\'s, Ovomaltine, Rivella, Ricola, Maggi, Knorr, Heinz, Barilla, Dr. Oetker, Rolex, Swatch, Omega, Tag Heuer, Victorinox, IKEA, Lego, Playmobil, Mattel, Barbie, Hasbro, Disney, Netflix, Spotify, Amazon, Ebay, Zalando, Facebook|Meta, Instagram, TikTok, Snapchat, YouTube, WhatsApp, Uber, Airbnb, Tesla, Shell, BP, Visa, Mastercard, PayPal, Twint, Swisscom, Migros, Coop, Aldi, Lidl, Denner, Rewe, Edeka, dm, Rossmann, Nivea, L\'Oréal, Gillette, Dove, Colgate, Pampers, Tempo, Tesla',
  },
  {
    id: 'schulfach',
    text: 'Etwas, das man in der Schule hat',
    pack: 'alltag',
    answers:
      'Mathe|Mathematik, Deutsch, Englisch, Französisch, Italienisch, Spanisch, Latein, Geschichte, Geografie|Geographie|Erdkunde, Biologie|Bio, Chemie, Physik, Informatik, Sport|Turnen, Musik, Kunst|Zeichnen|Bildnerisches Gestalten, Werken|Handarbeit|Textiles Gestalten, Religion|Ethik, Wirtschaft, Politik, Philosophie, Psychologie, Hauswirtschaft, Natur und Technik|NMG, Pause, Lehrer, Schüler, Klasse, Klassenzimmer, Wandtafel|Tafel, Kreide, Whiteboard, Beamer, Pult, Stuhl, Heft, Buch|Schulbuch, Füller|Füllfeder, Bleistift, Kugelschreiber|Kuli|Kugelschreiber, Radiergummi, Spitzer, Lineal, Geodreieck, Zirkel, Taschenrechner, Schulranzen|Thek|Schultasche, Mäppchen|Etui|Federmäppchen, Hausaufgaben|Hausaufgabe|Ufzgi, Prüfung|Test|Klausur, Zeugnis, Note, Schulreise|Klassenfahrt, Sporttag, Elternabend, Nachsitzen, Spickzettel, Pausenbrot, Pausenhof|Schulhof, Turnhalle, Mensa, Schulleiter|Rektor|Direktor, Hausmeister|Abwart, Stundenplan, Ferien, Klassenbuch, Referat, Vortrag, Diktat, Aufsatz, Schulbus, Gruppenarbeit, Projektwoche, Matura|Abitur|Abi',
  },
  {
    id: 'hobby',
    text: 'Ein Hobby',
    pack: 'alltag',
    answers:
      'Lesen, Malen, Zeichnen, Kochen, Backen, Gärtnern, Fotografieren|Fotografie, Filmen, Tanzen, Singen, Gitarre spielen|Gitarre, Klavier spielen|Klavier, Musik machen, Gamen|Zocken|Videospiele, Schach, Puzzeln|Puzzle, Basteln, Stricken, Häkeln, Nähen, Töpfern, Sticken, Sammeln|Briefmarken sammeln, Angeln|Fischen, Wandern, Joggen|Laufen|Rennen, Radfahren|Velofahren, Schwimmen, Klettern|Bouldern, Skifahren, Snowboarden, Reiten, Yoga, Fitness|Gym|Krafttraining, Kampfsport, Fußball|Fussball, Tennis, Skaten|Skateboarden, Surfen, Tauchen, Segeln, Camping|Zelten, Reisen, Geocaching, Vögel beobachten, Sternegucken|Astronomie, Modellbau, Modelleisenbahn, Lego bauen|Lego, Programmieren, Bloggen, Podcasten, Streamen, YouTube-Videos machen, Schreiben, Gedichte schreiben, Theater spielen|Theater, Zaubern, Jonglieren, Brettspiele, Kartenspiele|Jassen, Poker, Dart, Billard, Bowling|Kegeln, Minigolf, Golf, Karaoke, Kino, Serien schauen|Netflix, Shoppen, Party machen|Feiern, Freunde treffen, DJing|Auflegen, Rappen, Beatbox, Graffiti|Sprayen, Tattoos, Imkern, Pilze sammeln, Kräuter sammeln, Meditieren, Escape Rooms|Escape Room, Paintball, Airsoft, Lasertag, Kartfahren, Motorradfahren, Autos tunen|Tuning, Gaming, Cosplay, Anime schauen, Manga lesen, Sudoku, Kreuzworträtsel, Rätseln, Freestyle, Parkour, Trampolin, Kanufahren, Paragliding, Fallschirmspringen, Bungee-Jumping, Fischen',
  },
  {
    id: 'brettspiel',
    text: 'Ein Brett-, Karten- oder Partyspiel',
    pack: 'alltag',
    answers:
      'Monopoly, Siedler von Catan|Catan, Scrabble, Schach, Dame, Mühle, Backgammon, Mensch ärgere dich nicht|Eile mit Weile, Uno, Skip-Bo, Phase 10, Rummikub, Risiko, Cluedo, Activity, Tabu, Pictionary, Trivial Pursuit, Jenga, Twister, Memory, Kniffel|Yahtzee, Halli Galli, Dobble, Ligretto, Wizard, Skat, Jass|Jassen|Schieber, Poker, Blackjack, Rommé, Canasta, Doppelkopf, Schwimmen|Schnauz, Mau-Mau, Arschloch|Präsident, Solitär, Quartett, Schwarzer Peter, Lotto, Bingo, Dixit, Codenames, Carcassonne, Ticket to Ride|Zug um Zug, Azul, Exploding Kittens, Werwolf|Werwölfe, Wer bin ich, Stadt Land Fluss, Montagsmaler, Flaschendrehen, Wahrheit oder Pflicht, Bierpong|Beer Pong, Kings Cup, Ich hab noch nie, Mäxchen|Meiern, Looping Louie, Tic Tac Toe, Vier gewinnt, Schiffe versenken, Mastermind, Stratego, Mikado, Domino, Go, Mahjong, Sudoku, Hangman|Galgenmännchen, Ich sehe was, was du nicht siehst, Stille Post, Reise nach Jerusalem, Topfschlagen, Sackhüpfen, Eierlauf, Blinde Kuh, Verstecken, Fangen, Hot Potato|Heiße Kartoffel, Kartoffeln weitergeben, Imposter, Mafia, Just One, The Mind, Hanabi, 7 Wonders, Pandemic, Dominion, Splendor, Wingspan, Kingdomino, Saboteur, Bang, Love Letter, Black Stories, Cards Against Humanity, Kakerlakenpoker, Heckmeck, Qwirkle, Sagrada, Labyrinth|Das verrückte Labyrinth, Spiel des Lebens, Hotel, Scotland Yard',
  },
  {
    id: 'instrument',
    text: 'Ein Musikinstrument',
    pack: 'alltag',
    answers:
      'Gitarre, E-Gitarre, Bass|E-Bass|Bassgitarre, Klavier|Piano, Flügel, Keyboard, Synthesizer|Synth, Orgel, Akkordeon|Handorgel|Schwyzerörgeli|Ziehharmonika, Mundharmonika, Geige|Violine, Bratsche|Viola, Cello, Kontrabass, Harfe, Laute, Mandoline, Banjo, Ukulele, Sitar, Zither, Hackbrett, Schlagzeug|Drums, Trommel, Pauke, Bongo|Bongos, Cajón, Djembe, Tamburin, Triangel, Xylophon, Marimba, Glockenspiel, Becken, Kastagnetten, Rassel|Maracas, Gong, Klangschale, Steeldrum, Flöte|Querflöte, Blockflöte, Panflöte, Piccolo, Klarinette, Oboe, Fagott, Saxophon|Saxofon, Trompete, Posaune, Horn|Waldhorn, Tuba, Euphonium, Alphorn, Dudelsack, Didgeridoo, Okarina, Melodica, Kazoo, Theremin, Maultrommel, Drehleier, Spinett, Cembalo, Celesta, Vibraphon, Kuhglocke|Treichel, Löffel, Plattenspieler|Turntable, Beatpad|Launchpad, Drumcomputer, Talkbox, Shamisen, Koto, Balalaika, Bouzouki, Charango, Oud, Tabla, Steelguitar, Lyra|Leier',
  },
  {
    id: 'emoji',
    text: 'Etwas, das es als Emoji gibt',
    pack: 'alltag',
    answers:
      'Herz, Lachen|Lachendes Gesicht|Tränen lachen, Daumen hoch, Daumen runter, Feuer, Kackhaufen|Kacke|Poop, Totenkopf|Schädel, Clown, Geist, Alien, Roboter, Teufel, Engel, Einhorn, Affe|Nichts-sehen-Affe, Hund, Katze, Panda, Pinguin, Schlange, Schildkröte, Hai, Wal, Delfin, Biene, Schmetterling, Pizza, Burger, Pommes, Taco, Sushi, Avocado, Aubergine, Pfirsich, Kirsche, Erdbeere, Banane, Wassermelone, Ananas, Kuchen, Geburtstagskuchen, Bier, Wein, Cocktail, Kaffee, Sekt|Champagner, Party|Partypopper|Konfetti, Ballon, Geschenk, Pokal, Medaille, Krone, Diamant, Geld|Geldsack, Rakete, Flugzeug, Auto, Sonne, Mond, Stern, Regenbogen, Blitz, Schneeflocke, Schneemann, Weihnachtsbaum, Kürbis, Rose, Blume, Kaktus, Pilz, 100, Haken|Häkchen, Kreuz, Ausrufezeichen, Fragezeichen, Augen, Zwinker|Zwinkern, Kuss|Kussmund, Herzaugen, Sonnenbrille|Cool, Nerd, Schwitzen, Weinen, Wütend, Augenrollen, Facepalm, Schulterzucken, Muskel|Bizeps, Klatschen, Beten|Gefaltete Hände, Winken, Peace, Mittelfinger, Ok-Hand, Faust, Hände hoch, Sparkles|Funkeln, Glocke, Mikrofon, Kopfhörer, Gitarre, Fußball, Basketball, Handy, Laptop, Kamera, Bombe, Schwert, Pistole|Wasserpistole, Spritze, Pille, Brille, Hut, Zylinder, Schuh, Ring, Kerze, Schlüssel, Schloss, Uhr, Sanduhr, Erde|Weltkugel, Vulkan, Tornado, Welle, Tropfen, Mondgesicht, Salzstreuer, Nazar, Hamsa, Joint, Rauch',
  },

  // ------------------------------------------------------------------ Sport & Freizeit
  {
    id: 'sportart',
    text: 'Eine Sportart',
    pack: 'sport',
    letters: true,
    answers:
      'Fußball|Fussball|Tschutten, Basketball, Volleyball, Beachvolleyball, Handball, Eishockey|Hockey, Feldhockey, Unihockey|Floorball, Tennis, Tischtennis|Pingpong, Badminton|Federball, Squash, Padel, Golf, Minigolf, Baseball, Softball, American Football|Football, Rugby, Cricket, Lacrosse, Polo, Wasserball, Schwimmen, Turmspringen|Wasserspringen, Synchronschwimmen, Rudern, Kanu|Kanufahren, Kajak, Segeln, Surfen, Windsurfen, Kitesurfen, Wakeboarden, Wasserski, Tauchen, Leichtathletik, Sprint, Marathon, Laufen|Joggen, Hürdenlauf, Weitsprung, Hochsprung, Dreisprung, Stabhochsprung, Kugelstoßen|Kugelstossen, Diskuswurf, Speerwurf, Hammerwurf, Zehnkampf, Siebenkampf, Triathlon, Biathlon, Radsport|Radfahren, Mountainbike, BMX, Skifahren|Ski, Langlauf, Skispringen, Snowboard|Snowboarden, Eiskunstlauf, Eisschnelllauf, Curling, Bob|Bobfahren, Rodeln|Schlitteln, Skeleton, Boxen, Kickboxen, Thaiboxen|Muay Thai, Ringen, Schwingen, Judo, Karate, Taekwondo, Kung Fu, Jiu-Jitsu, MMA, Fechten, Bogenschießen, Schießen, Turnen|Kunstturnen, Rhythmische Gymnastik, Trampolin, Gewichtheben, Bodybuilding, Crossfit, Klettern|Bouldern, Bergsteigen, Reiten, Springreiten, Dressur, Pferderennen, Formel 1, Motorsport, Motocross, Rallye, Kartfahren, Skateboarden|Skaten, Inlineskaten, Parkour, Breakdance|Breaking, Tanzen, Yoga, Pilates, Dart|Darts, Billard, Snooker, Bowling|Kegeln, Schach, E-Sport|Esports, Hornussen, Steinstoßen, Sumo, Frisbee|Ultimate Frisbee, Discgolf, Cheerleading, Rope Skipping|Seilspringen, Paragliding|Gleitschirmfliegen, Fallschirmspringen, Bungee, Rafting, Canyoning, Stand-up-Paddling|SUP, Sepak Takraw, Kabaddi, Hurling, Faustball, Prellball, Korbball, Völkerball, Tauziehen',
  },
  {
    id: 'fussballclub',
    text: 'Ein Fußballverein',
    pack: 'sport',
    answers:
      'FC Basel|Basel, FC Zürich|FCZ, Grasshoppers|GC|Grasshopper Club, Young Boys|YB|BSC Young Boys, FC Luzern|Luzern, FC St. Gallen|St. Gallen, FC Lugano|Lugano, Servette|Servette Genf, FC Sion|Sion, FC Thun|Thun, FC Winterthur|Winterthur, Lausanne-Sport, Yverdon, Bayern München|Bayern|FC Bayern, Borussia Dortmund|Dortmund|BVB, RB Leipzig|Leipzig, Bayer Leverkusen|Leverkusen, Schalke|Schalke 04, VfB Stuttgart|Stuttgart, Eintracht Frankfurt|Frankfurt, Borussia Mönchengladbach|Gladbach, Werder Bremen|Bremen, Hamburger SV|HSV, 1. FC Köln|Köln, Hertha BSC|Hertha, Union Berlin, SC Freiburg|Freiburg, VfL Wolfsburg|Wolfsburg, FC St. Pauli|St. Pauli, Mainz 05|Mainz, Hoffenheim, Augsburg|FC Augsburg, Hannover 96, Fortuna Düsseldorf, 1. FC Kaiserslautern|Kaiserslautern, Nürnberg|1. FC Nürnberg, Rapid Wien, Austria Wien, Red Bull Salzburg|Salzburg, Sturm Graz, LASK, Real Madrid, FC Barcelona|Barcelona|Barça, Atlético Madrid|Atletico, FC Sevilla|Sevilla, Valencia, Villarreal, Real Betis|Betis, Athletic Bilbao|Bilbao, Manchester United|Man United, Manchester City|Man City, Liverpool, Chelsea, Arsenal, Tottenham|Spurs, Newcastle, Aston Villa, West Ham, Everton, Leeds, Juventus|Juve, AC Mailand|AC Milan|Milan, Inter Mailand|Inter, AS Rom|Roma, Lazio, Napoli|SSC Neapel, Atalanta, Fiorentina, Paris Saint-Germain|PSG, Olympique Marseille|Marseille, Olympique Lyon|Lyon, AS Monaco|Monaco, Lille, Ajax Amsterdam|Ajax, PSV Eindhoven|PSV, Feyenoord, Benfica, FC Porto|Porto, Sporting Lissabon|Sporting, Celtic, Rangers, Galatasaray, Fenerbahçe|Fenerbahce, Besiktas, Olympiakos, Panathinaikos, Roter Stern Belgrad, Dinamo Zagreb, Schachtar Donezk, Zenit, Club Brügge, Anderlecht, Boca Juniors, River Plate, Flamengo, Santos, Inter Miami, LA Galaxy, Al-Nassr, Al-Hilal',
  },
  {
    id: 'fussballer',
    text: 'Ein Fußballspieler oder eine Fußballspielerin',
    pack: 'sport',
    answers:
      'Messi|Lionel Messi, Ronaldo|Cristiano Ronaldo|CR7, Neymar, Mbappé|Kylian Mbappé|Mbappe, Haaland|Erling Haaland, Kane|Harry Kane, Bellingham|Jude Bellingham, Vinícius|Vinicius Junior|Vini Jr, Salah|Mohamed Salah, De Bruyne|Kevin De Bruyne, Lewandowski|Robert Lewandowski, Modrić|Luka Modric, Benzema, Griezmann, Musiala|Jamal Musiala, Wirtz|Florian Wirtz, Kimmich|Joshua Kimmich, Müller|Thomas Müller, Neuer|Manuel Neuer, Ter Stegen, Sané|Leroy Sané, Gündoğan|Gündogan, Kroos|Toni Kroos, Rüdiger|Antonio Rüdiger, Havertz, Xhaka|Granit Xhaka, Shaqiri|Xherdan Shaqiri, Sommer|Yann Sommer, Akanji|Manuel Akanji, Embolo|Breel Embolo, Freuler, Kobel|Gregor Kobel, Ndoye, Rieder, Frei|Alex Frei, Chapuisat, Lehmann, Beckenbauer|Franz Beckenbauer, Gerd Müller, Klose|Miroslav Klose, Ballack, Lahm, Schweinsteiger, Podolski, Götze, Reus|Marco Reus, Hummels, Özil|Mesut Özil, Pelé|Pele, Maradona, Zidane, Ronaldinho, Kaká|Kaka, Beckham, Rooney, Henry|Thierry Henry, Ibrahimović|Zlatan, Buffon, Pirlo, Totti, Del Piero, Maldini, Iniesta, Xavi, Puyol, Casillas, Ramos|Sergio Ramos, Pique, Busquets, Pedri, Gavi, Yamal|Lamine Yamal, Rodri, Saka|Bukayo Saka, Foden|Phil Foden, Rashford, Palmer|Cole Palmer, Son|Heung-min Son, Osimhen, Lautaro|Lautaro Martinez, Di María, Alvarez|Julian Alvarez, Valverde, Kvaratskhelia, Leão|Rafael Leao, Olise, Dembélé, Kanté, Pogba, Lukaku, Courtois, Alisson, Van Dijk, Alexander-Arnold, Mané, Firmino, Suárez|Luis Suarez, Cavani, Hazard, Bale, Drogba, Eto\'o, Alaba|David Alaba, Arnautović, Popp|Alexandra Popp, Bühl|Klara Bühl, Oberdorf, Bachmann|Ramona Bachmann, Crnogorčević, Putellas|Alexia Putellas, Bonmatí|Aitana Bonmati, Marta, Rapinoe|Megan Rapinoe, Morgan|Alex Morgan, Hegerberg',
  },
  {
    id: 'sportzubehoer',
    text: 'Etwas, das man zum Sport braucht',
    pack: 'sport',
    answers:
      'Ball, Fußball, Basketball, Volleyball, Tennisball, Golfball, Schläger|Tennisschläger, Tischtennisschläger, Badmintonschläger, Federball, Golfschläger, Hockeyschläger|Stock, Puck, Helm, Velohelm|Fahrradhelm, Skihelm, Skier|Ski, Skistöcke, Skischuhe, Snowboard, Schlittschuhe, Inlineskates, Skateboard, Fahrrad|Velo, Turnschuhe|Sportschuhe|Sneaker, Laufschuhe, Fußballschuhe|Stollenschuhe|Töggelischuhe, Spikes, Trikot, Sporthose, Leggings, Sport-BH, Stirnband, Schweißband, Trinkflasche, Handtuch, Hantel|Hanteln|Kurzhantel, Langhantel, Gewichte, Kettlebell, Yogamatte|Matte, Springseil|Seil, Widerstandsband|Theraband, Medizinball, Boxhandschuhe, Boxsack, Mundschutz, Schienbeinschoner, Knieschoner, Ellenbogenschoner, Handschuhe, Torwarthandschuhe, Tor, Netz, Korb, Pfeife, Stoppuhr, Startblock, Hürde, Stab, Speer, Diskus, Kugel, Schwimmbrille, Badekappe, Badehose, Badeanzug, Neoprenanzug, Flossen, Schnorchel, Taucherbrille, Surfbrett, Paddel, Ruder, Segel, Kletterschuhe, Seil|Kletterseil, Karabiner, Klettergurt, Chalk|Magnesia, Pulsuhr|Smartwatch, Fitnessarmband, Proteinshake|Protein, Gürtel|Gewichthebergürtel, Kampfanzug|Gi, Gürtel|Schwarzer Gurt, Bogen, Pfeil, Dartpfeil, Dartscheibe, Queue, Kegel, Bowlingkugel, Sattel, Reitstiefel, Gerte, Trampolin, Reck, Barren, Ringe, Pferd|Turnpferd, Sprungkasten|Kasten, Bock, Matte|Weichbodenmatte',
  },
  {
    id: 'olympia',
    text: 'Ein Sportstar (nicht Fußball)',
    pack: 'sport',
    answers:
      'Roger Federer|Federer, Rafael Nadal|Nadal, Novak Djokovic|Djokovic, Carlos Alcaraz|Alcaraz, Jannik Sinner|Sinner, Stan Wawrinka|Wawrinka, Martina Hingis|Hingis, Belinda Bencic|Bencic, Serena Williams|Serena, Venus Williams, Steffi Graf, Boris Becker, Alexander Zverev|Zverev, Michael Jordan|Jordan, LeBron James|LeBron, Kobe Bryant|Kobe, Stephen Curry|Curry, Dirk Nowitzki|Nowitzki, Shaquille O\'Neal|Shaq, Kevin Durant, Giannis, Luka Dončić|Doncic, Victor Wembanyama|Wemby, Usain Bolt|Bolt, Carl Lewis, Michael Phelps|Phelps, Simone Biles|Biles, Mujinga Kambundji|Kambundji, Lewis Hamilton|Hamilton, Max Verstappen|Verstappen, Michael Schumacher|Schumacher, Sebastian Vettel|Vettel, Ayrton Senna|Senna, Charles Leclerc|Leclerc, Lando Norris|Norris, Fernando Alonso|Alonso, Valentino Rossi|Rossi, Marc Márquez|Marquez, Tom Brady|Brady, Patrick Mahomes|Mahomes, Muhammad Ali|Ali, Mike Tyson|Tyson, Floyd Mayweather|Mayweather, Klitschko|Vitali Klitschko|Wladimir Klitschko, Conor McGregor|McGregor, Khabib, Tiger Woods|Tiger, Rory McIlroy, Wayne Gretzky|Gretzky, Nico Hischier|Hischier, Roman Josi|Josi, Nino Niederreiter, Kevin Fiala, Marco Odermatt|Odermatt, Lara Gut-Behrami|Lara Gut, Wendy Holdener|Holdener, Michelle Gisin, Didier Cuche|Cuche, Bernhard Russi, Vreni Schneider, Pirmin Zurbriggen, Marcel Hirscher|Hirscher, Mikaela Shiffrin|Shiffrin, Lindsey Vonn|Vonn, Hermann Maier, Dario Cologna|Cologna, Simon Ammann|Ammann, Nino Schurter|Schurter, Fabian Cancellara|Cancellara, Tadej Pogačar|Pogacar, Jonas Vingegaard, Lance Armstrong, Eliud Kipchoge|Kipchoge, Mo Farah, Armand Duplantis|Mondo Duplantis, Shaun White, Tony Hawk, Kelly Slater, Magnus Carlsen|Carlsen, Ronnie O\'Sullivan, Phil Taylor, Luke Littler, Michael van Gerwen, Tom Lüthi, Dominique Aegerter, Kilian Wenger, Christian Stucki, Joel Wicki',
  },
  {
    id: 'freizeitpark',
    text: 'Etwas, das man auf dem Jahrmarkt oder in einem Freizeitpark findet',
    pack: 'sport',
    answers:
      'Achterbahn, Riesenrad, Karussell|Rösslispiel, Kettenkarussell, Autoscooter|Autoscooter|Putschautos, Geisterbahn, Spiegelkabinett, Wildwasserbahn, Free Fall Tower|Freefall, Schiffschaukel, Breakdance, Twister, Loopingbahn, Kinderkarussell, Hau den Lukas, Schießbude, Losbude|Lose, Entenangeln, Dosenwerfen, Zuckerwatte, Magenbrot, Gebrannte Mandeln, Popcorn, Liebesapfel|Paradiesapfel|kandierter Apfel, Lebkuchenherz, Crêpes, Churros, Bratwurst, Langos, Slush|Slush-Eis, Softeis, Kuscheltier|Plüschtier, Ballon|Luftballon, Clown, Zauberer, Jongleur, Wahrsagerin, Hüpfburg, Trampolin, Rutsche, Minigolf, Labyrinth, Kartbahn, Bumper Boats, Wasserpark, Wasserrutsche, Maskottchen, Parade, Feuerwerk, Show, Warteschlange|Schlange, Fast Pass, Fotostation, Souvenirshop, Eingang|Kasse, Parkplatz, Toiletten, Europa-Park|Europapark, Disneyland, Phantasialand, Legoland, Heide Park, Conny-Land, Gardaland, Efteling, Tivoli, Prater, Oktoberfest|Wiesn, Cannstatter Wasen, Basler Herbstmesse|Herbstmesse, Knabenschiessen, Olma, Chilbi|Kirmes|Rummel, Jahrmarkt, Kirchweih, Schaustellerbude, Zelt|Festzelt|Bierzelt, Blasmusik, Bier, Maßkrug|Mass',
  },
];
