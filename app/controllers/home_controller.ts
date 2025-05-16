import Role from '#models/role'
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia, auth }: HttpContext) {
    const user = await auth.authenticate()

    // Cargar el rol con sus permisos usando preload
    const role = await Role.query()
      .select('id', 'rol')
      .where('id', user.roleId)
      .preload('permissions')

    console.log('Role:', role)

    return inertia.render('home', {
      breadcrumb: [
        { name: 'Dashboard', url: '/dashboard' },
        { name: 'Inicio', url: null },
      ],
    })
  }
}
