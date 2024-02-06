import path from 'path'
import { readFileSync } from 'fs'
import { NormalObject } from '@vunk/core'

export function getEnv (
  mode: string,
  root: string = process.cwd(),
): NormalObject {
  const envFilePath = path.resolve(root, `./.env.${mode}`)

  const data = readFileSync(envFilePath).toString()
  const res = {} as NormalObject

  data.split('\n').forEach((line) => {
    const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
    if (keyValueArr != null) {
      const key = keyValueArr[1]
      let value = keyValueArr[2] || ''
      const len = value ? value.length : 0
      if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"') {
        value = value.replace(/\\n/gm, '\n')
      }
      value = value.replace(/(^['"]|['"]$)/g, '').trim()
      res[key] = value
    }
  })
  
  return res  
}
