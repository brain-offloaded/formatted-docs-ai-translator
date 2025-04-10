import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

import { dateTransformer } from '../../../common/transformers/date.transformer';

@Entity({ name: 'log' })
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  level: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  context: string | null;

  @CreateDateColumn({
    type: 'datetime',
    transformer: dateTransformer,
  })
  @Index()
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  metadata: string | null;
}
