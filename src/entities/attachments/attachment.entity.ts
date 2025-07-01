import { v4 } from 'uuid';
import {
  Entity,
  PrimaryKey,
  Property,
} from '@mikro-orm/core';

@Entity({ tableName: 'attachments'})
export class Attachment {
  @PrimaryKey()
  id = v4();

  @Property()
  url: string;

  @Property({ nullable: true })
  thumbnailUrl?: string;

  @Property()
  createdAt?: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt?: Date = new Date();


  @Property({ nullable: true })
  deletedAt?: Date;

}

