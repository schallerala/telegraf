/* eslint-disable @typescript-eslint/no-floating-promises */
import {
  Composer,
  Markup,
  session,
  Stage,
  Telegraf,
  WizardContext,
  WizardContextWizard,
  WizardScene,
  WizardSession,
  WizardSessionData,
} from 'telegraf'

/**
 * It is possible to extend the session object that is available to each wizard.
 * This can be done by extending `WizardSessionData` and in turn passing your own
 * interface as a type variable to `WizardSession`.
 */
interface MyWizardSession extends WizardSessionData {
  // will be available under `ctx.scene.session.myWizardSessionProp`
  myWizardSessionProp: number
}

/**
 * We can still extend the session object that we can use on the context.
 * However, as we're using wizards, we have to make it extend `WizardSession`.
 *
 * It is possible to pass a type variable to `WizardSession` if you also want to
 * extend the wizard session.
 */
interface MySession extends WizardSession<MyWizardSession> {
  // will be available under `ctx.session.mySessionProp`
  mySessionProp: number
}

/**
 * Now that we have our session object, we can define our own context object.
 * Again, as we're using wizards, we now have to extend `WizardContext`.
 *
 * As always, if we also want to use our own session object, we have to set it
 * here under the `session` property.
 *
 * IMPORTANT: Whenever we want to extend the wizard session, we have to supply
 * the type arguments to `WizardContext`. It is not possible to access any
 * properties of `ctx.scene.session` if we only `extend WizardContext`. If we
 * did that, only `ctx.session` would be available.
 */
interface MyContext
  extends WizardContext<WizardContextWizard<MyContext>, MyWizardSession> {
  // will be available under `ctx.myContextProp`
  myContextProp: string

  session: MySession
}

const stepHandler = new Composer<MyContext>()
stepHandler.action('next', async (ctx) => {
  await ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
  await ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) =>
  ctx.replyWithMarkdown('Press `Next` button or type /next')
)

const superWizard = new WizardScene(
  'super-wizard',
  async (ctx) => {
    await ctx.reply(
      'Step 1',
      Markup.inlineKeyboard([
        Markup.button.url('❤️', 'http://telegraf.js.org'),
        Markup.button.callback('➡️ Next', 'next'),
      ])
    )
    return ctx.wizard.next()
  },
  async (ctx) => {
    // we now have access to the the fields defined above
    ctx.myContextProp ??= ''
    ctx.session.mySessionProp ??= 0
    ctx.scene.session.myWizardSessionProp ??= 0
    return ctx.wizard.next()
  },
  stepHandler,
  async (ctx) => {
    await ctx.reply('Step 3')
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Done')
    return await ctx.scene.leave()
  }
)

const bot = new Telegraf(process.env.BOT_TOKEN)
const stage = new Stage([superWizard], { default: 'super-wizard' })
bot.use(session())
bot.use(stage.middleware())
bot.launch()
