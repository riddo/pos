import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, afterCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Warehouse from './warehouse.js'
import InventoryMovement from './inventory_movement.js'

export default class InventoryTransfer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare fromWarehouseId: number

  @column()
  declare toWarehouseId: number

  @column()
  declare quantity: number

  @column()
  declare userId: number | null

  @column()
  declare status: 'pending' | 'completed' | 'canceled'

  @column.dateTime({ autoCreate: true })
  declare transferDate: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Warehouse, { foreignKey: 'fromWarehouseId' })
  declare fromWarehouse: BelongsTo<typeof Warehouse>

  @belongsTo(() => Warehouse, { foreignKey: 'toWarehouseId' })
  declare toWarehouse: BelongsTo<typeof Warehouse>

  @afterCreate()
  public static async createMovementRecords(transfer: InventoryTransfer) {
    // Crear registro para la salida (transfer_out)
    await InventoryMovement.create({
      productId: transfer.productId,
      warehouseId: transfer.fromWarehouseId,
      movementType: 'transfer_out',
      quantity: -transfer.quantity, // Negativo porque es una salida
      reason: null,
      userId: transfer.userId,
      salesHeaderId: null,
      createdAt: transfer.transferDate,
      updatedAt: transfer.updatedAt
    })

    // Crear registro para la entrada (transfer_in)
    await InventoryMovement.create({
      productId: transfer.productId,
      warehouseId: transfer.toWarehouseId,
      movementType: 'transfer_in',
      quantity: transfer.quantity, // Positivo porque es una entrada
      reason: null,
      userId: transfer.userId,
      salesHeaderId: null,
      createdAt: transfer.transferDate,
      updatedAt: transfer.updatedAt
    })
  }
}