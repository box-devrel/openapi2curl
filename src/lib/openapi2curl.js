const util = require('util')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const fetch = require('node-fetch')
const {Resolver} = require('@stoplight/json-ref-resolver')

class OpenAPI2Curl {
  constructor({input}) {
    this.input = input
    this.samples = []
  }

  async load(input) {
    if (/^https?:\/\//.test(input)) {
      return fetch(input).then(response => response.json())
    }
    return JSON.parse(readFile(input))
  }

  async resolve(spec) {
    const resolver = new Resolver()
    return (await resolver.resolve(spec)).result
  }

  serializedServerUrl(server) {
    if (!server) return null

    let url = server.url
    if (server.variables) {
      Object.entries(server.variables).forEach(([key, variable]) => {
        url = url.replace(`{${key}}`, variable.default)
      })
    }

    return url
  }

  requests(spec) {
    return Object.entries(spec.paths).flatMap(([path, endpoints]) => (
      Object.entries(endpoints).map(([verb, endpoint]) => ({
        verb,
        path,
        ...endpoint,
      }))
    ))
  }

  createSamples({requests}) {
    return requests.map(request => this.createSample({request}))
  }

  createSample({request}) {
    return {
      id: request.operationId,
      name: request.summary,
      description: request.description,
      tag: request.tags[0],
      value: this.serializeCurlSample({request}),
    }
  }

  serializeCurlSample({request}) {
    const verb = request.verb.toUpperCase()

    const authentication = this.serializeAuthentication(request)
    const url = this.serializeEndpointUrl({request, authentication})
    let curl = [`curl -X ${verb} ${url}`]
    curl = [...curl, ...this.serializeHeaders({request, authentication})]
    curl = [...curl, ...this.serializeBody({request})]
    return curl.join(' \\\n')
  }

  serializeEndpointUrl({request, authentication}) {
    let url = this.defaultServerUrl
    const path = this.serializedPath(request)

    if (request.servers && request.servers[0]) {
      url = this.serializedServerUrl(request.servers[0])
    }

    const query = this.serializedQuery({request, authentication})
    return `${url}${path}${query}`
  }

  serializedPath(request) {
    let path = request.path
    if (request.parameters) {
      request.parameters
      .filter(param => param.in === 'path')
      .forEach(param => {
        path = path.replace(`{${param.name}}`, param.example)
      })
    }
    return path
  }

  serializedQuery({request, authentication}) {
    let query = ''
    if (authentication && authentication.type === 'query') query += authentication.value

    if (request.parameters) {
      request.parameters
      .filter(param => param.required && param.in === 'query')
      .forEach(param => {
        query += `${param.name}=${param.example}`
      })
    }

    query = query === '' ? '' : `?${query}`
    return query
  }

  serializeHeaders({request, authentication}) {
    let headers = []
    if (authentication && authentication.type === 'header') {
      headers.push(authentication.value)
    }

    if (request.parameters) {
      request.parameters
      .filter(param => param.required && param.in === 'header')
      .forEach(param => {
        headers.push(`-H "${param.name}: ${param.example}"`)
      })
    }

    return headers
  }

  serializeAuthentication(request) {
    let security = this.security(request)
    if (!security) {
      return null
    }
    if (security.type === 'apiKey' && security.in === 'header') {
      return {
        type: 'header',
        value: `-H "${security.name}: <API_KEY>"`,
      }
    }
    if (security.type === 'apiKey' && security.in === 'query') {
      return {
        type: 'query',
        value: `${security.name}=<API_KEY>"`,
      }
    }
    if (security.type === 'apiKey' && security.in === 'cookie') {
      return {
        type: 'cookie',
        value: `--cookie ${security.name}=<API_KEY>"`,
      }
    }
    if (security.type === 'http' && security.scheme === 'basic') {
      return {
        type: 'header',
        value: '-H "Authorization: Basic <CREDENTIALS>"',
      }
    }
    if ((security.type === 'http' && security.scheme === 'bearer') ||
         security.type === 'oauth2' ||
         security.type === 'openIdConnect') {
      return {
        type: 'header',
        value: '-H "Authorization: Bearer <ACCESS_TOKEN>"',
      }
    }
  }

  serializeBody({request}) {
    const lines = []
    if (request.requestBody && request.requestBody.content) {
      const [contentType, content] = Object.entries(request.requestBody.content)[0]
      lines.push(`-H "Content-Type: ${contentType}"`)
      const body = this.serializeSchema(content.schema)
      if (Object.keys(body).length > 0) {
        lines.push(`-d '${JSON.stringify(body, null, 2)}'`)
      }
    }
    return lines
  }

  serializeSchema(schema) {
    const {required, properties} = schema
    const body = {}

    if (properties && required) {
      Object.entries(properties).forEach(([name, property]) => {
        if (!required.includes(name)) return
        if (property.properties) body[name] = this.serializeSchema(property)
        else body[name] = property.example
      })
    }

    return body
  }

  security(request) {
    let security = this.spec.security[0]
    if (request.security) security = request.security[0]
    if (security) {
      const key = Object.keys(security)[0]
      security = this.spec.components.securitySchemes[key]
    }
    return security
  }

  async convert() {
    this.spec = await this.load(this.input)

    const resolvedSpec = await this.resolve(this.spec)
    const requests = this.requests(resolvedSpec)

    this.defaultServerUrl = this.serializedServerUrl(resolvedSpec.servers[0])

    const samples = this.createSamples({requests})
    return samples
  }
}

module.exports = OpenAPI2Curl
