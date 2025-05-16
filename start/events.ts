import emitter from '@adonisjs/core/services/emitter'
import EmployeeCreatedEvent from '#events/employee_created'
const SendWelcomeEmail = () => import('#listeners/send_welcome_email')

emitter.on(EmployeeCreatedEvent, [SendWelcomeEmail, 'handle'])
