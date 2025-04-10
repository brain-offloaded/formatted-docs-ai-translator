import { MigrationInterface, QueryRunner } from 'typeorm';
import { Language } from '../../../../utils/language';

export class AddExamplePreset1720000001000 implements MigrationInterface {
  name = 'AddExamplePreset1720000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // example_preset 테이블 생성
    await queryRunner.query(
      `CREATE TABLE "example_preset" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
        "name" TEXT NOT NULL, 
        "description" TEXT, 
        "examples" TEXT NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP), 
        "updated_at" DATETIME NOT NULL DEFAULT (CURRENT_TIMESTAMP)
      )`
    );

    // 인덱스 생성
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_example_preset_name" ON "example_preset" ("name")`
    );

    // 기본 예제 데이터 삽입
    const defaultExamples = {
      [Language.CHINESE]: {
        sourceLines: [
          '令人瞩目的技术发展正在重塑现代社会的结构，并对个人的日常生活和价值观产生着深远的影响。',
          '在被夕阳晚霞染红的秋日天空下，金黄色的枫叶在风中轻柔地飘散，营造出了一幅令人难忘的景象。',
          '挑战不熟悉的领域有时会伴随着恐惧，但持续的努力和积极的心态最终将带来惊人的成长和成就。',
        ],
        resultLines: [
          '눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.',
          '해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.',
          '익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다.',
        ],
      },
      [Language.ENGLISH]: {
        sourceLines: [
          "Dazzling technological advancements are reshaping the structure of modern society and profoundly influencing individuals' daily lives and values.",
          'Beneath the autumn sky dyed red by the sunset glow, golden maple leaves gently scattered in the wind, creating an unforgettable scene.',
          'Challenging oneself in an unfamiliar field sometimes involves fear, but consistent effort and a positive mindset will ultimately lead to surprising growth and accomplishment.',
        ],
        resultLines: [
          '눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.',
          '해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.',
          '익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다.',
        ],
      },
      [Language.JAPANESE]: {
        sourceLines: [
          '目覚ましい技術発展は現代社会の構造を再編しており、個人の日常生活や価値観にも深い影響を与えています。',
          '日没の夕焼けが赤く染まった秋空の下、黄金色に染まった紅葉が風にやさしく舞い散り、忘れられない風景を醸し出していました。',
          '慣れない分野に挑戦することは時に恐れを伴いますが、地道な努力と前向きな心構えは、最終的に驚くべき成長と達成につながるでしょう。',
        ],
        resultLines: [
          '눈부신 기술 발전은 현대 사회의 구조를 재편하고 있으며, 개인의 일상생활과 가치관에도 깊은 영향을 미치고 있습니다.',
          '해 질 녘 노을이 붉게 물든 가을 하늘 아래, 황금빛으로 물든 단풍잎들이 바람에 부드럽게 흩날리며 잊을 수 없는 풍경을 자아냈습니다.',
          '익숙하지 않은 분야에 도전하는 것은 때때로 두려움을 동반하지만, 꾸준한 노력과 긍정적인 마음가짐은 결국 놀라운 성장과 성취로 이어질 것입니다.',
        ],
      },
    };

    await queryRunner.query(
      `INSERT INTO "example_preset" ("name", "description", "examples") 
       VALUES ('default', '기본 예제 프리셋', ?)`,
      [JSON.stringify(defaultExamples)]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 테이블 삭제
    await queryRunner.query(`DROP TABLE "example_preset"`);
  }
}
