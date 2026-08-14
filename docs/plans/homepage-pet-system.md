# 首页宠物系统实施方案

## 实施状态

- [x] Phase 1：世界坐标、模拟时钟、独立 `pause / wander / turn`、独立步态与双角色安全取景。
- [x] Phase 2：带相遇滞回、冷却和四阶段控制权的低频 `greet`。
- [x] 逻辑测试：确定性、脚底固定、停稳转向、边界、取景恢复、运动预算、互动阶段与环境门禁。
- [x] Phase 3：独立头部、观察与站立休息、需求值及随机喷火能力；坐姿和趴姿经视觉评审后移除。
- [x] Phase 4（2026-08-14）：趣味化三件——随机眨眼、指针经过时抬头看一眼、点击宠物原地轻跳（偶尔顺势喷火）。全部实现在 `WanderingWalker.astro` 组件层，不触碰 `src/lib/walker/` 的模拟内核与测试。

## 1. 目标与边界

把顶部宠物从“小人的跟随物”升级为拥有自己节奏的场景角色。宠物可以独自在地形上停留、游荡和转向；当双方自然靠近时，偶尔发生一次短暂且克制的互动。

系统必须满足：

- 宠物拥有独立世界位置、速度、朝向、步态和决策时钟，不持续追踪小人。
- 互动由独立仲裁层控制，不侵入或覆盖角色自身行为逻辑。
- 宠物不会脚底滑动、瞬移、越界或在尚未停稳时突然镜像。
- 动画是首页的环境细节，不抢夺正文注意力。
- 离屏、页面隐藏和减弱动画模式都有明确且可测试的语义。
- 姿态与能力使用专用 SVG 资产和独立状态机，不用难以维护的 path morph。

暂不包含：

- 喂食、拖拽或用户养成系统。（点击已在 Phase 4 放开：只做一次性的轻跳反馈，不产生状态积累，也不改变宠物的自主决策逻辑。）
- 服务端数据、账号同步或用户行为追踪。
- 火焰伤害、碰撞、永久燃烧痕迹或用户操控能力。
- 通用游戏引擎或第三方状态机依赖。

## 2. 体验原则与运动预算

1. **自由先于互动**：宠物的目标点和决策不依赖小人；互动只发生在自然相遇时。
2. **停留也是行为**：自由感来自独立目标、不规则停顿和偶尔改变方向，不等于持续横穿屏幕。
3. **互动后重新独立**：互动结束后双方重新规划自己的行为，不恢复可能已过期的旧目标。
4. **一次只有一个显著动作**：转向、互动和长距离移动不能同时争抢注意力。
5. **动作必须可辨识**：先减速、再转向或互动，最后平滑恢复，避免把状态切换表现成卡顿。

建议运动预算：

- 静止或轻微呼吸：可见时间的 `55%～70%`。
- 慢速游荡：`25%～40%`。
- 转向和互动等显著动作：不超过 `5%`。
- 互动总时长：可见时间的 `1%～4%`，上限不超过 `6%`。
- 显著全屏横穿：最多 `1 次/分钟`。

## 3. 坐标与时间契约

### 3.1 世界坐标

所有运动计算使用世界坐标，渲染时才转换到屏幕坐标：

```ts
walkerScreenX = walkerWorldX - cameraWorldX;
petScreenX = petWorldX - cameraWorldX;

walkerGroundY = terrainY(walkerWorldX);
petGroundY = terrainY(petWorldX);
```

`terrainY()` 的输入始终是世界坐标。角色的目标位置和速度也统一定义在世界坐标中，禁止混用屏幕速度和世界速度。

当前实现中的 `worldOffset` 应明确重命名或等价解释为 `cameraWorldX`。如果镜头继续随小人运动，则屏幕速度由以下公式得到：

```ts
actorScreenVelocity = actorWorldVelocity - cameraWorldVelocity;
```

宠物在 `pause` 时世界速度为零。此时镜头移动会让宠物在屏幕中相反方向移动，但它与脚下地形保持固定关系，因此不会产生脚底滑动。

### 3.2 相机取景约束

相机不能只跟随小人，否则静止的宠物可能被镜头带出屏幕。Camera Controller 需要同时维护两名角色的安全取景区：

- 小人与宠物的屏幕位置都应落在各自安全区内。
- 相机目标优先落在两名角色都可见的合法区间内，并平滑移动，不能瞬移。
- Pet Controller 在双方世界距离接近最大可见跨度前，只生成朝场景内侧的目标；这是取景约束，不是跟随小人的行为。
- 如果窗口缩放使合法区间暂时不存在，先暂停常规决策，再由两个 Controller 生成朝场景内侧的恢复意图以缩短距离；恢复过程中禁止直接改写世界位置。

对于安全区 `[safeLeft, safeRight]`，单个角色允许的相机区间为：

```ts
cameraMin = actorWorldX - safeRight;
cameraMax = actorWorldX - safeLeft;
```

Camera Controller 求两名角色区间的交集作为相机目标范围。系统通过限制最大角色间距保证交集在正常运行中存在。

### 3.3 落脚与步态

- 角色坡面高度使用自己的 `worldX` 采样。
- 坡面角度使用 `terrainY(worldX ± sampleOffset)` 计算。
- 宠物步频只由 `abs(pet.worldVelocity)` 驱动，不再从小人的 `gait` 派生。
- `pause` 状态停止脚步相位推进，仅允许非常轻的整体呼吸位移。

### 3.4 模拟时钟

行为状态不能直接依赖持续前进的绝对 `performance.now()`。系统维护仅在活动帧推进的模拟时钟：

```ts
sceneTime += delta;
```

以下字段全部基于 `sceneTime`：

- `stateUntil`
- `nextDecisionAt`
- `interaction.phaseUntil`
- `interactionCooldownUntil`
- `quietWindowUntil`

离屏或页面隐藏时停止 `requestAnimationFrame`，也停止推进 `sceneTime`。恢复时只重置上一帧真实时间，不改变状态剩余时长。

## 4. 控制器与控制权

```text
Terrain + simulation clock
├── Camera controller
├── Walker controller ── walker intent ─┐
├── Pet controller ───── pet intent ────┼─ Interaction / Ability director → final commands
└── Renderer ◀──────────────────────────┘
```

### 4.1 Controller

Walker 与 Pet Controller 只产生自身下一步意图：

```ts
interface ActorIntent {
  targetWorldX: number;
  targetSpeed: number;
  requestedFacing?: 1 | -1;
  pose: 'neutral' | 'breathe' | 'lean';
}
```

### 4.2 Interaction Director

Interaction Director 是互动期间唯一可以覆盖双方意图的层。覆盖必须具备优先级、阶段和可撤销性：

```ts
interface InteractionRuntime {
  kind: 'greet';
  phase: 'approach' | 'signal' | 'hold' | 'release';
  phaseUntil: number;
  startedAt: number;
}
```

互动结束时不盲目恢复进入互动前保存的速度和目标。Director 释放控制权后，通知两个 Controller 重新规划，避免恢复过期意图。

### 4.3 渲染职责

`drawFigure()` 和 `drawPet()` 只把 Runtime 投影为 SVG 属性，不做以下工作：

- 状态选择。
- 距离判断。
- 互动抽签。
- 目标点生成。
- 跟随误差计算。

## 5. Runtime 数据模型

```ts
type PetState = 'pause' | 'wander' | 'turn' | 'observe';
type PetPose = 'standing' | 'observing';
type InteractionKind = 'greet';

interface ActorRuntime {
  worldX: number;
  worldVelocity: number;
  targetWorldX: number;
  targetSpeed: number;
  facing: 1 | -1;
  pendingFacing?: 1 | -1;
}

interface PetRuntime extends ActorRuntime {
  gait: number;
  state: PetState;
  stateUntil: number;
  pose: PetPose;
  previousPose: PetPose;
  poseChangedAt: number;
  poseTransitionUntil: number;
  needs: PetNeeds;
}

interface SceneRuntime {
  sceneTime: number;
  cameraWorldX: number;
  walker: ActorRuntime;
  pet: PetRuntime;
  interaction?: InteractionRuntime;
  interactionCooldownUntil: number;
  quietWindowUntil: number;
  encounterArmed: boolean;
  fireAbility?: FireAbilityRuntime;
  nextFireAt: number;
}
```

Phase 1 只使用移动字段；Phase 3 在同一 Runtime 中启用 `pose / needs / fireAbility`，但仍由各 Controller 和 Director 分别拥有写入权。

## 6. Phase 1：独立游荡 MVP

### 6.1 状态机

第一版只实现三个可表达状态：

| 状态 | 行为 | 持续/退出条件 |
| --- | --- | --- |
| `pause` | 世界速度降到 0，停止脚步，轻微呼吸 | `4～8 秒`后选择目标 |
| `wander` | 朝独立世界目标慢速行走 | `2.5～5 秒`、到达目标或接近边界 |
| `turn` | 先减速至阈值，再翻转朝向 | 翻转完成后进入 `wander` |

基础转移：

```text
pause  → wander
wander → pause | turn
turn   → wander
```

Phase 1 使用定时器和固定权重，不依赖需求值：

- `wander → pause`: `75%`
- `wander → turn + wander`: `25%`
- 连续两次长距离移动后强制进入 `pause`。

### 6.2 目标与速度

- 桌面安全区：按角色半宽和至少 `24px` gutter 计算。
- 移动端安全区：按角色半宽和至少 `16px` gutter 计算。
- 常规目标距离为 `40～120px`；仅约 `15%` 的游荡选择更远目标。
- 桌面速度：约 `10～18px/s`。
- `≤620px` 时速度降低 `20%～30%`，停留时间延长 `30%～50%`。

目标点必须与当前位置保持最小距离，并对连续重复方向降权。接近边界时只能选择朝内目标。

### 6.3 显式转向

任何转向都遵循：

```text
request turn
→ targetSpeed = 0
→ abs(worldVelocity) < epsilon
→ flip facing
→ 设置新目标
→ 加速进入 wander
```

交互退出、窗口 resize 和边界处理都必须复用同一个转向入口，不能直接修改 `facing`。

### 6.4 Phase 1 验收

至少观察和记录 2 分钟：

- 宠物不持续贴着小人；连续近距离同步移动不超过 2 秒。
- `pause` 时脚与地形之间无相对滑动。
- 到达边界前自然制动，不越过安全区。
- 朝向只在速度接近 0 时翻转。
- 静止或微动占比至少 `55%`。
- 显著全屏横穿不超过 `1 次/分钟`。
- 桌面和移动端均无水平滚动条或 SVG 裁切。

## 7. Phase 2：低频互动 MVP

Phase 1 稳定后，只加入一种互动：`greet`。

### 7.1 相遇锁与触发条件

Interaction Director 使用带滞回的 encounter latch：

- 距离进入 `<40px` 时创建一次 encounter，并只抽签一次。
- 距离离开 `>58px` 后重新 armed。
- 首次抽签建议概率为 `0.35`。
- 距上次互动超过桌面 `30～50 秒`、移动端 `45～70 秒`。
- 双方均不在 `turn`，且至少已结束上一显著动作 2 秒。
- 宠物必须先面向小人；社交倾向未来只能提高概率，不能绕过空间和朝向条件。
- 大坡度或距离边界小于 `1.5 × brakingDistance` 时禁用互动。

若连续 `60～90 秒` 没有互动，可把下一次有效 encounter 的概率提高到 `0.7`，但不能强制宠物追逐小人。

### 7.2 Greet 动作

当前 SVG 不支持独立抬头，因此使用整身前倾/轻抬与小人抬臂表达：

```text
approach: 减速并调整至 24～32px 间距，250～350ms
signal:   宠物完成朝向并轻微前倾，小人抬臂，150～200ms
hold:     保持姿态，350～500ms
release:  双方恢复中性姿态，200～300ms
```

单次互动总时长约 `0.95～1.35 秒`。完成后释放 override，双方重新规划；进入冷却，并开始至少 2 秒 quiet window。

互动后的宠物选择：

- `65%` 选择与小人拉开距离。
- `25%` 原地多停留 `1～2 秒`。
- `10%` 同方向慢走一小段后再分开。

这不是逐帧匹配小人速度，不构成永久跟随。

### 7.3 Phase 2 暂不实现

- `crossPath`：横向高速动作过于抢镜，并有穿过角色轮廓的风险。
- `walkTogether`：容易在视觉上再次被理解为跟随。
- `explore`：需要明确坡顶查询和新的观察姿态。
- `lookUp`：由 Phase 3 的共享头部观察姿态替代。

### 7.4 Phase 2 验收

- 2 分钟内通常发生 `1～3 次`互动。
- 单次互动不超过 `1.35 秒`。
- 互动通常占可见时间 `1%～4%`，不得超过 `6%`。
- 同一次 encounter 只进行一次概率判断。
- 互动阶段严格按 `approach → signal → hold → release` 运行。
- Director 释放后 2 秒内，双方恢复独立决策或形成自然距离。
- 小人自身的随机决策不能在互动中途覆盖 Director。

## 8. Phase 3：姿态、需求值与喷火能力

Phase 3 保持“低频环境角色”的定位，新增能力不能让宠物持续成为首页视觉焦点。实施拆成 3A～3C，并继续复用世界坐标、`sceneTime` 和 Director 控制权。

### 8.1 姿态资产与转换

SVG 拆成共享头部和一套稳定的站立身体轮廓：

```text
pet
├── head（角、头、眼睛，可独立旋转/抬升）
└── body-standing + feet
```

姿态类型：

```ts
type PetPose = 'standing' | 'observing';
type PetState = 'pause' | 'observe';
```

- `observe`：复用站立身体，头部轻抬并朝前偏转；持续 `2.2～4.2 秒`。
- `rest`：继续使用站立身体和轻微呼吸，以更长的 `pause` 表达休息；持续 `4.5～8 秒`。
- 观察转换保存 `previousPose / poseChangedAt`，用 `0.34 秒`的头部位移和旋转衔接。
- 只有速度低于阈值、没有转向、互动、取景恢复或能力动作时，才能进入观察或休息。
- 坐姿和趴姿因轮廓辨识度不足而移除，印章上也始终使用站姿。

推荐自然动作链：

```text
wander → pause → observe → pause
               ↘ rest（站立）→ pause → wander
```

### 8.2 需求值

```ts
interface PetNeeds {
  curiosity: number;
  social: number;
  fatigue: number;
}
```

三个值限制在 `[0, 1]`，仅按活动帧的 `sceneTime` 积累：

- 游荡缓慢增加疲劳；站立休息降低疲劳。
- 停留时增加好奇心；观察会消耗好奇心。
- 社交需求缓慢恢复，`greet` 后明显降低；它只影响互动抽签概率，不绕过距离、朝向和安全条件。
- 状态选择使用需求值加权，但仍保留随机性，避免形成固定循环。

### 8.3 随机喷火能力

喷火由独立 Ability Director 管理，优先级低于 `greet`、高于普通姿态决策：

```ts
type FirePhase = 'prepare' | 'emit' | 'impact' | 'recover';

interface FireAbilityRuntime {
  kind: 'breatheFire';
  phase: FirePhase;
  phaseStartedAt: number;
  phaseUntil: number;
  startedAt: number;
  impactWorldX: number;
}
```

动作阶段：

```text
prepare: 停稳、轻微后仰、嘴部出现小火光，0.30～0.42s
emit:    弯曲火焰从头部前方喷向地形，0.45～0.65s
impact:  终点在线上形成一小簇火苗，0.18～0.28s
recover: 火苗熄灭、身体恢复，0.24～0.36s
```

落点必须使用世界坐标，并在每帧渲染时重新投影：

```ts
impactWorldX = pet.worldX + pet.facing * random(45, 90);
impactScreenX = impactWorldX - cameraWorldX;
impactY = terrainY(impactWorldX);
```

因此相机或地形滚动时，火焰终点仍牢牢贴在地形线上。能力约束：

- 首次触发延迟 `25～45 秒`，后续随机冷却桌面 `45～90 秒`、移动端 `55～100 秒`。
- 仅允许站立且已停稳的 `pause` 状态触发；触发后冻结普通状态决策。
- 优先沿当前朝向选择落点；若小人挡住路径，则在宠物已经停稳时改用另一侧。两侧都不安全、落点越过屏幕边距、大坡度、靠近边界、互动或转向中时延迟重试。
- 喷火期间 Director 制动小人和宠物并暂停双方旧意图；结束后重新规划，不恢复旧速度目标。
- 喷火期间 Camera Controller 将 `impactWorldX` 纳入安全取景，短暂放宽小人的常规安全区，优先保证宠物和落点可见。
- 火焰只负责装饰，无伤害、碰撞或残留；一次只有一条火焰。
- `prefers-reduced-motion` 下不运行 Ability Director，也不显示火焰。
- 移动端将喷射距离缩短到 `35～62px`，并减少火焰层数和落点火苗数量。

### 8.4 Phase 3 验收

- 观察时只有头部产生可辨识偏转，身体不发生脚滑。
- 印章和地形休息都只使用稳定站姿，页面中不存在坐姿或趴姿 SVG 资产。
- 同一时刻最多出现一个显著动作：转向、互动、姿态转换或喷火。
- 喷火严格按 `prepare → emit → impact → recover`，总时长不超过 `1.75 秒`。
- 火焰终点每帧等于 `terrainY(impactWorldX)`，相机移动时无漂移。
- 火焰路径不会穿过小人；冷却内不能重复触发。
- 同 seed、相同 delta 和环境输入产生相同姿态与能力事件序列。

根据地形局部极值寻找坡顶的 `explore`、低速 `walkTogether` 以及火焰照明/碰撞仍作为后续可选增强，不进入本次 Phase 3。

人格 seed 可以按日期保持整体性格，并混入仅影响时间间隔的 session seed。测试模式必须允许显式注入 seed。

## 9. 减弱动画与生命周期

### 9.1 `prefers-reduced-motion`

- 初始为 reduce 时，渲染固定场景，不启动状态机。
- 运行中切换为 reduce 时，保存 Live Runtime，使用独立静态 Render Pose；不能调用会改写 `walkerWorldX / petWorldX / gait / target` 的函数。
- 退出 reduce 时恢复 Live Runtime，重置真实帧时间，再继续推进 `sceneTime`。
- 离屏期间切换 reduce 也遵循相同规则。

### 9.2 页面隐藏与离屏

- `document.hidden` 或 IntersectionObserver 判定离屏时停止 rAF。
- 不推进 `sceneTime`、状态 deadline、互动阶段或需求值。
- 恢复首帧不得补算隐藏期间的 delta。
- Observer 回调中不创建新的状态机实例或重置角色位置。

## 10. 确定性、性能与测试

### 10.1 可测试逻辑边界

随机数、时钟、状态转移和互动判定应可以注入：

```ts
interface SimulationDependencies {
  random: () => number;
  now: () => number;
}
```

同一个 seed、相同初始 Runtime 和相同 delta 输入，必须得到相同的状态与互动事件序列。若要求跨不同帧率得到完全相同轨迹，再引入固定 timestep；第一版至少保证逻辑事件序列可复现。

### 10.2 性能预算

- 每帧不查询 DOM、不读取布局、不创建 Observer。
- 每帧只写已有 SVG 元素的属性。
- 地形重绘不超过约 `24fps`。
- 60 秒性能记录中不出现由该组件产生的长任务。
- 动画运行期间主线程脚本平均预算建议不超过 `1ms/frame`。
- 离屏和页面隐藏后 rAF 完全停止。

### 10.3 逻辑测试矩阵

- `pause / wander / turn` 的所有合法转移。
- 接近边界时只生成朝内目标。
- Camera Controller 始终把双方保持在安全取景区，窗口缩放时不瞬移角色。
- 转向必须先减速，速度阈值满足后才能翻面。
- 同一 encounter 只抽签一次，离开滞回半径后才 re-arm。
- `greet` 四阶段顺序和总时长。
- `observe / rest` 的进入条件、时长与恢复链，休息期间保持站姿。
- 需求值始终位于 `[0, 1]`，隐藏时不积累。
- 喷火四阶段、地形世界坐标落点、角色路径避让和冷却。
- 站立身体的 SVG paint order 保证共享头部和两只红眼最后绘制。
- 冷却期间不能再次互动。
- 互动退出后重新规划，不恢复旧目标。
- 隐藏与离屏 30 秒后恢复，剩余状态时间保持不变。
- 同 seed 和同输入产生相同事件序列。

### 10.4 浏览器集成验证

- 桌面和移动端安全区、裁切、水平溢出。
- 初始 reduce、运行中开关 reduce、离屏时开关 reduce。
- 页面隐藏和 IntersectionObserver 暂停/恢复。
- 角色在地形坡面上的落脚、脚底滑动和转向观感。
- 互动是否抢夺正文注意力的人工视觉检查。

## 11. 推荐代码拆分

第一阶段允许继续放在 `WanderingWalker.astro`，但必须按职责拆成函数：

- `updateSceneClock(delta)`
- `updateCamera(delta)`
- `choosePetState(sceneTime)`
- `enterPetState(state, sceneTime)`
- `updatePet(delta, sceneTime)`
- `requestPetTurn(facing)`
- `tryCreateEncounter(sceneTime)`
- `updateInteraction(delta, sceneTime)`
- `resolveFinalCommands()`
- `drawPet(runtime)`
- `drawFigure(runtime)`

在加入 Phase 2 前，建议提取为：

```text
src/lib/walker/simulation.ts
src/lib/walker/pet-controller.ts
src/lib/walker/interaction-director.ts
src/lib/walker/random.ts
```

纯逻辑模块不能直接访问 DOM，组件只负责生命周期、ResizeObserver、IntersectionObserver 和 SVG 渲染。

## 12. 实施顺序与批准条件

1. 固定世界坐标、相机坐标、模拟时钟和控制权契约。
2. 抽出 Walker/Pet Runtime，让 draw 函数成为纯投影。
3. 实现独立 `pause / wander / turn` 与独立 gait。
4. 完成 Phase 1 逻辑测试和 2 分钟视觉验收。
5. 实现 Interaction Director 与唯一互动 `greet`。
6. 完成暂停恢复、reduce、冷却和互动测试。
7. 拆分共享头部并加入 `observe` 头部姿态；使用站立 `pause` 表达休息。
8. 加入需求值和姿态加权选择，验证运动预算不被破坏。
9. 加入低频喷火 Ability Director、地形落点渲染与安全门禁。

批准结论：

- Phase 1 在完成第 1～2 步契约和测试接口后可以实施。
- Phase 2 必须等待 Phase 1 无脚滑、无越界、无瞬间转向后再开始。
- Phase 3 按 3A 姿态、3B 需求值、3C 喷火顺序实施；每一步通过逻辑与视觉验收后再启用下一步。
