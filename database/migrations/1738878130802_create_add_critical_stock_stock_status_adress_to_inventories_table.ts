import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddStockStatusAddressCriticalStockToInventories extends BaseSchema {
  protected tableName = 'inventories'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('stock_status', ['available', 'low', 'out_of_stock'])
        .notNullable()
        .defaultTo('available') // Estado del stock
      table.string('address').nullable() // Dirección del almacén
      table.integer('critical_stock').notNullable().defaultTo(0) // Stock crítico mínimo
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stock_status')
      table.dropColumn('address')
      table.dropColumn('critical_stock')
    })
  }
}
