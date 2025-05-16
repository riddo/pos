import { BaseEvent } from '@adonisjs/core/events'

export type EmployeeCreatedEventData = {
  fullName: string
  email: string
  temporaryPassword: string
}

export default class EmployeeCreated extends BaseEvent {
  /**
   * Accept event data as constructor parameters
   */
  constructor(public data: EmployeeCreatedEventData) {
    super()
  }
}
