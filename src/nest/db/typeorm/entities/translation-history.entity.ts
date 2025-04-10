import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { dateTransformer } from '../../../common/transformers/date.transformer';

import { Translation } from './translation.entity';

@Entity({ name: 'translation_history' })
export class TranslationHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Translation, (translation) => translation.history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'translation_id' })
  translation: Translation;

  @Column()
  @Index()
  source: string;

  @Column()
  target: string;

  @Column()
  success: boolean;

  @Column({ type: 'text', nullable: true })
  error: string | null;

  @Column()
  model: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    transformer: dateTransformer,
  })
  @Index()
  createdAt: Date;
}
