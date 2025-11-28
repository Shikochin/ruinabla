import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { Temporal } from '@js-temporal/polyfill'

// get posts dir
const POSTS_DIR = path.join(process.cwd(), 'src', 'posts')

/**
 * check if filename is valid
 * @param {string} name
 * @returns {boolean}
 */
function isValidFilename(name) {
  if (name === '.' || name === '..') {
    return false
  }

  const illegalChars = /[/:*?"<>|]/
  if (illegalChars.test(name)) {
    console.log('Filename cannot contain: / \\ : * ? " < > |')
    return false
  }

  if (name.length > 255) {
    console.log('Filename was too long (max: 255 chars)')
    return false
  }

  if (name.trim().length === 0) {
    console.log('Filename cannot be 滚木')
    return false
  }

  return true
}

/**
 * main：create file, fill template
 */
async function main() {
  // check if src/posts exists
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Error, src/posts doesn't exists: ${POSTS_DIR}`)
    return
  }

  const rl = readline.createInterface({ input, output })

  let filename
  while (!filename) {
    filename = await rl.question('Please input filename: ')
    filename = filename.trim()
    if (!isValidFilename(filename)) {
      filename = ''
      continue
    }
  }

  rl.close()

  // YYYY-MM-DD
  const formattedDate = Temporal.Now.plainDateISO().toString()
  const fileNameWithExt =
    filename.endsWith('.mdx') || filename.endsWith('.md') ? filename : `${filename}.mdx`
  const fullPath = path.join(POSTS_DIR, fileNameWithExt)

  if (fs.existsSync(fullPath)) {
    console.error(`Error, file already exists: ${path.relative(process.cwd(), fullPath)}`)
    return
  }

  // 构建 Front Matter 模板
  const template = `---
title: ${filename}
date: ${formattedDate}
tags:
  -
categories:
  -
---

`

  try {
    fs.writeFileSync(fullPath, template, 'utf-8')
    console.log(
      `\n🎉 Create ${filename}.mdx successfully: ${path.relative(process.cwd(), fullPath)}`,
    )
  } catch (error) {
    console.error('Error when writing file:', error.message)
  }
}

main()
