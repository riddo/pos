import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('unit_id').unsigned().references('id').inTable('units').onDelete('RESTRICT')
      table.boolean('has_inventory').notNullable().defaultTo(true)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('unit_id')
      table.dropColumn('has_inventory')
    })
  }
}
