import fs from "fs";
import path from "path";
import YAML from "yaml";
import type { Recipe, AtomicPattern } from "./types";

const RECIPES_DIR = path.join(process.cwd(), "content", "recipes");
const PATTERNS_DIR = path.join(process.cwd(), "content", "patterns");

export function getAllRecipes(): Recipe[] {
  const files = fs.readdirSync(RECIPES_DIR).filter((f) => f.endsWith(".yaml"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(RECIPES_DIR, file), "utf-8");
    const data = YAML.parse(raw);
    return { ...data, slug: file.replace(".yaml", "") } as Recipe;
  });
}

export function getRecipeBySlug(slug: string): Recipe | null {
  const filePath = path.join(RECIPES_DIR, `${slug}.yaml`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = YAML.parse(raw);
  return { ...data, slug } as Recipe;
}

export function getAllPatterns(): AtomicPattern[] {
  const files = fs
    .readdirSync(PATTERNS_DIR)
    .filter((f) => f.endsWith(".yaml"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(PATTERNS_DIR, file), "utf-8");
    const data = YAML.parse(raw);
    return { ...data, slug: file.replace(".yaml", "") } as AtomicPattern;
  });
}

export function getPatternBySlug(slug: string): AtomicPattern | null {
  const filePath = path.join(PATTERNS_DIR, `${slug}.yaml`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const data = YAML.parse(raw);
  return { ...data, slug } as AtomicPattern;
}

export function getRawYaml(type: "recipes" | "patterns", slug: string): string {
  const dir = type === "recipes" ? RECIPES_DIR : PATTERNS_DIR;
  const filePath = path.join(dir, `${slug}.yaml`);
  if (!fs.existsSync(filePath)) return "";
  return fs.readFileSync(filePath, "utf-8");
}
