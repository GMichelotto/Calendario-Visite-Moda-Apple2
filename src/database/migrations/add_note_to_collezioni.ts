// src/database/migrations/add_note_to_collezioni.ts
export async function up(db: Database): Promise<void> {
  await db.exec(`
    ALTER TABLE Collezioni 
    ADD COLUMN note TEXT;
  `);
}

export async function down(db: Database): Promise<void> {
  await db.exec(`
    ALTER TABLE Collezioni 
    DROP COLUMN note;
  `);
}
