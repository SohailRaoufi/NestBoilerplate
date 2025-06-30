import { v4 } from 'uuid';
import {
  Entity,
  EntityRepository,
  EntityRepositoryType,
  PrimaryKey,
  Property,
  Rel,
  ManyToOne,
} from '@mikro-orm/core';

import { User } from './user.entity';

@Entity({
  tableName: 'user_forget_passwords',
  repository: () => UserForgetPasswordRepository,
})
export class UserForgetPassword {
  @PrimaryKey()
  id = v4();

  @Property()
  token!: string;

  @Property()
  expiresAt!: Date;

  @Property()
  createdAt = new Date();

  // Relationships
  @ManyToOne(() => User)
  user!: Rel<User>;

  [EntityRepositoryType]?: UserForgetPasswordRepository;
}

export class UserForgetPasswordRepository extends EntityRepository<UserForgetPassword> {}
