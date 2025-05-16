import type { HttpContext } from '@adonisjs/core/http'
import Warehouse from '#models/warehouse'

export default class WarehousesController {
  async index({ inertia, request, session }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search')

    // Crear la consulta base
    const query = Warehouse.query()

    // Aplicar filtro de búsqueda si existe
    if (search) {
      query.where('name', 'like', `%${search}%`).orWhere('location', 'like', `%${search}%`)
    }

    // Ejecutar la consulta con paginación (5 elementos por página)
    const warehouses = await query.paginate(Number(page), 5)

    return inertia.render('warehouses/index', {
      warehouses,
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Almacenes', url: null },
      ],
      flash: {
        success: session.flashMessages.get('success'),
        error: session.flashMessages.get('error'),
      },
    })
  }

  async create({ inertia }: HttpContext) {
    return inertia.render('warehouses/Create', {
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Almacenes', url: '/warehouses' },
        { name: 'Crear Almacén', url: null },
      ],
    })
  }

  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'location', 'warehouseType', 'status'])

    await Warehouse.create(data)

    return response.redirect().toPath('/warehouses')
  }

  async edit({ params, inertia }: HttpContext) {
    const warehouse = await Warehouse.findOrFail(params.id)

    return inertia.render('warehouses/Edit', {
      warehouse,
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Almacenes', url: '/warehouses' },
        { name: 'Editar Almacén', url: null },
      ],
    })
  }

  async update({ params, request, response }: HttpContext) {
    const warehouse = await Warehouse.findOrFail(params.id)
    const data = request.only(['name', 'location', 'warehouseType', 'status'])

    await warehouse.merge(data).save()

    return response.redirect().toPath('/warehouses')
  }

  async destroy({ params, response }: HttpContext) {
    const warehouse = await Warehouse.findOrFail(params.id)
    await warehouse.delete()

    return response.redirect().toPath('/warehouses')
  }
}
