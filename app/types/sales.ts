export interface SaleItem {
  id: number
  name: string
  price: number
  quantity: number
  warehouseId: number
  hasInventory: boolean
  unit?: {
    id: number
    name: string
    abbreviation: string
    precision: number
  }
}
