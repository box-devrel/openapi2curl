const {Command, flags} = require('@oclif/command')

class Openapi2CurlCommand extends Command {
  async run() {
    const {flags} = this.parse(Openapi2CurlCommand)
    const name = flags.name || 'world'
    this.log(`hello ${name} from ./src/index.js`)
  }
}

Openapi2CurlCommand.description = `Describe the command here
...
Extra documentation goes here
`

Openapi2CurlCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  name: flags.string({char: 'n', description: 'name to print'}),
}

module.exports = Openapi2CurlCommand
