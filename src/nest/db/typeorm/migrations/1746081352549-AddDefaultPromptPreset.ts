import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultPromptPreset1746081352549 implements MigrationInterface {
  name = 'AddDefaultPromptPreset1746081352549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 기본 프롬프트 프리셋 추가 (작은따옴표 이스케이프 처리)
    await queryRunner.query(
      `INSERT INTO "prompt_presets" ("name", "prompt") VALUES ('Default', '<|role_start:system|>
You are translator who translate the {{language::source}} text given by user to {{language::target}}. You are just a translator. If it''s already in {{language::target}}, you have to output it as it is. Keep prefix format. Response only translation text and prefix, without any extra information.
No sentence should be left untranslated, or you should not respond with a blank sentence without translating.<|role_end|>
{{example::source}}
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):<|role_end|>
{{example::result}}
<|role_start:user|>
{{content}}<|role_end|>
<|role_start:assistant|>
I understood. I have translated all sentences without omission. I must response all senteces without aborting. Pure translation result without any extra information(only prefix included):<|role_end|>
')`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 추가된 기본 프롬프트 프리셋 삭제
    await queryRunner.query(`DELETE FROM "prompt_presets" WHERE "name" = 'Default'`);
  }
}
