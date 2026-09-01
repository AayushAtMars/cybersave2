const fs = require('fs');
const path = require('path');

const hiPath = path.join(__dirname, 'src/i18n/locales/hi.json');
let hiJson = {};

try { hiJson = JSON.parse(fs.readFileSync(hiPath, 'utf8')); } catch(e) { console.error(e); }

const manualTranslations = {
  "step-4-review": {
    "pdf": ".pdf"
  },
  "step-5-payment": {
    "visa_mastercard_rupay": "वीज़ा, मास्टरकार्ड, रुपे",
    "google_pay_phonepe_paytm": "गूगल पे, फोनपे, पेटीएम"
  },
  "home": {
    "pm_kisan_samman_nidhi": "पीएम-किसान सम्मान निधि"
  },
  "about": {
    "version_2_1_0_build_54": "संस्करण 2.1.0 (बिल्ड 54)",
    "cybersave": "साइबरसेव",
    "about_cybersave": "साइबरसेव के बारे में"
  },
  "address": {
    "dismiss": "खारिज करें",
    "the_address_has_been_permanent": "पता आपकी प्रोफ़ाइल से स्थायी रूप से हटा दिया गया है।",
    "address_deleted": "पता हटा दिया गया",
    "success": "सफलता!",
    "save_address": "पता सहेजें",
    "use_this_address_as_pre_filled": "इस पते को पहले से भरे हुए डिफ़ॉल्ट के रूप में उपयोग करें।",
    "set_as_default_address": "डिफ़ॉल्ट पता के रूप में सेट करें",
    "pin_code": "पिन कोड *",
    "state": "राज्य *",
    "city": "शहर *",
    "address_line_2": "पता पंक्ति 2",
    "address_line_1": "पता पंक्ति 1 *",
    "tag_label": "टैग / लेबल *",
    "add_an_address_to_automaticall": "अपने आवेदन और सुरक्षा लॉग को स्वचालित रूप से भरने के लिए एक पता जोड़ें।",
    "no_saved_addresses": "कोई सहेजा गया पता नहीं",
    "add_new_address": "+ नया पता जोड़ें",
    "my_addresses": "मेरे पते",
    "pincode": "पिनकोड:",
    "default": "डिफ़ॉल्ट"
  },
  "documents": {
    "delete": "हटाएं",
    "cancel": "रद्द करें",
    "this_action_cannot_be_undone": "\"? इस कार्रवाई को पूर्ववत नहीं किया जा सकता है।",
    "are_you_sure_you_want_to_perma": "क्या आप वाकई स्थायी रूप से हटाना चाहते हैं \"",
    "delete_document": "दस्तावेज़ हटाएं?",
    "dismiss": "खारिज करें",
    "the_file_has_been_permanently_": "फ़ाइल को आपके वॉल्ट और स्टोरेज बकेट से स्थायी रूप से हटा दिया गया है।",
    "document_deleted": "दस्तावेज़ हटा दिया गया",
    "your_document_has_been_safely_": "आपका दस्तावेज़ सुरक्षित रूप से एन्क्रिप्ट कर दिया गया है और सुरक्षित वॉल्ट स्टोरेज में अपलोड कर दिया गया है।",
    "upload_successful": "अपलोड सफल!",
    "please_wait_while_we_encrypt_a": "कृपया प्रतीक्षा करें जब तक हम आपकी फ़ाइल को एन्क्रिप्ट और सुरक्षित करते हैं।",
    "uploading_document": "दस्तावेज़ अपलोड हो रहा है...",
    "itr_receipts_payslips_bank_sta": "आईटीआर रसीदें, वेतन पर्ची, बैंक विवरण आदि।",
    "financial_income_proof": "वित्तीय / आय प्रमाण",
    "birth_certificate_address_cert": "जन्म प्रमाण पत्र, पता प्रमाण पत्र आदि।",
    "certificate_birth_proof": "प्रमाण पत्र / जन्म प्रमाण",
    "aadhaar_card_pan_card_voter_id": "आधार कार्ड, पैन कार्ड, वोटर आईडी आदि।",
    "id_proof": "पहचान प्रमाण",
    "choose_the_category_of_the_doc": "उस दस्तावेज़ की श्रेणी चुनें जिसे आप अपलोड करना चाहते हैं।",
    "select_document_type": "दस्तावेज़ प्रकार चुनें",
    "uploaded_documents_will_show_u": "अपलोड किए गए दस्तावेज़ यहां दिखाई देंगे जब आप उन्हें अपलोड करेंगे या कोई आवेदन जमा करेंगे।",
    "vault_is_empty": "वॉल्ट खाली है",
    "upload_new_document": "नया दस्तावेज़ अपलोड करें",
    "mb": "एमबी",
    "storage_usage": "स्टोरेज उपयोग",
    "my_documents": "मेरे दस्तावेज़",
    "share": "साझा करें",
    "download": "डाउनलोड करें",
    "view": "देखें",
    "uploaded": "अपलोड किया गया"
  },
  "info": {
    "link_document": "लिंक दस्तावेज़",
    "enter_your_12_digit_aadhaar_nu": "इसे अपने खाते से जोड़ने के लिए अपना 12 अंकों का आधार नंबर या 10 अक्षरों का पैन कार्ड नंबर दर्ज करें।",
    "card": "कार्ड",
    "link": "लिंक करें",
    "last_updated_12_may_2026_4_32_": "अंतिम अद्यतन: 12 मई 2026, शाम 4:32",
    "save_changes": "परिवर्तन सहेजें",
    "pan_masked": "पैन (मास्क्ड)",
    "aadhaar_masked": "आधार (मास्क्ड)",
    "gender": "लिंग",
    "date_of_birth": "जन्म तिथि",
    "email": "ईमेल",
    "verified": "सत्यापित",
    "phone": "फ़ोन",
    "full_name": "पूरा नाम",
    "change_photo": "फोटो बदलें",
    "personal_information": "व्यक्तिगत जानकारी"
  },
  "privacy": {
    "dismiss": "खारिज करें",
    "export_completed": "निर्यात पूर्ण!",
    "deactivate_account": "खाता निष्क्रिय करें",
    "download_my_digital_data": "मेरा डिजिटल डेटा डाउनलोड करें",
    "no_active_sessions_found": "कोई सक्रिय सत्र नहीं मिला।",
    "active_sessions": "सक्रिय सत्र",
    "share_verified_tags_with_offic": "आधिकारिक विभागों के साथ सत्यापित टैग साझा करें",
    "third_party_sharing": "तृतीय-पक्ष साझाकरण",
    "allow_anonymous_diagnostic_rep": "अनाम नैदानिक रिपोर्ट की अनुमति दें",
    "analytics_consent": "विश्लेषिकी सहमति",
    "consent_management": "सहमति प्रबंधन",
    "your_digital_assets_and_person": "आपकी डिजिटल संपत्ति और व्यक्तिगत विवरण एन्क्रिप्ट किए गए हैं।",
    "security_shield_active": "सुरक्षा शील्ड सक्रिय",
    "privacy_security": "गोपनीयता और सुरक्षा"
  },
  "settings": {
    "dismiss": "खारिज करें",
    "settings_saved": "सेटिंग्स सहेजी गईं!",
    "no_login_history_found": "कोई लॉगिन इतिहास नहीं मिला।",
    "login_history": "लॉगिन इतिहास",
    "confirm_new_mpin": "नया एमपिन (MPIN) की पुष्टि करें",
    "new_mpin": "नया एमपिन (MPIN)",
    "current_mpin": "वर्तमान एमपिन (MPIN)",
    "select_language": "भाषा चुनें",
    "delete_account": "खाता हटाएं",
    "clear_cache": "कैश साफ़ करें",
    "data": "डेटा",
    "two_factor_auth": "दो-कारक प्रमाणीकरण",
    "change_mpin": "एमपिन (MPIN) बदलें",
    "security": "सुरक्षा",
    "auto_pay": "ऑटो-पे (Auto-pay)",
    "biometric_login": "बायोमेट्रिक लॉगिन",
    "all_active": "सभी सक्रिय",
    "notifications": "सूचनाएं",
    "language": "भाषा",
    "account": "खाता",
    "settings": "सेटिंग्स"
  },
  "detail": {
    "apply_now": "अभी आवेदन करें",
    "refund_policy": "रिफंड नीति:",
    "payment_refund_information": "भुगतान और रिफंड जानकारी",
    "additional_options_processing_": "अतिरिक्त विकल्प / प्रसंस्करण शुल्क",
    "processing_time": "प्रसंस्करण समय",
    "government_fee": "सरकारी शुल्क",
    "address_proof_utility_bill": "पता प्रमाण (उपयोगिता बिल)",
    "marriage_certificate_of_parent": "माता-पिता का विवाह प्रमाण पत्र",
    "id_proof_of_parents_aadhaar_pa": "माता-पिता का पहचान प्रमाण (आधार/पैन)",
    "proof_of_birth_from_hospital": "अस्पताल से जन्म प्रमाण",
    "documents_required": "आवश्यक दस्तावेज़",
    "registered_within_21_days_stan": "21 दिनों के भीतर पंजीकृत (मानक शुल्क)",
    "birth_occurred_within_state_li": "जन्म राज्य की सीमा के भीतर हुआ",
    "citizen_of_india": "भारत के नागरिक",
    "eligibility": "पात्रता",
    "about_this_service": "इस सेवा के बारे में",
    "legally_certified_document_by_": "द्वारा कानूनी रूप से प्रमाणित दस्तावेज़",
    "registry": "रजिस्ट्री",
    "official": "आधिकारिक",
    "go_back": "वापस जाएँ",
    "service_details_could_not_be_f": "सेवा विवरण नहीं मिल सका।"
  },
  "hub": {
    "available_services": "उपलब्ध सेवाएँ"
  },
  "chat": {
    "this_support_ticket_has_been_c": "यह सपोर्ट टिकट ऑपरेटर द्वारा बंद कर दिया गया है।",
    "send": "भेजें",
    "status": "स्थिति:"
  },
  "create": {
    "select_category": "श्रेणी चुनें",
    "check_faq_before_raising_most_": "शिकायत दर्ज करने से पहले अक्सर पूछे जाने वाले प्रश्न (FAQ) देखें। अधिकांश समस्याएं तुरंत हल हो जाती हैं!",
    "submit_support_ticket": "सपोर्ट टिकट सबमिट करें",
    "png_jpg_pdf_up_to_5mb": "पीएनजी (PNG), जेपीजी (JPG), पीडीएफ (PDF) 5 एमबी (MB) तक",
    "choose_files_or_drag_here": "फ़ाइलें चुनें या यहाँ खींचें",
    "upload_screenshots": "स्क्रीनशॉट अपलोड करें",
    "priority_level": "प्राथमिकता स्तर",
    "detailed_description": "विस्तृत विवरण",
    "ticket_subject": "टिकट विषय",
    "support_category": "समर्थन श्रेणी",
    "raise_a_ticket": "टिकट दर्ज करें"
  },
  "feedback": {
    "dismiss": "खारिज करें",
    "feedback_sent": "प्रतिक्रिया भेजी गई!",
    "very_intuitive_ui_but_i_got_a_": "बहुत सहज यूआई (UI), लेकिन मुझे आधार अपडेट स्थिति में थोड़ी देरी हुई। कुल मिलाकर बढ़िया।",
    "ananya_s": "अनन्या एस.",
    "extremely_smooth_itr_filing_ex": "बेहद सहज आईटीआर (ITR) फाइलिंग अनुभव! सेकंड के भीतर सत्यापित।",
    "rakesh_k": "राकेश के.",
    "recent_reviews": "हाल की समीक्षाएं",
    "submit_feedback": "प्रतिक्रिया सबमिट करें",
    "write_your_feedback": "अपनी प्रतिक्रिया लिखें",
    "what_should_we_improve": "हमें क्या सुधारना चाहिए?",
    "stars": "तारे (",
    "you_selected": "आपने चुना",
    "rate_your_experience": "अपने अनुभव का मूल्यांकन करें",
    "share_feedback": "प्रतिक्रिया साझा करें"
  },
  "tickets": {
    "dismiss": "खारिज करें",
    "thank_you": "धन्यवाद!",
    "submit_feedback": "प्रतिक्रिया सबमिट करें"
  }
};

for (const ns in manualTranslations) {
  if (!hiJson[ns]) hiJson[ns] = {};
  for (const key in manualTranslations[ns]) {
    hiJson[ns][key] = manualTranslations[ns][key];
  }
}

fs.writeFileSync(hiPath, JSON.stringify(hiJson, null, 2));
console.log('Applied first batch of translations.');
