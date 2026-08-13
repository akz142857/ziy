export type Facing = 1 | -1;
export type PetState = 'pause' | 'wander' | 'turn' | 'observe';
export type PetPose = 'standing' | 'observing';
export type InteractionPhase = 'approach' | 'signal' | 'hold' | 'release';
export type FirePhase = 'prepare' | 'emit' | 'impact' | 'recover';

export interface InteractionRuntime {
  kind: 'greet';
  phase: InteractionPhase;
  phaseUntil: number;
  startedAt: number;
}

export interface SceneEnvironment {
  interactionAllowed?: boolean;
  fireAllowed?: boolean;
  fireTargetAllowed?: (worldX: number) => boolean;
  petOnTerrain?: boolean;
}

export interface PetNeeds {
  curiosity: number;
  social: number;
  fatigue: number;
}

export interface FireAbilityRuntime {
  kind: 'breatheFire';
  phase: FirePhase;
  phaseStartedAt: number;
  phaseUntil: number;
  startedAt: number;
  impactWorldX: number;
}

export interface ActorRuntime {
  worldX: number;
  worldVelocity: number;
  targetWorldX: number;
  targetSpeed: number;
  facing: Facing;
  pendingFacing?: Facing;
}

export interface WalkerRuntime extends ActorRuntime {
  gait: number;
  nextDecisionAt: number;
  resumeSpeed: number;
}

export interface PetRuntime extends ActorRuntime {
  gait: number;
  state: PetState;
  stateUntil: number;
  resumeSpeed: number;
  longMoveStreak: number;
  pose: PetPose;
  previousPose: PetPose;
  poseChangedAt: number;
  poseTransitionUntil: number;
  needs: PetNeeds;
}

export interface SceneRuntime {
  sceneTime: number;
  cameraWorldX: number;
  framingRecovery: boolean;
  walker: WalkerRuntime;
  pet: PetRuntime;
  interaction?: InteractionRuntime;
  interactionCooldownUntil: number;
  quietWindowUntil: number;
  encounterArmed: boolean;
  nextInteractionBoostAt: number;
  fireAbility?: FireAbilityRuntime;
  nextFireAt: number;
}

export type RandomSource = () => number;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const mix = (from: number, to: number, amount: number) =>
  from + (to - from) * amount;

const damp = (from: number, to: number, response: number, delta: number) =>
  mix(from, to, 1 - Math.exp(-response * delta));

const randomBetween = (random: RandomSource, min: number, max: number) =>
  min + random() * (max - min);

const directionOf = (distance: number): Facing => (distance < 0 ? -1 : 1);

const isMobileWidth = (width: number) => width <= 620;

const petSpeed = (width: number, random: RandomSource) => {
  const mobileScale = isMobileWidth(width) ? 0.75 : 1;
  return randomBetween(random, 10, 18) * mobileScale;
};

const petPauseDuration = (width: number, random: RandomSource) => {
  const mobileScale = isMobileWidth(width) ? 1.4 : 1;
  return randomBetween(random, 6, 8) * mobileScale;
};

const petWanderDuration = (width: number, random: RandomSource) =>
  randomBetween(random, 2.5, 5) * (isMobileWidth(width) ? 1.25 : 1);

export const createSeededRandom = (seed: number): RandomSource => {
  let state = seed >>> 0 || 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

export const getActorScreenX = (actor: ActorRuntime, cameraWorldX: number) =>
  actor.worldX - cameraWorldX;

export const createSceneRuntime = (
  width: number,
  cameraWorldX: number,
  random: RandomSource,
): SceneRuntime => {
  const walkerWorldX = cameraWorldX + width * 0.47;
  const initialWalkerSpeed = randomBetween(random, 24, 38);
  const petWorldX = walkerWorldX - clamp(width * 0.18, 64, 104);

  return {
    sceneTime: 0,
    cameraWorldX,
    framingRecovery: false,
    interactionCooldownUntil: 0,
    quietWindowUntil: 0,
    encounterArmed: true,
    nextInteractionBoostAt: randomBetween(random, 60, 90),
    nextFireAt: randomBetween(random, 25, 45),
    walker: {
      worldX: walkerWorldX,
      worldVelocity: initialWalkerSpeed,
      targetWorldX: walkerWorldX + width,
      targetSpeed: initialWalkerSpeed,
      facing: 1,
      gait: random() * Math.PI * 2,
      nextDecisionAt: randomBetween(random, 4, 8),
      resumeSpeed: initialWalkerSpeed,
    },
    pet: {
      worldX: petWorldX,
      worldVelocity: 0,
      targetWorldX: petWorldX,
      targetSpeed: 0,
      facing: 1,
      gait: random() * Math.PI * 2,
      state: 'pause',
      stateUntil: petPauseDuration(width, random),
      resumeSpeed: 0,
      longMoveStreak: 0,
      pose: 'standing',
      previousPose: 'standing',
      poseChangedAt: 0,
      poseTransitionUntil: 0,
      needs: {
        curiosity: randomBetween(random, 0.28, 0.5),
        social: randomBetween(random, 0.35, 0.55),
        fatigue: randomBetween(random, 0.12, 0.28),
      },
    },
  };
};

const requestWalkerTurn = (walker: WalkerRuntime) => {
  walker.pendingFacing = walker.facing === 1 ? -1 : 1;
  walker.targetSpeed = 0;
};

const chooseWalkerMovement = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const { walker } = scene;

  if (random() < 0.16) {
    walker.resumeSpeed = randomBetween(random, 24, 38);
    requestWalkerTurn(walker);
    walker.nextDecisionAt = scene.sceneTime + randomBetween(random, 0.65, 1.05);
    return;
  }

  const running = random() < 0.07;
  const speed = running ? randomBetween(random, 44, 52) : randomBetween(random, 24, 38);
  walker.resumeSpeed = speed;
  walker.targetSpeed = walker.facing * speed;
  walker.targetWorldX = walker.worldX + walker.facing * width;
  walker.nextDecisionAt = scene.sceneTime + randomBetween(random, 4, 8.8);
};

const updateWalkerIntent = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const { walker } = scene;

  if (walker.pendingFacing && Math.abs(walker.worldVelocity) < 0.65) {
    walker.facing = walker.pendingFacing;
    walker.pendingFacing = undefined;
    walker.targetSpeed = walker.facing * walker.resumeSpeed;
    walker.targetWorldX = walker.worldX + walker.facing * width;
    walker.nextDecisionAt = scene.sceneTime + randomBetween(random, 4, 8.8);
  } else if (!walker.pendingFacing && scene.sceneTime >= walker.nextDecisionAt) {
    chooseWalkerMovement(scene, width, random);
  }
};

const integrateWalker = (walker: WalkerRuntime, delta: number) => {
  walker.worldVelocity = damp(walker.worldVelocity, walker.targetSpeed, 1.8, delta);
  walker.worldX += walker.worldVelocity * delta;
  walker.gait += Math.max(5.6, Math.abs(walker.worldVelocity) * 0.24) * delta;
};

const setPetPose = (scene: SceneRuntime, pose: PetPose) => {
  const { pet } = scene;
  if (pet.pose === pose) {
    return;
  }
  pet.previousPose = pet.pose;
  pet.pose = pose;
  pet.poseChangedAt = scene.sceneTime;
  pet.poseTransitionUntil = scene.sceneTime + 0.34;
};

const enterPetPause = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const { pet } = scene;
  pet.state = 'pause';
  pet.targetSpeed = 0;
  pet.targetWorldX = pet.worldX;
  pet.pendingFacing = undefined;
  pet.stateUntil = scene.sceneTime + petPauseDuration(width, random);
  pet.longMoveStreak = 0;
  setPetPose(scene, 'standing');
};

const enterPetPoseState = (
  scene: SceneRuntime,
  state: Extract<PetState, 'observe'>,
  random: RandomSource,
) => {
  const { pet } = scene;
  pet.state = state;
  pet.targetSpeed = 0;
  pet.targetWorldX = pet.worldX;
  pet.pendingFacing = undefined;

  setPetPose(scene, 'observing');
  pet.stateUntil = scene.sceneTime + randomBetween(random, 2.2, 4.2);
};

const enterPetRest = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  enterPetPause(scene, width, random);
  scene.pet.stateUntil = scene.sceneTime + randomBetween(random, 4.5, 8);
  scene.pet.needs.fatigue = clamp(scene.pet.needs.fatigue - 0.28, 0, 1);
};

const choosePetTarget = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
  forcedFacing?: Facing,
) => {
  const { pet, walker } = scene;
  const petScreenX = getActorScreenX(pet, scene.cameraWorldX);
  const gutter = isMobileWidth(width) ? 30 : 38;
  const maxSeparation = width * 0.62;
  const separation = pet.worldX - walker.worldX;
  let direction = forcedFacing ?? (random() < 0.16 ? (pet.facing === 1 ? -1 : 1) : pet.facing);

  if (petScreenX <= gutter || separation <= -maxSeparation) {
    direction = 1;
  } else if (petScreenX >= width - gutter || separation >= maxSeparation) {
    direction = -1;
  }

  const longMove = random() < 0.15 && pet.longMoveStreak < 2;
  const distance = longMove
    ? randomBetween(random, 120, Math.min(220, width * 0.45))
    : randomBetween(random, 40, Math.min(120, width * 0.32));
  let targetWorldX = pet.worldX + direction * distance;

  const minWorldX = walker.worldX - maxSeparation;
  const maxWorldX = walker.worldX + maxSeparation;
  targetWorldX = clamp(targetWorldX, minWorldX, maxWorldX);

  return {
    direction: directionOf(targetWorldX - pet.worldX),
    distance: Math.abs(targetWorldX - pet.worldX),
    longMove,
    targetWorldX,
  };
};

export const enterPetWander = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
  forcedFacing?: Facing,
) => {
  const { pet } = scene;
  setPetPose(scene, 'standing');
  const target = choosePetTarget(scene, width, random, forcedFacing);
  const speed = petSpeed(width, random);

  pet.targetWorldX = target.targetWorldX;
  pet.resumeSpeed = speed;
  pet.stateUntil = scene.sceneTime + petWanderDuration(width, random);
  pet.longMoveStreak = target.longMove ? pet.longMoveStreak + 1 : 0;

  if (target.direction !== pet.facing) {
    pet.state = 'turn';
    pet.pendingFacing = target.direction;
    pet.targetSpeed = 0;
    return;
  }

  pet.state = 'wander';
  pet.pendingFacing = undefined;
  pet.targetSpeed = pet.facing * speed;
};

const choosePetActivity = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const { pet } = scene;
  const stopped = Math.abs(pet.worldVelocity) < 0.45;

  if (stopped && pet.needs.fatigue >= 0.72 && random() < 0.62) {
    enterPetRest(scene, width, random);
    return;
  }
  if (stopped && pet.needs.curiosity >= 0.58 && random() < 0.58) {
    enterPetPoseState(scene, 'observe', random);
    return;
  }
  if (stopped && pet.needs.fatigue >= 0.48 && random() < 0.34) {
    enterPetRest(scene, width, random);
    return;
  }
  enterPetWander(scene, width, random);
};

const updateFramingRecovery = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const separation = scene.pet.worldX - scene.walker.worldX;
  const distance = Math.abs(separation);
  const enterDistance = width * 0.56;
  const exitDistance = width * 0.48;

  if (!scene.framingRecovery && distance > enterDistance) {
    scene.framingRecovery = true;
  } else if (scene.framingRecovery && distance < exitDistance) {
    scene.framingRecovery = false;
    scene.walker.nextDecisionAt = scene.sceneTime;
  }

  if (!scene.framingRecovery) {
    return;
  }

  const petMovingOutward = scene.pet.targetSpeed * separation > 0;
  if (petMovingOutward) {
    enterPetWander(scene, width, random, separation < 0 ? 1 : -1);
    const recoverySpeed = randomBetween(random, 22, 28) * (isMobileWidth(width) ? 0.75 : 1);
    scene.pet.resumeSpeed = recoverySpeed;
    if (scene.pet.state === 'wander') {
      scene.pet.targetSpeed = scene.pet.facing * recoverySpeed;
    }
  }

  const walkerInwardFacing: Facing = separation < 0 ? -1 : 1;
  const walkerIntentIsInward = scene.walker.targetSpeed * separation > 0;
  if (!walkerIntentIsInward) {
    scene.walker.targetSpeed = 0;
    scene.walker.pendingFacing = walkerInwardFacing;
  } else if (
    scene.walker.facing === walkerInwardFacing &&
    Math.abs(scene.walker.targetSpeed) < 0.5
  ) {
    scene.walker.targetSpeed = walkerInwardFacing * scene.walker.resumeSpeed;
  }
  scene.walker.nextDecisionAt = Math.max(
    scene.walker.nextDecisionAt,
    scene.sceneTime + 0.25,
  );
};

const updatePetIntent = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
  activityAllowed = true,
) => {
  const { pet } = scene;

  if (scene.sceneTime < pet.poseTransitionUntil) {
    return;
  }

  if (pet.state === 'pause' && scene.sceneTime >= pet.stateUntil) {
    if (activityAllowed) {
      choosePetActivity(scene, width, random);
    }
  } else if (pet.state === 'wander') {
    const remaining = pet.targetWorldX - pet.worldX;
    const arrived = Math.abs(remaining) <= 2;
    const expired = scene.sceneTime >= pet.stateUntil;

    if (arrived || expired) {
      if (!arrived && random() < 0.25) {
        enterPetWander(scene, width, random, pet.facing === 1 ? -1 : 1);
      } else {
        enterPetPause(scene, width, random);
      }
    }
  } else if (pet.state === 'observe' && scene.sceneTime >= pet.stateUntil) {
    pet.needs.curiosity = clamp(pet.needs.curiosity - 0.36, 0, 1);
    enterPetPause(scene, width, random);
  } else if (
    pet.state === 'turn' &&
    pet.pendingFacing &&
    Math.abs(pet.worldVelocity) < 0.45
  ) {
    pet.facing = pet.pendingFacing;
    pet.pendingFacing = undefined;
    pet.state = 'wander';
    pet.targetSpeed = pet.facing * pet.resumeSpeed;
    pet.stateUntil = scene.sceneTime + petWanderDuration(width, random);
  }
};

const updatePetNeeds = (pet: PetRuntime, delta: number) => {
  const isMoving = pet.state === 'wander' || pet.state === 'turn';
  const fatigueRate = isMoving ? 0.016 : -0.006;
  const curiosityRate = pet.state === 'observe' ? -0.09 : isMoving ? 0.005 : 0.013;

  pet.needs.fatigue = clamp(pet.needs.fatigue + fatigueRate * delta, 0, 1);
  pet.needs.curiosity = clamp(pet.needs.curiosity + curiosityRate * delta, 0, 1);
  pet.needs.social = clamp(pet.needs.social + 0.004 * delta, 0, 1);
};

const integratePet = (pet: PetRuntime, delta: number) => {
  const response = pet.state === 'turn' ? 4.6 : 3.1;
  pet.worldVelocity = damp(pet.worldVelocity, pet.targetSpeed, response, delta);
  pet.worldX += pet.worldVelocity * delta;

  if (Math.abs(pet.worldVelocity) > 0.35) {
    pet.gait += Math.max(2.8, Math.abs(pet.worldVelocity) * 0.3) * delta;
  }
};

const interactionPhaseDuration = (
  phase: InteractionPhase,
  random: RandomSource,
) => {
  if (phase === 'approach') {
    return randomBetween(random, 0.25, 0.34);
  }
  if (phase === 'signal') {
    return randomBetween(random, 0.15, 0.19);
  }
  if (phase === 'hold') {
    return randomBetween(random, 0.35, 0.47);
  }
  return randomBetween(random, 0.2, 0.27);
};

const interactionCooldown = (width: number, random: RandomSource) =>
  isMobileWidth(width)
    ? randomBetween(random, 45, 70)
    : randomBetween(random, 30, 50);

const interactionIsInsideSafeArea = (scene: SceneRuntime, width: number) => {
  const petX = getActorScreenX(scene.pet, scene.cameraWorldX);
  const walkerX = getActorScreenX(scene.walker, scene.cameraWorldX);
  const brakingDistance = Math.max(
    Math.abs(scene.pet.worldVelocity),
    Math.abs(scene.walker.worldVelocity),
  ) * 0.45;
  const margin = Math.max(isMobileWidth(width) ? 30 : 38, brakingDistance * 1.5);
  return petX > margin && petX < width - margin && walkerX > margin && walkerX < width - margin;
};

export const tryStartInteraction = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
  environment: SceneEnvironment = {},
) => {
  const distance = Math.abs(scene.pet.worldX - scene.walker.worldX);

  if (distance > 58) {
    scene.encounterArmed = true;
    return false;
  }

  if (distance >= 40 || !scene.encounterArmed) {
    return false;
  }

  scene.encounterArmed = false;
  const petFacesWalker =
    (scene.walker.worldX - scene.pet.worldX) * scene.pet.facing > 0;
  const canInteract =
    !scene.interaction &&
    !scene.fireAbility &&
    !scene.framingRecovery &&
    scene.pet.state !== 'turn' &&
    scene.pet.pose === 'standing' &&
    scene.sceneTime >= scene.pet.poseTransitionUntil &&
    !scene.pet.pendingFacing &&
    !scene.walker.pendingFacing &&
    scene.sceneTime >= scene.interactionCooldownUntil &&
    scene.sceneTime >= scene.quietWindowUntil &&
    petFacesWalker &&
    interactionIsInsideSafeArea(scene, width) &&
    environment.interactionAllowed !== false;

  if (!canInteract) {
    return false;
  }

  const chance = scene.sceneTime >= scene.nextInteractionBoostAt
    ? 0.7
    : 0.25 + scene.pet.needs.social * 0.2;
  if (random() >= chance) {
    return false;
  }

  scene.interaction = {
    kind: 'greet',
    phase: 'approach',
    phaseUntil: scene.sceneTime + interactionPhaseDuration('approach', random),
    startedAt: scene.sceneTime,
  };
  scene.interactionCooldownUntil =
    scene.sceneTime + interactionCooldown(width, random);
  scene.nextInteractionBoostAt = scene.sceneTime + randomBetween(random, 60, 90);
  return true;
};

const finishInteraction = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  scene.interaction = undefined;
  scene.pet.needs.social = clamp(scene.pet.needs.social - 0.45, 0, 1);
  scene.quietWindowUntil = scene.sceneTime + 2;
  scene.walker.targetSpeed = 0;
  scene.walker.nextDecisionAt = scene.quietWindowUntil;
  enterPetPause(scene, width, random);
};

const firePhaseDuration = (phase: FirePhase, random: RandomSource) => {
  if (phase === 'prepare') {
    return randomBetween(random, 0.3, 0.42);
  }
  if (phase === 'emit') {
    return randomBetween(random, 0.45, 0.65);
  }
  if (phase === 'impact') {
    return randomBetween(random, 0.18, 0.28);
  }
  return randomBetween(random, 0.24, 0.36);
};

const fireCooldown = (width: number, random: RandomSource) =>
  isMobileWidth(width)
    ? randomBetween(random, 55, 100)
    : randomBetween(random, 45, 90);

export const tryStartFireAbility = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
  environment: SceneEnvironment = {},
) => {
  if (
    scene.fireAbility ||
    scene.interaction ||
    scene.framingRecovery ||
    scene.sceneTime < scene.nextFireAt ||
    scene.sceneTime < scene.quietWindowUntil ||
    scene.pet.state !== 'pause' ||
    scene.pet.pose !== 'standing' ||
    scene.sceneTime < scene.pet.poseTransitionUntil ||
    scene.pet.pendingFacing ||
    Math.abs(scene.pet.worldVelocity) >= 0.45 ||
    environment.fireAllowed === false
  ) {
    return false;
  }

  const distance = isMobileWidth(width)
    ? randomBetween(random, 35, 62)
    : randomBetween(random, 45, 90);
  const margin = isMobileWidth(width) ? 24 : 32;
  const projectedWalkerX = scene.walker.worldX + scene.walker.worldVelocity * 1.75;
  const walkerTravelMin = Math.min(scene.walker.worldX, projectedWalkerX);
  const walkerTravelMax = Math.max(scene.walker.worldX, projectedWalkerX);
  const directions: Facing[] = [scene.pet.facing, scene.pet.facing === 1 ? -1 : 1];
  const target = directions
    .map((facing) => {
      const impactWorldX = scene.pet.worldX + facing * distance;
      const impactScreenX = impactWorldX - scene.cameraWorldX;
      const pathMin = Math.min(scene.pet.worldX, impactWorldX) - 12;
      const pathMax = Math.max(scene.pet.worldX, impactWorldX) + 12;
      const walkerIsInPath = walkerTravelMax >= pathMin && walkerTravelMin <= pathMax;
      const allowed =
        impactScreenX > margin &&
        impactScreenX < width - margin &&
        !walkerIsInPath &&
        environment.fireTargetAllowed?.(impactWorldX) !== false;
      return { allowed, facing, impactWorldX };
    })
    .find((candidate) => candidate.allowed);

  if (!target) {
    scene.nextFireAt = scene.sceneTime + randomBetween(random, 4, 9);
    return false;
  }

  scene.pet.facing = target.facing;
  const duration = firePhaseDuration('prepare', random);
  scene.fireAbility = {
    kind: 'breatheFire',
    phase: 'prepare',
    phaseStartedAt: scene.sceneTime,
    phaseUntil: scene.sceneTime + duration,
    startedAt: scene.sceneTime,
    impactWorldX: target.impactWorldX,
  };
  scene.pet.targetSpeed = 0;
  scene.pet.targetWorldX = scene.pet.worldX;
  scene.walker.targetSpeed = 0;
  return true;
};

const finishFireAbility = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  scene.fireAbility = undefined;
  scene.nextFireAt = scene.sceneTime + fireCooldown(width, random);
  scene.quietWindowUntil = scene.sceneTime + 1.5;
  scene.walker.targetSpeed = 0;
  scene.walker.nextDecisionAt = scene.quietWindowUntil;
  enterPetPause(scene, width, random);
};

const updateFireAbility = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const ability = scene.fireAbility;
  if (!ability) {
    return;
  }

  scene.pet.targetSpeed = 0;
  scene.walker.targetSpeed = 0;
  scene.walker.nextDecisionAt = Math.max(scene.walker.nextDecisionAt, scene.sceneTime + 0.2);

  while (scene.fireAbility && scene.sceneTime >= ability.phaseUntil) {
    const nextPhaseAt = ability.phaseUntil;
    if (ability.phase === 'prepare') {
      ability.phase = 'emit';
    } else if (ability.phase === 'emit') {
      ability.phase = 'impact';
    } else if (ability.phase === 'impact') {
      ability.phase = 'recover';
    } else {
      finishFireAbility(scene, width, random);
      return;
    }

    ability.phaseStartedAt = nextPhaseAt;
    ability.phaseUntil = nextPhaseAt + firePhaseDuration(ability.phase, random);
  }
};

const updateInteraction = (
  scene: SceneRuntime,
  width: number,
  random: RandomSource,
) => {
  const interaction = scene.interaction;
  if (!interaction) {
    return;
  }

  while (scene.interaction && scene.sceneTime >= interaction.phaseUntil) {
    const actorsStopped =
      Math.abs(scene.pet.worldVelocity) < 0.75 &&
      Math.abs(scene.walker.worldVelocity) < 0.75;
    if (interaction.phase === 'approach' && !actorsStopped) {
      break;
    }
    const nextPhaseAt = interaction.phase === 'approach'
      ? Math.max(interaction.phaseUntil, scene.sceneTime)
      : interaction.phaseUntil;
    if (interaction.phase === 'approach') {
      interaction.phase = 'signal';
    } else if (interaction.phase === 'signal') {
      interaction.phase = 'hold';
    } else if (interaction.phase === 'hold') {
      interaction.phase = 'release';
    } else {
      finishInteraction(scene, width, random);
      return;
    }
    interaction.phaseUntil =
      nextPhaseAt + interactionPhaseDuration(interaction.phase, random);
  }

  scene.walker.targetSpeed = 0;
  scene.pet.targetSpeed = 0;

  if (interaction.phase === 'approach') {
    const distance = scene.walker.worldX - scene.pet.worldX;
    const gap = Math.abs(distance);
    if (gap > 32) {
      const direction = directionOf(distance);
      scene.pet.facing = direction;
      scene.pet.targetSpeed = direction * Math.min(24, (gap - 28) * 3);
    }
  }
};

const actorCameraInterval = (
  actor: ActorRuntime,
  safeLeft: number,
  safeRight: number,
) => ({
  min: actor.worldX - safeRight,
  max: actor.worldX - safeLeft,
});

export const updateCamera = (
  scene: SceneRuntime,
  delta: number,
  width: number,
  includePet = true,
) => {
  const walkerInterval = actorCameraInterval(scene.walker, width * 0.22, width * 0.78);
  const petGutter = isMobileWidth(width) ? 30 : 38;
  const petInterval = actorCameraInterval(scene.pet, petGutter, width - petGutter);
  const abilityMargin = isMobileWidth(width) ? 24 : 32;
  const abilityInterval = scene.fireAbility
    ? actorCameraInterval(
        { ...scene.pet, worldX: scene.fireAbility.impactWorldX },
        abilityMargin,
        width - abilityMargin,
      )
    : undefined;
  const allowedMin = !includePet
    ? walkerInterval.min
    : abilityInterval
      ? Math.max(petInterval.min, abilityInterval.min)
      : Math.max(walkerInterval.min, petInterval.min);
  const allowedMax = !includePet
    ? walkerInterval.max
    : abilityInterval
      ? Math.min(petInterval.max, abilityInterval.max)
      : Math.min(walkerInterval.max, petInterval.max);
  const target = allowedMin <= allowedMax
    ? clamp(scene.cameraWorldX, allowedMin, allowedMax)
    : (allowedMin + allowedMax) / 2;

  scene.cameraWorldX = damp(scene.cameraWorldX, target, 5, delta);
};

export const updateSceneRuntime = (
  scene: SceneRuntime,
  delta: number,
  width: number,
  random: RandomSource,
  environment: SceneEnvironment = {},
) => {
  const safeDelta = clamp(delta, 0, 0.04);
  const petOnTerrain = environment.petOnTerrain ?? true;
  scene.sceneTime += safeDelta;
  if (petOnTerrain) {
    updatePetNeeds(scene.pet, safeDelta);
  }

  if (!petOnTerrain) {
    scene.interaction = undefined;
    scene.fireAbility = undefined;
    scene.framingRecovery = false;
    updateWalkerIntent(scene, width, random);
  } else if (scene.fireAbility) {
    updateFireAbility(scene, width, random);
  } else if (scene.interaction) {
    updateInteraction(scene, width, random);
  } else {
    updateFramingRecovery(scene, width, random);
    updateWalkerIntent(scene, width, random);
    updatePetIntent(scene, width, random, !scene.framingRecovery);
    if (!scene.framingRecovery) {
      if (tryStartInteraction(scene, width, random, environment)) {
        updateInteraction(scene, width, random);
      } else if (tryStartFireAbility(scene, width, random, environment)) {
        updateFireAbility(scene, width, random);
      }
    }
  }

  const directorBraking = scene.interaction?.phase === 'approach' || !!scene.fireAbility;
  if (directorBraking) {
    scene.walker.worldVelocity = damp(
      scene.walker.worldVelocity,
      scene.walker.targetSpeed,
      14,
      safeDelta,
    );
    scene.pet.worldVelocity = damp(
      scene.pet.worldVelocity,
      scene.pet.targetSpeed,
      14,
      safeDelta,
    );
  }
  integrateWalker(scene.walker, safeDelta);
  if (petOnTerrain) {
    integratePet(scene.pet, safeDelta);
  }
  updateCamera(scene, safeDelta, width, petOnTerrain);
};
