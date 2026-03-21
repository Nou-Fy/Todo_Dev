// prisma.config.ts (à la racine du projet)
import "dotenv/config"; // charge ton .env
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma", // chemin relatif au config file

  datasource: {
    url: env("DATABASE_URL"), // utilise env() pour sécurité type + erreur si manquant
    // Si tu as un shadow DB pour migrations (rare), ajoute :
    // shadowUrl: env("SHADOW_DATABASE_URL"),
  },

  migrations: {
    path: "prisma/migrations", // dossier des migrations
    // seed: "ts-node prisma/seed.ts",  // si tu as un seed script
  },
});
