import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('roles_id').unsigned().references('id').inTable('roles').onDelete('CASCADE')
      table
        .integer('permisos_id')
        .unsigned()
        .references('id')
        .inTable('permissions')
        .onDelete('CASCADE')
      table.primary(['roles_id', 'permisos_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
