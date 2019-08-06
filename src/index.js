const {Command, flags} = require('@oclif/command')
const Openapi2Curl = require('./lib/openapi2curl')
const Writer = require('./lib/writer')

class Openapi2CurlCommand extends Command {
  async run() {
    const {flags} = this.parse(Openapi2CurlCommand)
    const {input, output, hiddenTag} = flags
    const converter = new Openapi2Curl({input})
    const samples = await converter.convert()
    const writer = new Writer({output, hiddenTag})
    writer.write({samples})
  }
}

Openapi2CurlCommand.description = 'Converts an OpenAPI spec to a set of cURL samples'

Openapi2CurlCommand.flags = {
  // add --version flag to show CLI version
  version: flags.version({char: 'v'}),
  // add --help flag to show CLI version
  help: flags.help({char: 'h'}),
  // add input flag
  input: flags.string({
    char: 'i',
    description: 'the input OpenAPI 3.X file',
    required: true,
  }),
  // add output flag
  output: flags.string({
    char: 'o',
    description: 'the output file to write samples to',
    required: false,
    default: 'curl.md',
  }),
  // add a flag for inserting sample operation ID tags
  hiddenTag: flags.boolean({
    char: 'x',
    description: 'Embed the operateionIDs as hidden comments in the markdown',
    default: false,
  }),
}

module.exports = Openapi2CurlCommand
