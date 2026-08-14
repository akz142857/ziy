import { describe, expect, test } from 'bun:test';
import {
  createSceneRuntime,
  createSeededRandom,
  enterPetWander,
  getActorScreenX,
  tryStartFireAbility,
  tryStartInteraction,
  updateCamera,
  updateSceneRuntime,
} from './simulation';

describe('walker scene simulation', () => {
  test('replays the same event sequence with the same seed and deltas', () => {
    const randomA = createSeededRandom(142857);
    const randomB = createSeededRandom(142857);
    const sceneA = createSceneRuntime(900, 1200, randomA);
    const sceneB = createSceneRuntime(900, 1200, randomB);

    for (let frame = 0; frame < 2_400; frame += 1) {
      updateSceneRuntime(sceneA, 1 / 60, 900, randomA);
      updateSceneRuntime(sceneB, 1 / 60, 900, randomB);
    }

    expect(sceneA).toEqual(sceneB);
  });

  test('keeps a paused pet fixed to its world position while the camera moves', () => {
    const random = createSeededRandom(7);
    const scene = createSceneRuntime(900, 800, random);
    const initialPetWorldX = scene.pet.worldX;
    const initialPetScreenX = getActorScreenX(scene.pet, scene.cameraWorldX);
    scene.pet.state = 'pause';
    scene.pet.stateUntil = 999;
    scene.walker.worldX += 420;

    for (let frame = 0; frame < 180; frame += 1) {
      updateCamera(scene, 1 / 60, 900);
    }

    expect(scene.pet.worldX).toBe(initialPetWorldX);
    expect(getActorScreenX(scene.pet, scene.cameraWorldX)).not.toBe(initialPetScreenX);
  });

  test('keeps an off-terrain pet frozen and out of camera framing', () => {
    const random = createSeededRandom(11);
    const scene = createSceneRuntime(800, 0, random);
    scene.walker.worldX = 900;
    scene.walker.worldVelocity = 18;
    scene.walker.targetSpeed = 18;
    scene.walker.nextDecisionAt = 999;
    scene.pet.worldX = -10_000;
    scene.pet.worldVelocity = 12;
    scene.pet.targetSpeed = 16;
    scene.pet.state = 'wander';
    const petWorldX = scene.pet.worldX;
    const petGait = scene.pet.gait;
    const petNeeds = { ...scene.pet.needs };

    for (let frame = 0; frame < 60; frame += 1) {
      updateSceneRuntime(scene, 1 / 60, 800, random, { petOnTerrain: false });
    }

    expect(scene.pet.worldX).toBe(petWorldX);
    expect(scene.pet.gait).toBe(petGait);
    expect(scene.pet.needs).toEqual(petNeeds);
    expect(scene.walker.worldX).toBeGreaterThan(900);
    expect(scene.cameraWorldX).toBeGreaterThan(100);
    expect(scene.interaction).toBeUndefined();
    expect(scene.fireAbility).toBeUndefined();
  });

  test('does not flip a turning pet until it has nearly stopped', () => {
    const random = createSeededRandom(19);
    const scene = createSceneRuntime(900, 0, random);
    scene.walker.nextDecisionAt = 999;
    scene.pet.state = 'turn';
    scene.pet.facing = 1;
    scene.pet.pendingFacing = -1;
    scene.pet.worldVelocity = 9;
    scene.pet.targetSpeed = 0;
    scene.pet.resumeSpeed = 12;
    scene.pet.targetWorldX = scene.pet.worldX - 80;

    updateSceneRuntime(scene, 0.01, 900, random);
    expect(scene.pet.facing).toBe(1);

    for (let frame = 0; frame < 300 && scene.pet.facing === 1; frame += 1) {
      updateSceneRuntime(scene, 0.01, 900, random);
    }

    expect(scene.pet.facing).toBe(-1);
    expect(scene.pet.state).toBe('wander');
  });

  test('generates an inward target near the left scene boundary', () => {
    const random = createSeededRandom(31);
    const scene = createSceneRuntime(800, 0, random);
    scene.pet.worldX = 24;
    scene.pet.facing = 1;

    enterPetWander(scene, 800, random);

    expect(scene.pet.targetWorldX).toBeGreaterThan(scene.pet.worldX);
  });

  test('frames both actors inside their camera safety zones', () => {
    const random = createSeededRandom(43);
    const scene = createSceneRuntime(800, 0, random);
    scene.walker.worldX = 620;
    scene.pet.worldX = 260;

    for (let frame = 0; frame < 240; frame += 1) {
      updateCamera(scene, 1 / 60, 800);
    }

    const walkerScreenX = getActorScreenX(scene.walker, scene.cameraWorldX);
    const petScreenX = getActorScreenX(scene.pet, scene.cameraWorldX);
    expect(walkerScreenX).toBeGreaterThanOrEqual(800 * 0.2 - 0.1);
    expect(walkerScreenX).toBeLessThanOrEqual(800 * 0.8 + 0.1);
    expect(petScreenX).toBeGreaterThanOrEqual(38 - 0.1);
    expect(petScreenX).toBeLessThanOrEqual(800 - 38 + 0.1);
  });

  test('brakes an outward-moving walker until framing distance recovers', () => {
    const random = createSeededRandom(47);
    const scene = createSceneRuntime(800, 0, random);
    scene.walker.worldX = 700;
    scene.walker.worldVelocity = 32;
    scene.walker.targetSpeed = 32;
    scene.pet.worldX = 180;
    scene.pet.state = 'pause';

    updateSceneRuntime(scene, 1 / 60, 800, random);

    expect(scene.framingRecovery).toBe(true);
    expect(scene.walker.targetSpeed).toBe(0);
    expect(scene.walker.pendingFacing).toBe(-1);
    expect(scene.pet.state).toBe('pause');

    scene.pet.worldX = scene.walker.worldX - 800 * 0.4;
    updateSceneRuntime(scene, 1 / 60, 800, random);
    expect(scene.framingRecovery).toBe(false);
  });

  test('clamps a resumed frame instead of advancing hidden time', () => {
    const random = createSeededRandom(59);
    const scene = createSceneRuntime(900, 0, random);

    updateSceneRuntime(scene, 30, 900, random);

    expect(scene.sceneTime).toBeCloseTo(0.04, 8);
  });

  test('advances pet gait independently from walker gait', () => {
    const random = createSeededRandom(71);
    const scene = createSceneRuntime(900, 0, random);
    const initialPetGait = scene.pet.gait;
    const initialWalkerGait = scene.walker.gait;
    scene.pet.state = 'pause';
    scene.pet.stateUntil = 999;
    scene.walker.nextDecisionAt = 999;

    updateSceneRuntime(scene, 1 / 30, 900, random);

    expect(scene.pet.gait).toBe(initialPetGait);
    expect(scene.walker.gait).toBeGreaterThan(initialWalkerGait);
  });

  test('stays within the Phase 1 motion budget over two simulated minutes', () => {
    const random = createSeededRandom(142857);
    const width = 1_265;
    const scene = createSceneRuntime(width, 1_000, random);
    const framesByState = { pause: 0, turn: 0, wander: 0, observe: 0 };
    let minPetX = Number.POSITIVE_INFINITY;
    let maxPetX = Number.NEGATIVE_INFINITY;
    let minWalkerX = Number.POSITIVE_INFINITY;
    let maxWalkerX = Number.NEGATIVE_INFINITY;

    for (let frame = 0; frame < 120 * 60; frame += 1) {
      updateSceneRuntime(scene, 1 / 60, width, random);
      framesByState[scene.pet.state] += 1;
      const petX = getActorScreenX(scene.pet, scene.cameraWorldX);
      const walkerX = getActorScreenX(scene.walker, scene.cameraWorldX);
      minPetX = Math.min(minPetX, petX);
      maxPetX = Math.max(maxPetX, petX);
      minWalkerX = Math.min(minWalkerX, walkerX);
      maxWalkerX = Math.max(maxWalkerX, walkerX);
    }

    const frameCount = 120 * 60;
    const stillFrames = framesByState.pause + framesByState.observe;
    expect(stillFrames / frameCount).toBeGreaterThanOrEqual(0.55);
    expect(framesByState.wander / frameCount).toBeLessThanOrEqual(0.4);
    expect(framesByState.turn / frameCount).toBeLessThanOrEqual(0.05);
    expect(minPetX).toBeGreaterThanOrEqual(30);
    expect(maxPetX).toBeLessThanOrEqual(width - 30);
    expect(minWalkerX).toBeGreaterThanOrEqual(width * 0.2);
    expect(maxWalkerX).toBeLessThanOrEqual(width * 0.8);
  });

  test('runs greet through all four phases and releases both controllers', () => {
    const random = () => 0.1;
    const width = 800;
    const scene = createSceneRuntime(width, 0, random);
    scene.sceneTime = 10;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 365;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.pet.stateUntil = 999;
    scene.walker.worldX = 400;
    scene.walker.worldVelocity = 0;
    scene.walker.targetSpeed = 0;
    scene.walker.nextDecisionAt = 999;
    const phases: string[] = [];

    updateSceneRuntime(scene, 0.01, width, random);
    expect(scene.interaction?.phase).toBe('approach');
    const startedAt = scene.interaction?.startedAt ?? scene.sceneTime;

    for (let frame = 0; frame < 200 && scene.interaction; frame += 1) {
      const phase = scene.interaction.phase;
      if (phases.at(-1) !== phase) {
        phases.push(phase);
      }
      updateSceneRuntime(scene, 0.01, width, random);
    }

    expect(phases).toEqual(['approach', 'signal', 'hold', 'release']);
    expect(scene.interaction).toBeUndefined();
    expect(scene.sceneTime - startedAt).toBeLessThanOrEqual(1.35);
    expect(scene.quietWindowUntil).toBeGreaterThan(scene.sceneTime);
    expect(scene.walker.nextDecisionAt).toBe(scene.quietWindowUntil);
    expect(scene.pet.state).toBe('pause');
  });

  test('evaluates an encounter only once until actors leave the hysteresis radius', () => {
    const sceneRandom = createSeededRandom(83);
    const scene = createSceneRuntime(800, 0, sceneRandom);
    scene.cameraWorldX = 0;
    scene.pet.worldX = 365;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.walker.worldX = 400;
    const rejectInteraction = () => 0.99;

    expect(tryStartInteraction(scene, 800, rejectInteraction)).toBe(false);
    expect(scene.encounterArmed).toBe(false);
    expect(tryStartInteraction(scene, 800, () => 0)).toBe(false);

    scene.pet.worldX = 330;
    expect(tryStartInteraction(scene, 800, () => 0)).toBe(false);
    expect(scene.encounterArmed).toBe(true);
  });

  test('respects the environment gate before starting greet', () => {
    const sceneRandom = createSeededRandom(97);
    const scene = createSceneRuntime(800, 0, sceneRandom);
    scene.cameraWorldX = 0;
    scene.pet.worldX = 365;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.walker.worldX = 400;

    expect(
      tryStartInteraction(scene, 800, () => 0, { interactionAllowed: false }),
    ).toBe(false);
    expect(scene.interaction).toBeUndefined();
  });

  test('rests without changing body shape and uses a readable curiosity pose', () => {
    const random = () => 0;
    const scene = createSceneRuntime(800, 0, random);
    scene.walker.worldX = 700;
    scene.walker.nextDecisionAt = 999;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.state = 'pause';
    scene.pet.stateUntil = 0;
    scene.pet.needs.fatigue = 0.8;

    updateSceneRuntime(scene, 0.01, 800, random);
    expect(scene.pet.state).toBe('pause');
    expect(scene.pet.pose).toBe('standing');
    expect(scene.pet.needs.fatigue).toBeLessThan(0.8);
    expect(scene.pet.stateUntil - scene.sceneTime).toBeGreaterThanOrEqual(4.49);

    scene.pet.state = 'pause';
    scene.pet.stateUntil = scene.sceneTime;
    scene.pet.pose = 'standing';
    scene.pet.previousPose = 'standing';
    scene.pet.poseTransitionUntil = scene.sceneTime;
    scene.pet.needs.fatigue = 0;
    scene.pet.needs.curiosity = 0.8;
    updateSceneRuntime(scene, 0.01, 800, random);
    expect(scene.pet.state).toBe('observe');
    expect(scene.pet.pose).toBe('observing');
  });

  test('keeps needs bounded during a long deterministic simulation', () => {
    const random = createSeededRandom(131);
    const scene = createSceneRuntime(900, 0, random);

    for (let frame = 0; frame < 20 * 60 * 60; frame += 1) {
      updateSceneRuntime(scene, 1 / 60, 900, random);
    }

    for (const need of Object.values(scene.pet.needs)) {
      expect(need).toBeGreaterThanOrEqual(0);
      expect(need).toBeLessThanOrEqual(1);
    }
  });

  test('runs fire through four phases with a world-space impact and cooldown', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.cameraWorldX = 0;
    scene.nextFireAt = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.pet.pose = 'standing';
    scene.pet.stateUntil = 999;
    scene.walker.worldX = 700;
    scene.walker.worldVelocity = 0;
    scene.walker.targetSpeed = 0;
    scene.walker.nextDecisionAt = 999;
    const checkedImpactWorldXs: number[] = [];

    expect(tryStartFireAbility(scene, 800, random, {
      fireTargetAllowed: (worldX) => {
        checkedImpactWorldXs.push(worldX);
        return true;
      },
    })).toBe(true);
    expect(checkedImpactWorldXs).toContain(scene.fireAbility?.impactWorldX);
    expect(scene.fireAbility?.impactWorldX).toBeGreaterThan(scene.pet.worldX);

    const startedAt = scene.fireAbility?.startedAt ?? scene.sceneTime;
    const phases: string[] = [];
    for (let frame = 0; frame < 250 && scene.fireAbility; frame += 1) {
      const phase = scene.fireAbility.phase;
      if (phases.at(-1) !== phase) phases.push(phase);
      updateSceneRuntime(scene, 0.01, 800, random);
    }

    expect(phases).toEqual(['prepare', 'emit', 'impact', 'recover']);
    expect(scene.fireAbility).toBeUndefined();
    expect(scene.sceneTime - startedAt).toBeLessThanOrEqual(1.75);
    expect(scene.nextFireAt).toBeGreaterThanOrEqual(scene.sceneTime + 180);
    expect(scene.nextFireAt).toBeLessThanOrEqual(scene.sceneTime + 300);
    expect(scene.quietWindowUntil).toBeGreaterThan(scene.sceneTime);
  });

  test('selects the other side when the walker crosses the projected flame path', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.nextFireAt = 0;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.pet.pose = 'standing';
    scene.walker.worldX = 340;
    scene.walker.worldVelocity = 0;

    expect(tryStartFireAbility(scene, 800, random)).toBe(true);
    expect(scene.pet.facing).toBe(-1);
    expect(scene.fireAbility?.impactWorldX).toBeLessThan(scene.pet.worldX);
  });

  test('delays fire when neither terrain target is safe', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.nextFireAt = 0;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.state = 'pause';
    scene.pet.pose = 'standing';
    scene.walker.worldX = 700;

    expect(tryStartFireAbility(scene, 800, random, {
      fireTargetAllowed: () => false,
    })).toBe(false);
    expect(scene.fireAbility).toBeUndefined();
    expect(scene.nextFireAt).toBeGreaterThan(scene.sceneTime);
  });

  test('keeps one standing body with the shared head and both red eyes', async () => {
    const source = await Bun.file(
      new URL('../../components/WanderingWalker.astro', import.meta.url),
    ).text();
    const headIndex = source.indexOf('<g data-pet-head>');

    expect(headIndex).toBeGreaterThan(source.indexOf('data-pet-body-standing'));
    expect(source).not.toContain('data-pet-body-sitting');
    expect(source).not.toContain('data-pet-body-lying');
    const headMarkup = source.slice(headIndex, source.indexOf('</g>', headIndex + 1) + 4);
    expect((headMarkup.match(/<path/g) ?? []).length).toBe(3);
  });

  test('keeps greet in approach until both actors have actually stopped', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 10;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 365;
    scene.pet.worldVelocity = 3;
    scene.pet.facing = 1;
    scene.pet.state = 'wander';
    scene.pet.pose = 'standing';
    scene.walker.worldX = 400;
    scene.walker.worldVelocity = 4;

    expect(tryStartInteraction(scene, 800, random)).toBe(true);
    for (let frame = 0; frame < 100 && scene.interaction?.phase === 'approach'; frame += 1) {
      updateSceneRuntime(scene, 0.01, 800, random);
    }
    expect(scene.interaction?.phase).toBe('signal');
    expect(Math.abs(scene.pet.worldVelocity)).toBeLessThan(0.75);
    expect(Math.abs(scene.walker.worldVelocity)).toBeLessThan(0.75);
  });

  test('does not overlap a pose transition with fire', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.nextFireAt = 0;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'observe';
    scene.pet.pose = 'observing';
    scene.pet.previousPose = 'standing';
    scene.pet.poseTransitionUntil = 0;
    scene.pet.stateUntil = scene.sceneTime;
    scene.walker.worldX = 700;
    scene.walker.worldVelocity = 0;
    scene.walker.targetSpeed = 0;
    scene.walker.nextDecisionAt = 999;

    updateSceneRuntime(scene, 0.01, 800, random);

    expect(scene.pet.pose).toBe('standing');
    expect(scene.pet.poseTransitionUntil).toBeGreaterThan(scene.sceneTime);
    expect(scene.fireAbility).toBeUndefined();
  });

  test('does not enter a pose state while framing recovery is active', () => {
    const random = () => 0;
    const scene = createSceneRuntime(800, 0, random);
    scene.pet.worldX = 100;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.state = 'pause';
    scene.pet.stateUntil = 0;
    scene.pet.needs.fatigue = 1;
    scene.walker.worldX = 600;
    scene.walker.worldVelocity = 30;
    scene.walker.targetSpeed = 30;

    updateSceneRuntime(scene, 0.01, 800, random);

    expect(scene.framingRecovery).toBe(true);
    expect(scene.pet.state).toBe('pause');
    expect(scene.pet.pose).toBe('standing');
  });

  test('brakes an accelerating walker for the whole fire ability', () => {
    const random = () => 0.1;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.nextFireAt = 0;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.pet.pose = 'standing';
    scene.walker.worldX = 390;
    scene.walker.worldVelocity = 0;
    scene.walker.targetSpeed = -52;
    scene.walker.nextDecisionAt = 999;

    expect(tryStartFireAbility(scene, 800, random)).toBe(true);
    const impactWorldX = scene.fireAbility?.impactWorldX ?? 0;
    expect(scene.walker.targetSpeed).toBe(0);
    while (scene.fireAbility) {
      updateSceneRuntime(scene, 0.04, 800, random);
    }

    expect(scene.walker.worldX).toBeGreaterThan(impactWorldX + 12);
  });

  test('keeps a mobile fire impact inside the camera safety margin', () => {
    const random = () => 0.1;
    const width = 375;
    const scene = createSceneRuntime(width, 0, random);
    scene.pet.worldX = 70;
    scene.walker.worldX = 300;
    scene.fireAbility = {
      kind: 'breatheFire',
      phase: 'emit',
      phaseStartedAt: 0,
      phaseUntil: 10,
      startedAt: 0,
      impactWorldX: 24.13,
    };

    for (let frame = 0; frame < 180; frame += 1) {
      updateCamera(scene, 1 / 60, width);
      const impactScreenX = scene.fireAbility.impactWorldX - scene.cameraWorldX;
      expect(impactScreenX).toBeGreaterThanOrEqual(24 - 0.1);
      expect(impactScreenX).toBeLessThanOrEqual(width - 24 + 0.1);
    }
  });

  test('keeps maximum fire timing within 1.75 seconds at 40ms frames', () => {
    const random = () => 0.999;
    const scene = createSceneRuntime(800, 0, random);
    scene.sceneTime = 100;
    scene.nextFireAt = 0;
    scene.cameraWorldX = 0;
    scene.pet.worldX = 300;
    scene.pet.worldVelocity = 0;
    scene.pet.targetSpeed = 0;
    scene.pet.facing = 1;
    scene.pet.state = 'pause';
    scene.pet.pose = 'standing';
    scene.walker.worldX = 700;
    scene.walker.worldVelocity = 0;
    scene.walker.targetSpeed = 0;
    scene.walker.nextDecisionAt = 999;

    expect(tryStartFireAbility(scene, 800, random)).toBe(true);
    const startedAt = scene.fireAbility?.startedAt ?? scene.sceneTime;
    while (scene.fireAbility) {
      updateSceneRuntime(scene, 0.04, 800, random);
    }

    expect(scene.sceneTime - startedAt).toBeLessThanOrEqual(1.75);
    expect(tryStartFireAbility(scene, 800, random)).toBe(false);
  });
});
