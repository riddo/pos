import Category from '#models/category'
import type { HttpContext } from '@adonisjs/core/http'
import CategoryService from '#services/category_service'

export default class CategoriesController {
  private categoryService: CategoryService

  constructor() {
    this.categoryService = new CategoryService()
  }

  async store({ request, response, auth, session }: HttpContext) {
    const { name } = request.only(['name'])

    if (!name) {
      session.flash('errors', {
        message: 'El nombre de la categoría es obligatorio.',
      })
      return response.redirect().back()
    }

    try {
      // Verificar si ya existe una categoría con el mismo nombre
      const exists = await this.categoryService.categoryNameExists(name)
      if (exists) {
        throw new Error('Ya existe una categoría con este nombre.')
      }

      // Crear la nueva categoría
      const category = await this.categoryService.createCategory(name, auth.user!.id)

      session.flash('success', 'Categoría creada exitosamente.')
      session.flash('categoryId', category.id)

      return response.redirect().back()
    } catch (error) {
      session.flash('errors', {
        message: error.message,
      })
      return response.redirect().back()
    }
  }
}
