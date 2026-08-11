/**
 * Seed script — populates the service catalog with all 29 services including form fields and eligibility.
 * Run: ts-node src/seeds/services.seed.ts
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Service } from '../models/Service';
import { ServiceCategory } from '@cybersave/shared';

const SERVICES = [
  // ─── AADHAAR SERVICES ───────────────────────────────────────────────────────
  {
    name: 'Update Address',
    description: 'Keep your Aadhaar details updated. It is mandatory for linking bank accounts, filing ITR, and availing subsidy schemes.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 5000, // ₹50
    convenienceFee: 0,
    slaHours: 72,
    eligibility: [
      'Valid Aadhaar holder',
      'Registered mobile number active',
      'Valid address proof document'
    ],
    requiredDocuments: [
      { name: 'Address Proof (Utility Bill / Rent Agreement / Passport)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Current Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'newAddressLine1', label: "New Address Line 1", type: 'text', placeholder: 'Flat, House no., Building, Company', required: true },
      { key: 'newAddressLine2', label: "New Address Line 2", type: 'text', placeholder: 'Area, Street, Sector, Village', required: false },
      { key: 'pincode', label: "Pin Code", type: 'number', placeholder: '6-digit postal code', required: true, maxLength: 6 },
      { key: 'reasonForUpdate', label: "Reason for Update", type: 'text', placeholder: 'e.g. Relocated for employment', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Update Mobile',
    description: 'Link or update your active mobile number in the UIDAI database for secure OTP verification.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 5000, // ₹50
    convenienceFee: 0,
    slaHours: 24,
    eligibility: [
      'Valid Aadhaar holder',
      'Physical presence at Seva Kendra required for biometrics'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] }
    ],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'mobileNo', label: "New Mobile Number", type: 'number', placeholder: '10-digit mobile number', required: true, maxLength: 10 },
    ],
    isActive: true,
  },
  {
    name: 'Update Name',
    description: 'Correct or update your legal name in the UIDAI Aadhaar registry. A legal proof of name change is mandatory.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 5000, // ₹50
    convenienceFee: 0,
    slaHours: 72,
    eligibility: [
      'Valid Aadhaar holder',
      'Supported legal proof of identity containing the correct name spelling'
    ],
    requiredDocuments: [
      { name: 'Proof of Identity (Passport / Voter ID / Gazette Notification)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'correctName', label: "Correct Full Name", type: 'text', placeholder: 'Enter name exactly as per proof document', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Download e-Aadhaar',
    description: 'Get a secure, digitally signed PDF copy of your Aadhaar card containing latest updates.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 2,
    eligibility: [
      'Valid Aadhaar / EID holder',
      'Registered mobile active to verify OTP'
    ],
    requiredDocuments: [
      { name: 'Consent for OTP Verification', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] }
    ],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar/Enrollment ID", type: 'text', placeholder: '12-digit Aadhaar or 28-digit EID', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Check Status',
    description: 'Check the status of your recent Aadhaar update or enrollment requests online using EID.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 2,
    eligibility: [
      'Possess Enrollment Identification Number (EID)'
    ],
    requiredDocuments: [
      { name: 'Enrollment Slip', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] }
    ],
    formFields: [
      { key: 'eid', label: "Enrollment ID (EID)", type: 'text', placeholder: 'Format: 14-digit EID + date/time', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Book Appointment',
    description: 'Book an appointment slot at your nearest Aadhaar Seva Kendra for demographic or biometric updates.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 2,
    eligibility: [
      'Resident of India'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'pincode', label: "Preferred Area Pin Code", type: 'number', placeholder: 'To find nearest centers', required: true },
      { key: 'updateType', label: "Update Type", type: 'select', options: ['Biometric', 'Demographic', 'New Enrollment'], required: true },
    ],
    isActive: true,
  },
  {
    name: 'Verify Aadhaar',
    description: 'Validate if an Aadhaar number exists and view its registered state, age band, and gender details.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 1,
    eligibility: [
      'Valid Aadhaar number to verify'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'Link Bank Account',
    description: 'Verify status or submit linking parameters for mapping your Aadhaar with active NPCI bank ledgers.',
    category: ServiceCategory.AADHAAR,
    department: 'UIDAI Official Central Services',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 48,
    eligibility: [
      'Valid active bank account in India',
      'Aadhaar details matching bank ledger exactly'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Passbook Front Page', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'bankName', label: "Bank Name", type: 'text', placeholder: 'e.g. State Bank of India', required: true },
      { key: 'accountNo', label: "Bank Account Number", type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── PAN SERVICES ──────────────────────────────────────────────────────────
  {
    name: 'Apply New PAN',
    description: 'Linking PAN with Aadhaar is mandatory. Unlinked PAN cards may become inoperative under Income Tax rules.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 9100,  // ₹91 (Indian address, 2026)
    convenienceFee: 5000,
    slaHours: 168,
    eligibility: [
      'Citizen of India',
      'Non-PAN holder',
      'Valid proof of birth document'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Date of Birth Proof (Birth Certificate / Class 10 Certificate)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Passport-size Photograph', mandatory: true, acceptedFormats: ['jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant's Full Name", type: 'text', placeholder: 'As per Aadhaar', required: true },
      { key: 'fatherName', label: "Father's Full Name", type: 'text', placeholder: 'First Name, Middle Name, Last Name', required: true },
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'Corrections',
    description: 'Request correction or changes in spelling, date of birth, photo or signature in your existing PAN card.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 11000, // ₹110
    convenienceFee: 0,
    slaHours: 120,
    eligibility: [
      'Existing PAN card holder',
      'Supported document proving correction requested'
    ],
    requiredDocuments: [
      { name: 'Existing PAN Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Proof of Correction (e.g. Gazette name spelling correction, Class 10 certificate)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'panNo', label: "Existing PAN Number", type: 'text', placeholder: 'e.g. ABCDE1234F', required: true, maxLength: 10 },
      { key: 'correctedField', label: "Fields to Correct", type: 'text', placeholder: 'e.g. Correct Date of Birth to 15-08-1990', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Reprint PAN',
    description: 'Order physical duplicate copy of your existing PAN card. The card will be delivered to your registered Aadhaar address.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 5000, // ₹50
    convenienceFee: 0,
    slaHours: 72,
    eligibility: [
      'Valid existing PAN number',
      'Mobile number linked to Aadhaar for OTP verification'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'panNo', label: "PAN Number", type: 'text', placeholder: '10-character alphanumeric PAN', required: true, maxLength: 10 },
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'Link with Aadhaar',
    description: 'Mandatory pairing of PAN card with Aadhaar number as per central Income Tax department regulations.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 100000, // ₹1000 late fee
    convenienceFee: 0,
    slaHours: 48,
    eligibility: [
      'Valid active PAN card',
      'Valid active Aadhaar card'
    ],
    requiredDocuments: [
      { name: 'PAN Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'panNo', label: "PAN Number", type: 'text', required: true, maxLength: 10 },
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'PAN Status',
    description: 'Track the status of your recent PAN application or correction requests using acknowledgement slips.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 2,
    eligibility: [
      'Possess 15-digit acknowledgement slip number'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'ackNo', label: "Acknowledgement Number", type: 'text', placeholder: '15-digit numeric code', required: true, maxLength: 15 },
    ],
    isActive: true,
  },
  {
    name: 'e-PAN Download',
    description: 'Download instant electronic copy (e-PAN card) in secure PDF format.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 2,
    eligibility: [
      'PAN card issued in last 30 days or paid reprints request active'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'panNo', label: "PAN Number", type: 'text', required: true, maxLength: 10 },
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'PAN Verification',
    description: 'Verify if a PAN card is active and matches name details with the central Income Tax database.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 1,
    eligibility: [
      'Alphanumeric PAN code to check'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'panNo', label: "PAN Number", type: 'text', required: true, maxLength: 10 },
      { key: 'fullName', label: "Full Name (as per card)", type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'TAN Application',
    description: 'Apply for Tax Deduction and Collection Account Number (TAN) for companies or individuals deductors.',
    category: ServiceCategory.PAN,
    department: 'Income Tax Department',
    govtFee: 6500, // ₹65
    convenienceFee: 0,
    slaHours: 72,
    eligibility: [
      'Corporate / Individual entity requiring tax deduction setups'
    ],
    requiredDocuments: [
      { name: 'Business Registration Proof / Incorporation Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] }
    ],
    formFields: [
      { key: 'deductorName', label: "Deductor Full Name / Company Name", type: 'text', required: true },
      { key: 'category', label: "Deductor Category", type: 'select', options: ['Company', 'Individual/Branch', 'Government'], required: true },
    ],
    isActive: true,
  },

  // ─── CERTIFICATES ──────────────────────────────────────────────────────────
  {
    name: 'Birth Certificate',
    description: 'Get official Birth Certificates issued by state/central bodies. Crucial for school admissions, passport applications, and identity proofs.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 5000,        // ₹50 in paise
    convenienceFee: 0,  // ₹0 in paise
    slaHours: 168,        // 7 days (prd.md §9)
    eligibility: [
      'Citizen of India',
      'Birth occurred within state limits',
      'Registered within 21 days (Standard fee)'
    ],
    requiredDocuments: [
      { name: 'Proof of Birth from Hospital', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'ID Proof of Parents (Aadhaar/PAN)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Marriage Certificate of Parents', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Address Proof (Utility Bill)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'childName', label: "Child's Full Name", type: 'text', placeholder: 'Name to be on the certificate', required: true },
      { key: 'birthPlace', label: 'Place of Birth', type: 'text', placeholder: 'Hospital / clinic name and city', required: true },
      { key: 'birthTime', label: 'Time of Birth (approx.)', type: 'text', placeholder: 'e.g. 10:30 AM', required: false },
      { key: 'fatherName', label: "Father's Full Name", type: 'text', placeholder: 'As per Aadhaar', required: true },
      { key: 'motherName', label: "Mother's Full Name", type: 'text', placeholder: 'As per Aadhaar', required: true },
      { key: 'fatherAadhaar', label: "Father's Aadhaar", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'motherAadhaar', label: "Mother's Aadhaar", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
    ],
    isActive: true,
  },
  {
    name: 'Death Certificate',
    description: 'Get official Death Registry certificates issued by State/Central bodies. Necessary for property transfers, insurance claims, and legal closure.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 5000,
    convenienceFee: 0,
    slaHours: 120, // 5 days
    eligibility: [
      'Citizen of India',
      'Death occurred within state limits',
      'Reported within 21 days'
    ],
    requiredDocuments: [
      { name: 'Hospital / Medical Death Proof', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: "Deceased's ID Proof (Aadhaar/PAN)", mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: "Informant's ID Proof", mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Address Proof', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'deceasedName', label: "Deceased's Full Name", type: 'text', placeholder: 'Name of the deceased person', required: true },
      { key: 'deathPlace', label: 'Place of Death', type: 'text', placeholder: 'Hospital name or address', required: true },
      { key: 'deathDate', label: 'Date of Death', type: 'date', required: true },
      { key: 'informantName', label: "Informant's Full Name", type: 'text', placeholder: 'Applicant name', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Marriage Certificate',
    description: 'Register marriages under the Special/Hindu Marriage Act to acquire legal validation certificates.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 10000, // ₹100
    convenienceFee: 0,
    slaHours: 240, // 10 days
    eligibility: [
      'Bride must be at least 18 years old',
      'Groom must be at least 21 years old',
      'Solemnization occurred within state boundaries'
    ],
    requiredDocuments: [
      { name: 'Bride & Groom ID Proof (Aadhaar/PAN)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Wedding Invitation Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Marriage Solemnization Photographs', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Witness ID Proofs (3 witnesses)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'husbandName', label: "Husband's Full Name", type: 'text', required: true },
      { key: 'wifeName', label: "Wife's Full Name", type: 'text', required: true },
      { key: 'marriageDate', label: "Solemnization Date", type: 'date', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Income Certificate',
    description: 'Acquire state-authorized proof of household income. Crucial for fee waivers, scholarships, and scheme enrollments.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 3000, // ₹30
    convenienceFee: 0,
    slaHours: 168, // 7 days
    eligibility: [
      'Resident of the State',
      'Total annual family income within defined state brackets'
    ],
    requiredDocuments: [
      { name: 'Salary Slip / Income Proof', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Land Revenue Receipt (for agricultural income)', mandatory: false, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant Name", type: 'text', required: true },
      { key: 'annualIncome', label: "Annual Household Income (₹)", type: 'number', required: true },
      { key: 'purpose', label: "Purpose of Certificate", type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Caste Certificate',
    description: 'Get verified proof of belonging to SC/ST/OBC categories. Crucial for reservation benefits and education policies.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 4000, // ₹40
    convenienceFee: 0,
    slaHours: 240, // 10 days
    eligibility: [
      'Belong to SC, ST or OBC communities as listed in state notifications',
      'Resident of the State'
    ],
    requiredDocuments: [
      { name: 'Caste Certificate of Father / Blood Relative', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'School Leaving Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant Full Name", type: 'text', required: true },
      { key: 'casteCategory', label: "Caste Category", type: 'select', options: ['SC', 'ST', 'OBC'], required: true },
      { key: 'subCaste', label: "Sub-Caste name", type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Domicile Certificate',
    description: 'State-certified proof of permanent residence. Required for state government recruitment and educational registrations.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 3000, // ₹30
    convenienceFee: 0,
    slaHours: 168, // 7 days
    eligibility: [
      'Residing continuously in the State for 15+ years',
      'Own land/property within state boundaries or completed schooling in state'
    ],
    requiredDocuments: [
      { name: 'Land Deed / Rent Receipt', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'School leaving certificate / passing sheet', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant Name", type: 'text', required: true },
      { key: 'residenceYears', label: "Duration of stay (in Years)", type: 'number', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Character Certificate',
    description: 'Official verified character certification issued by local police authorities indicating no pending cases.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 10000, // ₹100
    convenienceFee: 0,
    slaHours: 360, // 15 days
    eligibility: [
      'Citizen of India',
      'No active criminal record or pending charge sheets in police records'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Verification form signed by local gazetted officer', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant Full Name", type: 'text', required: true },
      { key: 'purpose', label: "Reason for Certificate", type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Residence Certificate',
    description: 'Get verified proof of local residence. Useful for municipal utility registrations and state-level subsidy forms.',
    category: ServiceCategory.CERTIFICATE,
    department: 'State & Revenue Departments',
    govtFee: 3000, // ₹30
    convenienceFee: 0,
    slaHours: 168, // 7 days
    eligibility: [
      'Resident of the state and ward/municipality'
    ],
    requiredDocuments: [
      { name: 'Electricity Bill / Water Bill', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Applicant Full Name", type: 'text', required: true },
      { key: 'address', label: "Current Address", type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── GOV SCHEMES / OTHER UTILITY SCHEMES ─────────────────────────────────────
  {
    name: 'PM-Kisan Samman Nidhi',
    description: 'Eligible farmers get ₹6,000 yearly directly into bank accounts. Apply easily today.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Department of Agriculture and Farmers Welfare',
    govtFee: 1000, // ₹10 in paise
    convenienceFee: 0,
    slaHours: 240, // 10 days
    eligibility: [
      'Small and marginal farmer',
      'Own cultivable land',
      'Valid bank account and Aadhaar'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Land Ownership Documents (Khasra/Khatauni)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Passbook / Cancelled Cheque', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: "Farmer's Full Name", type: 'text', placeholder: 'As per Aadhaar', required: true },
      { key: 'aadhaarNo', label: "Aadhaar Number", type: 'aadhaar', placeholder: '12-digit Aadhaar number', required: true, maxLength: 12 },
      { key: 'landArea', label: "Cultivable Land Area (in Hectares)", type: 'number', placeholder: 'e.g. 1.5', required: true },
      { key: 'bankAccountNumber', label: "Bank Account Number", type: 'text', placeholder: 'For direct benefit transfer', required: true },
      { key: 'ifscCode', label: "Bank IFSC Code", type: 'text', placeholder: 'e.g. SBIN0001234', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Electricity Bill',
    description: 'Pay central & state utility bills. Fast, secure, and instant receipt generation.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'State Electricity Board / Utility Department',
    govtFee: 1500, // ₹15 in paise
    convenienceFee: 0,
    slaHours: 24, // 1 day
    eligibility: [
      'Active consumer account',
      'No outstanding dispute',
      'Valid consumer number'
    ],
    requiredDocuments: [
      { name: 'Previous Electricity Bill', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'consumerNumber', label: "Consumer Number", type: 'text', placeholder: 'Find on your electricity bill', required: true },
      { key: 'billingCycle', label: "Billing Cycle / Month", type: 'text', placeholder: 'e.g. August 2026', required: true },
      { key: 'amount', label: "Billing Amount (₹)", type: 'number', placeholder: 'As printed on the bill', required: true },
    ],
    isActive: true,
  },
  {
    name: 'PM SVANidhi Scheme',
    description: 'Special Micro-Credit Facility scheme for providing affordable Working Capital loan to street vendors.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Housing & Urban Affairs',
    govtFee: 1000,
    convenienceFee: 0,
    slaHours: 120,
    eligibility: [
      'Street vendor in urban areas',
      'Vending certificate holder'
    ],
    requiredDocuments: [
      { name: 'Identity Proof', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Vending Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
      { key: 'vendingLocation', label: 'Vending Location/Address', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Ayushman Bharat PM-JAY',
    description: 'Provides health cover up to ₹5 Lakh per family per year for secondary and tertiary care hospitalization.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Health & Family Welfare',
    govtFee: 1000,
    convenienceFee: 0,
    slaHours: 72,
    eligibility: [
      'Secured under SECC database',
      'Low-income family category'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Ration Card (BPL Proof)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Full Name', type: 'text', required: true },
      { key: 'rationCardNo', label: 'Ration Card Number', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Pradhan Mantri Awas Yojana',
    description: 'Providing a pucca house with basic amenities to all homeless householders in rural and urban areas.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Rural Development',
    govtFee: 1500,
    convenienceFee: 0,
    slaHours: 240,
    eligibility: [
      'Homeless or kutcha house dweller',
      'Annual household income within limits'
    ],
    requiredDocuments: [
      { name: 'Income Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
      { key: 'annualIncome', label: 'Annual Family Income', type: 'number', required: true },
    ],
    isActive: true,
  },
  // ─── BANKING (AEPS) ────────────────────────────────────────────────────────
  {
    name: 'AEPS Cash Withdrawal',
    description: 'Withdraw cash from your Aadhaar Link bank account securely using biometric authentication.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'National Payments Corporation of India',
    govtFee: 0,
    convenienceFee: 1000, // ₹10
    slaHours: 2,
    eligibility: [
      'Aadhaar linked to your bank account',
      'Active bank account eligible for AEPS'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] }
    ],
    formFields: [
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'bankName', label: 'Bank Name', type: 'text', required: true },
      { key: 'amount', label: 'Withdrawal Amount (₹)', type: 'number', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Balance Inquiry',
    description: 'Check the real-time balance of your Aadhaar-linked bank account.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'National Payments Corporation of India',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 1,
    eligibility: [
      'Aadhaar linked to your bank account'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'bankName', label: 'Bank Name', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Mini Statement',
    description: 'Retrieve a list of the last 5 transactions on your Aadhaar-linked bank account.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'National Payments Corporation of India',
    govtFee: 0,
    convenienceFee: 0,
    slaHours: 1,
    eligibility: [
      'Aadhaar linked to your bank account'
    ],
    requiredDocuments: [],
    formFields: [
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'bankName', label: 'Bank Name', type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── INSURANCE ─────────────────────────────────────────────────────────────
  {
    name: 'PMSBY — Accident Insurance',
    description: 'Pradhan Mantri Suraksha Bima Yojana offers high-value accident insurance cover of ₹2 Lakh at highly subsidized rates.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Finance',
    govtFee: 2000, // ₹20
    convenienceFee: 1000,
    slaHours: 48,
    eligibility: [
      'Age between 18 and 70 years',
      'Having a savings bank account with auto-debit consent'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Passbook / Details', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Full Name', type: 'text', required: true },
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'nomineeName', label: 'Nominee Name', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'PMJJBY — Life Insurance',
    description: 'Pradhan Mantri Jeevan Jyoti Bima Yojana provides life insurance cover of ₹2 Lakh for death due to any cause.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Finance',
    govtFee: 43600, // ₹436
    convenienceFee: 1000,
    slaHours: 48,
    eligibility: [
      'Age between 18 and 50 years',
      'Having a savings bank account with auto-debit consent'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Passbook / Details', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Full Name', type: 'text', required: true },
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'nomineeName', label: 'Nominee Name', type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── EDUCATION ─────────────────────────────────────────────────────────────
  {
    name: 'National Scholarship Scheme',
    description: 'Financial assistance schemes for students belonging to minority and backward communities pursuing higher education.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Minority Affairs',
    govtFee: 0,
    convenienceFee: 1000,
    slaHours: 120,
    eligibility: [
      'Student currently studying in registered school/college',
      'Secured 50%+ marks in previous final exam',
      'Annual family income less than ₹2.5 Lakh'
    ],
    requiredDocuments: [
      { name: 'Previous Year Marksheet', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Income Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'studentName', label: 'Student Full Name', type: 'text', required: true },
      { key: 'collegeName', label: 'School/College Name', type: 'text', required: true },
      { key: 'prevMarks', label: 'Previous Exam Percentage (%)', type: 'number', required: true },
    ],
    isActive: true,
  },
  {
    name: 'Central Sector Scholarship',
    description: 'Scholarship scheme for college and university students to support undergraduate and postgraduate studies.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Department of Higher Education',
    govtFee: 0,
    convenienceFee: 1000,
    slaHours: 120,
    eligibility: [
      'Above 80th percentile of successful candidates in class 12 exam',
      'Pursuing regular course in a recognized college'
    ],
    requiredDocuments: [
      { name: 'Class 12 Marksheet', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Admission Fees Receipt', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Student Full Name', type: 'text', required: true },
      { key: 'rollNo', label: 'Class 12 Roll Number', type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── PENSION PLAN ──────────────────────────────────────────────────────────
  {
    name: 'Atal Pension Yojana',
    description: 'Subsidized pension plan for workers in the unorganized sector to guarantee fixed monthly pension after 60.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Pension Fund Regulatory and Development Authority',
    govtFee: 0,
    convenienceFee: 1000,
    slaHours: 72,
    eligibility: [
      'Age between 18 and 40 years',
      'Having a savings bank account with active auto-debit setup'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Account Passbook Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Full Name', type: 'text', required: true },
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
      { key: 'monthlyPension', label: 'Pension Amount Needed (₹1000-₹5000)', type: 'number', required: true },
    ],
    isActive: true,
  },
  {
    name: 'IGNOAPS Old Age Pension',
    description: 'Indira Gandhi National Old Age Pension Scheme provides monthly financial assistance to senior citizens.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Rural Development',
    govtFee: 0,
    convenienceFee: 1000,
    slaHours: 168,
    eligibility: [
      'Age 60 years or above',
      'Belonging to a household below the poverty line (BPL)'
    ],
    requiredDocuments: [
      { name: 'Age Proof (Birth Certificate / Aadhaar / School Certificate)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Ration Card / BPL Certificate', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Applicant Name', type: 'text', required: true },
      { key: 'aadhaarNo', label: 'Aadhaar Number', type: 'aadhaar', required: true, maxLength: 12 },
    ],
    isActive: true,
  },

  // ─── EMPLOYMENT ────────────────────────────────────────────────────────────
  {
    name: 'Shramik Card Registration',
    description: 'Register as an unorganized sector worker to acquire a Shramik Card and gain access to government social welfare payouts.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Labour & Employment',
    govtFee: 0,
    convenienceFee: 1500,
    slaHours: 48,
    eligibility: [
      'Unorganized worker (e.g. construction, home worker, agricultural)',
      'Age between 16 and 59 years',
      'Not an income tax payer'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Passbook Front Page', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Worker Full Name', type: 'text', required: true },
      { key: 'occupation', label: 'Primary Occupation/Skill', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'NREGA Job Card',
    description: 'Acquire an NREGA job card to guarantee 100 days of manual wage employment in rural areas per financial year.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Ministry of Rural Development',
    govtFee: 0,
    convenienceFee: 1000,
    slaHours: 72,
    eligibility: [
      'Adult member of a rural household',
      'Willing to do unskilled manual work'
    ],
    requiredDocuments: [
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Passport size photograph', mandatory: true, acceptedFormats: ['jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'headOfFamily', label: 'Head of Family Name', type: 'text', required: true },
      { key: 'villageName', label: 'Village Name', type: 'text', required: true },
    ],
    isActive: true,
  },

  // ─── TAX SERVICES ──────────────────────────────────────────────────────────
  {
    name: 'ITR Filing (Salary Class)',
    description: 'File your annual Income Tax Return (ITR-1) for salaried individuals and pension earners.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'Income Tax Department',
    govtFee: 0,
    convenienceFee: 49900, // ₹499
    slaHours: 72,
    eligibility: [
      'Salaried individual / pensioner',
      'Total annual income within basic taxable brackets'
    ],
    requiredDocuments: [
      { name: 'Form 16 from Employer', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'PAN Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Aadhaar Card Copy', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'applicantName', label: 'Taxpayer Name', type: 'text', required: true },
      { key: 'panNo', label: 'PAN Number', type: 'text', required: true, maxLength: 10 },
      { key: 'assessmentYear', label: 'Assessment Year (e.g. 2026-27)', type: 'text', required: true },
    ],
    isActive: true,
  },
  {
    name: 'GST Registration',
    description: 'Acquire new Goods and Services Tax Identification Number (GSTIN) for your business entity.',
    category: ServiceCategory.GOV_SCHEME,
    department: 'GST Council / CBIC',
    govtFee: 0,
    convenienceFee: 99900, // ₹999
    slaHours: 120,
    eligibility: [
      'Business entity with annual turnover exceeding threshold or requiring voluntary registration'
    ],
    requiredDocuments: [
      { name: 'PAN Card of Business / Proprietor', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Business Address Proof (Property Tax Receipt / Rent Agreement)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
      { name: 'Bank Account Proof (Cancelled Cheque / Statement)', mandatory: true, acceptedFormats: ['pdf', 'jpg', 'jpeg', 'png'] },
    ],
    formFields: [
      { key: 'tradeName', label: 'Trade/Business Name', type: 'text', required: true },
      { key: 'constitution', label: 'Constitution of Business', type: 'select', options: ['Proprietorship', 'Partnership', 'Private Limited', 'Others'], required: true },
    ],
    isActive: true,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  console.log('Connected to MongoDB');

  for (const service of SERVICES) {
    await Service.findOneAndUpdate(
      { name: service.name },
      service,
      { upsert: true, new: true, runValidators: true }
    );
    console.log(`✓ Seeded: ${service.name}`);
  }

  console.log('\nSeed complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
