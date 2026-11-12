/* ================= xAPI event layer (XAPI_EVENTS.md) =========================
   Copied from the FLN math games (MT01A01_L05_S02 app.js, "xAPI event layer") - same 7 verbs, same statement shape, same
   context fields, sent through the same platform bridge (bare SwiftPAL.sendEvent, declared inline in index.html).
   The only adaptation: the math engine reads the current slide from CARD.slides[state.idx]; this game has no slide deck,
   so the router reports its current screen with setSlide({ id, type, phase, index }).
     activity_launched  "Let's start"                     screen_viewed     tour, Try it!, Labels, Activity, score, summary
     question_started   Try it! challenge, predict, Sort it item, quiz question
     question_answered  every answer (attempt, is_correct, score 1 only when right on the first attempt)
     activity_completed the "What you learned" end screen (score = first-try ratio over all answered questions)
     hint_used / audio_replayed exist for parity; this game has no hint bulb or replay chip. */

// Lesson codes for this game. TODO: replace with the official codes from the content team (one place).
export const CARD = { skill_code: 'SC06_L08_TYPES_OF_JOINTS', lo_code: 'SC06_L08', part_label: '' };
const DEV_MODE = new URLSearchParams(window.location.search).get('dev') === '1';

let current = null;                     // { id, type, phase, index } - set by the router on every screen
export const setSlide = s => { current = s; };

export const XAPI = (function(){
  const t0 = Date.now();
  const qs = new URLSearchParams(window.location.search);
  let answered = 0, firstTry = 0;
  function fmt(type){ type = String(type || "");
    return /DRAG|MATCH/.test(type) ? "drag" : /BUILD/.test(type) ? "build"
         : /COUNT/.test(type) ? "tap_count" : "mcq"; }
  function ctx(){
    const s = current;
    return {
      skill_code: CARD.skill_code,
      lo_code: CARD.lo_code || String(CARD.skill_code || "").split("_S")[0],
      medium: qs.get("medium") || "hi",
      session_ms: Date.now() - t0,
      question_id: s ? s.id : null,
      question_index: s ? (s.index ?? null) : null,
      template: s ? s.type : null,
      question_format: s ? fmt(s.type) : "mcq",
      phase: s ? s.phase : null,
      context_id: qs.get("context_id") || null,
      journey_id: qs.get("journey_id") || null
    };
  }
  function send(verb, object, result){
    const statement = { verb: verb, object: object || null, result: result || null, context: ctx() };
    try{
      /* transport: hand off to the embedded xAPI event bridge in index.html - it is
         this module's single outbound sender. The original path stays as a safety net. */
      SwiftPAL.sendEvent(statement);
    }catch(e){ /* analytics must never break the lesson */ }
    try{ if (DEV_MODE) XAPI.log.push(statement); }catch(e){}
    return statement;
  }
  return {
    log: [],
    launched(){ send("activity_launched", { type: "activity", id: CARD.skill_code }); },
    screen(id){ send("screen_viewed", { type: "screen", id: id }); },
    question(id){ send("question_started", { type: "question", id: id }); },
    answered(obj, isCorrect, attempt){
      answered += 1; if (isCorrect && attempt === 1) firstTry += 1;
      send("question_answered", obj,
           { score: (isCorrect && attempt === 1) ? 1 : 0, attempt: attempt, is_correct: !!isCorrect });
    },
    hint(){ send("hint_used", { type: "hint", id: "bulb" }); },
    replay(chip){ send("audio_replayed", { type: "audio", id: chip || "chip" }); },
    completed(){
      send("activity_completed", { type: "activity", id: CARD.skill_code },
           { completed: true, progress: 100,
             score: answered ? Math.round((firstTry / answered) * 100) / 100 : 0,
             duration_ms: Date.now() - t0 });
    }
  };
})();
try { if (DEV_MODE) window.XAPI = XAPI; } catch (e) {}   // ?dev=1: inspect XAPI.log in the console

// helpers for the screens: the same "tap" object shape the math adapter builds
export const tapObj = (id, text, uiIndex, originalIndex) => ({ type: 'text', id, text: text ?? null, mediaUrl: null, ui_index: uiIndex ?? null, original_index: originalIndex ?? null });
export const screen = (id, type, phase, index) => { setSlide({ id, type, phase, index }); XAPI.screen(id); };
export const question = (id, type, phase, index) => { setSlide({ id, type, phase, index }); XAPI.question(id); };
