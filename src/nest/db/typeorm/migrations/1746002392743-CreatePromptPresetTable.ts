import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromptPresetTable1746002392743 implements MigrationInterface {
  name = 'CreatePromptPresetTable1746002392743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_translation_history_source"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_translation_id"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL, "error" text, "model" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "translation_history"`
    );
    await queryRunner.query(`DROP TABLE "translation_history"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_translation_history" RENAME TO "translation_history"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_source" ON "translation_history" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_created_at" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_translation_id" ON "translation_history" ("translation_id") `
    );
    await queryRunner.query(`DROP INDEX "IDX_translation_file_info_id"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_last_accessed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_source"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "translation"`
    );
    await queryRunner.query(`DROP TABLE "translation"`);
    await queryRunner.query(`ALTER TABLE "temporary_translation" RENAME TO "translation"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_file_info_id" ON "translation" ("file_info_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_last_accessed_at" ON "translation" ("last_accessed_at") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_translation_source" ON "translation" ("source") `
    );
    await queryRunner.query(`DROP INDEX "IDX_file_info_file_path"`);
    await queryRunner.query(`DROP INDEX "IDX_file_info_file_name"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_source"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_translation_id"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_file_info_id"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_last_accessed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_source"`);
    await queryRunner.query(`DROP INDEX "IDX_log_timestamp"`);
    await queryRunner.query(`DROP INDEX "IDX_log_level"`);
    await queryRunner.query(`DROP INDEX "IDX_example_preset_name"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "level" text NOT NULL, "message" text NOT NULL, "context" text, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "metadata" text)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_log"("id", "level", "message", "context", "timestamp", "metadata") SELECT "id", "level", "message", "context", "timestamp", "metadata" FROM "log"`
    );
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`ALTER TABLE "temporary_log" RENAME TO "log"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_example_preset" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "description" text, "examples" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_example_preset"("id", "name", "description", "examples", "created_at", "updated_at") SELECT "id", "name", "description", "examples", "created_at", "updated_at" FROM "example_preset"`
    );
    await queryRunner.query(`DROP TABLE "example_preset"`);
    await queryRunner.query(`ALTER TABLE "temporary_example_preset" RENAME TO "example_preset"`);
    await queryRunner.query(
      `CREATE TABLE "prompt_presets" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(255) NOT NULL, "prompt" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_0c99a3fc7650bfc7a1d3c97f16d" UNIQUE ("name"))`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_file_info" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "file_name" varchar NOT NULL, "file_path" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_file_info"("id", "file_name", "file_path", "created_at", "updated_at") SELECT "id", "file_name", "file_path", "created_at", "updated_at" FROM "file_info"`
    );
    await queryRunner.query(`DROP TABLE "file_info"`);
    await queryRunner.query(`ALTER TABLE "temporary_file_info" RENAME TO "file_info"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL, "error" text, "model" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "translation_history"`
    );
    await queryRunner.query(`DROP TABLE "translation_history"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_translation_history" RENAME TO "translation_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "temporary_translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "translation"`
    );
    await queryRunner.query(`DROP TABLE "translation"`);
    await queryRunner.query(`ALTER TABLE "temporary_translation" RENAME TO "translation"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "level" varchar NOT NULL, "message" text NOT NULL, "context" text, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "metadata" text)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_log"("id", "level", "message", "context", "timestamp", "metadata") SELECT "id", "level", "message", "context", "timestamp", "metadata" FROM "log"`
    );
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`ALTER TABLE "temporary_log" RENAME TO "log"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_example_preset" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar NOT NULL, "description" text, "examples" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "updated_at" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_example_preset"("id", "name", "description", "examples", "created_at", "updated_at") SELECT "id", "name", "description", "examples", "created_at", "updated_at" FROM "example_preset"`
    );
    await queryRunner.query(`DROP TABLE "example_preset"`);
    await queryRunner.query(`ALTER TABLE "temporary_example_preset" RENAME TO "example_preset"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_5e03441e0ecb3706e9c92c0244" ON "file_info" ("file_name") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ba4d050cf03365fa429b5d4d98" ON "file_info" ("file_path") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a65364ca1df42263eb8bac26ad" ON "translation_history" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27d3509ca5a921e343271aa14f" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53982a80086fd4c860121254c0" ON "translation" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90098ba907c41e91fd6c745574" ON "translation" ("last_accessed_at") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_584b536b49e53ac81beb39a177" ON "log" ("level") `);
    await queryRunner.query(
      `CREATE INDEX "IDX_d8b227f0e8c205a131e303f3ce" ON "log" ("timestamp") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_13598c5555dba81077a3cf8ba4" ON "example_preset" ("name") `
    );
    await queryRunner.query(`DROP INDEX "IDX_a65364ca1df42263eb8bac26ad"`);
    await queryRunner.query(`DROP INDEX "IDX_27d3509ca5a921e343271aa14f"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL, "error" text, "model" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_22bb78dc77dce7f2b65bf44142e" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "translation_history"`
    );
    await queryRunner.query(`DROP TABLE "translation_history"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_translation_history" RENAME TO "translation_history"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a65364ca1df42263eb8bac26ad" ON "translation_history" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_27d3509ca5a921e343271aa14f" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(`DROP INDEX "IDX_53982a80086fd4c860121254c0"`);
    await queryRunner.query(`DROP INDEX "IDX_90098ba907c41e91fd6c745574"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer, CONSTRAINT "FK_f5842f6edb6ea31fb84968ac99c" FOREIGN KEY ("file_info_id") REFERENCES "file_info" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "translation"`
    );
    await queryRunner.query(`DROP TABLE "translation"`);
    await queryRunner.query(`ALTER TABLE "temporary_translation" RENAME TO "translation"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53982a80086fd4c860121254c0" ON "translation" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_90098ba907c41e91fd6c745574" ON "translation" ("last_accessed_at") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_90098ba907c41e91fd6c745574"`);
    await queryRunner.query(`DROP INDEX "IDX_53982a80086fd4c860121254c0"`);
    await queryRunner.query(`ALTER TABLE "translation" RENAME TO "temporary_translation"`);
    await queryRunner.query(
      `CREATE TABLE "translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "temporary_translation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_90098ba907c41e91fd6c745574" ON "translation" ("last_accessed_at") `
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_53982a80086fd4c860121254c0" ON "translation" ("source") `
    );
    await queryRunner.query(`DROP INDEX "IDX_27d3509ca5a921e343271aa14f"`);
    await queryRunner.query(`DROP INDEX "IDX_a65364ca1df42263eb8bac26ad"`);
    await queryRunner.query(
      `ALTER TABLE "translation_history" RENAME TO "temporary_translation_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer, "source" varchar NOT NULL, "target" varchar NOT NULL, "success" boolean NOT NULL, "error" text, "model" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')))`
    );
    await queryRunner.query(
      `INSERT INTO "translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "temporary_translation_history"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation_history"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_27d3509ca5a921e343271aa14f" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a65364ca1df42263eb8bac26ad" ON "translation_history" ("source") `
    );
    await queryRunner.query(`DROP INDEX "IDX_13598c5555dba81077a3cf8ba4"`);
    await queryRunner.query(`DROP INDEX "IDX_d8b227f0e8c205a131e303f3ce"`);
    await queryRunner.query(`DROP INDEX "IDX_584b536b49e53ac81beb39a177"`);
    await queryRunner.query(`DROP INDEX "IDX_90098ba907c41e91fd6c745574"`);
    await queryRunner.query(`DROP INDEX "IDX_53982a80086fd4c860121254c0"`);
    await queryRunner.query(`DROP INDEX "IDX_27d3509ca5a921e343271aa14f"`);
    await queryRunner.query(`DROP INDEX "IDX_a65364ca1df42263eb8bac26ad"`);
    await queryRunner.query(`DROP INDEX "IDX_ba4d050cf03365fa429b5d4d98"`);
    await queryRunner.query(`DROP INDEX "IDX_5e03441e0ecb3706e9c92c0244"`);
    await queryRunner.query(`ALTER TABLE "example_preset" RENAME TO "temporary_example_preset"`);
    await queryRunner.query(
      `CREATE TABLE "example_preset" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "description" text, "examples" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "example_preset"("id", "name", "description", "examples", "created_at", "updated_at") SELECT "id", "name", "description", "examples", "created_at", "updated_at" FROM "temporary_example_preset"`
    );
    await queryRunner.query(`DROP TABLE "temporary_example_preset"`);
    await queryRunner.query(`ALTER TABLE "log" RENAME TO "temporary_log"`);
    await queryRunner.query(
      `CREATE TABLE "log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "level" text NOT NULL, "message" text NOT NULL, "context" text, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "metadata" text)`
    );
    await queryRunner.query(
      `INSERT INTO "log"("id", "level", "message", "context", "timestamp", "metadata") SELECT "id", "level", "message", "context", "timestamp", "metadata" FROM "temporary_log"`
    );
    await queryRunner.query(`DROP TABLE "temporary_log"`);
    await queryRunner.query(`ALTER TABLE "translation" RENAME TO "temporary_translation"`);
    await queryRunner.query(
      `CREATE TABLE "translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "temporary_translation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation"`);
    await queryRunner.query(
      `ALTER TABLE "translation_history" RENAME TO "temporary_translation_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL, "error" text, "model" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "temporary_translation_history"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation_history"`);
    await queryRunner.query(`ALTER TABLE "file_info" RENAME TO "temporary_file_info"`);
    await queryRunner.query(
      `CREATE TABLE "file_info" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "file_name" text NOT NULL, "file_path" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "file_info"("id", "file_name", "file_path", "created_at", "updated_at") SELECT "id", "file_name", "file_path", "created_at", "updated_at" FROM "temporary_file_info"`
    );
    await queryRunner.query(`DROP TABLE "temporary_file_info"`);
    await queryRunner.query(`DROP TABLE "prompt_presets"`);
    await queryRunner.query(`ALTER TABLE "example_preset" RENAME TO "temporary_example_preset"`);
    await queryRunner.query(
      `CREATE TABLE "example_preset" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" text NOT NULL, "description" text, "examples" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updated_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP))`
    );
    await queryRunner.query(
      `INSERT INTO "example_preset"("id", "name", "description", "examples", "created_at", "updated_at") SELECT "id", "name", "description", "examples", "created_at", "updated_at" FROM "temporary_example_preset"`
    );
    await queryRunner.query(`DROP TABLE "temporary_example_preset"`);
    await queryRunner.query(`ALTER TABLE "log" RENAME TO "temporary_log"`);
    await queryRunner.query(
      `CREATE TABLE "log" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "level" text NOT NULL, "message" text NOT NULL, "context" text, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "metadata" text)`
    );
    await queryRunner.query(
      `INSERT INTO "log"("id", "level", "message", "context", "timestamp", "metadata") SELECT "id", "level", "message", "context", "timestamp", "metadata" FROM "temporary_log"`
    );
    await queryRunner.query(`DROP TABLE "temporary_log"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_example_preset_name" ON "example_preset" ("name") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_log_level" ON "log" ("level") `);
    await queryRunner.query(`CREATE INDEX "IDX_log_timestamp" ON "log" ("timestamp") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_translation_source" ON "translation" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_last_accessed_at" ON "translation" ("last_accessed_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_file_info_id" ON "translation" ("file_info_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_translation_id" ON "translation_history" ("translation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_created_at" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_source" ON "translation_history" ("source") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_file_info_file_name" ON "file_info" ("file_name") `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_file_info_file_path" ON "file_info" ("file_path") `
    );
    await queryRunner.query(`DROP INDEX "IDX_translation_source"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_last_accessed_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_file_info_id"`);
    await queryRunner.query(`ALTER TABLE "translation" RENAME TO "temporary_translation"`);
    await queryRunner.query(
      `CREATE TABLE "translation" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "last_accessed_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "file_info_id" integer, CONSTRAINT "FK_translation_file_info" FOREIGN KEY ("file_info_id") REFERENCES "file_info" ("id") ON DELETE SET NULL ON UPDATE CASCADE)`
    );
    await queryRunner.query(
      `INSERT INTO "translation"("id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id") SELECT "id", "source", "target", "success", "created_at", "last_accessed_at", "file_info_id" FROM "temporary_translation"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation"`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_translation_source" ON "translation" ("source") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_last_accessed_at" ON "translation" ("last_accessed_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_file_info_id" ON "translation" ("file_info_id") `
    );
    await queryRunner.query(`DROP INDEX "IDX_translation_history_translation_id"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_translation_history_source"`);
    await queryRunner.query(
      `ALTER TABLE "translation_history" RENAME TO "temporary_translation_history"`
    );
    await queryRunner.query(
      `CREATE TABLE "translation_history" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "translation_id" integer NOT NULL, "source" text NOT NULL, "target" text NOT NULL, "success" boolean NOT NULL, "error" text, "model" text NOT NULL, "created_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), CONSTRAINT "FK_translation_history_translation" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`
    );
    await queryRunner.query(
      `INSERT INTO "translation_history"("id", "translation_id", "source", "target", "success", "error", "model", "created_at") SELECT "id", "translation_id", "source", "target", "success", "error", "model", "created_at" FROM "temporary_translation_history"`
    );
    await queryRunner.query(`DROP TABLE "temporary_translation_history"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_translation_id" ON "translation_history" ("translation_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_created_at" ON "translation_history" ("created_at") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_source" ON "translation_history" ("source") `
    );
  }
}
