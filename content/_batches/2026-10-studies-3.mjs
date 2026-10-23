// Content batch (23.10.2026): the third set of "Studie kurz erklärt" cards. Every part is quoted from the linked article.
//   node scripts/content/verify-evidence.mjs content/_batches/2026-10-studies-3.mjs && node scripts/content/merge-studies.mjs content/_batches/2026-10-studies-3.mjs
export const TODAY = "2026-10-23";
export const verification = "ai_checked";
const W = "https://de.wikipedia.org/wiki/";
const wiki = (title) => ({ name: "Wikipedia: " + title.replaceAll("_", " "), url: W + title });
export const studies = [
  {
    id: "s-kleine-welt", category: "science", minAge: 10, year: 1967,
    name: { de: "Kleine-Welt-Experiment (Milgram)", en: "The small-world experiment (Milgram)" },
    sources: [wiki("Kleine-Welt-Phänomen")],
    de: {
      question: "Ist jeder Mensch mit jedem anderen über eine überraschend kurze Kette von Bekanntschaftsbeziehungen verbunden?",
      method: "Stanley Milgram ließ 1967 ein Informationspaket an 60 zufällig ausgewählte Teilnehmer schicken, das eine vorher festgelegte Person in Boston erreichen sollte. Wer die Zielperson nicht persönlich kannte, sollte das Paket an eine Person senden, die sie persönlich kannte und die die Zielperson wahrscheinlicher kannte.",
      result: "Insgesamt erreichten drei Pakete die Zielpersonen mit einer durchschnittlichen Pfadlänge von 5,5 oder aufgerundet sechs. Die Wissenschaftler schlossen daraus, dass jede Person der US-amerikanischen Bevölkerung von jeder anderen durchschnittlich durch sechs Personen getrennt ist.",
      caveat: "Aber sowohl das Experiment als auch die Schlussfolgerungen sind umstritten und werden als nicht beweiskräftig angesehen. Judith Kleinfeld kritisierte 2002 die nicht ausreichende Datenlage, sie spricht von einer „5 % chain completion rate“.",
    },
    en: {
      question: "Is every person connected to every other person by a surprisingly short chain of acquaintances?",
      method: "In 1967 Stanley Milgram had an information package sent to 60 randomly chosen participants, which was meant to reach a pre-set person in Boston. Anyone who did not know the target personally was to send the package to a person they knew personally and who was more likely to know the target.",
      result: "Altogether three packages reached the target persons, with an average path length of 5.5, or rounded up, six. The scientists concluded from this that each person in the US population is separated from every other person in the USA by an average of six people.",
      caveat: "But both the experiment and its conclusions are controversial and are regarded as not conclusive. In 2002 Judith Kleinfeld criticised the insufficient data and speaks of a “5 % chain completion rate”.",
    },
  },
  {
    id: "s-mere-exposure", category: "science", minAge: 10, year: 1968,
    name: { de: "Zajonc und der Mere-Exposure-Effekt (bloßes Kennen)", en: "Zajonc and the mere-exposure effect (simply being familiar)" },
    sources: [wiki("Mere-Exposure-Effekt")],
    de: {
      question: "Führt allein die wiederholte Wahrnehmung eines ursprünglich neutral beurteilten Reizes zu einer positiveren Bewertung?",
      method: "Robert Zajonc untersuchte den Effekt 1968 in drei Experimenten. Er zeigte Versuchspersonen türkische Wörter oder chinesische Schriftzeichen unterschiedlich oft, und sie sollten angeben, wie positiv oder negativ diese Reize wirkten. Im dritten Experiment verwendete er Porträtfotos von Studierenden, die später auf Sympathie bewertet wurden.",
      result: "Häufiger präsentierte Wörter und Zeichen wurden deutlich positiver bewertet als selten oder gar nicht gezeigte. Auch häufiger gezeigte Gesichter wurden als deutlich sympathischer eingeschätzt, wobei der Anstieg mit zunehmender Darbietung schrittweise abflachte.",
      caveat: "Aber der Effekt tritt in der Regel nicht auf, wenn ein Reiz bereits beim ersten Kontakt negativ bewertet wurde, dann kann wiederholte Darbietung die Abneigung sogar verstärken. Die Metaanalyse von Montoya et al. (2017) fand unter bestimmten Bedingungen eine umgekehrt U-förmige Kurve: Das Gefallen steigt zunächst an, nimmt jedoch bei weiterer Wiederholung wieder ab.",
    },
    en: {
      question: "Does the mere repeated perception of an originally neutral stimulus lead to a more positive evaluation?",
      method: "Robert Zajonc studied the effect in three experiments in 1968. He showed participants Turkish words or Chinese characters different numbers of times, and they were to say how positive or negative these stimuli seemed. In the third experiment he used portrait photos of students, who were later rated for likeability.",
      result: "Words and characters shown more often were rated clearly more positively than ones shown rarely or not at all. Faces shown more often were also judged clearly more likeable, with the increase levelling off step by step as presentations increased.",
      caveat: "But the effect usually does not occur if a stimulus was already rated negatively at first contact; then repeated presentation can even strengthen the dislike. The meta-analysis by Montoya et al. (2017) found an inverted U-shaped curve under certain conditions: liking first rises, but falls again with further repetition.",
    },
  },
  {
    id: "s-gorilla", category: "science", minAge: 10, year: 1999,
    name: { de: "Der unsichtbare Gorilla (Simons und Chabris)", en: "The invisible gorilla (Simons and Chabris)" },
    sources: [wiki("Unaufmerksamkeitsblindheit")],
    de: {
      question: "Übersehen wir etwas sehr Auffälliges, wenn wir mit einer Beobachtungsaufgabe beschäftigt sind?",
      method: "Daniel Simons und Christopher Chabris zeigten Videos von jeweils 75 Sekunden Dauer. Jeder Film zeigt zwei Teams mit je drei Spielern, die sich einen Basketball zuwerfen, und die Versuchspersonen sollten die Ballwechsel eines Teams mitzählen. Nach 44 bis 48 Sekunden läuft in der Gorilla-Version eine kleinere Frau, die vollständig in ein Gorillakostüm gehüllt ist, durchs Bild. Ihre Studie „Gorillas in Our Midst“ ist von 1999.",
      result: "Von 192 Versuchspersonen bemerkten 54 Prozent den „Zwischenfall“ und 46 Prozent nicht. Die Frau mit dem Regenschirm wurde öfter entdeckt als die im Gorillakostüm (65 % versus 44 %).",
      caveat: "Aber wie oft der Gorilla bemerkt wurde, hing vom Team ab: Wer das schwarze Team beobachtete, bemerkte ihn öfter als wer das weiße Team beobachtete (schwarz 58 %, weiß 27 %). Die Höhe der Unaufmerksamkeitsblindheit hängt außerdem vom Schwierigkeitsgrad der Beobachtungsaufgabe ab.",
    },
    en: {
      question: "Do we overlook something very conspicuous when we are busy with an observation task?",
      method: "Daniel Simons and Christopher Chabris showed videos of 75 seconds each. Each film shows two teams of three players each passing a basketball, and the participants were to count the passes of one team. After 44 to 48 seconds, in the gorilla version a smaller woman, completely wrapped in a gorilla costume, walks through the scene. Their study “Gorillas in Our Midst” dates from 1999.",
      result: "Of 192 participants, 54 percent noticed the “incident” and 46 percent did not. The woman with the umbrella was spotted more often than the one in the gorilla costume (65% versus 44%).",
      caveat: "But how often the gorilla was noticed depended on the team: those who watched the black team noticed it more often than those who watched the white team (black 58%, white 27%). The degree of inattentional blindness also depends on how difficult the observation task is.",
    },
  },
];
export const evidence = {
  "s-kleine-welt": [
    "de|Kleine-Welt-Phänomen|Der Hypothese nach ist jeder Mensch (sozialer Akteur) auf der Welt mit jedem anderen über eine überraschend kurze Kette von Bekanntschaftsbeziehungen verbunden.",
    "de|Kleine-Welt-Phänomen|Das erste Kleine-Welt-Experiment wurde im Jahre 1967 von dem US-amerikanischen Psychologen Stanley Milgram",
    "de|Kleine-Welt-Phänomen|Milgram erstellte eine Art Informationspaket, das 60 zufällig ausgewählte Teilnehmer an jeweils eine vorher festgelegte Person in Boston zu senden hatten.",
    "de|Kleine-Welt-Phänomen|sofern sie diese nicht persönlich kannten",
    "de|Kleine-Welt-Phänomen|sondern an eine Person, die sie persönlich kannten und bei der die Wahrscheinlichkeit höher war, dass sie die Zielperson kannte.",
    "de|Kleine-Welt-Phänomen|Insgesamt erreichten drei Pakete die Zielpersonen mit einer durchschnittlichen Pfadlänge von 5,5 oder aufgerundet sechs.",
    "de|Kleine-Welt-Phänomen|Die Wissenschaftler schlossen daraus, dass jede Person der US-amerikanischen Bevölkerung von jeder anderen Person der USA durchschnittlich durch sechs Personen getrennt ist",
    "de|Kleine-Welt-Phänomen|Sowohl das Experiment als auch die aus den Ergebnissen abgeleiteten Schlussfolgerungen sind umstritten und werden als nicht beweiskräftig angesehen.",
    "de|Kleine-Welt-Phänomen|In einer im Jahr 2002 veröffentlichten Studie kritisiert die US-amerikanische Psychologin Judith Kleinfeld insbesondere die nicht ausreichende Datenlage",
    "de|Kleine-Welt-Phänomen|Kleinfeld spricht von einer „5 % chain completion rate“",
  ],
  "s-mere-exposure": [
    "de|Mere-Exposure-Effekt|dass allein die wiederholte Wahrnehmung eines ursprünglich neutral beurteilten Reizes zu einer positiveren Bewertung führt.",
    "de|Mere-Exposure-Effekt|Robert Zajonc untersuchte den Mere-Exposure-Effekt 1968 in drei Experimenten.",
    "de|Mere-Exposure-Effekt|zeigte er Versuchspersonen türkische Wörter oder chinesische Schriftzeichen unterschiedlich oft.",
    "de|Mere-Exposure-Effekt|Anschließend sollten die Teilnehmenden angeben, wie positiv oder negativ diese Reize wirkten.",
    "de|Mere-Exposure-Effekt|Im dritten Experiment verwendete Zajonc Porträtfotos von Studierenden.",
    "de|Mere-Exposure-Effekt|Die Fotos wurden unterschiedlich oft gezeigt und später auf Sympathie bewertet.",
    "de|Mere-Exposure-Effekt|häufiger präsentierte Wörter und Zeichen deutlich positiver bewertet wurden als selten oder gar nicht gezeigte.",
    "de|Mere-Exposure-Effekt|Auch hier wurden häufiger gezeigte Gesichter als deutlich sympathischer eingeschätzt.",
    "de|Mere-Exposure-Effekt|Gleichzeitig zeigte sich, dass der Anstieg mit zunehmender Darbietung schrittweise abflacht.",
    "de|Mere-Exposure-Effekt|Der Mere-Exposure-Effekt tritt in der Regel nicht auf, wenn ein Reiz bereits beim ersten Kontakt negativ bewertet wurde.",
    "de|Mere-Exposure-Effekt|In diesem Fall kann wiederholte Darbietung die Abneigung sogar verstärken.",
    "de|Mere-Exposure-Effekt|Die Metaanalyse von Montoya et al. (2017)",
    "de|Mere-Exposure-Effekt|Unter bestimmten Bedingungen lässt sich eine umgekehrt U-förmige Kurve beobachten.",
    "de|Mere-Exposure-Effekt|Das Gefallen steigt zunächst an, nimmt jedoch bei weiterer Wiederholung wieder ab.",
  ],
  "s-gorilla": [
    "de|Unaufmerksamkeitsblindheit|untersuchten Daniel Simons und Christopher Chabris in ihrem Gorilla-Experiment",
    "de|Unaufmerksamkeitsblindheit|Ungefähr die Hälfte der Versuchspersonen nimmt ein länger dauerndes, eigentlich sehr auffälliges, jedoch unerwartetes Ereignis nicht wahr, wenn sie mit einer elementaren Beobachtungsaufgabe beschäftigt ist.",
    "de|Unaufmerksamkeitsblindheit|vier Videos von jeweils 75 Sekunden Dauer",
    "de|Unaufmerksamkeitsblindheit|Jeder Film zeigt zwei Teams mit je drei Spielern",
    "de|Unaufmerksamkeitsblindheit|sämtliche Ballwechsel des beobachteten Teams im Kopf mitzuzählen",
    "de|Unaufmerksamkeitsblindheit|Nach 44 bis 48 Sekunden ereignet sich etwas Unerwartetes",
    "de|Unaufmerksamkeitsblindheit|In der Gorilla-Version läuft eine kleinere Frau, die vollständig in ein Gorillakostüm gehüllt ist, auf die gleiche Weise durchs Bild.",
    "de|Unaufmerksamkeitsblindheit|D.J. Simons, C.F. Chabris (1999): Gorillas in Our Midst",
    "de|Unaufmerksamkeitsblindheit|Letztlich blieben für die Auswertung 192 Versuchspersonen übrig",
    "de|Unaufmerksamkeitsblindheit|54 Prozent den „Zwischenfall“ bemerkten und 46 Prozent nicht",
    "de|Unaufmerksamkeitsblindheit|die Frau mit dem Regenschirm öfter entdeckt wurde als die im Gorillakostüm (65 % versus 44 %)",
    "de|Unaufmerksamkeitsblindheit|Die Versuchspersonen, die das schwarze Team beobachteten, bemerkten den Gorilla öfter als die, die das weiße Team im Fokus ihrer Aufmerksamkeit hatten (schwarz 58 %, weiß 27 %).",
    "de|Unaufmerksamkeitsblindheit|Die Höhe der Unaufmerksamkeitsblindheit hängt ab vom Schwierigkeitsgrad der Beobachtungsaufgabe.",
  ],
};
