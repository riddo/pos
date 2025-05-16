import { BaseSchema } from '@adonisjs/lucid/schema'

export default class Products extends BaseSchema {
  protected tableName = 'products'

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
      table
        .integer('category_id') // Relación con la tabla users
        .unsigned()
        .references('id')
        .inTable('categories')
        .onDelete('SET NULL')
        .nullable()
      table.string('product_name') // Nombre del producto
      table.integer('price') // Precio del producto
      table.string('image_path').nullable() // Ruta de la imagen
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now()) // Fecha de creación
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now()) // Fecha de actualización
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName) // Elimina la tabla
  }
}
