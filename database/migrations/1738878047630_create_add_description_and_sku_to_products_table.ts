import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddDescriptionAndSkuToProducts extends BaseSchema {
  protected tableName = 'products'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description').nullable() // Campo de descripción
      table.string('sku').nullable().unique() // Código SKU único y obligatorio
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
      table.dropColumn('sku')
    })
  }
}
