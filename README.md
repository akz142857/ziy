# ZiyOne

ZiyOne 是一个使用 **Astro + Bun** 构建的个人数字档案，用来收录开源项目、学习实验与电子书。

站点保持单页结构，视觉方向受日本设计中的留白、克制与用之美启发。

## 开发

```bash
bun install        # 安装依赖
bun run dev        # 本地开发 http://localhost:4321/ZiyOne
bun run build      # 构建到 dist/
bun run preview    # 预览构建产物
bun run check      # 类型检查
```

## 内容维护

编辑 `src/data/site.ts` 即可更新个人信息、项目、学习路径与电子书。

### 电子书存储约定

```text
src/content/books/<book-slug>/   # Markdown 原稿，内容的唯一来源
src/data/<book-slug>.ts          # 章节、分组和简介元数据
src/pages/books/<book-slug>/     # 书籍首页与阅读路由
src/layouts/                     # 书籍专用页面外壳
src/styles/<book-slug>.css       # 书籍独立样式，不影响个人首页
public/books/<book-slug>/        # 封面、分享图与其他静态资源
```

`Ontology` 已迁移到 `books/ontology` 命名空间。后续修改书稿时，以
`src/content/books/ontology/*.md` 为准，不再依赖原始 `Ontology/site`
项目。

## X 归档脚本

`scripts/` 下另有独立的 X/Twitter 公开推文归档与周报脚本,见 [`data/x/README.md`](data/x/README.md)。

## 规划

见 [`docs/plans/`](docs/plans/)。
