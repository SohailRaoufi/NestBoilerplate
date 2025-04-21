import { v4 } from 'uuid';
import { Entity, ManyToOne, PrimaryKey, Property, Rel } from '@mikro-orm/core';
import { AdminRole } from 'src/common/enums/admin-role.enum';

@Entity({ tableName: 'admins' })
export class Admin {
  @PrimaryKey()
  id = v4();

  @Property()
  name!: string;

  @Property()
  email!: string;

  @Property()
  passwordHash!: string;

  @Property({ nullable: true })
  initialPasswordChangedAt?: Date;

  @Property({ nullable: true })
  photo?: string;

  @Property({ nullable: true })
  photoThumbnail?: string;

  @Property()
  role: AdminRole = AdminRole.ADMIN;

  @Property({ nullable: true })
  suspendedAt?: Date;

  @Property({ nullable: true })
  suspendReason?: string;

  // Timestamps
  @Property()
  createdAt = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt = new Date();

  @Property({ nullable: true })
  deletedAt?: Date;

  /**
   * --------------------------------------------
   * Constraint
   * --------------------------------------------
   */
  @ManyToOne({ entity: () => Admin, nullable: true })
  createdBy?: Rel<Admin>;

  @ManyToOne({ entity: () => Admin, nullable: true })
  updatedBy?: Rel<Admin>;
}
