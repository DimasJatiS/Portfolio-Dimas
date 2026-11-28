import { defineField, defineType } from "sanity";
import { requireEn } from "./i18n";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "heroLabel", type: "string", initialValue: "LONG LIVE LEARNER", description: "Not translated." }),
    defineField({ name: "heroStatement", type: "localeString", description: "≤ 80 characters. Wrap one word in *asterisks* for the bronze italic accent.", validation: (r) => requireEn(r) as never }),
    defineField({ name: "manifesto", type: "localeText", description: "3–4 sentences. *One* accent word.", validation: (r) => requireEn(r) as never }),
    defineField({ name: "portrait", type: "altImage", description: "Your photo for the About section. Portrait 4:5, at least 1600 px wide. Shown grayscale, colour on hover." }),
    defineField({ name: "email", type: "string", validation: (r) => r.email() }),
    defineField({ name: "linkedin", title: "LinkedIn URL", type: "url" }),
    defineField({ name: "github", title: "GitHub URL", type: "url" }),
    defineField({ name: "repoUrl", title: "Website source URL", type: "url", description: "Footer “Source” link." }),
    defineField({
      name: "cv",
      title: "CV (PDF, ≤ 500 KB)",
      type: "file",
      options: { accept: "application/pdf" },
      description: "Served at /cv.pdf.",
    }),
  ],
  preview: { prepare: () => ({ title: "Site settings" }) },
});
