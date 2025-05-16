import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Unit from '#models/unit'

export default class extends BaseSeeder {
  async run() {
    const units = [
      // Unidad base
      { name: 'Cada uno', abbreviation: 'u', category: 'Base', precision: 1 },
      
      // Peso
      { name: 'Gramo', abbreviation: 'g', category: 'Peso', precision: 0.1 },
      { name: 'Kilogramo', abbreviation: 'kg', category: 'Peso', precision: 0.001 },
      { name: 'Onza', abbreviation: 'oz', category: 'Peso', precision: 0.01 },
      { name: 'Libra', abbreviation: 'lb', category: 'Peso', precision: 0.01 },
      
      // Tiempo
      { name: 'Minuto', abbreviation: 'min', category: 'Tiempo', precision: 1 },
      { name: 'Hora', abbreviation: 'hr', category: 'Tiempo', precision: 0.1 },
      { name: 'Día', abbreviation: 'd', category: 'Tiempo', precision: 1 },
      { name: 'Semana', abbreviation: 'sem.', category: 'Tiempo', precision: 1 },
      { name: 'Mes', abbreviation: 'mes', category: 'Tiempo', precision: 1 },
      { name: 'Año', abbreviation: 'a.', category: 'Tiempo', precision: 1 },
      
      // Longitud
      { name: 'Milímetro', abbreviation: 'mm', category: 'Longitud', precision: 0.1 },
      { name: 'Centímetro', abbreviation: 'cm', category: 'Longitud', precision: 0.1 },
      { name: 'Metro', abbreviation: 'm', category: 'Longitud', precision: 0.01 },
      { name: 'Kilómetro', abbreviation: 'km', category: 'Longitud', precision: 0.001 },
      { name: 'Pulgada', abbreviation: 'in', category: 'Longitud', precision: 0.1 },
      { name: 'Pie', abbreviation: 'ft', category: 'Longitud', precision: 0.01 },
      { name: 'Milla', abbreviation: 'mi', category: 'Longitud', precision: 0.001 },
      
      // Volumen
      { name: 'Centilitro', abbreviation: 'cl', category: 'Volumen', precision: 0.1 },
      { name: 'Litro', abbreviation: 'l', category: 'Volumen', precision: 0.01 },
      { name: 'Mililitro', abbreviation: 'ml', category: 'Volumen', precision: 1 },
      { name: 'Galón', abbreviation: 'gal', category: 'Volumen', precision: 0.01 },
      
      // Área
      { name: 'Metro cuadrado', abbreviation: 'm²', category: 'Área', precision: 0.01 },
      { name: 'Pie cuadrado', abbreviation: 'ft²', category: 'Área', precision: 0.01 },
    ]

    await Unit.createMany(units)
  }
}