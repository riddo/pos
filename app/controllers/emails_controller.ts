import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class EmailsController {
  /**
   * Verifica si el email ya está en uso
   */
  async check({ request, response, inertia }: HttpContext) {
    const email = request.input('email')

    if (!email) {
      return response.badRequest({ message: 'El email es requerido' })
    }

    const user = await User.findBy('email', email)

    // Comparte el resultado como props de Inertia
    return response.send({
      exists: !!user,
    })
  }
}
