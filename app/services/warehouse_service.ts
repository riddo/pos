import Warehouse from '#models/warehouse'

export default class WarehouseService {
  /**
   * Obtiene todos los almacenes activos
   */
  async getActiveWarehouses() {
    const warehouses = await Warehouse.query()
      .whereNull('deleted_at')
      .orderBy('name')

    return warehouses.map(warehouse => ({
      id: warehouse.id,
      name: warehouse.name,
      warehouseType: warehouse.warehouseType
    }))
  }
}
