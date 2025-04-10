import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { dateTransformer } from '../../../common/transformers/date.transformer';

import { Translation } from './translation.entity';

@Entity({ name: 'file_info' })
export class FileInfo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'file_name' })
  @Index()
  fileName: string;

  @Column({ name: 'file_path' })
  @Index({ unique: true })
  filePath: string;

  @OneToMany(() => Translation, (translation) => translation.fileInfo)
  translations: Translation[];

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
}
