import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';

@Injectable()
export abstract class BaseTransaction<TransactionInput, TransactionOutput> {
  protected constructor(private readonly connection: DataSource) {}

  protected abstract execute(data: TransactionInput, manager: EntityManager): Promise<TransactionOutput>;

  private async createRunner(): Promise<QueryRunner> {
    return this.connection.createQueryRunner();
  }

  async run(data: TransactionInput): Promise<TransactionOutput> {
    const queryRunner = await this.createRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await this.execute(data, queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch {
      await queryRunner.rollbackTransaction();
      throw new Error('Transaction failed');
    } finally {
      await queryRunner.release();
    }
  }

  async runWithinTransaction(data: TransactionInput, manager: EntityManager): Promise<TransactionOutput> {
    return this.execute(data, manager);
  }
}
