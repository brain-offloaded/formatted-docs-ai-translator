import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1720000000000 implements MigrationInterface {
  name = 'InitSchema1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // WAL 모드 활성화
    // await queryRunner.query(`PRAGMA journal_mode = WAL;`);
    // await queryRunner.query(`PRAGMA synchronous = NORMAL;`);
    // await queryRunner.query(`PRAGMA foreign_keys = ON;`);

    // file_info 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "file_info" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        "file_name" TEXT NOT NULL, 
        "file_path" TEXT NOT NULL, 
        "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP), 
        "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )`
    );

    // 인덱스 생성
    await queryRunner.query(`CREATE INDEX "IDX_file_info_file_name" ON "file_info" ("file_name")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_file_info_file_path" ON "file_info" ("file_path")`
    );

    // translation 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "translation" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        "source" TEXT NOT NULL,
        "target" TEXT NOT NULL, 
        "success" BOOLEAN NOT NULL DEFAULT (1), 
        "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP), 
        "last_accessed_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP), 
        "file_info_id" INTEGER,
        CONSTRAINT "FK_translation_file_info" FOREIGN KEY ("file_info_id") REFERENCES "file_info" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )`
    );

    // 인덱스 생성
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_translation_source" ON "translation" ("source")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_last_accessed_at" ON "translation" ("last_accessed_at")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_file_info_id" ON "translation" ("file_info_id")`
    );

    // translation_history 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "translation_history" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        "translation_id" INTEGER NOT NULL, 
        "source" TEXT NOT NULL, 
        "target" TEXT NOT NULL, 
        "success" BOOLEAN NOT NULL, 
        "error" TEXT, 
        "model" TEXT NOT NULL, 
        "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        CONSTRAINT "FK_translation_history_translation" FOREIGN KEY ("translation_id") REFERENCES "translation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )`
    );

    // 인덱스 생성
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_translation_id" ON "translation_history" ("translation_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_created_at" ON "translation_history" ("created_at")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_translation_history_source" ON "translation_history" ("source")`
    );

    // log 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "log" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        "level" TEXT NOT NULL, 
        "message" TEXT NOT NULL, 
        "context" TEXT, 
        "timestamp" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP), 
        "metadata" TEXT
      )`
    );

    // 인덱스 생성
    await queryRunner.query(`CREATE INDEX "IDX_log_level" ON "log" ("level")`);
    await queryRunner.query(`CREATE INDEX "IDX_log_timestamp" ON "log" ("timestamp")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 테이블 삭제 (역순)
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`DROP TABLE "translation_history"`);
    await queryRunner.query(`DROP TABLE "translation"`);
    await queryRunner.query(`DROP TABLE "file_info"`);
  }
}
