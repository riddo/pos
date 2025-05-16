import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth_service'
import db from '@adonisjs/lucid/services/db'

export default class LoginController {
  private authService: AuthService

  constructor() {
    this.authService = new AuthService()
  }

  async index({ inertia, auth, response }: HttpContext) {
    if (await auth.check()) {
      return response.redirect().toRoute('pos')
    }
    return inertia.render('auth/login')
  }

  async store({ request, response, auth, session }: HttpContext) {
    const credentials = request.only(['email', 'password'])
    this.authService.setAuth(auth)
    const trx = await db.transaction()

    try {
      await this.authService.login(credentials, trx)
      await trx.commit()
      return response.redirect().toRoute('/pos')
    } catch (error) {
      await trx.rollback()
      session.flash('errors', {
        message: error.message,
      })
      return response.redirect().back()
    }
  }
}
