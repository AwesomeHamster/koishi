import { App } from 'koishi'
import {} from '@koishijs/plugin-suggest'
import mock from '@koishijs/plugin-mock'

describe('Command Suggestion', () => {
  const app = new App({ prefix: '/' }).plugin(mock)
  const client1 = app.mock.client('456')
  const client2 = app.mock.client('789', '987')

  app.command('foo <text>', { checkArgCount: true })
    .action((_, bar) => 'foo' + bar)

  app.command('fooo', { checkUnknown: true })
    .alias('bool')
    .option('text', '-t <bar>')
    .action(({ options }) => 'fooo' + options.text)

  before(() => app.start())

  it('execute command', async () => {
    await client1.shouldReply('foo bar', 'foobar')
    await client1.shouldNotReply(' ')
  })

  it('no suggestions', async () => {
    await client1.shouldNotReply('bar foo')
  })

  it('apply suggestions 1', async () => {
    await client1.shouldReply('fo bar', '您要找的是不是“foo”？发送句号以使用推测的指令。')
    await client2.shouldReply('/fooo -t bar', 'fooobar')
    await client1.shouldReply(' ', 'foobar')
    await client1.shouldNotReply(' ')
  })

  it('apply suggestions 2', async () => {
    await client2.shouldReply('/foooo -t bar', '您要找的是不是“fooo”？发送句号以使用推测的指令。')
    await client1.shouldReply('foo bar', 'foobar')
    await client2.shouldReply(' ', 'fooobar')
    await client2.shouldNotReply(' ')
  })

  it('ignore suggestions 1', async () => {
    await client1.shouldReply('fo bar', '您要找的是不是“foo”？发送句号以使用推测的指令。')
    await client1.shouldNotReply('bar foo')
    await client1.shouldNotReply(' ')
  })

  it('ignore suggestions 2', async () => {
    await client2.shouldReply('/fo bar', '您要找的是不是“foo”？发送句号以使用推测的指令。')
    await client2.shouldReply('/foo bar', 'foobar')
    await client2.shouldNotReply(' ')
  })

  it('multiple suggestions', async () => {
    await client1.shouldReply('fool bar', '您要找的是不是“foo”或“fooo”或“bool”？')
    await client1.shouldNotReply(' ')
  })
})