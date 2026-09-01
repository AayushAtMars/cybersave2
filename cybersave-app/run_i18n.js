const { Project, SyntaxKind } = require('ts-morph');
const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');
const path = require('path');

const project = new Project();
project.addSourceFilesAtPaths("app/**/*.tsx");

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const hiPath = path.join(__dirname, 'src/i18n/locales/hi.json');

let enJson = {};
let hiJson = {};

try { enJson = JSON.parse(fs.readFileSync(enPath, 'utf8')); } catch(e) {}
try { hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8')); } catch(e) {}

const translateText = async (text) => {
  if (!text || text.trim() === '') return text;
  text = text.trim();
  try {
    const res = await translate(text, { to: 'hi' });
    return res.text;
  } catch (e) {
    console.error("Translation error for:", text, e.message);
    return text;
  }
};

const sanitizeKey = (text) => {
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 30) || 'key_' + Math.random().toString(36).substring(7);
};

const processFiles = async () => {
  const sourceFiles = project.getSourceFiles();
  
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    if (filePath.includes('language-select.tsx')) continue;
    if (filePath.includes('_layout.tsx')) continue;
    
    // Quick skip to save time if no text
    const textElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    if (textElements.length === 0) continue;

    console.log(`Processing: ${filePath}`);
    let fileChanged = false;
    const fileName = path.basename(filePath, '.tsx');

    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    for (let i = jsxTexts.length - 1; i >= 0; i--) {
      const jsxText = jsxTexts[i];
      const text = jsxText.getLiteralText();
      
      if (text && text.trim().length > 1 && !text.match(/^[ \t\n\r]+$/)) {
        const cleanText = text.trim();
        const key = sanitizeKey(cleanText);
        
        if (!enJson[fileName]) enJson[fileName] = {};
        if (!hiJson[fileName]) hiJson[fileName] = {};
        
        if (!enJson[fileName][key]) {
            enJson[fileName][key] = cleanText;
            const translated = await translateText(cleanText);
            hiJson[fileName][key] = translated;
            console.log(`Translated: ${cleanText} -> ${translated}`);
        }
        
        const prefix = text.substring(0, text.indexOf(cleanText));
        const suffix = text.substring(text.indexOf(cleanText) + cleanText.length);
        
        jsxText.replaceWithText(`${prefix}{t('${fileName}.${key}')}${suffix}`);
        fileChanged = true;
      }
    }

    if (fileChanged) {
      const imports = sourceFile.getImportDeclarations();
      const hasTranslationImport = imports.some(imp => imp.getModuleSpecifierValue() === 'react-i18next');
      if (!hasTranslationImport) {
        sourceFile.addImportDeclaration({
          namedImports: ['useTranslation'],
          moduleSpecifier: 'react-i18next'
        });
      }

      let defaultFunc = sourceFile.getFunctions().find(f => f.isDefaultExport());
      let bodyToInsert = null;

      if (defaultFunc) {
        bodyToInsert = defaultFunc.getBody();
      } else {
        const defaultExport = sourceFile.getExportAssignment(e => !e.isExportEquals());
        if (defaultExport) {
           const expr = defaultExport.getExpression();
           if (expr.getKind() === SyntaxKind.Identifier) {
               const varDecl = sourceFile.getVariableDeclaration(expr.getText());
               if (varDecl) {
                   const init = varDecl.getInitializer();
                   if (init && (init.getKind() === SyntaxKind.ArrowFunction || init.getKind() === SyntaxKind.FunctionExpression)) {
                       bodyToInsert = init.getBody();
                   }
               }
           }
        }
      }

      if (bodyToInsert && bodyToInsert.getKind() === SyntaxKind.Block) {
         const statements = bodyToInsert.getStatements();
         const hasT = statements.some(s => s.getText().includes('useTranslation'));
         if (!hasT) {
            bodyToInsert.insertStatements(0, "const { t } = useTranslation();");
         }
      }
      
      await sourceFile.save();
    }
  }

  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
  fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2));
  console.log("Done extracting and translating.");
};

processFiles();
