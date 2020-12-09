/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  BaseScene as Scene,
  SceneContext,
  SceneContextScene,
  session,
  Stage,
  Telegraf,
} from 'telegraf'

/**
 * We can extend the scene object itself by extending `SceneContextScene`. Note
 * that you need to pass your context object as type variable.
 */
interface MyScene extends SceneContextScene<MyContext> {
  // will be available under `ctx.scene.mySceneProp`
  mySceneProp: number
}

/**
 * Since you can only pass a custom context to the bot, we can simply define a
 * type alias to use the custom scene without actually extending the context in
 * any way.
 */
type MyContext = SceneContext<MyScene>

// Handler factories
const { enter, leave } = Stage

// Greeter scene
const greeterScene = new Scene<MyContext>('greeter')
greeterScene.enter((ctx) => ctx.reply('Hi'))
greeterScene.leave((ctx) => ctx.reply('Bye'))
greeterScene.hears('hi', enter('greeter'))
greeterScene.on('message', (ctx) => ctx.replyWithMarkdown('Send `hi`'))

// Echo scene
const echoScene = new Scene<MyContext>('echo')
echoScene.enter((ctx) => ctx.reply('echo scene'))
echoScene.leave((ctx) => ctx.reply('exiting echo scene'))
echoScene.command('back', leave())
echoScene.on('text', (ctx) => ctx.reply(ctx.message.text))
echoScene.on('message', (ctx) => ctx.reply('Only text messages please'))

const bot = new Telegraf<MyContext>(process.env.BOT_TOKEN)

const stage = new Stage<MyContext>([greeterScene, echoScene], {
  ttl: 10,
})
bot.use(session())
bot.use(stage.middleware())
bot.use((ctx, next) => {
  // we now have access to the the fields defined above
  ctx.scene.mySceneProp ??= 0
  return next()
})
bot.command('greeter', (ctx) => ctx.scene.enter('greeter'))
bot.command('echo', (ctx) => ctx.scene.enter('echo'))
bot.on('message', (ctx) => ctx.reply('Try /echo or /greeter'))
bot.launch()