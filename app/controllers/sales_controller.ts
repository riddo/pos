import Category from '#models/category'
import Product from '#models/product'
import SalesService from '#services/sales_service'
import Inventory from '#models/inventory'
import Warehouse from '#models/warehouse'
import type { HttpContext } from '@adonisjs/core/http'

export default class SalesController {
  async index({ inertia, auth }: HttpContext) {
    // Obtener productos con y sin inventario
    const products = await Product.query()
      .apply((scopes) => scopes.active())
      .preload('inventory', (query) => {
        query.preload('warehouse')
      })
      .preload('category')
      .preload('unit')
      .select('id', 'category_id', 'product_name', 'price', 'image_path', 'description', 'sku', 'has_inventory', 'unit_id')

    const categories = await Category.all()
    const warehouses = await Warehouse.query()
      .where('status', 'active')
      .where('warehouseType', 'store')
      .exec()

    let breadcrumb = []
    if (auth.user?.role?.rol === 'admin') {
      breadcrumb = [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Ventas', url: null },
      ]
    } else {
      breadcrumb = [
        { name: 'Vendedor', url: '/pos' },
        { name: 'Ventas', url: null },
      ]
    }

    // Transformar los productos para incluir el inventario por sucursal
    const transformedProducts = products.map((product) => {
      const inventories = product.inventory || []
      const inventoryByWarehouse: Record<number, any> = inventories.reduce((acc, inv) => {
        acc[inv.warehouseId] = {
          stock: inv.stock || 0,
          criticalStock: inv.criticalStock || 0,
          stockStatus: getStockStatus(inv.stock || 0, inv.criticalStock || 0),
          warehouseId: inv.warehouseId,
          warehouse: inv.warehouse,
        }
        return acc
      }, {} as Record<number, any>)

      return {
        id: product.id,
        productName: product.productName,
        price: product.price,
        imagePath: product.imagePath,
        category: product.category,
        sku: product.sku,
        hasInventory: product.hasInventory,
        unit: product.unit,
        inventory: inventoryByWarehouse,
        disabled: false, // Se actualizará en el frontend según el almacén seleccionado
      }
    })

    return inertia.render('pos/index', {
      breadcrumb,
      products: transformedProducts,
      categories,
      warehouses,
    })
  }

  async store({ request, response, auth, inertia }: HttpContext) {
    const { saleItems, paymentMethodId, warehouseId } = request.only([
      'saleItems',
      'paymentMethodId',
      'warehouseId',
    ])

    const user = auth.user
    if (!user) {
      return response.unauthorized({ error: 'Usuario no autenticado.' })
    }

    if (!saleItems || !Array.isArray(saleItems) || saleItems.length === 0) {
      return response.badRequest({ error: 'No hay productos en la venta.' })
    }
    try {
      const salesService = new SalesService()
      const salesHeaderId = await salesService.createSale(
        user.id,
        saleItems,
        paymentMethodId,
        warehouseId
      )

      return inertia.render('pos/index', {
        success: true,
        message: 'Venta procesada con éxito',
        salesHeaderId,
      })
    } catch (error) {
      console.error(error)
      return inertia.render('pos/index', {
        success: false,
        message: error.message,
      })
    }
  }
  async update({ request, response, params }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const data = request.only([
      'name',
      'price',
      'category',
      'description',
      'sku',
      'criticalStock',
      'initialStock',
    ])

    const image = request.file('image', {
      extnames: ['jpg', 'jpeg', 'png'],
      size: '5mb',
    })

    let newImagePath = product.imagePath
    if (image) {
      if (!image.isValid) {
        return response.badRequest(image.errors)
      }
      const imageName = `${new Date().getTime()}.${image.extname}`
      await image.move('inertia/public/products', { name: imageName })
      newImagePath = imageName
    }

    // Actualizar producto
    await product
      .merge({
        productName: data.name,
        categoryId: data.category,
        price: data.price,
        description: data.description,
        sku: data.sku,
        imagePath: newImagePath,
      })
      .save()

    // Actualizar inventario
    await Inventory.updateOrCreate(
      { productId: product.id },
      {
        stock: data.initialStock,
        criticalStock: data.criticalStock,
      }
    )

    return response.redirect().toPath('/pos')
  }
}

// Función helper para determinar el estado del stock
function getStockStatus(stock: number = 0, criticalStock: number = 0) {
  if (!stock || stock <= 0) return 'out_of_stock'
  if (stock <= criticalStock) return 'low'
  return 'available'
}
