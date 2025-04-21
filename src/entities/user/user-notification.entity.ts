import { v4 } from 'uuid';
import { Entity, Enum, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { UserNotificationTypes } from '@/common/enums/notification.enum';
import { User } from './user.entity';

@Entity({ tableName: 'user_notifications' })
export class UserNotification {
  @PrimaryKey()
  id = v4();

  @Property()
  title!: string;

  @Property({ nullable: true })
  content?: string;

  @Property({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Enum(() => UserNotificationTypes)
  type!: UserNotificationTypes;

  @Property({ nullable: true })
  topic?: string;

  @Property({ nullable: true })
  readAt?: Date;

  @Property()
  createdAt = new Date();

  /**
   * --------------------------------------------
   * Constraint
   * --------------------------------------------
   */

  @ManyToOne(() => User)
  user!: User;
}
