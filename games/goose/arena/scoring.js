import { CONFIG as C } from './config.js';
export function clearPoints(count, level, combo, backToBack) {
  const base = C.scoring.lines[count] || 0;
  if(count<4)return base+Math.min(4,Math.max(0,combo-1))*C.scoring.smallCombo;
  return Math.round(base * level * (backToBack ? C.scoring.backToBackMultiplier : 1) + Math.max(0, combo - 1) * C.scoring.combo * level);
}
export function levelFor(lines) { return 1 + Math.floor(lines / C.gameplay.linesPerLevel); }
export function pressureLevel(level,elapsed,pieces){return Math.max(level,Math.min(C.gameplay.primaryLevels,1+Math.floor(elapsed/C.gameplay.pressureEveryMs)),Math.min(C.gameplay.primaryLevels,1+Math.floor(pieces/C.gameplay.pressureEveryPieces)));}
export function speedFor(level) {
  const g=C.gameplay;
  if (g.levelSpeeds[level-1] != null) return Math.max(16,g.levelSpeeds[level-1]);
  if(level>g.primaryLevels) return Math.max(g.enduranceMinimumSpeed,Math.max(g.minimumSpeed,g.startingSpeed*g.speedDecay**(g.primaryLevels-1))*g.enduranceDecay**(level-g.primaryLevels));
  return Math.max(g.minimumSpeed,g.startingSpeed*g.speedDecay**(level-1));
}

export function isImpressiveClear(event){return event.count>0&&event.count<4&&event.points>=C.effects.impressivePointsThreshold;}
