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

function parse(block: string): string[] {
  return block
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.includes('___'))
    // nur ein Platzhalter pro Satz – bei zweien gilt nur der erste
    .map((s) => {
      const i = s.indexOf('___');
      return s.slice(0, i + 3) + s.slice(i + 3).replace(/___/g, '…');
    });
}

export const STATEMENTS: Record<StatementSet, string[]> = {
  klassisch: parse(KLASSISCH),
  party: parse(PARTY),
};
