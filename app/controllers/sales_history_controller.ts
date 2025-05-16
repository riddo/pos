import type { HttpContext } from '@adonisjs/core/http'
import SalesHeader from '#models/sales_header'
import Warehouse from '#models/warehouse'
import SalesDetail from '#models/sales_detail'
import db from '@adonisjs/lucid/services/db'

export default class SalesHistoryController {
  async index({ request, inertia }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search')
    const warehouseId = request.input('warehouse')
    const month = request.input('month', new Date().getMonth() + 1) // Mes actual (1-12)
    const year = request.input('year', new Date().getFullYear()) // Año actual

    console.log('Recibido warehouseId:', warehouseId, 'tipo:', typeof warehouseId)

    const query = SalesHeader.query().preload('salesDetails').orderBy('created_at', 'desc')

    // Obtener la estructura de la tabla para verificar el nombre de columna
    console.log('Verificando estructura de tabla sales_header')
    const tableInfo = await db.from('sales_header').first()
    console.log('Columnas disponibles en sales_header:', Object.keys(tableInfo || {}))

    // Obtener ventas diarias del mes seleccionado
    const salesByDayQuery = db
      .from('sales_header')
      .select(
        db.raw('EXTRACT(DAY FROM created_at) as day'),
        db.raw('COUNT(*) as count'),
        db.raw('SUM(total) as total')
      )
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [month])
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])

    // Aplicar filtro de almacén a ventas diarias si está presente
    if (warehouseId) {
      console.log('Aplicando filtro de warehouseId a salesByDay:', warehouseId)
      // Usar el nombre correcto de la columna según el modelo
      salesByDayQuery.where('warehouse_id', warehouseId) 
    }

    const salesByDay = await salesByDayQuery.groupBy('day').orderBy('day')
    console.log('Datos salesByDay con filtro:', salesByDay.length, 'registros')

    //acumular ventas por mes
    const salesByMonth = await db
      .from('sales_header')
      .select(db.raw('EXTRACT(MONTH FROM created_at) as month'), db.raw('COUNT(*) as total'))
      .groupBy('month')
      .orderBy('month')

    // Consulta base para top productos
    let topProductsQuery = SalesDetail.query()
      .select('product_id')
      .sum('quantity as total_sold')
      .groupBy('product_id')
      .orderBy('total_sold', 'desc')
      .preload('product')
      .limit(3)

    // Si hay un warehouse seleccionado, filtramos los productos de ese almacén
    if (warehouseId) {
      console.log('Aplicando filtro de warehouseId a topProducts:', warehouseId)
      // Usar el nombre correcto según la definición de la relación
      topProductsQuery = topProductsQuery.whereHas('salesHeader', (query) => {
        console.log('Dentro de whereHas para salesHeader, aplicando filtro warehouseId')
        query.where('warehouse_id', warehouseId)
      })
    }

    const topProducts = await topProductsQuery.exec()
      .then((results) => {
        return results.map((result) => ({
          name: result.product.productName,
          product: result.product,
          totalSold: Number(result.$extras.total_sold),
        }))
      })

    if (search) {
      // Verificamos si la búsqueda es un número para manejar la búsqueda por ID correctamente
      if (!isNaN(Number(search))) {
        // Si es número, buscar por ID exacto
        query.where('id', Number(search))
      } else {
        // Si no es número, buscar solo por ID como texto
        query.whereRaw('CAST(id AS TEXT) LIKE ?', [`%${search}%`])
      }
    }

    if (warehouseId) {
      query.where('warehouseId', warehouseId)
    }

    const sales = await query.paginate(page, 5)

    // Obtener solo los almacenes tipo tienda que estén activos
    const warehouses = await Warehouse.query()
      .where('status', 'active')
      .where('warehouseType', 'store')
      .exec()
    return inertia.render('sales/index', {
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Historial de ventas', url: null },
      ],
      sales: {
        data: sales.all().map((sale) => ({
          id: sale.id,
          date: sale.createdAt,
          customerName: 'Cliente General', // Valor por defecto ya que no existe la propiedad customerName
          paymentMethodId: sale.paymentMethodId,
          total: sale.total,
          warehouseId: sale.warehouseId,
        })),
        meta: {
          total: sales.total,
          perPage: sales.perPage,
          currentPage: sales.currentPage,
          lastPage: sales.lastPage,
        },
        warehouses,
        topProducts,
        salesByDay,
        salesByMonth,
        filters: {
          month: Number(month),
          year: Number(year),
        },
      },
    })
  }

  async show({ params, inertia }: HttpContext) {
    const sale = await SalesHeader.query()
      .where('id', params.id)
      .preload('user')
      .preload('paymentMethod')
      .preload('salesDetails', (query) => {
        query.preload('product', (productQuery) => {
          productQuery.preload('unit')
        })
      })
      .firstOrFail()

    return inertia.render('sales/SaleDetails', {
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Historial de ventas', url: '/sales' },
        { name: 'Detalle de venta #' + sale.id, url: null },
      ],
      sale: {
        id: sale.id,
        date: sale.createdAt,
        customerName: 'Cliente General', // Valor temporal por defecto
        paymentMethod: 'Efectivo', // Valor temporal por defecto
        total: sale.total,
        details: sale.salesDetails.map((detail) => ({
          productName: detail.product.productName,
          quantity: detail.quantity,
          unitPrice: detail.unitPrice,
          subtotal: detail.quantity * detail.unitPrice,
          unit: detail.product.unit?.abbreviation || 'u'
        })),
      },
    })
  }
}
