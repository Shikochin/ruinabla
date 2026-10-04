import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

async function render(source: string) {
  const container = document.createElement('div')
  container.innerHTML = await renderMarkdown(source)
  return container
}

describe('article Markdown', () => {
  it('preserves links and nested blockquotes', async () => {
    const article = await render('> A [link](https://example.com)\n>\n> > Nested quote')

    expect(article.querySelector('blockquote a')?.getAttribute('href')).toBe('https://example.com')
    expect(article.querySelector('blockquote blockquote')?.textContent?.trim()).toBe('Nested quote')
  })

  it('renders tables, strikethrough, task lists and automatic links', async () => {
    const article = await render(`| Feature | Status |
| :--- | ---: |
| ~~Old~~ | Ready |

- [x] Done
- [ ] Pending

https://example.com`)

    expect(article.querySelectorAll('table tbody tr')).toHaveLength(1)
    expect(article.querySelector('th:last-child')?.getAttribute('align')).toBe('right')
    expect(article.querySelector('del')?.textContent).toBe('Old')
    const tasks = article.querySelectorAll<HTMLInputElement>('.task-list-item input')
    expect([...tasks].map((task) => [task.checked, task.disabled])).toEqual([
      [true, true],
      [false, true],
    ])
    expect(article.querySelector('a')?.getAttribute('href')).toBe('https://example.com')
  })

  it('keeps heading anchors, highlighted code and image galleries working', async () => {
    const article = await render(
      '## Heading\n\n```js\nconst answer = 42\n```\n\n![Cover](https://example.com/cover.png)',
    )

    expect(article.querySelector('h2')?.id).toBe('heading')
    expect(article.querySelector('.anchor-link')?.getAttribute('href')).toBe('#heading')
    expect(article.querySelector('pre code.language-js .token')).not.toBeNull()
    expect(
      article.querySelector('[data-fancybox="markdown-gallery"] img')?.getAttribute('src'),
    ).toBe('https://example.com/cover.png')
  })
})
