import type { HttpContext } from '@adonisjs/core/http'
import ProductService from '#services/product_service'
import WarehouseService from '#services/warehouse_service'
import CategoryService from '#services/category_service'
import Unit from '#models/unit'
import app from '@adonisjs/core/services/app'

export default class ProductsController {
  private productService: ProductService
  private warehouseService: WarehouseService
  private categoryService: CategoryService

  constructor() {
    this.productService = new ProductService()
    this.warehouseService = new WarehouseService()
    this.categoryService = new CategoryService()
  }

  async index({ inertia, auth, response, request, session }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search')
    const warehouseId = request.input('warehouse')

    if (!(await auth.check())) {
      return response.redirect().toRoute('login.index')
    }

    // Si no hay warehouseId en la URL, obtener el primer almacén y redirigir
    if (!warehouseId) {
      const warehouses = await this.warehouseService.getActiveWarehouses()
      if (warehouses.length > 0) {
        const defaultWarehouseId = warehouses[0].id
        return response.redirect().toPath(`/products?page=1&warehouse=${defaultWarehouseId}`)
      }
    }

    const products = await this.productService.getProducts(Number(page), search, warehouseId)
    const warehouses = await this.warehouseService.getActiveWarehouses()

    return inertia.render('products/index', {
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Productos', url: null },
      ],
      products: {
        data: products.data,
        meta: {
          currentPage: products.currentPage,
          perPage: products.perPage,
          total: products.total,
          lastPage: products.lastPage,
        },
      },
      warehouses,
      flash: {
        success: session.flashMessages.get('success'),
        errors: session.flashMessages.get('errors'),
        bulkUploadErrors: session.flashMessages.get('bulkUploadErrors'),
      },
    })
  }

  async create({ inertia, session }: HttpContext) {
    const categories = await this.categoryService.getAllCategories()
    const warehouses = await this.warehouseService.getActiveWarehouses()
    const units = await Unit.query()
      .orderBy('category', 'asc')
      .orderBy('name', 'asc')

    // Orden específico de categorías
    const categoryOrder = ['Base', 'Peso', 'Tiempo', 'Longitud', 'Volumen', 'Área']

    // Agrupar unidades por categoría
    const unitsMap = units.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = []
      }
      acc[unit.category].push({
        id: unit.id,
        name: unit.name,
        precision: unit.precision,
        category: unit.category
      })
      return acc
    }, {} as Record<string, any[]>)

    // Ordenar las categorías según el orden especificado
    const groupedUnits = categoryOrder.reduce((acc, category) => {
      if (unitsMap[category]) {
        acc[category] = unitsMap[category]
      }
      return acc
    }, {} as Record<string, any[]>)

    return inertia.render('products/Create', {
      categories,
      warehouses,
      units: groupedUnits,
      flash: {
        categoryId: session.flashMessages.get('categoryId'),
        success: session.flashMessages.get('success'),
        errors: session.flashMessages.get('errors'),
      },
    })
  }

  async store({ request, response, auth, session }: HttpContext) {
    const data = request.only([
      'name',
      'price',
      'category',
      'description',
      'sku',
      'hasInventory',
      'criticalStock',
      'inventories',
      'unitId',
      'precision'
    ])

    try {
      const image = request.file('image', {
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
        size: '5mb',
      })

      // Convertir hasInventory a booleano
      data.hasInventory = data.hasInventory === 'true'

      await this.productService.createProduct(data, auth.user!.id, image)

      session.flash('success', 'Producto creado correctamente')
      return response.redirect().toPath('/products')
    } catch (error) {
      console.error('Error creating product:', error)
      session.flash('errors', {
        message: error.message,
      })

      return response.redirect().back()
    }
  }

  async edit({ params, request, inertia, session }: HttpContext) {
    const warehouseId = request.input('warehouse') // Obtener el almacén del query string
    const product = await this.productService.getProductById(params.id, warehouseId)
    const categories = await this.categoryService.getAllCategories()
    const warehouses = await this.warehouseService.getActiveWarehouses()
    const units = await Unit.query()
      .orderBy('category', 'asc')
      .orderBy('name', 'asc')

    // Orden específico de categorías
    const categoryOrder = ['Base', 'Peso', 'Tiempo', 'Longitud', 'Volumen', 'Área']

    // Agrupar unidades por categoría
    const unitsMap = units.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = []
      }
      acc[unit.category].push({
        id: unit.id,
        name: unit.name,
        precision: unit.precision,
        category: unit.category,
        abbreviation: unit.abbreviation,
        unitPrecision: unit.precision
      })
      return acc
    }, {} as Record<string, any[]>)

    // Ordenar las categorías según el orden especificado
    const groupedUnits = categoryOrder.reduce((acc, category) => {
      if (unitsMap[category]) {
        acc[category] = unitsMap[category]
      }
      return acc
    }, {} as Record<string, any[]>)

    return inertia.render('products/Edit', {
      product,
      categories,
      warehouses,
      units: groupedUnits,
      flash: {
        categoryId: session.flashMessages.get('categoryId'),
      },
    })
  }

  async update({ params, request, response }: HttpContext) {
    const data = request.all()
    const image = request.file('image')
    const warehouseId = request.input('warehouse')

    // Procesar unitId y precision
    if (data.unitId) {
      data.unitId = Number(data.unitId)
    }
    if (data.precision) {
      data.precision = Number(data.precision)
    }

    await this.productService.updateProduct(params.id, data, image, warehouseId)
    return response.redirect().back()
  }

  async destroy({ params, response, session }: HttpContext) {
    try {
      await this.productService.deleteProduct(params.id)
      session.flash('success', 'Producto eliminado correctamente')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', 'Error al eliminar el producto')
      return response.redirect().back()
    }
  }

  async getBulkUploadFile({ response }: HttpContext) {
    const filePath = app.makePath('templateBulkUpload.xlsx')
    return response.download(filePath)
  }

  /**
   * Procesa la carga masiva de productos desde un archivo Excel
   */
  public async processBulkUpload({ request, response, auth, session, inertia }: HttpContext) {
    try {
      // Obtener los datos desde el formulario
      const { fileBase64, fileName, fileType, warehouse } = request.only([
        'fileBase64',
        'fileName',
        'fileType', 
        'warehouse'
      ])

      const user = await auth.authenticate()

      if (!fileBase64) {
        return inertia.render('products/index', {
          bulkUploadResult: {
            success: false,
            message: 'No se proporcionó un archivo válido'
          }
        })
      }

      if (!warehouse) {
        return inertia.render('products/index', {
          bulkUploadResult: {
            success: false,
            message: 'Debe seleccionar un almacén'
          }
        })
      }

      // Procesar la carga masiva con el método que acepta Base64
      const results = await this.productService.processBulkUploadBase64(fileBase64, warehouse, user.id)

      // Preparar mensaje de resultado
      let message = `Se procesaron ${results.created} de ${results.total} productos correctamente.`

      if (results.errors.length > 0) {
        message += ` Se encontraron ${results.errors.length} errores.`
        
        return inertia.render('products/index', {
          bulkUploadResult: {
            success: false,
            message: 'Error al procesar el archivo Excel',
            errors: results.errors
          }
        })
      }

      // Devolver respuesta de éxito
      return inertia.render('products/index', {
        bulkUploadResult: {
          success: true,
          message
        }
      })
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error)
      
      return inertia.render('products/index', {
        bulkUploadResult: {
          success: false,
          message: error.message || 'Error al procesar el archivo Excel'
        }
      })
    }
  }
}
