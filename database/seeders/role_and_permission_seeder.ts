import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // 1. Crear rol admin
    const [adminRole] = await db
      .table('roles')
      .insert({
        rol: 'admin',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('id')

    // 2. Crear permisos agrupados
    const permissions = await db
      .table('permissions')
      .insert([
        // Ventas
        {
          permissions_name: 'view_sales_panel',
          description: 'Ver Panel de ventas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'post_sales',
          description: 'Realizar Venta',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'view_sales_history',
          description: 'Ver historial de ventas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'view_sale_details',
          description: 'Ver detalle de ventas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Productos
        {
          permissions_name: 'view_products',
          description: 'Ver Productos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'edit_products',
          description: 'Editar Productos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'delete_products',
          description: 'Eliminar productos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'create_products',
          description: 'Agregar Productos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Configuraciones
        {
          permissions_name: 'view_settings',
          description: 'Ver Configuraciones',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'manage_roles',
          description: 'Gestionar roles',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'manage_users',
          description: 'Gestionar usuarios',
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Inventario
        {
          permissions_name: 'view_inventory',
          description: 'Ver Inventario',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'view_movements',
          description: 'Ver Movimientos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'do_movements',
          description: 'Realizar Movimientos',
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Bodegas
        {
          permissions_name: 'view_warehouses',
          description: 'Ver Bodegas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'create_warehouses',
          description: 'Crear Bodegas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'edit_warehouses',
          description: 'Editar Bodegas',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          permissions_name: 'delete_warehouses',
          description: 'Eliminar Bodegas',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ])
      .returning('id')

    // 3. Asignar todos los permisos al rol admin
    await db.table('roles_permissions').insert(
      permissions.map((permission) => ({
        roles_id: adminRole.id,
        permisos_id: permission.id,
      }))
    )
  }
}
