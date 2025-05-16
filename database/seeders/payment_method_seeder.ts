import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSeeder {
  async run() {
    // Crear métodos de pago básicos
    await db.table('payment_methods').insert([
      {
        method_type: 'cash',
        details: 'Pago en efectivo',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        method_type: 'debit',
        details: 'Pago con tarjeta de débito',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        method_type: 'credit',
        details: 'Pago con tarjeta de crédito',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])
  }
}
