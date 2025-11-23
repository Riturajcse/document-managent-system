import { Entity, ObjectIdColumn, ObjectId, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Document {
  @ObjectIdColumn()
  id!: ObjectId;

  @Column()
  name!: string;

  @Column({ nullable: true })
  path?: string;

  @Column({ nullable: true })
  buffer?: Buffer;

  @Column({ nullable: true })
  s3Key?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
