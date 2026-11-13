"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, Compass, Flag, Gamepad2, Layers3, Play, RotateCcw, Sparkles, Target, Trophy, X, Zap } from "lucide-react";
import { SlotMachine } from "./slot-machine";
import type { SlotField, SlotPhase, SlotPicks, SlotQuestion } from "./slot-machine";
import { prepareSlotAudio, SLOT_CHECK_MS } from "./slot-feedback";
import { makeRound, shuffle, verbs } from "./verbs";

const sizes = [10, 20, 82];
const letters = ["A", "B", "C", "D"];
type Round = ReturnType<typeof makeRound>;

type RoundProgress = {
  index: number;
  score: number;
  missed: Round;
};

type Game = RoundProgress & (
  | { mode: "classic"; round: Round; step: "simple" | "participle"; choice: string | null }
  | { mode: "slot"; round: SlotQuestion[]; phase: SlotPhase; picks: SlotPicks }
);

const emptyPicks: SlotPicks = { simple: null, participle: null };

export default function Home() {
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState(10);
  const [mode, setMode] = useState<Game["mode"]>("slot");
  const [game, setGame] = useState<Game | null>(null);
  const [showList, setShowList] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const next = useRef<HTMLButtonElement>(null);
  const verb = game?.round[game.index];
  const finished = Boolean(game && !verb);
  const screen = showList ? "list" : finished ? "result" : verb ? "game" : "home";
  const classic = screen === "game" && game?.mode === "classic" ? game : null;
  const slot = screen === "game" && game?.mode === "slot" ? game : null;
  const focusKey = screen === "game" ? `${game?.index}-${classic?.step ?? "slot"}` : screen;
  const previousFocusKey = useRef(focusKey);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (previousFocusKey.current === focusKey) return;
    previousFocusKey.current = focusKey;
    heading.current?.focus();
  }, [focusKey]);

  function start(retry?: Round) {
    if (mode === "slot") void prepareSlotAudio();
    const round = makeRound(retry?.length ?? size, retry);
    const progress: RoundProgress = { index: 0, score: 0, missed: [] };
    setGame(mode === "slot" ? {
      ...progress, mode, phase: "selecting", picks: emptyPicks,
      round: round.map((question) => ({ ...question, participleOptions: shuffle(question.options) })),
    } : { ...progress, mode, round, step: "simple", choice: null });
    setShowList(false);
  }

  function choose(choice: string) {
    setGame((current) => {
      if (current?.mode !== "classic" || current.choice !== null) return current;
      const question = current.round[current.index];
      if (!question) return current;
      const correct = choice === question[current.step];
      return {
        ...current,
        choice,
        score: current.score + Number(correct),
        missed: correct || current.missed.includes(question)
          ? current.missed : [...current.missed, question],
      };
    });
  }

  function advance() {
    setGame((current) => {
      if (current?.mode !== "classic" || current.choice === null) return current;
      const question = current.round[current.index];
      if (current.step === "simple" && question.participle) {
        return { ...current, step: "participle", choice: null };
      }
      return { ...current, index: current.index + 1, step: "simple", choice: null };
    });
  }

  function pickSlot(field: SlotField, value: string) {
    setGame((current) => current?.mode === "slot" && current.phase === "selecting"
      ? { ...current, picks: { ...current.picks, [field]: value } }
      : current);
  }

  function checkSlot() {
    setGame((current) => {
      if (current?.mode !== "slot" || current.phase !== "selecting") return current;
      const question = current.round[current.index];
      if (!question || !current.picks.simple || (question.participle && !current.picks.participle)) return current;
      return { ...current, phase: "checking" };
    });
  }

  const slotChecking = game?.mode === "slot" && game.phase === "checking";
  useEffect(() => {
    if (!slotChecking) return;
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : SLOT_CHECK_MS;
    const timer = window.setTimeout(() => {
      setGame((current) => {
        if (current?.mode !== "slot" || current.phase !== "checking") return current;
        const question = current.round[current.index];
        const simple = current.picks.simple === question.simple;
        const participle = Boolean(question.participle) && current.picks.participle === question.participle;
        return {
          ...current, phase: "checked", score: current.score + Number(simple) + Number(participle),
          missed: simple && (participle || !question.participle) ? current.missed : [...current.missed, question],
        };
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [slotChecking]);

  function advanceSlot() {
    setGame((current) => current?.mode === "slot" && current.phase === "checked"
      ? { ...current, index: current.index + 1, phase: "selecting", picks: emptyPicks }
      : current);
  }

  const answered = classic !== null && classic.choice !== null;
  const canContinue = answered || slot?.phase === "checked";
  useEffect(() => {
    if (canContinue) next.current?.focus({ preventScroll: true });
  }, [canContinue]);

  const correctAnswer = classic && verb ? verb[classic.step] : "";
  const isCorrect = answered && classic.choice === correctAnswer;
  const isFirstOfTwo = classic?.step === "simple" && Boolean(verb?.participle);
  const slotVerb = slot?.round[slot.index];
  const totalQuestions = game?.round.reduce((sum, item) => sum + (item.participle ? 2 : 1), 0) ?? 0;

  return (
    <>
      <header className="site-header">
        <div className="site-width header-inner">
          <button className="brand" type="button" onClick={() => setShowList(false)} aria-label="Verb Quest, juego">
            <span className="brand-icon"><Zap size={22} fill="currentColor" strokeWidth={2.5} /></span>
            <span>Verb<span className="brand-accent">Quest</span></span>
          </button>
          <nav aria-label="Secciones">
            <button type="button" className={showList ? "nav-button" : "nav-button selected"} aria-current={showList ? undefined : "page"} onClick={() => setShowList(false)}><Gamepad2 size={17} /> Jugar</button>
            <button type="button" className={showList ? "nav-button selected" : "nav-button"} aria-current={showList ? "page" : undefined} onClick={() => setShowList(true)}><BookOpen size={17} /> <span>Lista de verbos</span></button>
          </nav>
        </div>
      </header>

      <main className="site-width">
        {screen === "list" ? (
          <section className="panel reference">
            <p className="eyebrow"><BookOpen size={16} /> GUÍA DE ESTUDIO</p>
            <h1 ref={heading} tabIndex={-1}>Los 82 verbos</h1>
            <p className="muted">Consulta las tres formas y la traducción de cada verbo.</p>
            <div className="table-scroll" tabIndex={0} role="region" aria-label="Tabla de los 82 verbos">
              <table>
                <thead><tr><th scope="col">Infinitivo</th><th scope="col">Past simple</th><th scope="col">Past participle</th><th scope="col">Traducción</th></tr></thead>
                <tbody>{verbs.map((item) => (
                  <tr key={item.base}><th scope="row" lang="en">{item.base}</th><td lang="en">{item.simple}</td><td lang="en">{item.participle || "—"}</td><td>{item.meaning}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        ) : (
          <div className="dashboard">
            <div className="main-column">
              {screen === "home" && (
                <>
                  <section className="hero">
                    <div className="hero-content">
                      <p className="hero-label"><Zap size={14} fill="currentColor" /> INGLÉS · 1.º DE ESO</p>
                      <h1 ref={heading} tabIndex={-1}>Domina los verbos <em>irregulares.</em></h1>
                      <p className="hero-copy">Elige las formas correctas en inglés y repasa los verbos que más te cuestan.</p>
                    </div>
                    {/* Decorative illustration. */}
                    <img className="hero-art" src={`${import.meta.env.BASE_URL}rocket.svg`} width={302} height={260} alt="" />
                  </section>
                  <section className="panel setup">
                    <p className="eyebrow"><Compass size={16} /> NUEVA PARTIDA</p>
                    <h2>Elige cómo jugar</h2>
                    <fieldset disabled={!ready}>
                      <legend className="sr-only">Modo de juego</legend>
                      <div className="game-modes">
                        <label className={mode === "classic" ? "mode-option active" : "mode-option"}>
                          <input type="radio" name="mode" checked={mode === "classic"} onChange={() => setMode("classic")} />
                          <Gamepad2 size={21} aria-hidden="true" />
                          <span><strong>Clásico</strong><small>Una forma cada vez</small></span>
                          <span className="radio-dot" aria-hidden="true" />
                        </label>
                        <label className={mode === "slot" ? "mode-option active" : "mode-option"}>
                          <input type="radio" name="mode" checked={mode === "slot"} onChange={() => setMode("slot")} />
                          <Sparkles size={21} aria-hidden="true" />
                          <span><strong>Slot Machine</strong><small>Las tres formas juntas</small></span>
                          <span className="radio-dot" aria-hidden="true" />
                        </label>
                      </div>
                    </fieldset>
                    <fieldset disabled={!ready}>
                      <legend className="size-legend">Verbos por ronda</legend>
                      <div className="round-sizes">
                        {sizes.map((count, index) => (
                          <label className={size === count ? "size-option active" : "size-option"} key={count}>
                            <input type="radio" name="size" checked={size === count} onChange={() => setSize(count)} />
                            <span className="size-main"><strong>{count}</strong><span className="radio-dot" aria-hidden="true" /></span>
                            <span className="size-label">{["Rápida", "Entrenamiento", "Lista completa"][index]}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button className="primary start-button" type="button" disabled={!ready} onClick={() => start()}><Play size={18} fill="currentColor" /> {ready ? "Empezar a jugar" : "Preparando el juego…"} <ArrowRight className="trailing-icon" size={19} /></button>
                  </section>
                </>
              )}

              {screen === "game" && game && verb && (
                <section className="panel question">
                  <div className="question-top">
                    <span className="eyebrow"><Flag size={16} /> VERBO {game.index + 1} DE {game.round.length}</span>
                    <span className="score"><Zap size={15} fill="currentColor" /> {game.score} {game.score === 1 ? "acierto" : "aciertos"}</span>
                  </div>
                  <progress className="progress" value={game.index + 1} max={game.round.length} aria-label="Progreso de la ronda" />
                  {slot && slotVerb && (
                    <SlotMachine key={slotVerb.base} verb={slotVerb} picks={slot.picks} phase={slot.phase}
                      last={slot.index + 1 === slot.round.length} heading={heading} next={next}
                      onPick={pickSlot} onCheck={checkSlot} onNext={advanceSlot} />
                  )}
                  {classic && <>
                    <div className="verb-card">
                      <p className="verb-label">INFINITIVO</p>
                      <h1 ref={heading} tabIndex={-1} lang="en">{verb.base}</h1>
                      <p>{verb.meaning}</p>
                    </div>
                    <div className="question-heading">
                      <h2>Elige el <span lang="en">{classic.step === "simple" ? "past simple" : "past participle"}</span></h2>
                      <span className="step">PASO {classic.step === "simple" ? 1 : 2} DE {verb.participle ? 2 : 1}</span>
                    </div>
                    <div className="answers">
                      {verb.options.map((option, index) => {
                        const state = !answered ? "" : option === correctAnswer ? " correct" : option === classic.choice ? " incorrect" : " neutral";
                        return (
                          <button key={option} className={`answer${state}`} type="button" disabled={Boolean(answered)} onClick={() => choose(option)}>
                            <span className="answer-letter" aria-hidden="true">{letters[index]}</span>
                            <span lang="en">{option}</span>
                            {state === " correct" && <Check size={20} className="answer-icon" aria-hidden="true" />}
                            {state === " incorrect" && <X size={20} className="answer-icon" aria-hidden="true" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="feedback-row">
                      <div role="status" className={isCorrect ? "feedback right" : "feedback"}>
                        {answered && (
                          <>
                            <p>{isCorrect ? "¡Correcto!" : <>La respuesta era <strong lang="en">{correctAnswer}</strong>.</>}</p>
                            {!verb.participle && <small>El verbo modal <span lang="en">can</span> no tiene participio.</small>}
                          </>
                        )}
                      </div>
                      {answered && <button className="primary" ref={next} type="button" onClick={advance}>
                        {isFirstOfTwo ? "Ir al participio" : game.index + 1 < game.round.length ? "Siguiente verbo" : "Ver resultado"}
                        <ArrowRight size={18} />
                      </button>}
                    </div>
                  </>}
                  <button className="back-to-setup" type="button" onClick={() => setGame(null)}><ArrowLeft size={15} /> Volver al menú</button>
                </section>
              )}

              {finished && game && (
                <section className="panel result">
                  <span className="result-icon"><Trophy size={29} /></span>
                  <p className="eyebrow">RESULTADO</p>
                  <h1 ref={heading} tabIndex={-1}>¡Ronda completada!</h1>
                  <p className="result-score"><strong>{game.score}</strong> / {totalQuestions} aciertos</p>
                  {game.missed.length ? (
                    <>
                      <h2>Para repasar</h2>
                      <ul className="missed-list">
                        {game.missed.map((item) => (
                          <li key={item.base}><strong lang="en">{item.base}</strong><span lang="en">{[item.simple, item.participle].filter(Boolean).join(" → ")}</span></li>
                        ))}
                      </ul>
                    </>
                  ) : <p>¡Has acertado todas las formas de la ronda!</p>}
                  <div className="result-actions">
                    {game.missed.length > 0 && <button className="primary" type="button" onClick={() => start(game.missed)}><RotateCcw size={17} /> Repetir los fallados</button>}
                    <button className={game.missed.length ? "secondary" : "primary"} type="button" onClick={() => setGame(null)}><ArrowLeft size={17} /> Elegir otra ronda</button>
                  </div>
                </section>
              )}
            </div>

            <aside className="sidebar">
              <section className="panel instructions">
                <span className="side-icon"><CircleHelp size={23} /></span>
                <h2>Cómo se juega</h2>
                {(game?.mode ?? mode) === "slot" ? <ol>
                  <li><span aria-hidden="true">1</span><div><strong>Lee el infinitivo</strong><p>El primer rodillo es fijo. Debajo tienes la traducción.</p></div></li>
                  <li><span aria-hidden="true">2</span><div><strong>Gira los otros dos</strong><p>Desliza el dedo o usa las flechas para elegir entre cuatro opciones en cada rodillo.</p></div></li>
                  <li><span aria-hidden="true">3</span><div><strong>Comprueba la combinación</strong><p>Al final verás las tres formas correctas juntas.</p></div></li>
                </ol> : <ol>
                  <li><span aria-hidden="true">1</span><div><strong>Lee el infinitivo</strong><p>La traducción aparece debajo, en pequeño.</p></div></li>
                  <li><span aria-hidden="true">2</span><div><strong>Elige el <i lang="en">past simple</i></strong><p>Escoge una de las cuatro opciones.</p></div></li>
                  <li><span aria-hidden="true">3</span><div><strong>Elige el <i lang="en">past participle</i></strong><p>Usa las mismas opciones. A veces coinciden.</p></div></li>
                </ol>}
              </section>

              <section className="guide-card">
                <div className="guide-title"><Target size={19} /><h2>¿Necesitas repasar?</h2></div>
                <p>Consulta la lista del cole con los 82 verbos y sus traducciones.</p>
                <button type="button" onClick={() => setShowList(true)}>Ver lista de verbos <ArrowRight size={16} /></button>
              </section>
            </aside>
          </div>
        )}

        <footer><Layers3 size={16} /> 82 verbos irregulares <span aria-hidden="true">·</span> Inglés de 1.º de ESO</footer>
      </main>
    </>
  );
}
