const fs = require('fs')

let node = fs.readFileSync('tsconfig.node.template.json', 'utf-8')
let web = fs.readFileSync('tsconfig.web.template.json', 'utf-8')
const regUnset = new RegExp(/^ +\/\/.+$/, 'gm')
const regComment = new RegExp(/ +\/\*.+\*\/$/, 'gm')
const regEmpty = new RegExp(/^\s*\n/, 'gm')
node = node.replace(regUnset, '')
    .replace(regComment, '')
    .replace(regEmpty, '')
    .replace(/,(?![\s\S]*,)/, '')
web = web.replace(regUnset, '')
    .replace(regComment, '')
    .replace(regEmpty, '')
    .replace(/,(?![\s\S]*,)/, '')
fs.writeFileSync('tsconfig.node.json', node)
fs.writeFileSync('tsconfig.web.json', web)