import { v4 } from 'uuid';
import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ tableName: 'user_devices' })
export class UserDevice {
  @PrimaryKey()
  id = v4();

  @Property()
  deviceId!: string;

  @Property({ nullable: true })
  fcmToken?: string;

  @Property()
  createdAt?: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;

  /**
   * --------------------------------------------
   * Constraint
   * --------------------------------------------
   */

  @ManyToOne(() => User)
  user!: User;
}
