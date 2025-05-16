import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class BouncerMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: any) {
    /**
     * Middleware logic goes here (before the next call)
     */

    await ctx.bouncer.authorize(options)
    /**
     * Call next method in the pipeline and return its output
     */

    return next()
  }
}
