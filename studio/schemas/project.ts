import { defineArrayMember, defineField, defineType } from "sanity";
import { requireEn } from "./i18n";

type Doc = { featured?: boolean };

export const project = defineType({
  name: "project",
  title: "Project",
  type: "document",
  groups: [{ name: "card", title: "Card", default: true }, { name: "case", title: "Case study" }],
  fields: [
    defineField({ name: "title", type: "string", group: "card", validation: (r) => r.required() }),
    defineField({ name: "slug", type: "slug", group: "card", options: { source: "title" }, validation: (r) => r.required() }),
    defineField({ name: "featured", type: "boolean", group: "card", initialValue: false, description: "Featured card + zoom-gallery cover." }),
    defineField({ name: "order", type: "number", group: "card", description: "Projects are listed newest year first; this only orders projects of the same year (1 = first).", validation: (r) => r.required() }),
    defineField({ name: "summary", type: "localeText", group: "card", description: "One sentence.", validation: (r) => requireEn(r) as never }),
    defineField({ name: "role", type: "string", group: "card" }),
    defineField({ name: "year", type: "string", group: "card" }),
    defineField({ name: "duration", type: "string", group: "card" }),
    defineField({ name: "team", type: "string", group: "card" }),
    defineField({ name: "stack", type: "array", group: "card", of: [{ type: "string" }], options: { layout: "tags" } }),
    defineField({
      name: "glyph",
      type: "string",
      group: "card",
      initialValue: "generic",
      options: { list: ["tbxxpert", "cv", "chat", "flower", "grid", "shard", "chain", "trophy", "stopwatch", "pulse", "console", "portfolio", "chicken", "bolt", "podium", "basketball", "generic"] },
      description: "2D glyph (A3) shown in the gallery and on the card.",
    }),
    defineField({ name: "cover", type: "altImage", group: "card", description: "1440 px or wider. Shown grayscale; colour on hover. Without a cover the glyph is shown." }),
    defineField({ name: "galleryTile", type: "boolean", group: "card", initialValue: true, description: "Include in the Work zoom gallery." }),
    defineField({ name: "liveUrl", type: "url", group: "card" }),
    defineField({ name: "repoUrl", type: "url", group: "card" }),
    defineField({
      name: "problem",
      type: "localeBlocks",
      group: "case",
      validation: (r) => r.custom((v: { en?: unknown[] } | undefined, ctx) => ((ctx.document as Doc)?.featured && !v?.en?.length ? "Featured projects need a problem" : true)),
    }),
    defineField({ name: "process", type: "localeBlocks", group: "case" }),
    defineField({
      name: "decisions",
      title: "Key decisions",
      type: "array",
      group: "case",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "title", type: "localeString" }),
            defineField({ name: "body", type: "localeText" }),
            defineField({
              name: "code",
              type: "object",
              fields: [defineField({ name: "language", type: "string" }), defineField({ name: "code", type: "text", rows: 8 })],
            }),
          ],
          preview: { select: { title: "title.en" } },
        }),
      ],
      validation: (r) => r.custom((v: unknown[] | undefined, ctx) => ((ctx.document as Doc)?.featured && !v?.length ? "Featured projects need at least one decision" : true)),
    }),
    defineField({ name: "results", type: "localeBlocks", group: "case" }),
    defineField({ name: "gallery", type: "array", group: "case", of: [{ type: "altImage" }] }),
  ],
  orderings: [{ title: "Order", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "summary.en", media: "cover" } },
});
