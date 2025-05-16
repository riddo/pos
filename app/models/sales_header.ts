import { BaseModel, belongsTo, hasMany, column, afterCreate, scope } from '@adonisjs/lucid/orm'
import User from './user.js'
import PaymentMethod from './payment_method.js'
import SalesDetail from './sales_detail.js'
import Warehouse from './warehouse.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import InventoryMovement from './inventory_movement.js'

export default class SalesHeader extends BaseModel {
  // Agrega esta línea para definir el nombre de la tabla
  public static table = 'sales_header'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare paymentMethodId: number | null

  @column()
  declare warehouseId: number | null

  @column()
  declare total: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime({ serializeAs: null })
  declare deletedAt: DateTime | null

  // Scope para obtener solo usuarios activos
  static active = scope((query) => {
    query.whereNull('deleted_at')
  })

  // Método para soft delete
  async softDelete() {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  @hasMany(() => SalesDetail)
  declare salesDetails: HasMany<typeof SalesDetail>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => PaymentMethod)
  declare paymentMethod: BelongsTo<typeof PaymentMethod>

  @belongsTo(() => Warehouse)
  declare warehouse: BelongsTo<typeof Warehouse>

  @hasMany(() => InventoryMovement)
  declare inventoryMovements: HasMany<typeof InventoryMovement>

  @afterCreate()
  public static async createInventoryMovements(salesHeader: SalesHeader) {
    await salesHeader.load('salesDetails', (query) => {
      query.preload('product', (query) => {
        query.preload('inventory')
      })
    })

    for (const detail of salesHeader.salesDetails) {
      // Asumimos que queremos el primer inventario o uno específico
      const inventory = detail.product.inventory
      if (!inventory) continue

      await InventoryMovement.create({
        productId: detail.productId,
        warehouseId: inventory.warehouseId,
        movementType: 'sale',
        quantity: -detail.quantity,
        reason: `Venta #${salesHeader.id}`,
        userId: salesHeader.userId,
        salesHeaderId: salesHeader.id,
      })
    }
  }
}
