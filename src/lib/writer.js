const fs = require('fs')
const path = require('path')

class Writer {
  constructor({output, hiddenTag}) {
    this.output = output
    this.dirname = path.dirname(output)
    this.hiddenTag = hiddenTag
  }

  async write({samples}) {
    const content = this.serialize(samples)

    if (!fs.existsSync(this.dirname)) {
      fs.mkdirSync(this.dirname)
    }

    fs.writeFileSync(this.output, content)
  }

  serialize(samples) {
    let content = ''
    samples.forEach(sample => {
      content += `# ${sample.name}\n\n`
      content += `${sample.description}\n\n`

      if (this.hiddenTag) {
        content += `<!-- sample ${sample.id} -->\n`
      }

      const value = this.pad(sample.value)
      content += `\`\`\`bash\n${value}\n\`\`\`\n\n`
    })
    return content
  }

  pad(value) {
    return value.split('\n').map((line, index) => {
      if (index === 0) return line
      return `     ${line}`
    }).join('\n')
  }
}

module.exports = Writer
