import type { UUID } from 'crypto';
import { CompletionImage } from 'src/participations/entities/completion-image.entity';
import { Participation } from 'src/participations/entities/participation.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: UUID;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'text', nullable: true })
  emailVerificationToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailVerificationExpires?: Date | null;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  allowPublicImages: boolean;

  @Column({ default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'text', name: 'refresh_token', nullable: true })
  hashedRefreshToken?: string | null;

  @Column({ type: 'text', nullable: true })
  resetPasswordToken?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpires?: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Participation, (p) => p.user)
  participations: Participation[];

  @OneToMany(() => CompletionImage, (img) => img.user)
  completionImages: CompletionImage[];
}
