import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Warehouse from '#models/warehouse'
import InventoryAdjustment from '#models/inventory_adjustment'
import InventoryRestock from '#models/inventory_restock'
import InventoryTransfer from '#models/inventory_transfer'
import Supplier from '#models/supplier'
import Inventory from '#models/inventory'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class InventoriesController {
  async index({ inertia, request, session }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search')
    const warehouseId = request.input('warehouse')

    // Comenzar con la consulta desde Inventory
    const query = Inventory.query()
      .preload('product', (query) => {
        query.preload('category')
        if (search) {
          // Buscar en el nombre del producto
          query.whereILike('productName', `%${search}%`)
        }
      })
      .preload('warehouse')
      .orderBy('id', 'desc')

    // Filtrar por almacén si se especifica
    if (warehouseId) {
      query.where('warehouseId', warehouseId)
    }

    // Obtener todos los registros sin paginar primero
    const allInventories = await query.exec()

    // Crear un Map para almacenar únicos registros por producto-almacén
    const uniqueInventories = new Map()

    // Filtrar registros duplicados manteniendo solo el más reciente
    allInventories.forEach((inventory) => {
      const key = `${inventory.productId}-${inventory.warehouseId}`
      if (!uniqueInventories.has(key)) {
        uniqueInventories.set(key, inventory)
      }
    })

    // Convertir el Map a array y aplicar paginación manual
    const inventoriesArray = Array.from(uniqueInventories.values())
    const startIndex = (page - 1) * 10
    const paginatedInventories = inventoriesArray.slice(startIndex, startIndex + 10)

    // Calcular meta información para la paginación
    const totalItems = inventoriesArray.length
    const lastPage = Math.ceil(totalItems / 10)

    const warehouses = await Warehouse.query().where('status', 'active').exec()

    // Transformar los datos manteniendo la estructura actual
    const transformedInventories = {
      data: paginatedInventories.map((inventory) => ({
        id: inventory.product.id,
        productName: inventory.product.productName,
        imagePath: inventory.product.imagePath,
        category: inventory.product.category,
        inventory: {
          id: inventory.id,
          stock: inventory.stock,
          criticalStock: inventory.criticalStock,
          stockStatus: inventory.stockStatus,
          warehouse: inventory.warehouse,
          warehouseId: inventory.warehouseId,
        },
      })),
      meta: {
        total: totalItems,
        per_page: 10,
        current_page: Number.parseInt(page),
        last_page: lastPage,
      },
    }

    return inertia.render('inventory/index', {
      products: transformedInventories,
      warehouses,
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Inventario', url: null },
      ],
    })
  }

  async adjust({ request, response }: HttpContext) {
    const { productId, quantity, reason, type, warehouseId } = request.only([
      'productId',
      'quantity',
      'reason',
      'type',
      'warehouseId',
    ])

    try {
      const product = await Product.findOrFail(productId)
      const inventory = await product
        .related('inventory')
        .query()
        .where('warehouseId', warehouseId)
        .first()

      if (!inventory) {
        return response.badRequest('Inventario no encontrado')
      }

      let adjustmentType = type
      if (reason === 'damage' || reason === 'theft' || reason === 'loss') {
        adjustmentType = 'subtract'
      } else if (reason === 'stock_received') {
        adjustmentType = 'add'
      }

      // Manejar transferencias
      if (reason === 'transfer') {
        const destinationInventory = await product
          .related('inventory')
          .query()
          .where('warehouseId', warehouseId)
          .first()

        if (inventory.stock < quantity) {
          return response.badRequest('Stock insuficiente para transferir')
        }

        // Restar del origen
        inventory.stock -= quantity

        // Agregar al destino o crear nuevo registro
        if (destinationInventory) {
          destinationInventory.stock += quantity
          await destinationInventory.save()
        } else {
          await product.related('inventory').create({
            warehouseId,
            stock: quantity,
            criticalStock: inventory.criticalStock,
          })
        }
      } else {
        // Ajustar el stock para otros casos
        if (adjustmentType === 'add') {
          inventory.stock += quantity
        } else if (adjustmentType === 'subtract') {
          if (inventory.stock < quantity) {
            return response.badRequest('Stock insuficiente')
          }
          inventory.stock -= quantity
        }
      }

      await inventory.save()

      return response.redirect().back()
    } catch (error) {
      return response.badRequest('Error al ajustar el inventario')
    }
  }

  async restock({ request, response, auth, session }: HttpContext) {
    const { productId, quantity, supplierId, warehouseId } = request.only([
      'productId',
      'quantity',
      'supplierId',
      'warehouseId',
    ])

    if (!productId || !quantity || !warehouseId) {
      session.flash('error', 'Faltan datos requeridos')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // 1. Verificar que el producto existe
      const product = await Product.findOrFail(productId)
      if (!product) {
        throw new Error('Producto no encontrado')
      }

      // 2. Verificar que el almacén existe
      const warehouse = await Warehouse.findOrFail(warehouseId)
      if (!warehouse) {
        throw new Error('Almacén no encontrado')
      }

      // 3. Crear el registro de restock
      const restock = await InventoryRestock.create(
        {
          productId,
          quantity: Number.parseInt(quantity),
          supplierId: supplierId || null,
          warehouseId,
          userId: auth.user?.id,
        },
        { client: trx }
      )

      // 4. Buscar el inventario existente
      let inventory = await Inventory.query({ client: trx })
        .where('productId', productId)
        .where('warehouseId', warehouseId)
        .first()

      // 5. Si no existe el inventario, crearlo
      if (!inventory) {
        inventory = await Inventory.create(
          {
            productId,
            warehouseId,
            stock: Number.parseInt(quantity),
            criticalStock: 5,
          },
          { client: trx }
        )
      } else {
        // 6. Si existe, actualizar el stock
        inventory.stock += Number.parseInt(quantity)
        await inventory.save()
      }

      // 7. Confirmar la transacción
      await trx.commit()

      session.flash('success', 'Stock actualizado correctamente')
      return response.redirect().back()
    } catch (error) {
      // 8. Rollback en caso de error
      await trx.rollback()

      console.error('Error en restock:', error)

      // Mensaje de error más específico
      let errorMessage = 'Error al actualizar el stock'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      session.flash('error', errorMessage)
      return response.redirect().back()
    }
  }

  async transfer({ request, response, auth, session }: HttpContext) {
    const { productId, quantity, fromWarehouseId, toWarehouseId } = request.only([
      'productId',
      'quantity',
      'fromWarehouseId',
      'toWarehouseId',
    ])

    if (!productId || !quantity || !fromWarehouseId || !toWarehouseId) {
      session.flash('error', 'Faltan datos requeridos')
      return response.redirect().back()
    }

    if (fromWarehouseId === toWarehouseId) {
      session.flash('error', 'El almacén de origen y destino no pueden ser el mismo')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // 1. Verificar que el producto existe
      const product = await Product.findOrFail(productId)
      if (!product) {
        throw new Error('Producto no encontrado')
      }

      // 2. Verificar que los almacenes existen
      const [fromWarehouse, toWarehouse] = await Promise.all([
        Warehouse.findOrFail(fromWarehouseId),
        Warehouse.findOrFail(toWarehouseId),
      ])

      // 3. Verificar el stock en el almacén origen
      const sourceInventory = await Inventory.query({ client: trx })
        .where('productId', productId)
        .where('warehouseId', fromWarehouseId)
        .firstOrFail()

      if (sourceInventory.stock < Number.parseInt(quantity)) {
        throw new Error('Stock insuficiente para realizar la transferencia')
      }

      // 4. Buscar o crear el registro en el almacén destino
      let destinationInventory = await Inventory.query({ client: trx })
        .where('productId', productId)
        .where('warehouseId', toWarehouseId)
        .first()

      if (!destinationInventory) {
        // Crear el registro inicial en el almacén destino
        destinationInventory = await Inventory.create(
          {
            productId,
            warehouseId: toWarehouseId,
            stock: 0,
            criticalStock: sourceInventory.criticalStock,
            stockStatus: 'out_of_stock',
          },
          { client: trx }
        )
      }

      // 5. Crear el registro de transferencia
      await InventoryTransfer.create(
        {
          productId,
          fromWarehouseId,
          toWarehouseId,
          quantity: Number.parseInt(quantity),
          userId: auth.user?.id,
          status: 'completed',
          transferDate: DateTime.fromJSDate(new Date()),
        },
        { client: trx }
      )

      // 6. Actualizar los stocks
      sourceInventory.stock -= Number.parseInt(quantity)
      await sourceInventory.save()

      destinationInventory.stock += Number.parseInt(quantity)
      await destinationInventory.save()

      await trx.commit()
      session.flash('success', 'Transferencia realizada correctamente')
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      console.error('Error en transfer:', error)

      let errorMessage = 'Error al realizar la transferencia'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      session.flash('error', errorMessage)
      return response.redirect().back()
    }
  }

  async adjustment({ request, response, auth, session }: HttpContext) {
    const { productId, quantity, adjustmentType, reason, warehouseId } = request.only([
      'productId',
      'quantity',
      'adjustmentType',
      'reason',
      'warehouseId',
    ])

    // Validar que el tipo de ajuste es válido
    const validTypes = ['damage', 'loss', 'correction', 'theft', 'shrinkage']
    if (!validTypes.includes(adjustmentType)) {
      session.flash('error', 'Tipo de ajuste inválido')
      return response.redirect().back()
    }

    if (!productId || !quantity || !adjustmentType || !warehouseId) {
      session.flash('error', 'Faltan datos requeridos')
      return response.redirect().back()
    }

    const trx = await db.transaction()

    try {
      // 1. Verificar que el producto existe
      const product = await Product.findOrFail(productId)
      if (!product) {
        throw new Error('Producto no encontrado')
      }

      // 2. Verificar que el almacén existe
      const warehouse = await Warehouse.findOrFail(warehouseId)
      if (!warehouse) {
        throw new Error('Almacén no encontrado')
      }

      // 3. Crear el registro de ajuste
      await InventoryAdjustment.create(
        {
          productId,
          quantity: Number.parseInt(quantity),
          adjustmentType: adjustmentType as
            | 'damage'
            | 'loss'
            | 'correction'
            | 'theft'
            | 'shrinkage',
          reason,
          warehouseId,
          userId: auth.user?.id,
        },
        { client: trx }
      )

      // 4. Buscar el inventario existente
      const inventory = await Inventory.query({ client: trx })
        .where('productId', productId)
        .where('warehouseId', warehouseId)
        .firstOrFail()

      // 5. Actualizar el stock según el tipo de ajuste
      if (['damage', 'theft', 'shrinkage', 'loss'].includes(adjustmentType)) {
        if (inventory.stock < Number.parseInt(quantity)) {
          throw new Error('Stock insuficiente para realizar el ajuste')
        }
        inventory.stock -= Number.parseInt(quantity)
      } else if (adjustmentType === 'correction') {
        inventory.stock += Number.parseInt(quantity)
      }

      await inventory.save()
      await trx.commit()

      session.flash('success', 'Ajuste realizado correctamente')
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      console.error('Error en adjustment:', error)

      let errorMessage = 'Error al realizar el ajuste'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      session.flash('error', errorMessage)
      return response.redirect().back()
    }
  }
}
