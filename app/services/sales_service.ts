import db from '@adonisjs/lucid/services/db'
import SalesHeader from '#models/sales_header'
import SalesDetail from '#models/sales_detail'
import Product from '#models/product'
import { SaleItem } from '../types/sales.js'

export default class SalesService {
  async createSale(
    userId: number,
    saleItems: SaleItem[],
    paymentMethodId: number | null,
    warehouseId: number
  ) {
    // Separar items con y sin inventario
    const inventoryItems = saleItems.filter(item => item.hasInventory)
    const nonInventoryItems = saleItems.filter(item => !item.hasInventory)

    // Validar productos con inventario antes de iniciar la transacción
    if (inventoryItems.length > 0) {
      await this.validateProducts(inventoryItems)
    }

    const trx = await db.transaction()

    try {
      // Obtener y bloquear los inventarios para actualización (solo para productos con inventario)
      const inventories = inventoryItems.length > 0 
        ? await this.getInventoriesForUpdate(inventoryItems, trx)
        : []

      // Validar stock una vez más (por si cambió entre la validación inicial y el bloqueo)
      if (inventoryItems.length > 0) {
        this.validateInventories(inventoryItems, inventories)
      }

      // Crear el header de la venta
      const salesHeader = await SalesHeader.create(
        {
          userId,
          paymentMethodId,
          warehouseId,
          total: this.calculateTotal([...inventoryItems, ...nonInventoryItems]),
        },
        { client: trx }
      )

      // Procesar items con inventario
      if (inventoryItems.length > 0) {
        await this.processSaleItems(salesHeader.id, inventoryItems, inventories, trx)
      }

      // Procesar items sin inventario
      if (nonInventoryItems.length > 0) {
        await this.processNonInventoryItems(salesHeader.id, nonInventoryItems, trx)
      }

      // Si todo salió bien, confirmar la transacción
      await trx.commit()
      return salesHeader.id
    } catch (error) {
      // Si algo falló, revertir todos los cambios
      await trx.rollback()
      throw error
    }
  }

  private async validateProducts(saleItems: SaleItem[]) {
    for (const item of saleItems) {
      const product = await Product.query()
        .where('id', item.id)
        .preload('inventory', (query) => {
          query.where('warehouseId', item.warehouseId)
        })
        .first()

      if (!product) {
        throw new Error(`El producto "${item.name}" ya no existe en el sistema`)
      }

      const inventory = product.inventory[0]
      if (!inventory || inventory.stock <= 0) {
        throw new Error(`El producto "${item.name}" está fuera de stock en este almacén`)
      }

      if (inventory.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para "${item.name}". Disponible: ${inventory.stock}`
        )
      }
    }
  }

  private validateInventories(saleItems: SaleItem[], inventories: any[]) {
    for (const item of saleItems) {
      const inventory = inventories.find(
        (inv) => inv.product_id === item.id && inv.warehouse_id === item.warehouseId
      )

      if (!inventory) {
        throw new Error(`El producto "${item.name}" no tiene inventario asociado en este almacén`)
      }

      if (inventory.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${item.name}". Disponible: ${inventory.stock}`)
      }
    }
  }

  private calculateTotal(saleItems: SaleItem[]): number {
    return saleItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  private async getInventoriesForUpdate(saleItems: SaleItem[], trx: any) {
    const productWarehousePairs = saleItems.map((item) => ({
      productId: item.id,
      warehouseId: item.warehouseId,
    }))

    return await db
      .query()
      .useTransaction(trx)
      .from('inventories')
      .where((builder) => {
        productWarehousePairs.forEach((pair) => {
          builder.orWhere((subBuilder) => {
            subBuilder
              .where('product_id', pair.productId)
              .where('warehouse_id', pair.warehouseId)
          })
        })
      })
      .forUpdate() // Bloquear registros para actualización
  }

  private async processSaleItems(
    salesHeaderId: number,
    saleItems: SaleItem[],
    inventories: any[],
    trx: any
  ) {
    for (const item of saleItems) {
      const inventory = inventories.find(
        (inv) => inv.product_id === item.id && inv.warehouse_id === item.warehouseId
      )

      // Crear detalle de venta
      await SalesDetail.create(
        {
          salesHeaderId,
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        },
        { client: trx }
      )

      // Actualizar inventario solo del almacén específico
      await db
        .query()
        .useTransaction(trx)
        .from('inventories')
        .where('product_id', item.id)
        .where('warehouse_id', item.warehouseId)
        .update({
          stock: inventory.stock - item.quantity,
          stock_status: this.calculateStockStatus(
            inventory.stock - item.quantity,
            inventory.critical_stock
          ),
        })
    }
  }

  private async processNonInventoryItems(
    salesHeaderId: number,
    saleItems: SaleItem[],
    trx: any
  ) {
    for (const item of saleItems) {
      // Crear detalle de venta para productos sin inventario
      await SalesDetail.create(
        {
          salesHeaderId,
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
        },
        { client: trx }
      )
    }
  }

  private calculateStockStatus(
    stock: number,
    criticalStock: number
  ): 'available' | 'low' | 'out_of_stock' {
    if (stock <= 0) return 'out_of_stock'
    if (stock <= criticalStock) return 'low'
    return 'available'
  }
}
