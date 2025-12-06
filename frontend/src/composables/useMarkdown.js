import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

export function useMarkdown() {
  const renderMarkdown = (text) => {
    if (!text) return ''
    const rawHtml = md.render(text)
    return DOMPurify.sanitize(rawHtml)
  }

  return { renderMarkdown }
}