#!/usr/bin/env node
const path = require('path')
const meow = require('meow')
const { pkg } = require('read-pkg-up').sync()
const open = require('opn')
const ora = require('ora')
const chalk = require('chalk')

const x0Pkg = require('../package.json')

require('update-notifier')({ pkg: x0Pkg }).notify()

const cli = meow(`
  Usage:

    $ x0 dev src/App.js

    $ x0 build src/App.js

  Options:

    -d --out-dir  Output directory for static build

    -s --static   Render static HTML without client-side JS

    -p --port     Port for dev server

    -o --open     Open dev server in default browser

    -px --proxy   Proxy requests to another server (only for dev)

`, {
  alias: {
    d: 'outDir',
    s: 'static',
    p: 'port',
    o: 'open',
    h: 'help',
    v: 'version',
    px: 'proxy'
  }
})

const [ cmd, file ] = cli.input
const options = Object.assign({}, pkg.x0, cli.flags)

const absolute = f => f
  ? path.isAbsolute(f) ? f : path.join(process.cwd(), f)
  : null

const filename = absolute(file)

console.log(chalk.black.bgCyan(' x0 '), chalk.cyan('@compositor/x0'), '\n')
const spinner = ora().start()

switch (cmd) {
  case 'dev':
    spinner.start('starting dev server')
    let opened = false
    const dev = require('../lib/dev')
    dev(filename, options, (err, port) => {
      if (err) {
        spinner.fail(err)
        process.exit(1)
      }
      spinner.succeed(`dev server listening at http://localhost:${port}`)
      if (!opened && options.open) {
        open(`http://localhost:${port}`)
        opened = true
      }
    })
    break
  case 'build':
    spinner.start('building static site')
    const build = require('../lib/static')
    build(filename, options, (err, html) => {
      if (err) {
        spinner.fail('Error')
        console.log(err)
        process.exit(1)
      } else if (!options.outDir) {
        console.log(html)
      } else {
        spinner.succeed(`static site saved to ${options.outDir}`)
      }
    })
    break
  default:
    spinner.fail('no argument provided')
    process.exit(0)
}
