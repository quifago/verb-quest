"use client";

import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { ArrowRight, Check, ChevronDown, ChevronUp, Lock, Sparkles, X } from "lucide-react";
import { playSlotFeedback } from "./slot-feedback";
import type { makeRound } from "./verbs";

export type SlotField = "simple" | "participle";
export type SlotPicks = Record<SlotField, string | null>;
export type SlotPhase = "selecting" | "checking" | "checked";
export type SlotQuestion = ReturnType<typeof makeRound>[number] & { participleOptions: string[] };

type ReelProps = {
  label: string;
  options: string[];
  picked: string | null;
  answer: string;
  phase: SlotPhase;
  onChange: (value: string) => void;
};

function Reel({ label, options, picked, answer, phase, onChange }: ReelProps) {
  const [offset, setOffset] = useState(0);
  const drag = useRef<{ pointer: number; y: number } | null>(null);
  const enabled = phase === "selecting";
  const marked = phase === "checked";
  const result = marked ? picked === answer ? "match" : "miss" : "";
  const current = marked ? answer : picked;
  const index = options.indexOf(current ?? "");
  const at = (position: number) => options[(position + options.length) % options.length];
  const before = at(index < 0 ? -1 : index - 1);
  const after = at(index < 0 ? 0 : index + 1);

  function move(direction: -1 | 1) {
    if (!enabled) return;
    onChange(direction === -1 ? before : after);
    playSlotFeedback("tick");
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!enabled || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointer: event.pointerId, y: event.clientY };
  }

  function dragReel(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    setOffset(Math.max(-42, Math.min(42, event.clientY - drag.current.y)));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    const delta = event.clientY - drag.current.y;
    drag.current = null;
    setOffset(0);
    if (event.type === "pointerup" && Math.abs(delta) >= 14) move(delta < 0 ? 1 : -1);
  }

  return (
    <div className={`slot-reel ${result}`}>
      <p className="slot-label" lang="en">{label}</p>
      <button className="reel-arrow" type="button" aria-label={`Opción anterior de ${label}`} disabled={!enabled} onClick={() => move(-1)}><ChevronUp size={19} /></button>
      <div
        className="reel-window"
        role="spinbutton"
        tabIndex={enabled ? 0 : -1}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={options.length}
        aria-valuenow={index + 1}
        aria-valuetext={current ?? "Elige una opción"}
        aria-disabled={!enabled}
        onPointerDown={startDrag}
        onPointerMove={dragReel}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onKeyDown={(event) => {
          if (!enabled) return;
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            move(event.key === "ArrowUp" ? -1 : 1);
          }
        }}
      >
        <div className="reel-track" style={{ "--reel-offset": `${offset}px` } as CSSProperties} aria-hidden="true">
          <div className="reel-row reel-neighbour" lang="en">{before}</div>
          <div className={current ? "reel-row reel-value" : "reel-row reel-value placeholder"} lang={current ? "en" : undefined} key={current ?? "empty"}>{current ?? "Elige"}</div>
          <div className="reel-row reel-neighbour" lang="en">{after}</div>
        </div>
      </div>
      <button className="reel-arrow" type="button" aria-label={`Opción siguiente de ${label}`} disabled={!enabled} onClick={() => move(1)}><ChevronDown size={19} /></button>
      {marked && (
        <p className="reel-mark">
          {result === "match" ? <><Check size={15} /> Correcto</> : <><X size={15} /> Elegiste <span lang="en">{picked}</span></>}
        </p>
      )}
    </div>
  );
}

type SlotMachineProps = {
  verb: SlotQuestion;
  picks: SlotPicks;
  phase: SlotPhase;
  last: boolean;
  heading: React.Ref<HTMLHeadingElement>;
  next: React.Ref<HTMLButtonElement>;
  onPick: (field: SlotField, value: string) => void;
  onCheck: () => void;
  onNext: () => void;
};

export function SlotMachine({ verb, picks, phase, last, heading, next, onPick, onCheck, onNext }: SlotMachineProps) {
  const hasParticiple = Boolean(verb.participle);
  const checked = phase === "checked";
  const ready = Boolean(picks.simple && (!hasParticiple || picks.participle));
  const correct = picks.simple === verb.simple && (!hasParticiple || picks.participle === verb.participle);

  function check() {
    if (!ready || phase !== "selecting") return;
    onCheck();
    playSlotFeedback(correct ? "match" : "miss");
  }

  return (
    <>
      <div className={`slot-machine ${phase}${checked && correct ? " jackpot" : ""}`}>
        <div className="slot-marquee">
          <Sparkles aria-hidden="true" size={16} />
          <h1 ref={heading} tabIndex={-1}>Slot Machine</h1>
          <Sparkles aria-hidden="true" size={16} />
        </div>
        <div className="slot-reels">
          <div className="slot-reel fixed">
            <p className="slot-label">Infinitivo</p>
            <div className="reel-arrow fixed-icon"><Lock size={14} aria-hidden="true" /></div>
            <div className="reel-window fixed-window"><span className="reel-row reel-value" lang="en">{verb.base}</span></div>
            <p className="slot-translation">{verb.meaning}</p>
          </div>
          <Reel label="Past simple" options={verb.options} picked={picks.simple} answer={verb.simple} phase={phase} onChange={(value) => onPick("simple", value)} />
          {hasParticiple ? (
            <Reel label="Past participle" options={verb.participleOptions} picked={picks.participle} answer={verb.participle} phase={phase} onChange={(value) => onPick("participle", value)} />
          ) : (
            <div className="slot-reel fixed">
              <p className="slot-label" lang="en">Past participle</p>
              <div className="reel-arrow fixed-icon"><Lock size={14} aria-hidden="true" /></div>
              <div className="reel-window fixed-window missing"><span aria-hidden="true">—</span><small>Sin participio</small></div>
              <div className="reel-arrow fixed-icon" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="slot-lights" aria-hidden="true"><span /><span /><span /><span /><span /><span /><span /></div>
      </div>
      <div className="slot-actions">
        <p className={`slot-feedback${checked && correct ? " win" : ""}`} role="status">
          {checked ? correct ? "¡Has acertado todas las formas!" : "Ya puedes ver las formas correctas juntas."
            : phase === "checking" ? "Comprobando…"
            : "Desliza los rodillos hacia arriba o abajo, o usa las flechas."}
        </p>
        {checked ? (
          <button className="primary" ref={next} type="button" onClick={onNext}>{last ? "Ver resultado" : "Siguiente verbo"} <ArrowRight size={18} /></button>
        ) : (
          <button className="primary" type="button" disabled={!ready || phase === "checking"} onClick={check}><Sparkles size={18} /> Comprobar</button>
        )}
      </div>
    </>
  );
}
