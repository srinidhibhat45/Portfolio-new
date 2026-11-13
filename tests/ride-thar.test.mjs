import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, autopilot, SEG, PLAYER_W, THAR_LINE } from '../js/ride/sim.js';
import { THAR_PLATE } from '../js/ride/sprites.js';

function ride(safety) {
  const g = createGame();
  g.phase = 'ride';
  const seen = { horns: 0, says: [], chaserRuns: 0, passedYou: 0, rammed: 0 };
  let active = false, behind = false;
  for (let n = 0; !g.finish && n < 60 * 400; n++) {
    step(g, autopilot(g, safety));
    for (const e of g.events.splice(0)) {
      if (e.type === 'tharHorn') seen.horns++;
      if (e.type === 'tharSay') seen.says.push(g.t);
    }
    const c = g.chaser, dz = c.z - g.player.z;
    if (c.active && !active) { seen.chaserRuns++; behind = false; }
    if (c.active && dz < -SEG) behind = true;
    if (c.active && behind && dz > SEG) { seen.passedYou++; behind = false; }
    active = c.active;
    // A Thar coming up behind never drives into the rider.
    for (const t of g.cars) if (t.thar && t.active && t.z < g.player.z && g.player.z - t.z < SEG * 0.6 && Math.abs(t.offset - g.player.x) < (t.w + PLAYER_W) / 2 - 0.02) seen.rammed++;
  }
  return { g, seen };
}

test('Thars are on every stage of the road, and every one wears the same plate', () => {
  const g = createGame();
  const stages = new Set(g.cars.filter(c => c.thar && !c.chaser).map(c => g.route.segs[Math.floor(c.z / SEG)].stage));
  assert.deepEqual([...stages].sort(), [0, 1, 2]);
  assert.equal(THAR_PLATE, 'FRCS');
  assert.deepEqual(THAR_LINE, ["FRANCIS'", 'WORST NIGHTMARE']);
});

test('a Thar comes up from behind on the horn, gets past, and has its say now and then', () => {
  for (const safety of [1, 0.93, 0.85]) {
    const { g, seen } = ride(safety);
    assert.ok(g.finish, `the ride finished at safety ${safety}`);
    assert.equal(g.spills, 0, 'no Thar knocks the rider off');
    assert.ok(seen.chaserRuns >= 2, `a Thar came from behind ${seen.chaserRuns} times`);
    assert.ok(seen.passedYou >= 1, 'and got past');
    assert.ok(seen.horns >= 5, `${seen.horns} honks`);
    assert.equal(seen.rammed, 0, 'never drove into the rider from behind');
    assert.ok(seen.says.length >= 1 && seen.says.length <= 4, `said it ${seen.says.length} times`);
    for (let k = 1; k < seen.says.length; k++) assert.ok(seen.says[k] - seen.says[k - 1] >= 40, 'never twice in quick succession');
  }
});

test('the rest of the traffic is laid out exactly as before the Thars arrived', () => {
  const g = createGame();
  // The first six vehicles as the pre-Thar game laid them out (the Thars draw from their own random stream).
  const others = g.cars.filter(c => !c.thar && !c.rider).slice(0, 6).map(c => [c.kind, Math.round(c.z), +c.offset.toFixed(3)]);
  assert.deepEqual(others, [['bus', 34100, -0.493], ['scooter', 60900, -0.655], ['auto', 91500, -0.637], ['bus', 108500, -0.492], ['car', 131500, -0.467], ['auto', 150700, -0.614]]);
});
