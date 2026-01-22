import { sql } from "drizzle-orm";
import { db } from "../db";

async function main() {
  console.log("Fixing database...");
  try {
    await db.execute(
      sql`ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "options" text;`
    );
    console.log("Successfully added 'options' column to 'questions' table.");
  } catch (error) {
    console.error("Error fixing database:", error);
  }
  process.exit(0);
}

main();
