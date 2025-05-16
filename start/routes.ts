/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

const RegistersController = () => import('#controllers/registers_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import {
  viewProducts,
  createProducts,
  editProducts,
  deleteProducts,
  viewSalesHistory,
  viewSaleDetails,
  viewSalesPanel,
  postSales,
  editSales,
  viewSettings,
  manageRoles,
  manageUsers,
  viewWarehouses,
  createWarehouses,
  editWarehouses,
  deleteWarehouses,
  viewMovements,
  viewInventory,
  doMovements,
} from '#abilities/main'
const ProfilesController = () => import('#controllers/profiles_controller')
const SalesHistoryController = () => import('#controllers/sales_history_controller')
const CategoriesController = () => import('#controllers/categories_controller')
const SalesController = () => import('#controllers/sales_controller')
const LogoutsController = () => import('#controllers/logouts_controller')
const ProductsController = () => import('#controllers/products_controller')
const LoginController = () => import('#controllers/login_controller')
const HomeController = () => import('#controllers/home_controller')
const EmailsController = () => import('#controllers/emails_controller')
const WarehousesController = () => import('#controllers/warehouses_controller')
const InventoriesController = () => import('#controllers/inventories_controller')
const InventoryListController = () => import('#controllers/inventory_list_controller')

router.on('/').redirect('/login')

router.get('/register', [RegistersController, 'index']).as('register.index')
router.post('/register', [RegistersController, 'store']).as('register.store')
router.get('/check-email', [EmailsController, 'check'])

router.get('/login', [LoginController, 'index']).as('login.index')
router.post('/login', [LoginController, 'store']).as('login.store')

// Rutas protegidas (requieren autenticación)S
router
  .group(() => {
    router.post('/logout', [LogoutsController, 'handle']).as('logout')


    // Rutas de productos
    router.group(() => {
      router
        .get('/products', [ProductsController, 'index'])
        .as('products.index')
        .use(middleware.bouncer(viewProducts))
      router
        .post('/products', [ProductsController, 'store'])
        .as('products.store')
        .use(middleware.bouncer(createProducts))
      router
        .get('/products/create', [ProductsController, 'create'])
        .as('products.create')
        .use(middleware.bouncer(createProducts))
      router
        .post('/categories', [CategoriesController, 'store'])
        .as('categories.store')
        .use(middleware.bouncer(createProducts))
      router
        .get('/products/:id/edit', [ProductsController, 'edit'])
        .as('products.edit')
        .use(middleware.bouncer(editProducts))
      router
        .put('/products/:id', [ProductsController, 'update'])
        .as('products.update')
        .use(middleware.bouncer(editProducts))
      router
        .delete('/products/:id', [ProductsController, 'destroy'])
        .as('products.destroy')
        .use(middleware.bouncer(deleteProducts))
      router.get('/products/download-template', [ProductsController, 'getBulkUploadFile'])
      router.post('/products/bulk-upload', [ProductsController, 'processBulkUpload'])
    })

    // Rutas de ventas
    router.group(() => {
      router
        .get('/pos', [SalesController, 'index'])
        .as('sales.index')
        .use(middleware.bouncer(viewSalesPanel))
      router
        .post('/pos', [SalesController, 'store'])
        .as('sales.store')
        .use(middleware.bouncer(postSales))
      router
        .put('/pos/:id', [SalesController, 'update'])
        .as('sales.update')
        .use(middleware.bouncer(editSales))
    })

    // Rutas de historial de ventas
    router.group(() => {
      router
        .get('/sales', [SalesHistoryController, 'index'])
        .as('sales')
        .use(middleware.bouncer(viewSalesHistory))
      router
        .get('/sales/:id', [SalesHistoryController, 'show'])
        .as('sales.details')
        .use(middleware.bouncer(viewSaleDetails))
    })

    router
      .group(() => {
        // Rutas de roles - El orden es importante
        router
          .group(() => {
            router.get('/settings/roles/create', '#controllers/roles_controller.create')
            router.get('/settings/roles', '#controllers/roles_controller.index')
            router.post('/settings/roles', '#controllers/roles_controller.store')
            router.put('/settings/roles/:id', '#controllers/roles_controller.update')
            router.delete('/settings/roles/:id', '#controllers/roles_controller.destroy')
          })
          .use(middleware.bouncer(manageRoles))

        // Rutas de empleados
        router
          .group(() => {
            router.get('/settings/employees', '#controllers/settings/employees_controller.index')
            router.post('/settings/employees', '#controllers/settings/employees_controller.store')
            router.put(
              '/settings/employees/:id',
              '#controllers/settings/employees_controller.update'
            )
            router.delete(
              '/settings/employees/:id',
              '#controllers/settings/employees_controller.destroy'
            )
          })
          .use(middleware.bouncer(manageUsers))
      })
      .use(middleware.bouncer(viewSettings))

    // Añadir rutas para warehouses
    router
      .get('/warehouses', [WarehousesController, 'index'])
      .as('warehouses.index')
      .use(middleware.bouncer(viewWarehouses))
    router
      .post('/warehouses', [WarehousesController, 'store'])
      .as('warehouses.store')
      .use(middleware.bouncer(createWarehouses))
    router
      .get('/warehouses/create', [WarehousesController, 'create'])
      .as('warehouses.create')
      .use(middleware.bouncer(createWarehouses))
    router
      .get('/warehouses/:id/edit', [WarehousesController, 'edit'])
      .as('warehouses.edit')
      .use(middleware.bouncer(editWarehouses))
    router
      .put('/warehouses/:id', [WarehousesController, 'update'])
      .as('warehouses.update')
      .use(middleware.bouncer(editWarehouses))
    router
      .delete('/warehouses/:id', [WarehousesController, 'destroy'])
      .as('warehouses.destroy')
      .use(middleware.bouncer(deleteWarehouses))

    // Agregar rutas para inventario
    router
      .group(() => {
        router.post('/inventory/adjust', [InventoriesController, 'adjust']).as('inventory.adjust')
        router
          .post('/inventory/restock', [InventoriesController, 'restock'])
          .as('inventory.restock')
        router
          .post('/inventory/transfer', [InventoriesController, 'transfer'])
          .as('inventory.transfer')
        router
          .post('/inventory/adjustment', [InventoriesController, 'adjustment'])
          .as('inventory.adjustment')
      })
      .use(middleware.bouncer(doMovements))
    router
      .get('/inventory/list', [InventoryListController, 'index'])
      .as('inventory.list')
      .use(middleware.bouncer(viewMovements))
  })
  .use(
    middleware.auth({
      guards: ['web'],
    })
  )
router.get('/profile', [ProfilesController, 'index']).as('profile.index')
router.put('/profile', [ProfilesController, 'update']).as('profile.update')
router.put('/profile/avatar', [ProfilesController, 'updateAvatar']).as('profile.updateAvatar')
router
  .put('/profile/change-password', [ProfilesController, 'changePassword'])
  .as('profile.changePassword')
