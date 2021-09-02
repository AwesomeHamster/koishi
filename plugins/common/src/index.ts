import { Context } from 'koishi'
import basic, { BasicConfig } from './basic'
import handler, { HandlerConfig } from './handler'
import updater, { UpdaterConfig } from './updater'

export * from './basic'
export * from './handler'
export * from './updater'

declare module 'koishi' {
  interface Loader {
    common: typeof import('.')
  }
}

export interface Config extends HandlerConfig, BasicConfig, UpdaterConfig {}

export const name = 'common'

export function apply(ctx: Context, config: Config = {}) {
  ctx.command('common', '基础功能')

  ctx.plugin(basic, config)
  ctx.plugin(handler, config)
  ctx.plugin(updater, config)
}
