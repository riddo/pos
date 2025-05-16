import type { HttpContext } from '@adonisjs/core/http'
import InventoryMovement from '#models/inventory_movement'
import Warehouse from '#models/warehouse'

export default class InventoryListController {
  async index({ inertia, request }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search')
    const warehouseId = request.input('warehouse')

    const query = InventoryMovement.query()
      .preload('product')
      .preload('warehouse')
      .preload('user')
      .orderBy('created_at', 'desc')

    if (search) {
      query.whereHas('product', (query) => {
        query.whereILike('productName', `%${search}%`)
      })
    }

    if (warehouseId) {
      query.where('warehouseId', warehouseId)
    }

    const movements = await query.paginate(page, 10)
    const warehouses = await Warehouse.query().where('status', 'active').exec()

    return inertia.render('inventory/List', {
      movements: {
        data: movements.all().map((movement) => ({
          ...movement.toJSON(),
          product: movement.product,
          warehouse: movement.warehouse,
          user: {
            name: movement.user?.fullName || 'Sistema',
          },
        })),
        meta: movements.getMeta(),
        warehouses,
      },
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Inventario', url: '/inventory' },
        { name: 'Movimientos', url: null },
      ],
    })
  }
}
