export interface OntologyLesson {
  slug: string;
  shortTitle: string;
  description: string;
}

export interface OntologyTrack {
  name: string;
  range: string;
  description: string;
  lessons: string[];
}

export const ontologyLessons: OntologyLesson[] = [
  { slug: '01', shortTitle: '理解 Ontology', description: '用外卖业务建立最核心的直觉' },
  { slug: '02', shortTitle: '最小本体', description: '动手推演 Object、Link 与 Action' },
  { slug: '03', shortTitle: '四种模型的区别', description: 'ER、知识图谱、DDD 与 Ontology' },
  { slug: '04', shortTitle: '从决策开始设计', description: '避免把数据库表机械复制成本体' },
  { slug: '05', shortTitle: '预测性维护闭环', description: '从传感器数据到维修决定' },
  { slug: '06', shortTitle: 'Foundry 全景', description: '数据怎样进入运营工作流' },
  { slug: '07', shortTitle: '数据成为 Object', description: '主键、索引、Links 与用户编辑' },
  { slug: '08', shortTitle: '企业 Ontology', description: '复用、扩展、演进与治理' },
  { slug: '09', shortTitle: '逻辑怎样分工', description: 'Pipeline、Automation、Function 与 Model' },
  { slug: '10', shortTitle: 'Action 决策闭环', description: '事务、副作用、写回与补偿' },
  { slug: '11', shortTitle: '应用、API 与 AI', description: 'OSDK、MCP 与 Agent 的消费方式' },
  { slug: '12', shortTitle: '权限与验收', description: '让 Ontology 长期可信' },
  { slug: '13', shortTitle: 'ERP 进销存', description: '采购、库存、销售与履约闭环' },
  { slug: '14', shortTitle: 'Supply & Demand Planning', description: '约束、Scenario、计划发布与复盘' },
];

export const ontologyTracks: OntologyTrack[] = [
  { name: '建立直觉', range: '01—04', description: '理解本体是什么，以及怎样从业务问题开始建模。', lessons: ['01', '02', '03', '04'] },
  { name: '看懂闭环', range: '05—07', description: '把 Foundry 数据基础连接到真实业务对象和完整决策。', lessons: ['05', '06', '07'] },
  { name: '走向生产', range: '08—12', description: '掌握逻辑、行动、应用、安全和企业治理。', lessons: ['08', '09', '10', '11', '12'] },
  { name: '迁移到企业案例', range: '13—14', description: '把核心方法应用到 ERP 进销存和供需计划。', lessons: ['13', '14'] },
];

export function getOntologyLesson(slug: string) {
  return ontologyLessons.find((lesson) => lesson.slug === slug);
}
