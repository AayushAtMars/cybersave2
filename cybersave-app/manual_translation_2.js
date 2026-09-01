const fs = require('fs');
const path = require('path');

const hiPath = path.join(__dirname, 'src/i18n/locales/hi.json');
let hiJson = {};

try { hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8')); } catch(e) { console.error(e); }

const manualTranslations = {
  "tickets": {
    "share_app_feedback": "ऐप फीडबैक साझा करें",
    "got_it": "समझ गया",
    "create_new_ticket": "+ नया टिकट बनाएँ",
    "updated": "अद्यतन:",
    "submit_queries_relating_to_pay": "नीचे दिए गए बटन पर टैप करके भुगतान या आवेदन से संबंधित प्रश्न सबमिट करें।",
    "no_tickets_found": "कोई टिकट नहीं मिला",
    "active_support_tickets": "सक्रिय समर्थन टिकट",
    "single_emergency_helpline_resp": "एकल आपातकालीन हेल्पलाइन प्रतिक्रिया",
    "national_emergency": "राष्ट्रीय आपातकाल",
    "national_helpline_numbers": "राष्ट्रीय हेल्पलाइन नंबर",
    "no_matching_help_topics_found": "कोई मेल खाने वाला सहायता विषय नहीं मिला।",
    "popular_help_topics": "लोकप्रिय सहायता विषय",
    "track_issues": "समस्याओं को ट्रैक करें",
    "open_ticket": "टिकट खोलें",
    "help_support": "सहायता और समर्थन"
  }
};

for (const ns in manualTranslations) {
  if (!hiJson[ns]) hiJson[ns] = {};
  for (const key in manualTranslations[ns]) {
    hiJson[ns][key] = manualTranslations[ns][key];
  }
}

fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2));
console.log('Applied second batch of translations.');
