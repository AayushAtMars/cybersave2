const { translate } = require('@vitalets/google-translate-api');
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'src/i18n/locales/en.json');
const hiPath = path.join(__dirname, 'src/i18n/locales/hi.json');

let enJson = {};
let hiJson = {};

try { enJson = JSON.parse(fs.readFileSync(enPath, 'utf8')); } catch(e) { console.error(e); }
try { hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8')); } catch(e) { console.error(e); }

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const translateText = async (text) => {
  if (!text || text.trim() === '') return text;
  text = text.trim();
  try {
    const res = await translate(text, { to: 'hi' });
    return res.text;
  } catch (e) {
    console.error("Translation error for:", text, e.message);
    return null;
  }
};

const processFiles = async () => {
  let count = 0;
  for (const namespace in enJson) {
    for (const key in enJson[namespace]) {
      const enText = enJson[namespace][key];
      const hiText = hiJson[namespace]?.[key];
      
      // If the Hindi text is missing or exactly the same as English, it likely failed
      // Also ignore very short strings that might be the same (like numbers) or punctuation
      if ((!hiText || hiText === enText) && enText.match(/[a-zA-Z]{2,}/)) {
        console.log(`Translating remaining: "${enText}"`);
        const translated = await translateText(enText);
        if (translated) {
           if (!hiJson[namespace]) hiJson[namespace] = {};
           hiJson[namespace][key] = translated;
           console.log(`Success: ${translated}`);
           count++;
           fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2)); // Save incrementally
           await sleep(1200); // 1.2 second delay to avoid rate limit
        } else {
           // Wait longer on error
           await sleep(3000);
        }
      }
    }
  }

  console.log(`Done translating ${count} remaining strings.`);
};

processFiles();
