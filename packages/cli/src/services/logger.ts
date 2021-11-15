import { App, Logger, Schema, version } from 'koishi'
import { Loader } from '../loader'
import {} from '../..'

const LoggerConfig = Schema.object({
  levels: Schema.any('默认的日志输出等级。'),
  showDiff: Schema.boolean('标注相邻两次日志输出的时间差。'),
  showTime: Schema.union([Schema.boolean(), Schema.string()], '输出日志所使用的时间格式。'),
}, '日志设置')

App.Config.list.push(Schema.object({
  logger: LoggerConfig.hidden(),
}))

export function prepare(loader: Loader, config: App.Config.Logger = {}) {
  const { levels } = config
  // configurate logger levels
  if (typeof levels === 'object') {
    Logger.levels = levels as any
  } else if (typeof levels === 'number') {
    Logger.levels.base = levels
  }

  let showTime = config.showTime
  if (showTime === true) showTime = 'yyyy-MM-dd hh:mm:ss'
  if (showTime) Logger.targets[0].showTime = showTime
  Logger.targets[0].showDiff = config.showDiff ?? !showTime

  // cli options have higher precedence
  if (process.env.KOISHI_LOG_LEVEL) {
    Logger.levels.base = +process.env.KOISHI_LOG_LEVEL
  }

  function ensureBaseLevel(config: Logger.LevelConfig, base: number) {
    config.base ??= base
    Object.values(config).forEach((value) => {
      if (typeof value !== 'object') return
      ensureBaseLevel(value, config.base)
    })
  }

  ensureBaseLevel(Logger.levels, 2)

  if (process.env.KOISHI_DEBUG) {
    for (const name of process.env.KOISHI_DEBUG.split(',')) {
      new Logger(name).level = Logger.DEBUG
    }
  }

  new Logger('app').info('%C', `Koishi/${version}`)
  Logger.timestamp = Date.now()
}
