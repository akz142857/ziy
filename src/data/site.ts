export interface Project {
  number: string;
  title: string;
  category: string;
  year: string;
  status: 'Active' | 'Building' | 'Archive';
  description: string;
  tags: string[];
  href: string;
}

export interface LearningItem {
  number: string;
  title: string;
  label: string;
  description: string;
  status: string;
}

export interface Book {
  number: string;
  title: string;
  subtitle: string;
  kind: string;
  year: string;
  status: string;
  href?: string;
  external?: boolean;
  tone: 'vermillion' | 'ink' | 'moss';
}

export const profile = {
  name: 'ZiyOne',
  email: 'tomi@claycosmos.ai',
  github: 'https://github.com/akz142857',
  intro:
    '这里放我做的开源项目、学习记录和电子书。我主要关注 AI Agent、软件产品和知识整理。',
};

export const projects: Project[] = [
  {
    number: '01',
    title: 'ClayCosmos',
    category: 'AI Product',
    year: '2026',
    status: 'Active',
    description: '一个围绕 AI 创作流程做的产品实验。',
    tags: ['AI Agent', 'Product', 'Creative Tools'],
    href: 'https://claycosmos.ai',
  },
  {
    number: '02',
    title: 'ZiyOne',
    category: 'Open Source',
    year: '2026',
    status: 'Building',
    description: '这个个人网站的源代码，使用 Astro 构建。',
    tags: ['Astro', 'Design', 'Open Web'],
    href: 'https://github.com/akz142857/ziy',
  },
  {
    number: '03',
    title: 'X Signal Archive',
    category: 'Automation',
    year: '2026',
    status: 'Active',
    description: '抓取并归档公开的技术动态，按周生成摘要。',
    tags: ['Python', 'Research', 'Knowledge'],
    href: 'https://github.com/akz142857/ziy/tree/main/scripts',
  },
];

export const learning: LearningItem[] = [
  {
    number: '一',
    title: 'World Models',
    label: 'AI Engineering',
    description: '从表征学习、动力学建模到可执行的世界模型实验。',
    status: '阅读与实验中',
  },
  {
    number: '二',
    title: 'Agent Economy',
    label: 'Product Research',
    description: '研究 Agent 之间的协作、定价、交易与可持续产品形态。',
    status: '资料整理中',
  },
  {
    number: '三',
    title: 'English & Storytelling',
    label: 'Creative Practice',
    description: '通过绘本、写作与视觉叙事，训练更清晰的表达。',
    status: '持续练习',
  },
];

export const books: Book[] = [
  {
    number: 'B—01',
    title: 'Ontology 中文学习笔记',
    subtitle: '从业务对象、关系和逻辑，到 Action、应用、AI 与企业治理',
    kind: 'Learning Book',
    year: '2026',
    status: '阅读',
    href: 'books/ontology/',
    external: false,
    tone: 'moss',
  },
  {
    number: 'B—02',
    title: "Tomi's English Time Book",
    subtitle: '从时间开始的中英双语启蒙绘本',
    kind: 'Picture Book',
    year: '2026',
    status: '制作中',
    tone: 'vermillion',
  },
  {
    number: 'B—03',
    title: 'World Model Learning Roadmap',
    subtitle: '在本地设备上学习与实验世界模型的路线图',
    kind: 'Learning Notes',
    year: '2026',
    status: '阅读',
    href: 'https://github.com/akz142857/ziy/blob/main/docs/plans/world-model-learning-roadmap-m4pro.md',
    tone: 'ink',
  },
  {
    number: 'B—04',
    title: 'E-commerce Integration Report',
    subtitle: '淘宝、抖音与微信生态的平台对接研究',
    kind: 'Research Report',
    year: '2026',
    status: '阅读',
    href: 'https://github.com/akz142857/ziy/blob/main/docs/reports/ecommerce-platform-integration-taobao-douyin-wechat-2026.md',
    tone: 'moss',
  },
];
