import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { dateTransformer } from '../../../common/transformers/date.transformer';
import { SourceLanguage } from '../../../../utils/language';

@Entity({ name: 'example_preset' })
export class ExamplePreset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text' })
  examples: string; // JSON 형태로 저장: { [language: string]: { sourceLines: string[], resultLines: string[] } }

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    transformer: dateTransformer,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    transformer: dateTransformer,
  })
  updatedAt: Date;

  // 예제 가져오기
  getExamples(): Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }> {
    try {
      return JSON.parse(this.examples);
    } catch (error) {
      console.error('예제 데이터 파싱 중 오류 발생:', error);
      return {} as Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>;
    }
  }

  // 예제 설정하기
  setExamples(
    examples: Record<SourceLanguage, { sourceLines: string[]; resultLines: string[] }>
  ): void {
    this.examples = JSON.stringify(examples);
  }
}
