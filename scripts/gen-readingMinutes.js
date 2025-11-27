// scripts/fill-reading-minutes.js
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(import.meta.dirname, '../src/posts')

function toPlainText(segment) {
  return segment
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[[^\]]+]\([^)]*\)/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function estimateReadingMinutes(body) {
  const text = toPlainText(body || '')
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const nonCjk = text.replace(/[\u4e00-\u9fa5]/g, ' ').trim()
  const words = nonCjk.split(/\s+/).filter((w) => w.length > 0).length
  const minutes = cjk / 400 + words / 200
  return Math.max(1, Math.round(minutes))
}

function getFilesRecursively(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath))
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      results.push(filePath)
    }
  })
  return results
}

function main() {
  const files = getFilesRecursively(POSTS_DIR)
  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const fileMatter = matter(fileContent)
    const readingMinutes = estimateReadingMinutes(fileMatter.content)
    fileMatter.data.readingMinutes = readingMinutes
    fs.writeFileSync(filePath, matter.stringify(fileMatter.content, fileMatter.data), 'utf-8')
    console.log(`[✓] ${path.relative(POSTS_DIR, filePath)} 填充阅读时长: ${readingMinutes} 分钟`)
  }
}

main()
