import type { HttpContext } from '@adonisjs/core/http'
import { ProfileService } from '#services/profile_service'
import db from '@adonisjs/lucid/services/db'

export default class ProfilesController {
  private profileService: ProfileService

  constructor() {
    this.profileService = new ProfileService()
  }

  public async index({ inertia, auth }: HttpContext) {
    this.profileService.setAuth(auth)
    const profileData = await this.profileService.getProfileData()
    return inertia.render('profile/index', profileData)
  }

  public async update({ request, response, auth, session }: HttpContext) {
    const trx = await db.transaction()
    this.profileService.setAuth(auth)

    try {
      const data = request.only(['address', 'phone', 'name'])
      await this.profileService.updateProfile(
        {
          address: data.address,
          phone: data.phone,
          fullName: data.name,
        },
        trx
      )

      await trx.commit()
      session.flash('success', 'Perfil actualizado correctamente')
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      session.flash('errors', {
        message: error.message || 'Error al actualizar el perfil',
      })
      return response.redirect().back()
    }
  }

  public async updateAvatar({ request, response, auth, session }: HttpContext) {
    const trx = await db.transaction()
    this.profileService.setAuth(auth)

    try {
      const image = request.file('avatar', {
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
        size: '2mb',
      })

      if (!image) {
        throw new Error('No se ha proporcionado una imagen')
      }

      await this.profileService.updateProfileImage(image, trx)
      await trx.commit()

      session.flash('success', 'Imagen de perfil actualizada correctamente')
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      session.flash('errors', {
        message: error.message || 'Error al actualizar la imagen de perfil',
      })
      return response.redirect().back()
    }
  }

  public async changePassword({ request, response, auth, session }: HttpContext) {
    const trx = await db.transaction()
    this.profileService.setAuth(auth)

    try {
      const data = request.only(['currentPassword', 'password', 'passwordConfirmation'])
      await this.profileService.changePassword(data, trx)

      await trx.commit()
      session.flash('success', 'Contraseña actualizada correctamente')
      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      session.flash('errors', {
        message: error.message || 'Error al cambiar la contraseña',
      })
      return response.redirect().back()
    }
  }
}
