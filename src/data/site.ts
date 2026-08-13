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
    about: string;
  };
  hero: {
    title: string;
    projectsLink: string;
  };
  works: {
    title: string;
    intro: string;
  };
  books: {
    title: string;
    intro: string;
  };
  about: {
    title: string;
    lines: [string, string];
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
      title: 'ZiyOne｜Ziy 的个人网站',
      description: 'Ziy 的个人网站，收录开源项目、学习记录和电子书。',
      ogDescription: 'Ziy 的项目、学习记录和电子书。',
    },
    accessibility: {
      skip: '跳到主要内容',
      mainNavigation: '主导航',
      languageNavigation: '选择语言',
      seal: 'ZiyOne 印章',
      newTab: '在新标签页打开',
      techTags: '技术标签',
    },
    nav: { works: '项目', books: '书籍', about: '关于' },
    hero: { title: '我是Ziy', projectsLink: '查看项目' },
    works: { title: '项目', intro: '正在做和以前做过的一些项目。' },
    books: { title: '电子书', intro: '正在写或已经整理完成的书与文档。' },
    about: { title: '关于', lines: ['一名艺术软件工程师', '和理想主义者。'] },
    footer: { builtWith: '使用 Astro 构建。', backToTop: '回到顶部 ↑' },
  },
  en: {
    meta: {
      title: 'ZiyOne | Ziy’s personal website',
      description: 'Ziy’s personal website for open-source projects, learning notes, and books.',
      ogDescription: 'Projects, learning notes, and books by Ziy.',
    },
    accessibility: {
      skip: 'Skip to main content',
      mainNavigation: 'Main navigation',
      languageNavigation: 'Choose language',
      seal: 'ZiyOne seal',
      newTab: 'Opens in a new tab',
      techTags: 'Technology tags',
    },
    nav: { works: 'Works', books: 'Books', about: 'About' },
    hero: { title: 'I’m Ziy', projectsLink: 'View projects' },
    works: { title: 'Projects', intro: 'A selection of what I’m building and what I’ve made.' },
    books: { title: 'Books', intro: 'Books and notes in progress or already complete.' },
    about: { title: 'About', lines: ['An artistic software engineer', 'and an idealist.'] },
    footer: { builtWith: 'Built with Astro.', backToTop: 'Back to top ↑' },
  },
  ja: {
    meta: {
      title: 'ZiyOne｜Ziyの個人サイト',
      description: 'Ziyの個人サイト。オープンソースプロジェクト、学習ノート、書籍を紹介しています。',
      ogDescription: 'Ziyのプロジェクト、学習ノート、書籍。',
    },
    accessibility: {
      skip: 'メインコンテンツへ移動',
      mainNavigation: 'メインナビゲーション',
      languageNavigation: '言語を選択',
      seal: 'ZiyOneの印章',
      newTab: '新しいタブで開きます',
      techTags: '技術タグ',
    },
    nav: { works: '作品', books: '書籍', about: '私について' },
    hero: { title: 'Ziyです', projectsLink: 'プロジェクトを見る' },
    works: { title: 'プロジェクト', intro: 'いま取り組んでいることと、これまでに作ったもの。' },
    books: { title: '書籍', intro: '執筆中、またはまとめ終えた本とドキュメント。' },
    about: { title: '私について', lines: ['アートを愛するソフトウェアエンジニア', 'そして、理想主義者。'] },
    footer: { builtWith: 'Astroで構築。', backToTop: 'ページ上部へ ↑' },
  },
};

export const profile = {
  name: 'ZiyOne',
  email: 'tomi@claycosmos.ai',
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
      zh: '一个围绕 AI 创作流程做的产品实验。',
      en: 'A product experiment exploring AI-assisted creative workflows.',
      ja: 'AIを活用した創作ワークフローを探るプロダクト実験。',
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
      zh: '这个个人网站的源代码，使用 Astro 构建。',
      en: 'The source code for this personal website, built with Astro.',
      ja: 'Astroで構築した、この個人サイトのソースコード。',
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
      zh: '抓取并归档公开的技术动态，按周生成摘要。',
      en: 'Collects and archives public tech updates, then produces weekly digests.',
      ja: '公開されている技術動向を収集・保存し、週ごとの要約を作成。',
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
