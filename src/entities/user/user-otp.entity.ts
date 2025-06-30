import { v4 } from 'uuid';
import {
  Entity,
  Property,
  PrimaryKey,
  ManyToOne,
  EntityRepositoryType,
  EntityRepository,
  Rel,
} from '@mikro-orm/core';

import { UserOtpType } from '@/common/enums/user-otp-types.enum';

import { User } from './user.entity';

@Entity({ tableName: 'user_otp', repository: () => UserOtpRepository })
export class UserOtp {
  @PrimaryKey()
  id: string = v4();

  @Property()
  otpCode!: string;

  @Property()
  otpType: UserOtpType;

  @Property()
  otpSentTo!: string;

  @Property()
  otpExpiry!: Date;

  @Property({ nullable: true, default: 0 })
  otpAttempts?: number;

  @Property({ default: true })
  isOtpValid: boolean = true;

  @Property()
  createdAt: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => User)
  user!: Rel<User>;

  [EntityRepositoryType]: UserOtpRepository;
}

export class UserOtpRepository extends EntityRepository<UserOtp> {}
