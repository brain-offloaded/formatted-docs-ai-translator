import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';

import { dateTransformer } from '../../../common/transformers/date.transformer';

import { FileInfo } from './file-info.entity';
import { TranslationHistory } from './translation-history.entity';

@Entity({ name: 'translation' })
export class Translation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  source: string;

  @Column()
  target: string;

  @Column({ default: true })
  success: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    transformer: dateTransformer,
  })
  createdAt: Date;

  @Column({
    name: 'last_accessed_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
    transformer: dateTransformer,
  })
  @Index()
  lastAccessedAt: Date;

  @ManyToOne(() => FileInfo, (fileInfo) => fileInfo.translations, { nullable: true })
  @JoinColumn({ name: 'file_info_id' })
  fileInfo: FileInfo | null;

  @OneToMany(() => TranslationHistory, (history) => history.translation)
  history: TranslationHistory[];
}
