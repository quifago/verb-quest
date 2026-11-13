const rows = `be|was / were|been|ser / estar
become|became|become|llegar a ser
begin|began|begun|empezar, comenzar
bite|bit|bitten|morder
break|broke|broken|romper
bring|brought|brought|traer / llevar
build|built|built|construir
burn|burnt, burned|burnt, burned|quemar / arder
buy|bought|bought|comprar
can|could||poder
catch|caught|caught|coger, atrapar
choose|chose|chosen|elegir, escoger
come|came|come|venir, llegar
cost|cost|cost|costar
cut|cut|cut|cortar
do|did|done|hacer
draw|drew|drawn|dibujar
dream|dreamt|dreamt|soñar
drink|drank|drunk|beber
drive|drove|driven|conducir
eat|ate|eaten|comer
fall|fell|fallen|caerse
feed|fed|fed|alimentar
feel|felt|felt|sentir
fight|fought|fought|luchar
find|found|found|encontrar
fly|flew|flown|volar
forget|forgot|forgotten|olvidar
freeze|froze|frozen|helar, congelar
get|got|got|conseguir, obtener
give|gave|given|dar
go|went|gone|ir
grow|grew|grown|crecer / cultivar
have|had|had|tener / haber
hear|heard|heard|oír
hide|hid|hidden|esconder
hit|hit|hit|golpear / chocar
hold|held|held|sostener / aguantar
hurt|hurt|hurt|herir / doler
keep|kept|kept|conservar / mantener
know|knew|known|saber, conocer
learn|learnt, learned|learnt, learned|aprender
leave|left|left|dejar (abandonar)
lend|lent|lent|prestar
let|let|let|dejar (permitir)
lose|lost|lost|perder
make|made|made|hacer, fabricar
mean|meant|meant|significar
meet|met|met|encontrarse / quedar con
pay|paid|paid|pagar
put|put|put|poner, colocar
read|read|read|leer
ride|rode|ridden|montar
ring|rang|rung|sonar
run|ran|run|correr
say|said|said|decir
see|saw|seen|ver
sell|sold|sold|vender
send|sent|sent|enviar
shine|shone|shone|brillar
shoot|shot|shot|disparar
shut|shut|shut|cerrar (fuertemente)
sing|sang|sung|cantar
sit|sat|sat|sentarse
sleep|slept|slept|dormir
speak|spoke|spoken|hablar
spell|spelt|spelt|deletrear
spend|spent|spent|gastar
stand|stood|stood|estar de pie / colocar
steal|stole|stolen|robar
swim|swam|swum|nadar
swing|swung|swung|balancearse
take|took|taken|llevarse / coger
teach|taught|taught|enseñar
tell|told|told|decir (contar)
think|thought|thought|pensar
throw|threw|thrown|arrojar, lanzar
understand|understood|understood|entender, comprender
wake|woke|woken|despertar
wear|wore|worn|llevar puesto
win|won|won|ganar
write|wrote|written|escribir`;

export const verbs = rows.split("\n").map((row) => {
  const [base, simple, participle, meaning] = row.split("|");
  return { base, simple, participle, meaning };
});

type Verb = (typeof verbs)[number];

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const validAlternatives: Record<string, string[]> = {
  dream: ["dreamed"], get: ["gotten"], shine: ["shined"],
  spell: ["spelled"], wake: ["waked"], can: ["canned"],
};

function makeOptions(verb: Verb) {
  const answers = [...new Set([verb.simple, verb.participle].filter(Boolean))];
  const variants = new Set(answers.flatMap((answer) => answer.split(/, | \/ /)));
  const regular = verb.base.endsWith("e") ? verb.base + "d" : verb.base + "ed";
  const otherForms = shuffle(verbs.filter((other) =>
    other.base !== verb.base && other.base[0] === verb.base[0],
  )).map((other) => other.simple);
  const fallback = shuffle(verbs).map((other) => other.simple);
  const options = [...answers];

  for (const candidate of [verb.base, regular, ...otherForms, ...fallback]) {
    if (options.length === 4) break;
    if (variants.has(candidate) || options.includes(candidate) || validAlternatives[verb.base]?.includes(candidate)) continue;
    if (candidate.includes(",") || candidate.includes(" / ")) continue;
    options.push(candidate);
  }

  return shuffle(options);
}

export function makeRound(size: number, pool = verbs) {
  return shuffle(pool).slice(0, size).map((verb) => ({
    ...verb,
    options: makeOptions(verb),
  }));
}
