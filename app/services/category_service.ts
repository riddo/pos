import Category from '#models/category'
import db from '@adonisjs/lucid/services/db'

export default class CategoryService {
  /**
   * Obtiene todas las categorías
   */
  async getAllCategories() {
    return await Category.all()
  }

  /**
   * Verifica si existe una categoría con el mismo nombre
   */
  async categoryNameExists(name: string): Promise<boolean> {
    const formattedName = this.formatCategoryName(name)
    const category = await Category.query().where('categoryName', formattedName).first()

    return !!category
  }

  /**
   * Crea una nueva categoría usando una transacción
   */
  async createCategory(name: string, userId: number) {
    return await db.transaction(async (trx) => {
      try {
        const category = await Category.create(
          {
            categoryName: name,
            userId: userId,
          },
          { client: trx }
        )

        await trx.commit()
        return category
      } catch (error) {
        await trx.rollback()
        throw error
      }
    })
  }

  /**
   * Formatea el nombre de la categoría siguiendo el estándar
   */
  private formatCategoryName(name: string): string {
    const words = name.toLowerCase().split(' ')
    return words
      .map((word, index) => {
        if (index === 0) {
          return word.charAt(0).toUpperCase() + word.slice(1)
        }
        return word
      })
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }
}
