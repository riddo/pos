import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description', 255).notNullable().defaultTo('')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
    })
  }
}
