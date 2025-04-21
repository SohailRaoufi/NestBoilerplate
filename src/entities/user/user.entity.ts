import { v4 } from 'uuid';
import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'users' })
export class User {
  @PrimaryKey()
  id = v4();

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  passwordHash!: string;

  @Property()
  isPremium?: boolean = false;

  @Property({ nullable: true })
  photo?: string;

  @Property({ nullable: true })
  photoThumbnail?: string;

  @Property()
  notificationEnabled?: boolean = true;

  @Property()
  weeklyReminders?: boolean = false;

  @Property({ nullable: true })
  emailVerifiedAt?: Date;

  @Property()
  createdAt?: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;
}
