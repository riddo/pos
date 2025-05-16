import mail from '@adonisjs/mail/services/main'
import EmployeeCreatedEvent from '#events/employee_created'

export type EmployeeCreatedEventData = {
  fullName: string
  email: string
  temporaryPassword: string
}

export default class SendWelcomeEmail {
  async handle(event: EmployeeCreatedEvent) {
    await mail.send((message) => {
      message
        .to(event.data.email)
        .subject('Bienvenido - Credenciales de acceso')
        .htmlView('emails/welcome', {
          fullName: event.data.fullName,
          email: event.data.email,
          temporaryPassword: event.data.temporaryPassword,
        })
    })
  }
}
