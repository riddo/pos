import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales_details'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.decimal('quantity', 12, 5).notNullable().alter()
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('quantity').notNullable().alter()
    })
  }
}