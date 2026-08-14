export type Locale = 'zh' | 'en' | 'ja';

type LocalizedText = Record<Locale, string>;

export interface Project {
  number: string;
  title: string;
  category: string;
  year: string;
  status: 'active' | 'building' | 'archive';
  statusLabel: string;
  description: string;
  tags: string[];
  href: string;
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

export interface HomeCopy {
  meta: {
    title: string;
    description: string;
    ogDescription: string;
  };
  accessibility: {
    skip: string;
    mainNavigation: string;
    languageNavigation: string;
    seal: string;
    newTab: string;
    techTags: string;
  };
  nav: {
    works: string;
    books: string;
    now: string;
    about: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    intro: string;
    projectsLink: string;
    writingLink: string;
  };
  works: {
    label: string;
    title: string;
    intro: string;
  };
  books: {
    label: string;
    title: string;
    intro: string;
  };
  now: {
    label: string;
    title: string;
    updated: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  about: {
    label: string;
    title: string;
    lines: [string, string];
    body: string;
    invitation: string;
    emailLink: string;
  };
  footer: {
    builtWith: string;
    backToTop: string;
  };
}

export const localeInfo: Record<Locale, {
  htmlLang: string;
  ogLocale: string;
  path: string;
  label: string;
  shortLabel: string;
}> = {
  zh: {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    path: '',
    label: '中文',
    shortLabel: '中',
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    path: 'en/',
    label: 'English',
    shortLabel: 'EN',
  },
  ja: {
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    path: 'ja/',
    label: '日本語',
    shortLabel: '日',
  },
};

export const supportedLocales = Object.keys(localeInfo) as Locale[];

export const homeCopy: Record<Locale, HomeCopy> = {
  zh: {
    meta: {
      title: 'Ziy｜AI 创作工具、Agent 与学习写作',
      description: 'Ziy 的个人数字档案：探索 AI 原生创作，并公开项目、研究笔记与电子书。',
      ogDescription: 'Ziy 在 ClayCosmos 探索 AI 原生创作，并把实践写成项目和书。',
    },
    accessibility: {
      skip: '跳到主要内容',
      mainNavigation: '主导航',
      languageNavigation: '选择语言',
      seal: 'ZiyOne 印章',
      newTab: '在新标签页打开',
      techTags: '技术标签',
    },
    nav: { works: '项目', books: '写作', now: '此刻', about: '关于' },
    hero: {
      eyebrow: '艺术软件工程师 / AI 产品实践者',
      title: '以软件为器，让创作与学习更自在。',
      intro: '我是 Ziy。我在 ClayCosmos 探索 AI 原生创作，也把关于 Agent、知识系统与学习的实践写成项目和书。',
      projectsLink: '看正在做的事',
      writingLink: '读学习笔记',
    },
    works: { label: '项目', title: '正在做的事', intro: '少量，但持续。这里是正在运行、构建和归档中的项目。' },
    books: { label: '写作', title: '把学习写成书', intro: '将复杂问题整理成可以反复阅读的路径。' },
    now: {
      label: '此刻',
      title: '此刻',
      updated: '更新于 2026.08',
      items: [
        { title: 'ClayCosmos', description: '推进 AI 原生创作流程与 Agent 产品实验。' },
        { title: 'Ontology 写作', description: '把企业知识、行动与 AI 的关系整理成中文学习路径。' },
        { title: 'Agent 研究', description: '持续观察个人知识系统与 Agent 协作方式。' },
      ],
    },
    about: {
      label: '关于',
      title: '关于',
      lines: ['好的工具会退到身后，', '让人专注于正在做的事。'],
      body: '于是我做产品、写代码，也把学习整理成书。',
      invitation: '如果你也在做 AI 创作工具、Agent 或个人知识系统，欢迎来信交换想法。',
      emailLink: '写信给我',
    },
    footer: { builtWith: '使用 Astro 构建。', backToTop: '回到顶部 ↑' },
  },
  en: {
    meta: {
      title: 'Ziy | AI creative tools, agents, and learning in public',
      description: 'Ziy’s digital archive of AI-native creative tools, open projects, research notes, and books.',
      ogDescription: 'Ziy explores AI-native creation at ClayCosmos and turns the practice into projects and books.',
    },
    accessibility: {
      skip: 'Skip to main content',
      mainNavigation: 'Main navigation',
      languageNavigation: 'Choose language',
      seal: 'ZiyOne seal',
      newTab: 'Opens in a new tab',
      techTags: 'Technology tags',
    },
    nav: { works: 'Works', books: 'Writing', now: 'Now', about: 'About' },
    hero: {
      eyebrow: 'Artistic software engineer / AI product builder',
      title: 'Quieter tools for creating and learning with AI.',
      intro: 'I’m Ziy. At ClayCosmos I explore AI-native creation, then turn what I learn about agents and knowledge systems into open projects and books.',
      projectsLink: 'See what I’m building',
      writingLink: 'Read the notes',
    },
    works: { label: 'Projects', title: 'What I’m building', intro: 'A small, evolving set of products, tools, and archives.' },
    books: { label: 'Writing', title: 'Learning, written down', intro: 'Complex questions arranged into paths worth returning to.' },
    now: {
      label: 'Now',
      title: 'Now',
      updated: 'Updated 2026.08',
      items: [
        { title: 'ClayCosmos', description: 'Shaping AI-native creative workflows and agent product experiments.' },
        { title: 'Ontology notes', description: 'Turning enterprise knowledge, action, and AI into a Chinese learning path.' },
        { title: 'Agent research', description: 'Studying personal knowledge systems and new ways for agents to collaborate.' },
      ],
    },
    about: {
      label: 'About',
      title: 'About',
      lines: ['Good tools recede,', 'so the work can come forward.'],
      body: 'That is why I build products, write code, and turn learning into books.',
      invitation: 'If you are exploring AI creative tools, agents, or personal knowledge systems, I would be glad to exchange ideas.',
      emailLink: 'Write to me',
    },
    footer: { builtWith: 'Built with Astro.', backToTop: 'Back to top ↑' },
  },
  ja: {
    meta: {
      title: 'Ziy｜AI創作ツール、エージェント、学びの記録',
      description: 'AIネイティブな創作を探りながら、プロジェクト、研究ノート、書籍を公開するZiyのデジタルアーカイブ。',
      ogDescription: 'ClayCosmosでAIネイティブな創作を探り、その実践をプロジェクトと書籍にまとめています。',
    },
    accessibility: {
      skip: 'メインコンテンツへ移動',
      mainNavigation: 'メインナビゲーション',
      languageNavigation: '言語を選択',
      seal: 'ZiyOneの印章',
      newTab: '新しいタブで開きます',
      techTags: '技術タグ',
    },
    nav: { works: '作品', books: '文章', now: 'いま', about: '私について' },
    hero: {
      eyebrow: 'アーティスティック・ソフトウェアエンジニア / AIプロダクトビルダー',
      title: 'ソフトウェアを道具に、創作と学びをもっと自由に。',
      intro: 'Ziyです。ClayCosmosでAIネイティブな創作を探り、エージェントや知識システムについての実践を、プロジェクトと本にまとめています。',
      projectsLink: 'いま作っているもの',
      writingLink: '学びの記録を読む',
    },
    works: { label: '作品', title: 'いま作っているもの', intro: '数は少なく、歩みは止めず。運用中、開発中、記録中のプロジェクトです。' },
    books: { label: '文章', title: '学びを、本にする', intro: '複雑な問いを、何度も読み返せる道筋へ。' },
    now: {
      label: 'いま',
      title: 'いま',
      updated: '2026.08 更新',
      items: [
        { title: 'ClayCosmos', description: 'AIネイティブな創作フローとエージェント製品を実験中。' },
        { title: 'Ontology 執筆', description: '企業の知識・行動・AIの関係を中国語の学習経路に整理中。' },
        { title: 'Agent リサーチ', description: '個人知識システムとエージェントの協働方法を観察中。' },
      ],
    },
    about: {
      label: '私について',
      title: '私について',
      lines: ['よい道具は、一歩退き、', '人を目の前の営みに戻す。'],
      body: 'だから、プロダクトを作り、コードを書き、学びを本にしています。',
      invitation: 'AI創作ツール、エージェント、個人知識システムに取り組んでいる方と、考えを交わせたらうれしいです。',
      emailLink: 'メールを書く',
    },
    footer: { builtWith: 'Astroで構築。', backToTop: 'ページ上部へ ↑' },
  },
};

export const profile = {
  name: 'ZiyOne',
  email: 'z@ziy.one',
  github: 'https://github.com/akz142857',
};

const projectRecords: Array<Omit<Project, 'description' | 'statusLabel'> & {
  descriptions: LocalizedText;
  statusLabels: LocalizedText;
}> = [
  {
    number: '01',
    title: 'ClayCosmos',
    category: 'AI Product',
    year: '2026',
    status: 'active',
    statusLabels: { zh: '活跃', en: 'Active', ja: '運用中' },
    descriptions: {
      zh: '把 Agent、生成与迭代组织成可以持续使用的 AI 创作流程。',
      en: 'Organizing agents, generation, and iteration into a creative workflow people can keep using.',
      ja: 'エージェント、生成、反復を、継続して使えるAI創作フローにまとめています。',
    },
    tags: ['AI Agent', 'Product', 'Creative Tools'],
    href: 'https://claycosmos.ai',
  },
  {
    number: '02',
    title: 'ZiyOne',
    category: 'Open Source',
    year: '2026',
    status: 'building',
    statusLabels: { zh: '开发中', en: 'Building', ja: '開発中' },
    descriptions: {
      zh: '一座持续生长的个人数字档案，公开留存作品、实验与写作。',
      en: 'A living personal archive where projects, experiments, and writing remain open.',
      ja: '作品、実験、文章を公開しながら育てていく個人デジタルアーカイブ。',
    },
    tags: ['Astro', 'Design', 'Open Web'],
    href: 'https://github.com/akz142857/ziy',
  },
  {
    number: '03',
    title: 'X Signal Archive',
    category: 'Automation',
    year: '2026',
    status: 'active',
    statusLabels: { zh: '活跃', en: 'Active', ja: '運用中' },
    descriptions: {
      zh: '每日归档公开技术动态，并压缩成可回看的每周研究摘要。',
      en: 'Archiving public technology signals each day and compressing them into weekly research digests.',
      ja: '公開技術シグナルを毎日保存し、振り返れる週次リサーチ要約にまとめます。',
    },
    tags: ['Python', 'Research', 'Knowledge'],
    href: 'https://github.com/akz142857/ziy/tree/main/scripts',
  },
];

const bookRecords: Array<Omit<Book, 'title' | 'subtitle' | 'kind' | 'status'> & {
  titles: LocalizedText;
  subtitles: LocalizedText;
  kinds: LocalizedText;
  statuses: LocalizedText;
}> = [
  {
    number: 'B—01',
    titles: {
      zh: 'Ontology 中文学习笔记',
      en: 'Ontology Study Notes in Chinese',
      ja: 'Ontology 中国語学習ノート',
    },
    subtitles: {
      zh: '从业务对象、关系和逻辑，到 Action、应用、AI 与企业治理',
      en: 'From business objects, relationships, and logic to Actions, apps, AI, and enterprise governance',
      ja: 'ビジネスオブジェクト、関係、ロジックからAction、アプリ、AI、企業ガバナンスまで',
    },
    kinds: { zh: '学习读物', en: 'Learning Book', ja: '学習ブック' },
    year: '2026',
    statuses: { zh: '阅读', en: 'Read', ja: '読む' },
    href: 'books/ontology/',
    external: false,
    tone: 'moss',
  },
  {
    number: 'B—02',
    titles: {
      zh: "Tomi's English Time Book",
      en: "Tomi's English Time Book",
      ja: "Tomi's English Time Book",
    },
    subtitles: {
      zh: '从时间开始的中英双语启蒙绘本',
      en: 'A Chinese–English picture book that begins with learning time',
      ja: '時間の学びから始まる、中国語・英語のバイリンガル絵本',
    },
    kinds: { zh: '绘本', en: 'Picture Book', ja: '絵本' },
    year: '2026',
    statuses: { zh: '制作中', en: 'In progress', ja: '制作中' },
    tone: 'vermillion',
  },
  {
    number: 'B—03',
    titles: {
      zh: 'World Model Learning Roadmap',
      en: 'World Model Learning Roadmap',
      ja: 'World Model Learning Roadmap',
    },
    subtitles: {
      zh: '在本地设备上学习与实验世界模型的路线图',
      en: 'A roadmap for learning and experimenting with world models on local devices',
      ja: 'ローカルデバイスで世界モデルを学び、実験するためのロードマップ',
    },
    kinds: { zh: '学习笔记', en: 'Learning Notes', ja: '学習ノート' },
    year: '2026',
    statuses: { zh: '阅读', en: 'Read', ja: '読む' },
    href: 'https://github.com/akz142857/ziy/blob/main/docs/plans/world-model-learning-roadmap-m4pro.md',
    tone: 'ink',
  },
  {
    number: 'B—04',
    titles: {
      zh: 'E-commerce Integration Report',
      en: 'E-commerce Integration Report',
      ja: 'E-commerce Integration Report',
    },
    subtitles: {
      zh: '淘宝、抖音与微信生态的平台对接研究',
      en: 'Platform integration research across the Taobao, Douyin, and WeChat ecosystems',
      ja: '淘宝、Douyin、WeChatエコシステムのプラットフォーム連携調査',
    },
    kinds: { zh: '研究报告', en: 'Research Report', ja: '調査レポート' },
    year: '2026',
    statuses: { zh: '阅读', en: 'Read', ja: '読む' },
    href: 'https://github.com/akz142857/ziy/blob/main/docs/reports/ecommerce-platform-integration-taobao-douyin-wechat-2026.md',
    tone: 'moss',
  },
];

export const getProjects = (locale: Locale): Project[] =>
  projectRecords.map(({ descriptions, statusLabels, ...project }) => ({
    ...project,
    description: descriptions[locale],
    statusLabel: statusLabels[locale],
  }));

export const getBooks = (locale: Locale): Book[] =>
  bookRecords.map(({ titles, subtitles, kinds, statuses, ...book }) => ({
    ...book,
    title: titles[locale],
    subtitle: subtitles[locale],
    kind: kinds[locale],
    status: statuses[locale],
  }));
