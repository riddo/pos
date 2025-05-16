/*
|--------------------------------------------------------------------------
| Bouncer abilities
|--------------------------------------------------------------------------
|
| You may export multiple abilities from this file and pre-register them
| when creating the Bouncer instance.
|
| Pre-registered policies and abilities can be referenced as a string by their
| name. Also they are must if want to perform authorization inside Edge
| templates.
|
*/

import User from '#models/user'
import { Bouncer, AuthorizationResponse } from '@adonisjs/bouncer'

/**
 * Delete the following ability to start from
 * scratch
 */

const hasPermission = async (user: User, permissionName: string) => {
  const userRole = await user.related('role').query().preload('permissions').first()

  if (!userRole) return false

  return userRole.permissions.some((p) => p.permissionsName === permissionName)
}

// Ventas
export const viewSalesPanel = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_sales_panel'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const postSales = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'post_sales'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const editSales = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'edit_sales'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const viewSalesHistory = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_sales_history'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const viewSaleDetails = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_sale_details'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

// Productos
export const viewProducts = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_products'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const editProducts = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'edit_products'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const deleteProducts = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'delete_products'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const createProducts = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'create_products'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

// Configuraciones
export const viewSettings = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_settings'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const manageRoles = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'manage_roles'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const manageUsers = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'manage_users'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

// Sucursales y Bodegas
export const viewWarehouses = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_warehouses'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const createWarehouses = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'create_warehouses'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const editWarehouses = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'edit_warehouses'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const deleteWarehouses = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'delete_warehouses'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

// Inventario
export const viewInventory = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_inventory'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const doMovements = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'do_movements'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})

export const viewMovements = Bouncer.ability(async (user: User) => {
  return (await hasPermission(user, 'view_movements'))
    ? true
    : AuthorizationResponse.deny('No tienes permisos para realizar esta acción', 403)
})
