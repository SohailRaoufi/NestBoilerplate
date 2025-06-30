import { v4 } from 'uuid';
import {
  Entity,
  EntityRepositoryType,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';
import { UserRole } from '@/common/enums/user-role.enum';
import { BaseRepository } from '@/common/extensions/base-repository';
import { OauthProvider } from '@/common/enums/oauth.enum';

@Entity({ tableName: 'users', repository: () => userRepository })
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
  role!: UserRole;

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

  @Property({ default: false })
  twoFactorAuthenticationEnabled: boolean = false;

  @Property({ nullable: true, hidden: true })
  twoFactorAuthenticationSecret?: string;

  @Property({ nullable: true })
  oauthProvider?: OauthProvider;

  @Property({ nullable: true })
  oauthProviderId?: string;

  @Property()
  createdAt?: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date = new Date();

  @Property({ nullable: true })
  deactivatedAt?: Date;

  @Property({ nullable: true })
  deletedAt?: Date;

  [EntityRepositoryType]?: userRepository;
}

export class userRepository extends BaseRepository<User> {}
