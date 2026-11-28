import { defineQuery } from "next-sanity";

const image = `{ "url": asset->url, "width": asset->metadata.dimensions.width, "height": asset->metadata.dimensions.height, alt }`;

/** One query for the whole site: content is small, and one cache tag keeps revalidation simple. */
export const contentQuery = defineQuery(`{
  "settings": *[_type == "siteSettings"][0]{
    heroLabel, heroStatement, manifesto, "portrait": portrait${image},
    email, linkedin, github, repoUrl, "cvUrl": cv.asset->url
  },
  "projects": *[_type == "project" && defined(slug.current)] | order(order asc){
    title, "slug": slug.current, featured, order, summary, role, year, duration, team, stack, glyph,
    galleryTile, liveUrl, repoUrl, problem, process, results, decisions,
    "cover": cover${image}, "gallery": gallery[]${image}
  },
  "activities": *[_type == "activity" && defined(slug.current)] | order(order asc){
    title, "slug": slug.current, org, type, startDate, endDate, summary, body, url, featured, order, glyph,
    "cover": cover${image}, "gallery": gallery[]${image}
  },
  "skills": *[_type == "skillGroup"] | order(order asc){ title, items, order }
}`);
