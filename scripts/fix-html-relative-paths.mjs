import fs from 'fs'
import path from 'path'

const BASE_DIR = 'C:/Users/pavil/Downloads/Personal/Sami/Agenda Sami/mascots-art/artist-pass-v0.2'
const PROD_DIR = path.join(BASE_DIR, 'production')

// Fix comparison.html (located at artist-pass-v0.2/comparison.html)
let compHtml = fs.readFileSync(path.join(BASE_DIR, 'comparison.html'), 'utf8')

// Fix the missing parent references
compHtml = compHtml.replace(/src="pibble\//g, 'src="../pibble/')
compHtml = compHtml.replace(/src='pibble\//g, "src='../pibble/")
compHtml = compHtml.replace(/src="capilampara\//g, 'src="../capilampara/')
compHtml = compHtml.replace(/src='capilampara\//g, "src='../capilampara/")
compHtml = compHtml.replace(/src="production-design\//g, 'src="../production-design/')
compHtml = compHtml.replace(/src='production-design\//g, "src='../production-design/")

fs.writeFileSync(path.join(BASE_DIR, 'comparison.html'), compHtml, 'utf8')
fs.writeFileSync(path.join(PROD_DIR, 'qa', 'comparison.html'), compHtml, 'utf8')
console.log('comparison.html updated with correct relative paths.')

// Fix preview.html (located at artist-pass-v0.2/production/previews/preview.html)
let prevHtml = compHtml

// In preview.html (nested 2 levels deeper than artist-pass-v0.2):
// production/ -> ../
// ../pibble -> ../../../pibble
prevHtml = prevHtml.replace(/\.\.\/pibble\//g, '../../../pibble/')
prevHtml = prevHtml.replace(/\.\.\/capilampara\//g, '../../../capilampara/')
prevHtml = prevHtml.replace(/\.\.\/production-design\//g, '../../../production-design/')
prevHtml = prevHtml.replace(/production\//g, '../')

fs.writeFileSync(path.join(PROD_DIR, 'previews', 'preview.html'), prevHtml, 'utf8')
console.log('preview.html updated with correct relative paths.')
