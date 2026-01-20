import type { UUID } from 'crypto';
import { Challenge } from 'src/challenges/entities/challenge.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('completion-image')
export class CompletionImage {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ type: 'uuid' })
  userId: UUID;

  @Column({ type: 'uuid' })
  challengeId: UUID;

  @Column()
  url: string;

  @Column({ type: 'timestamptz' })
  uploadedAt: Date;

  @ManyToOne(() => User, (user) => user.completionImages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Challenge, (chal) => chal.completionImages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challengeId' })
  challenge: Challenge;
}
