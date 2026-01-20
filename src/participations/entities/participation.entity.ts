import type { UUID } from 'crypto';
import { Challenge } from 'src/challenges/entities/challenge.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('participations')
export class Participation {
  @PrimaryColumn('uuid')
  userId: UUID;

  @PrimaryColumn('uuid')
  challengeId: UUID;

  @Column({ default: false })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ default: 0 })
  completionCount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.participations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Challenge, (chal) => chal.participations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;
}
