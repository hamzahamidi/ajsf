import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = 'dist/demo/api'
const marker = 'data-google-analytics="portfolio"'
const tag = `<script ${marker}>(function(){if(location.hostname!=='hamidihamza.com')return;window.dataLayer=window.dataLayer||[];window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config','G-TH8GG8HPH6');var script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id=G-TH8GG8HPH6';document.head.appendChild(script)})()</script>`

async function inject(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await inject(path)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue

    const html = await readFile(path, 'utf8')
    if (html.includes(marker)) continue
    if (!html.includes('</head>')) throw new Error(`Missing head close tag in ${path}`)
    await writeFile(path, html.replace('</head>', `${tag}</head>`))
  }
}

await inject(root)
