import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RecipeCard } from "@/components/RecipeCard";
import { getAllRecipes } from "@/lib/recipes";

export default function RecipesPage() {
  const recipes = getAllRecipes();

  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Recipes</h1>
        <p className="text-[var(--color-text-muted)] mb-10">
          Full pipeline specifications for Pura. Fork any recipe, simulate
          it locally, deploy to Base.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <RecipeCard key={r.slug} recipe={r} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
