// One shared, mutable state object (modules mutate properties, never reassign).
export const state = {
  S: null, A: null, lang: 'en', muted: false, cur: null, timers: [],
  mode: '', startDone: false, welcomed: false, recalled: false,
  seen: new Set(),                       // 'labels:<joint>' / 'activity:<joint>' -> what the student has explored (gates Next)
  quiz: null,                            // { i, score, attempts } -> quiz progress survives Previous / language switch
  redo: null, langSwitch: false, tourDone: false, score: 0, summaryOff: null
};

// Timer management
export const later = (fn, ms) => state.timers.push(setTimeout(fn, ms));
export const clearTimers = () => { state.timers.forEach(clearTimeout); state.timers = []; };

export const setMode = (mode) => { state.mode = mode; };
export const setRedo = (redoFn) => { state.redo = redoFn; };
export const setScore = (score) => { state.score = score; };
export const setSummaryOff = (cleanupFn) => { state.summaryOff = cleanupFn; };
