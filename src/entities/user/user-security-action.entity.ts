import { v4 } from 'uuid';
import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import {
  SecurityActionsStatus,
  SecurityActionType,
} from '@/common/enums/security-action.enum';
import { User } from './user.entity';

@Entity({ tableName: 'user_security_actions' })
export class UserSecurityAction {
  @PrimaryKey()
  id = v4();

  @Property()
  type!: SecurityActionType;

  @Property({ type: 'jsonb', nullable: true })
  payload?: Record<string, any>;

  @Property({ unique: true })
  secret!: string;

  @Property()
  status: SecurityActionsStatus = SecurityActionsStatus.PENDING;

  @Property()
  expiredAt!: Date;

  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  /**
   * --------------------------------------------
   * Constraint
   * --------------------------------------------
   */

  @ManyToOne(() => User)
  user!: User;
}
