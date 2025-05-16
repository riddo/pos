import Product from '#models/product'
import Inventory from '#models/inventory'
import db from '@adonisjs/lucid/services/db'
import { promises as fs } from 'node:fs'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import SalesDetail from '#models/sales_detail'
import XLSX from 'xlsx'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Category from '#models/category'
import Unit from '#models/unit'

// Define un tipo para los productos del Excel
interface BulkProductData {
  productName: string
  category: string
  price: number
  stock: number
  sku: string
  description?: string
}

// Define un tipo para los resultados de la importación
interface ImportResult {
  total: number
  created: number
  errors: {
    row: number
    product: string
    message: string
  }[]
}

export default class ProductService {
  //=============================================================================
  // MÉTODOS CRUD BÁSICOS
  //=============================================================================

  /**
   * Obtiene productos con filtros opcionales
   */
  async getProducts(page: number = 1, search?: string, warehouseId?: string) {
    const query = Product.query()
      .apply((scopes) => scopes.active())
      .preload('category')
      .preload('inventory', (inventoryQuery) => {
        if (warehouseId) {
          inventoryQuery.where('warehouseId', warehouseId)
        }
        inventoryQuery.preload('warehouse')
      })

    if (warehouseId) {
      query.where((builder) => {
        builder
          .whereHas('inventory', (inventorySubQuery) => {
            inventorySubQuery.where('warehouseId', warehouseId)
          })
          .orWhereDoesntHave('inventory', (query) => query)
      })
    }

    if (search) {
      query.where('productName', 'like', `%${search}%`)
    }

    const products = await query.paginate(page, 5)

    const transformedData = products.all().map((product) => ({
      id: product.id,
      productName: product.productName,
      imagePath: product.imagePath,
      price: product.price,
      category: product.category,
      inventory: product.inventory?.[0] || null,
    }))

    return {
      ...products,
      data: transformedData,
    }
  }

  /**
   * Obtiene un producto por su ID y almacén específico
   */
  async getProductById(id: number, warehouseId?: string) {
    const product = await Product.query()
      .where('id', id)
      .preload('inventory', (query) => {
        if (warehouseId) {
          query.where('warehouseId', warehouseId)
        }
        query.preload('warehouse')
      })
      .preload('category')
      .preload('unit')
      .firstOrFail()

    // Asegurarnos de obtener el inventario correcto según el almacén
    const inventory = warehouseId 
      ? product.inventory.find(inv => inv.warehouseId === Number(warehouseId))
      : product.inventory[0]

    // Transformar los datos para que coincidan con el formato esperado en el frontend
    return {
      ...product.serialize(),
      inventory: inventory,
      categoryId: product.categoryId,
      productName: product.productName,
      price: product.price,
      sku: product.sku,
      description: product.description,
      imagePath: product.imagePath,
      initialStock: inventory?.stock || 0,
      criticalStock: inventory?.criticalStock || 0,
      warehouseId: inventory?.warehouseId || '',
      unitId: product.unitId ? String(product.unitId) : '',
      precision: product.unit?.precision || '1',
      unitName: product.unit?.name || '',
      unitPrecision: product.unit?.precision || '1'
    }
  }

  /**
   * Crea un nuevo producto con o sin inventarios
   */
  async createProduct(data: any, userId: number, image?: MultipartFile | null) {
    let imagePath = 'default-product.png'

    if (image) {
      imagePath = await this.processImage(image)
    }

    try {
      const exists = await this.productNameExists(data.name)
      if (exists) {
        throw new Error('Ya existe un producto con este nombre')
      }

      // Iniciar transacción
      return await db.transaction(async (trx) => {
        // Verificar si la unidad es "Cada uno" antes de actualizar la precisión
        if (data.unitId && data.precision !== undefined) {
          const unit = await Unit.query({ client: trx })
            .where('id', Number(data.unitId))
            .firstOrFail()

          // Solo actualizar la precisión si la unidad no es "Cada uno"
          if (unit.name !== 'Cada uno') {
            await Unit.query({ client: trx })
              .where('id', Number(data.unitId))
              .update({ precision: data.precision })
          }
        }

        // Crear producto
        const product = await Product.create(
          {
            userId: userId,
            productName: data.name,
            categoryId: data.category,
            price: data.price,
            description: data.description,
            sku: data.sku,
            imagePath,
            hasInventory: data.hasInventory,
            unitId: data.unitId ? Number(data.unitId) : undefined,
          },
          { client: trx }
        )

        // Solo crear inventarios si hasInventory es true
        if (data.hasInventory && data.inventories?.length > 0) {
          for (const inventory of data.inventories) {
            await Inventory.create(
              {
                productId: product.id,
                warehouseId: inventory.warehouseId,
                stock: Number(inventory.initialStock),
                criticalStock: Number(data.criticalStock),
                stockStatus: this.calculateStockStatus(Number(inventory.initialStock), Number(data.criticalStock)),
              },
              { client: trx }
            )
          }
        }

        return product
      })
    } catch (error) {
      // Si hay error, eliminar la imagen si se subió una nueva
      if (image && imagePath !== 'default-product.png') {
        await this.deleteImage(imagePath)
      }
      throw error
    }
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(productId: number, data: any, image?: MultipartFile | null, warehouseId?: string) {
    const product = await Product.findOrFail(productId)

    let imagePath = product.imagePath
    if (image) {
      imagePath = await this.processImage(image)
    }
    const categoryId = data.category === 'null' ? null : Number(data.category)
    const sku = data.sku === 'null' ? null : data.sku

    // Iniciar transacción para asegurar la integridad de los datos
    return await db.transaction(async (trx) => {
      // Verificar si la unidad es "Cada uno" antes de actualizar la precisión
      if (data.unitId && data.precision !== undefined) {
        const unit = await Unit.query({ client: trx })
          .where('id', Number(data.unitId))
          .firstOrFail()

        // Solo actualizar la precisión si la unidad no es "Cada uno"
        if (unit.name !== 'Cada uno') {
          await unit.merge({ precision: Number(data.precision) }).save()
        }
      }

      // Actualizar producto
      await Product.query({ client: trx })
        .where('id', product.id)
        .update({
          productName: data.name,
          price: data.price,
          description: data.description,
          imagePath,
          categoryId,
          sku,
          unitId: data.unitId ? Number(data.unitId) : null,
        })

      // Solo actualizar el inventario si el producto tiene hasInventory
      if (product.hasInventory && warehouseId) {
        const inventory = await Inventory.query({ client: trx })
          .where('productId', product.id)
          .where('warehouseId', Number(warehouseId))
          .firstOrFail()

        await inventory.merge({
          criticalStock: data.criticalStock,
          stockStatus: this.calculateStockStatus(inventory.stock, data.criticalStock),
        }).save()
      }

      return product
    })
  }

  /**
   * Elimina un producto (soft delete)
   */
  async deleteProduct(productId: number) {
    const product = await Product.findOrFail(productId)
    product.sku = null
    product.save()
    return await product.softDelete()
  }

  /**
   * Verifica si existe un producto con el mismo nombre
   */
  async productNameExists(name: string): Promise<boolean> {
    const formattedName = await this.formatName(name)
    const product = await Product.query()
      .where('productName', formattedName)
      .whereNull('deleted_at')
      .first()

    return !!product
  }

  //=============================================================================
  // MÉTODOS PARA CARGA MASIVA DE PRODUCTOS
  //=============================================================================

  /**
   * Procesa la carga masiva de productos desde un archivo Excel
   */
  async processBulkUpload(
    file: MultipartFile,
    warehouse: string,
    userId: number
  ): Promise<ImportResult> {
    const products = this.processExcelFile(file)

    const results: ImportResult = {
      total: products.length,
      created: 0,
      errors: [],
    }

    // Usar transacción para toda la operación
    return await db.transaction(async (trx) => {
      for (const [i, product] of products.entries()) {
        try {
          await this.createBulkProduct(product, warehouse, userId, trx)
          results.created++
        } catch (error) {
          // Formatear el nombre para mostrarlo en el mensaje de error
          const formattedName = await this.formatName(product.productName)
          console.log(`Error al procesar producto en fila ${i + 2}:`, error.message)
          results.errors.push({
            row: i + 2, // +2 porque la fila 1 es el encabezado
            product: formattedName || product.sku || `Fila ${i + 2}`,
            message: error.message,
          })
        }
      }
      return results
    })
  }

  /**
   * Procesa la carga masiva de productos desde un archivo Excel en formato Base64
   */
  async processBulkUploadBase64(
    fileBase64: string,
    warehouse: string,
    userId: number
  ): Promise<ImportResult> {
    try {
      // Convertir Base64 a buffer
      const buffer = Buffer.from(fileBase64, 'base64')
      
      // Procesar el archivo Excel desde el buffer
      const products = this.processExcelBuffer(buffer)

      const results: ImportResult = {
        total: products.length,
        created: 0,
        errors: [],
      }

      // Usar transacción para toda la operación
      return await db.transaction(async (trx) => {
        for (const [i, product] of products.entries()) {
          try {
            await this.createBulkProduct(product, warehouse, userId, trx)
            results.created++
          } catch (error) {
            // Formatear el nombre para mostrarlo en el mensaje de error
            const formattedName = await this.formatName(product.productName)
            console.log(`Error al procesar producto en fila ${i + 2}:`, error.message)
            results.errors.push({
              row: i + 2, // +2 porque la fila 1 es el encabezado
              product: formattedName || product.sku || `Fila ${i + 2}`,
              message: error.message,
            })
          }
        }
        return results
      })
    } catch (error) {
      console.error('Error en processBulkUploadBase64:', error)
      throw new Error(`Error al procesar el archivo: ${error.message}`)
    }
  }

  /**
   * Crea un producto individual a partir de datos del Excel
   * Utiliza transacción para garantizar la integridad de los datos
   */
  private async createBulkProduct(
    product: BulkProductData,
    warehouseId: string,
    userId: number,
    trx: TransactionClientContract
  ) {
    // Formatear el nombre del producto para que coincida con el formato en la base de datos
    const formattedName = await this.formatName(product.productName)

    // Verificar si existe un producto con el mismo nombre
    const { existingProduct, existingInventory } = await this.verifyProduct(product, warehouseId)
    const categoryName = await this.formatName(product.category)
    const categoryId = await this.verifyCategory(categoryName, userId)

    // Si el producto ya existe y ya tiene inventario en este almacén, lanzar un error
    if (existingProduct && existingInventory) {
      throw new Error(`El producto "${formattedName}" ya existe en el almacén seleccionado`)
    }

    // Variable para almacenar el ID del producto (existente o nuevo)
    let productId: number

    if (!existingProduct) {
      // Crear el producto y obtener la instancia creada
      const newProduct = await Product.create(
        {
          productName: formattedName, // Usar el nombre formateado
          price: product.price,
          sku: product.sku,
          userId,
          description: product.description || '',
          imagePath: 'default-product.png',
          categoryId,
        },
        { client: trx }
      )

      // Guardar el ID del producto recién creado
      productId = newProduct.id
    } else {
      // Usar el ID del producto existente
      productId = existingProduct.id
    }

    // Verificar si ya existe inventario para este producto en este almacén
    if (!existingInventory) {
      // Crear el inventario usando el ID del producto (nuevo o existente)
      await Inventory.create(
        {
          productId: productId,
          warehouseId: Number(warehouseId),
          stock: product.stock,
          criticalStock: 10, // Valor por defecto, podría ser configurable
        },
        { client: trx }
      )
    }
  }

  /**
   * Verifica si existe un producto con el mismo nombre
   */
  private async verifyProduct(product: BulkProductData, warehouseId: string) {
    // Formatear el nombre del producto para que coincida con el formato en la base de datos
    const formattedName = await this.formatName(product.productName)

    // Verificar si existe un producto con el mismo nombre formateado
    const existingProduct = await Product.query()
      .where('productName', formattedName)
      .whereNull('deleted_at')
      .first()

    // Si existe un producto con el mismo nombre, verificar si ya tiene inventario en el almacén seleccionado
    let existingInventory = null
    if (existingProduct) {
      existingInventory = await Inventory.query()
        .where('productId', existingProduct.id)
        .where('warehouseId', warehouseId)
        .first()
    }
    return { existingProduct, existingInventory }
  }

  /**
   * Procesa un archivo Excel para crear productos y los retorna en un array
   */
  private processExcelFile(file: MultipartFile): BulkProductData[] {
    if (!file || !file.tmpPath) {
      throw new Error('No se proporcionó un archivo válido')
    }

    const workbook = XLSX.readFile(file.tmpPath)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      throw new Error('No se encontró la hoja de trabajo en el Excel')
    }

    const products = XLSX.utils.sheet_to_json<BulkProductData>(worksheet)
    return products
  }

  /**
   * Procesa un buffer Excel para crear productos y los retorna en un array
   */
  private processExcelBuffer(buffer: Buffer): BulkProductData[] {
    try {
      console.log(`Procesando buffer de tamaño: ${buffer.length} bytes`)
      
      // Asegurarnos de que el buffer tenga un tamaño razonable
      if (buffer.length === 0) {
        throw new Error('El archivo está vacío')
      }
      
      // Intentar leer el Excel desde el buffer
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('No se pudo leer el archivo Excel correctamente')
      }
      
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]

      if (!worksheet) {
        throw new Error('No se encontró la hoja de trabajo en el Excel')
      }

      // Convertir la hoja a JSON
      const products = XLSX.utils.sheet_to_json<BulkProductData>(worksheet)
      
      // Verificar que se obtuvieron productos
      if (!products || products.length === 0) {
        throw new Error('No se encontraron productos en el archivo')
      }
      
      console.log(`Se encontraron ${products.length} productos en el archivo`)
      
      // Validación básica de los datos
      products.forEach((product, index) => {
        if (!product.productName) {
          throw new Error(`Fila ${index + 2}: Falta el nombre del producto`)
        }
        if (!product.price || isNaN(product.price)) {
          throw new Error(`Fila ${index + 2}: Precio inválido o faltante para "${product.productName}"`)
        }
      })
      
      return products
    } catch (error) {
      console.error('Error al procesar el archivo Excel:', error)
      throw new Error(`Error al procesar el archivo Excel: ${error.message}`)
    }
  }

  //=============================================================================
  // MÉTODOS PARA INVENTARIO Y ESTADÍSTICAS
  //=============================================================================

  /**
   * Obtiene los productos más vendidos
   */
  async getTopProducts() {
    return await SalesDetail.query()
      .select('product_id')
      .sum('quantity as total_sold')
      .groupBy('product_id')
      .orderBy('total_sold', 'desc')
      .preload('product')
      .exec()
      .then((results) => {
        return results.map((result) => ({
          product: result.product,
          totalSold: Number(result.$extras.total_sold),
        }))
      })
  }

  /**
   * Calcula el estado del stock basado en la cantidad y el stock crítico
   */
  private calculateStockStatus(
    stock: number,
    criticalStock: number
  ): 'available' | 'low' | 'out_of_stock' {
    if (stock <= 0) return 'out_of_stock'
    if (stock <= criticalStock) return 'low'
    return 'available'
  }

  //=============================================================================
  // MÉTODOS DE UTILIDAD
  //=============================================================================

  /**
   * Verifica si existe la categoría, si no existe la crea
   */
  private async verifyCategory(categoryName: string, userId: number) {
    let category = await Category.query().where('categoryName', categoryName).first()
    if (!category) {
      category = await Category.create({ categoryName, userId })
    }
    const categoryId = category?.id
    return categoryId
  }

  /**
   * Formatea el nombre del producto
   */
  private async formatName(name: string) {
    const words = name.toLowerCase().split(' ')
    return words
      .map((word, index) => {
        // Solo capitalizar la primera palabra
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }
        return word
      })
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
  }

  /**
   * Procesa y guarda una imagen
   */
  private async processImage(image: MultipartFile): Promise<string> {
    if (!image.isValid) {
      throw new Error('Imagen inválida')
    }

    const imageName = `${new Date().getTime()}.${image.extname}`
    const uploadPath = 'inertia/public/products'

    try {
      await image.move(uploadPath, { name: imageName })
      return imageName
    } catch (error) {
      console.error('Error al procesar la imagen:', error)
      throw new Error('Error al procesar la imagen')
    }
  }

  /**
   * Elimina una imagen del sistema de archivos
   */
  private async deleteImage(imagePath: string): Promise<void> {
    try {
      await fs.unlink(`inertia/public/products/${imagePath}`)
    } catch (unlinkError) {
      // Ignorar errores al eliminar el archivo
    }
  }
}
