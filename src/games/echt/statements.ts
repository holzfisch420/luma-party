/**
 * Eigene Satzsammlung für „Echt jetzt?“ – ___ wird durch den Platzhalter ersetzt.
 * Alle Sätze sind persönlich und lassen viele ehrliche Antworten zu.
 */
import type { StatementSet } from './game-config';

const KLASSISCH = `
Wenn ich ___ rieche, fühle ich mich sofort wie ein Kind.
Mein heimliches Talent ist ___.
Auf eine einsame Insel würde ich ___ mitnehmen.
___ würde ich nie im Leben essen.
Mein Lieblingsessen um Mitternacht ist ___.
Als Kind wollte ich unbedingt ___ werden.
Wenn ich im Lotto gewinne, kaufe ich mir als Erstes ___.
___ bringt mich jedes Mal auf die Palme.
Mein erstes Haustier hieß – oder hätte heißen sollen – ___.
Im Supermarkt landet bei mir immer ___ im Wagen.
Bei ___ muss ich jedes Mal weinen.
Mein peinlichstes Lieblingslied ist ___.
Wenn ich ein Tier wäre, wäre ich ___.
Am Sonntagmorgen mache ich am liebsten ___.
Ohne ___ verlasse ich nie das Haus.
Mein schlechtestes Schulfach war ___.
Vor ___ habe ich heimlich Angst.
Mein Lieblingswort ist ___.
Wenn ich eine Superkraft hätte, wäre es ___.
Das Beste am Winter ist ___.
Das Schlimmste am Sommer ist ___.
In meinem Kühlschrank findet man immer ___.
Ich sammle heimlich ___.
Mein Traumberuf wäre ___.
Den ersten Kuss hatte ich mit ___ Jahren – ungefähr.
Wenn ich nicht schlafen kann, ___.
Mein Lieblingsschimpfwort ist ___.
In der Badewanne ___ ich.
Ein Gericht, das ich perfekt kochen kann: ___.
Mein Handy-Hintergrundbild zeigt ___.
___ ist völlig überbewertet.
___ ist völlig unterschätzt.
Mein größter Kindheitsheld war ___.
Wenn ich zaubern könnte, würde ich ___ verschwinden lassen.
Mit ___ könnte ich stundenlang telefonieren.
Ein Ort, an den ich unbedingt noch reisen will: ___.
Das Merkwürdigste, das ich je gegessen habe, ist ___.
Meine Lieblingsfarbe für Socken ist ___.
Mein Spitzname als Kind war ___.
Wenn ich krank bin, brauche ich unbedingt ___.
Die beste Erfindung aller Zeiten ist ___.
Die nutzloseste Erfindung aller Zeiten ist ___.
Mein Lieblingsgeruch ist ___.
___ kann ich überhaupt nicht.
Ich bin stolz darauf, dass ich ___.
Mein Lieblingsplatz zu Hause ist ___.
Einen ganzen Tag lang würde ich gern ___ sein.
Bei einem Feueralarm würde ich zuerst ___ retten.
Das erste, was ich morgens mache, ist ___.
Im Urlaub vermisse ich am meisten ___.
Mein Lieblings-Eis ist ___.
Mit ___ kann man mich immer bestechen.
Ich wurde schon einmal mit ___ verwechselt.
Mein Lieblingsfilm als Kind war ___.
Eine Sache, die ich nie wieder tun würde: ___.
Ich kann ___ nicht ausstehen, obwohl es alle mögen.
Meine Oma sagt immer: „___“.
Wenn ich ein Gericht wäre, wäre ich ___.
Die längste Zeit ohne Handy war ___.
Mein Lieblingsspiel als Kind war ___.
Am meisten Geld gebe ich für ___ aus.
Ein Geräusch, das ich hasse: ___.
Wenn ich traurig bin, hilft mir ___.
Mein bester Ratschlag fürs Leben: ___.
Mein Lieblingsgemüse ist ___.
Ich habe Angst, dass irgendwann ___.
Mein größter Fehlkauf war ___.
Wenn ich mich selbst beschreiben müsste, mit einem Wort: ___.
Das schönste Geschenk, das ich je bekommen habe, war ___.
Ich würde gern einmal mit ___ zu Abend essen.
___ ist mein Geheimrezept für gute Laune.
Mein Lieblingsbuchstabe ist ___ – und zwar aus gutem Grund.
Ich kann nicht widerstehen, wenn ___.
In einem Horrorfilm wäre ich die Person, die ___.
Mein Lieblings-Emoji ist ___.
Wenn ich Bürgermeister wäre, würde ich als Erstes ___.
Bei Gewitter ___ ich.
Ein Lied, das ich auswendig kann: ___.
Mein Lieblingsfeiertag ist ___.
Ich esse Pizza am liebsten mit ___.
Das Peinlichste, das mir in der Schule passiert ist: ___.
Eine Regel, die ich immer breche: ___.
Mein Zimmer als Teenager war voll mit ___.
Ich bin ein echter Profi im ___.
Ohne ___ wäre der Sommer nur halb so schön.
Wenn ich drei Wünsche frei hätte, wäre einer davon ___.
Das letzte, was ich gegoogelt habe, war ___.
Für ___ würde ich mitten in der Nacht aufstehen.
Ich glaube heimlich an ___.
In meiner Freizeit ___ ich am liebsten.
Mein Lieblingsessen von Mama oder Papa ist ___.
Eine App, ohne die ich nicht leben kann: ___.
Wenn ich müde bin, werde ich ___.
Ein Hobby, das ich gern anfangen würde: ___.
Mein schlimmster Ohrwurm ist ___.
Ich habe schon einmal ___ verloren und nie wiedergefunden.
`;

const PARTY = `
Mein Lieblingsgetränk auf einer Party ist ___.
Auf der Tanzfläche bin ich berühmt für ___.
Am Morgen nach einer Party brauche ich ___.
Mein schlimmster Kater kam von ___.
Beim ersten Date achte ich zuerst auf ___.
Mein Flirt-Trick ist ___.
Das Peinlichste, das ich je betrunken getan habe: ___.
Auf einer Hausparty findet man mich meistens ___.
Mein Karaoke-Lied ist ___.
Um 3 Uhr nachts esse ich am liebsten ___.
Ein absolutes No-Go beim Date ist ___.
Mein Partytrick ist ___.
Wenn die Musik schlecht ist, ___ ich.
Mein Spitzname im Ausgang ist ___.
Ich bin schon einmal aus ___ geflogen.
Mein schlechtester Anmachspruch: „___“.
In der WhatsApp-Gruppe bin ich die Person, die ___.
Mein perfekter Samstagabend: ___.
Auf Festivals vergesse ich immer ___.
Mein heimlicher Schwarm war ___.
Beim Wahrheit-oder-Pflicht wähle ich immer ___.
Die beste Ausrede, um früher zu gehen: ___.
Mein Lieblings-Shot ist ___.
Wenn ich zu viel getrunken habe, rufe ich ___ an.
Das verrückteste, was ich je um Mitternacht getan habe: ___.
Mein Dating-Profil würde mit „___“ anfangen.
Mein Tanzstil lässt sich beschreiben als ___.
Ich habe schon einmal ___ geküsst – ganz aus Versehen.
Bei einer Party bringe ich immer ___ mit.
Mein größter Fail beim Flirten war ___.
`;


const DOPPELT = `
Mein Lieblings___ ist der ___.
Früher hatte ich Angst vor ___, heute liebe ich ___.
Wenn ich ___ höre, will ich sofort ___.
___ am Morgen, ___ am Abend – mehr brauche ich nicht.
Ein Tag ohne ___ ist ein verlorener Tag, aber zu viel ___ ist auch nicht gut.
Meine Oma schwört auf ___, mein Opa kann ___ nicht ausstehen.
Ich träume oft von ___ – letzte Nacht sogar von riesigem ___.
Kein Fest ohne ___ – und kein ___ ohne Fest.
Ich schlafe mit ___ ein und wache mit ___ wieder auf.
Bei mir zu Hause gibt es zu viel ___, und trotzdem kaufe ich immer mehr ___.
Im Sommer ___, im Winter ___ – ich bin da konsequent.
Wer mir ___ schenkt, hat mein Herz – wer mir ___ wegnimmt, hat ein Problem.
Mein größter Traum hat mit ___ zu tun, mein größter Albtraum leider auch mit ___.
Über ___ könnte ich stundenlang reden, aber über ___ schweige ich lieber.
Ich habe einmal ___ gegessen und seitdem esse ich nie wieder ___.
`;

const FAMILIE = `
Bei uns zu Hause gab es jeden Sonntag ___.
Meine Familie nennt mich heimlich ___.
Der lauteste Streit bei uns ging um ___.
Von meiner Mutter habe ich ___ geerbt.
Von meinem Vater habe ich ___ geerbt.
Meine Geschwister würden sagen, ich bin ___.
An Weihnachten gibt es bei uns immer ___.
Das peinlichste Familienfoto zeigt mich mit ___.
Mein bester Freund oder meine beste Freundin weiß als Einzige(r), dass ich ___.
Bei Familienfesten bin ich immer der/die mit ___.
Meine Eltern haben mir verboten, ___.
Ein Satz, den ich von meinen Eltern immer gehört habe: „___“.
Im Familien-Chat schicke ich am liebsten ___.
Mit meinen Freunden mache ich am liebsten ___.
Wenn Besuch kommt, verstecke ich schnell ___.
Mein erster bester Freund hieß ___.
Unser Familienurlaub ging meistens nach ___.
Bei uns im Auto lief immer ___.
In meiner Familie bin ich zuständig für ___.
Das Lieblingsgericht in meiner Familie ist ___.
Ich ruf meine Mutter an, wenn ___.
Mein schlimmster Kinderstreich war ___.
Als Kind habe ich mich vor ___ unter dem Bett versteckt.
Meine Freunde sagen, ich kann am besten ___.
Ohne meine Freunde hätte ich nie ___.
Ein Geheimnis zwischen mir und meinen Geschwistern: ___.
Bei Spieleabenden schummle ich immer bei ___.
Mein Haustier – echt oder erträumt – heißt ___.
Wenn ich Kinder habe, verbiete ich ihnen niemals ___.
Bei Geburtstagen wünsche ich mir immer ___.
Meine Großeltern haben mir ___ beigebracht.
Unser Familienmotto könnte lauten: „___“.
Wenn wir zusammen kochen, endet es immer mit ___.
Meine Freundschaften halten, weil ich ___.
Ich werde nie vergessen, wie meine Familie ___.
Die beste Ausrede, um nicht beim Abwaschen zu helfen: ___.
In unserem Kühlschrank zu Hause stand immer ___.
Mein Freundeskreis würde ohne mich ___.
Bei uns zu Hause hing an der Wand ___.
Mein Zimmer musste ich immer aufräumen, weil ___.
`;

const ARBEIT = `
Mein Lieblingsfach in der Schule war ___.
Im Unterricht habe ich heimlich ___.
Mein seltsamster Ferienjob war ___.
Wenn ich Chef wäre, würde ich als Erstes ___ einführen.
In der Mittagspause esse ich am liebsten ___.
Mein Schreibtisch ist voll mit ___.
Die beste Ausrede für Zuspätkommen ist ___.
Mein Lehrer hat mir mal gesagt: „___“.
In der Schule war ich bekannt für ___.
Mein Traumbüro hätte unbedingt ___.
Ein Job, den ich niemals machen würde: ___.
Bei Prüfungen hilft mir ___.
In Gruppenarbeiten bin ich immer die Person, die ___.
Mein Lieblingstag in der Woche ist ___.
Am Montagmorgen brauche ich ___.
Ein Fach, das es in der Schule geben sollte: ___.
Mein erstes selbst verdientes Geld habe ich für ___ ausgegeben.
Bei Meetings denke ich meistens an ___.
Mein Spickzettel war einmal auf ___ versteckt.
Das Nervigste an Hausaufgaben war ___.
Von meiner Klassenfahrt erinnere ich mich vor allem an ___.
Wenn der Drucker streikt, ___ ich.
Mein Arbeitsweg wäre perfekt mit ___.
Eine Fähigkeit, die man in keiner Schule lernt: ___.
Im Sportunterricht war ich immer ___.
Am Freitagnachmittag bin ich ___.
Ein Berufswunsch, den ich als Kind hatte und heute peinlich finde: ___.
Meine Kollegen oder Mitschüler würden mich als ___ beschreiben.
Das Beste an der Pause ist ___.
Wenn ich kündigen würde, dann um ___.
Mein Lieblings-Bürogegenstand ist ___.
Die Schulnote, auf die ich am stolzesten bin, war in ___.
Ein Referat von mir ging einmal über ___.
In meiner Schultasche fand man immer ___.
Bei langweiligen Vorträgen zeichne ich ___.
Mein bester Tipp fürs Lernen: ___.
Die Mensa war berühmt für ___.
Wenn ich einen Tag lang Lehrer wäre, würde ich ___.
Das wichtigste Werkzeug in meinem Job oder Alltag ist ___.
Ein Nebenjob, der mich reizen würde: ___.
`;

const WASWAERE = `
Wenn ich unsichtbar wäre, würde ich zuerst ___.
Wenn ich in einer anderen Zeit leben könnte, dann in ___.
Wenn ich ein Superheld wäre, hieße ich ___.
Wenn Tiere sprechen könnten, würde ich zuerst ___ fragen.
Wenn ich ein Land regieren würde, wäre ___ Pflicht.
Wenn ich ein Restaurant eröffnen würde, gäbe es nur ___.
Wenn ich ein Buch schreiben würde, hieße es „___“.
Wenn ich einen Roboter hätte, müsste er ___.
Wenn ich eine Zeitmaschine hätte, würde ich ___ verhindern.
Wenn ich ein Gemüse wäre, wäre ich ___.
Wenn mein Leben ein Film wäre, würde ___ mich spielen.
Wenn ich eine Sache auf der Welt abschaffen könnte, wäre es ___.
Wenn ich einen Tag lang ein Tier sein könnte, wäre ich ___.
Wenn ich eine eigene Insel hätte, würde ich sie ___ nennen.
Wenn ich auf den Mars ziehen müsste, würde ich ___ einpacken.
Wenn ich ein Lied wäre, wäre ich ___.
Wenn ich ein Möbelstück wäre, wäre ich ___.
Wenn ich berühmt wäre, dann wegen ___.
Wenn ich eine neue Sportart erfinden würde, ginge es um ___.
Wenn ich eine Million verschenken müsste, bekäme sie ___.
Wenn ich Gedanken lesen könnte, würde ich bei ___ anfangen.
Wenn ich eine Woche ohne Handy auskommen müsste, würde ich ___.
Wenn ich einen Feiertag erfinden könnte, wäre es der Tag des ___.
Wenn ich einen Zauberspruch hätte, würde er ___ bewirken.
Wenn ich eine Eissorte erfinden würde, schmeckte sie nach ___.
Wenn ich einen Monat lang nur eine Sache essen dürfte, wäre es ___.
Wenn ich eine Farbe wäre, wäre ich ___.
Wenn ich mein eigenes Haus bauen würde, hätte es unbedingt ___.
Wenn ich ein Hobby zum Beruf machen könnte, wäre es ___.
Wenn ich ein Monster wäre, hätte ich Angst vor ___.
Wenn ich in einem Videospiel leben würde, dann in ___.
Wenn ich eine Erfindung machen könnte, wäre es ___.
Wenn ich ein Wort aus der Sprache streichen könnte, wäre es ___.
Wenn ich im Zirkus arbeiten würde, wäre ich ___.
Wenn ich ein Geheimagent wäre, wäre mein Deckname ___.
Wenn ich die Schwerkraft ausschalten könnte, würde ich ___.
Wenn ich ein Geräusch für immer verbieten könnte, wäre es ___.
Wenn ich mit 80 zurückblicke, möchte ich ___ gemacht haben.
Wenn ich eine Woche lang jemand anderes sein könnte, wäre ich ___.
Wenn ich eine Fernsehsendung moderieren würde, hieße sie „___“.
Wenn ich ein Gesetz erlassen dürfte, würde ___ verboten.
Wenn ich drei Dinge in eine Zeitkapsel legen würde, wäre eins davon ___.
Wenn ich eine Pflanze wäre, wäre ich ___.
Wenn ich einen Drachen hätte, würde ich ihn ___ nennen.
Wenn ich ab morgen in einer anderen Stadt leben müsste, dann in ___.
`;

function parse(block: string): string[] {
  return block
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.includes('___'));
}

export const STATEMENTS: Record<StatementSet, string[]> = {
  // Sätze mit zwei Platzhaltern – dieselbe Antwort steht an beiden Stellen
  klassisch: [...parse(KLASSISCH), ...parse(DOPPELT)],
  familie: parse(FAMILIE),
  arbeit: parse(ARBEIT),
  wasware: parse(WASWAERE),
  party: parse(PARTY),
};
