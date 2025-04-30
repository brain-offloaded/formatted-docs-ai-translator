import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('prompt_presets')
export class PromptPreset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, unique: true }) // 프리셋 이름은 고유해야 함
  name: string;

  @Column({ type: 'text' }) // 프롬프트 내용은 길 수 있으므로 text 타입 사용
  prompt: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
