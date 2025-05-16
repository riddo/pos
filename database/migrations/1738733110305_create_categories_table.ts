import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Categories extends BaseSchema {
  protected tableName = 'categories'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Llave primaria
      table
        .integer('user_id') // Relación con la tabla users
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE') // Elimina las categorías si el usuario es eliminado
        .notNullable()
      table.string('category_name') // Nombre de la categoría
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()) // Fecha de creación
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()) // Fecha de actualización
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName) // Elimina la tabla
  }
}
