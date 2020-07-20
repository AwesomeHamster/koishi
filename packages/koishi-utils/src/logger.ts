import { inspect, InspectOptions, format } from 'util'
import { stderr } from 'supports-color'
import { isatty } from 'tty'

const isTTY = isatty(process.stderr['fd'])

const colors = stderr.level < 2 ? [6, 2, 3, 4, 5, 1] : [
  20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62,
  63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113,
  129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168,
  169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200,
  201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
]

const instances: Record<string, Logger> = {}

type LogFunction = (format: any, ...param: any[]) => void

export class Logger {
  static baseLevel = 2
  static levels: Record<string, number> = {}

  static options: InspectOptions = {
    colors: isTTY,
  }

  static formatters: Record<string, (this: Logger, value: any) => string> = {
    c: Logger.prototype.wrapColor,
    o: value => inspect(value, Logger.options).replace(/\s*\n\s*/g, ' '),
  }

  static create (name = '') {
    return instances[name] || new Logger(name)
  }

  private colorCode: number
  private displayName: string

  public success: LogFunction
  public error: LogFunction
  public info: LogFunction
  public warn: LogFunction
  public debug: LogFunction

  private constructor (private name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 3) - hash) + name.charCodeAt(i)
      hash |= 0
    }
    this.colorCode = colors[Math.abs(hash) % colors.length]
    instances[this.name] = this
    this.displayName = name
    if (name) this.displayName += ' '
    if (isTTY) this.displayName = this.wrapColor(this.displayName, ';1')
    this.createMethod('success', '[S] ', 1)
    this.createMethod('error', '[E] ', 1)
    this.createMethod('info', '[I] ', 2)
    this.createMethod('warn', '[W] ', 2)
    this.createMethod('debug', '[D] ', 3)
  }

  private wrapColor (value: any, decoration = '') {
    if (!Logger.options.colors) return '' + value
    const code = this.colorCode
    return `\u001B[3${code < 8 ? code : '8;5;' + code}${decoration}m${value}\u001B[0m`
  }

  private createMethod (name: string, prefix: string, minLevel: number) {
    this[name] = (...args: [any, ...any[]]) => {
      if (this.level < minLevel) return
      process.stderr.write(prefix + this.displayName + this.format(...args) + '\n')
    }
  }

  get level () {
    return Logger.levels[this.name] ?? Logger.baseLevel
  }

  extend = (namespace: string) => {
    return Logger.create(`${this.name}:${namespace}`)
  }

  format: (format: any, ...param: any[]) => string = (...args) => {
    if (args[0] instanceof Error) {
      args[0] = args[0].stack || args[0].message
    } else if (typeof args[0] !== 'string') {
      args.unshift('%O')
    }

    let index = 0
    args[0] = (args[0] as string).replace(/%([a-zA-Z%])/g, (match, format) => {
      if (match === '%%') return match
      index += 1
      const formatter = Logger.formatters[format]
      if (typeof formatter === 'function') {
        match = formatter.call(this, args[index])
        args.splice(index, 1)
        index -= 1
      }
      return match
    }).split('\n').join('\n    ')

    return format(...args)
  }
}
