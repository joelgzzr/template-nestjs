import * as bcrypt from 'bcryptjs';
import { BaseEntity, Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity()
@Unique(['email'])
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  password: string;

  @Column()
  salt: string;

  @Column()
  resetToken: string;

  @Column({ type: 'datetime', nullable: true })
  resetTokenExpiration: Date;

  async validatePassword(password: string): Promise<boolean> {
    const hash = await bcrypt.hash(password, this.salt);
    return hash === this.password;
  }
}
