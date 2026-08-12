import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useDraftStore } from '../../src/store/draftApplicationStore';
import { useService, useSaveWizardStep } from '../../src/api/applications';
import { colors, spacing, radius, shadows } from '../../src/theme';
import { STATE_DISTRICTS } from '../../src/utils/districtsData';

function SearchableModalPicker({
  visible,
  onClose,
  title,
  options,
  onSelect,
  value
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onSelect: (val: string) => void;
  value: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '75%', padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#94A3B8"
            style={{
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              fontSize: 14,
              color: '#0F172A',
              backgroundColor: '#F8FAFC',
              marginBottom: 16
            }}
            value={search}
            onChangeText={setSearch}
          />
          <FlatList
            data={filtered}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item);
                  onClose();
                  setSearch('');
                }}
                style={{
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F1F5F9',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: value === item ? '700' : '500', color: value === item ? '#2563EB' : '#334155' }}>
                  {item}
                </Text>
                {value === item && <Ionicons name="checkmark" size={18} color="#2563EB" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function Step1PersonalScreen() {
  const draft = useDraftStore((s) => s.draft);
  const updateDraft = useDraftStore((s) => s.updateDraft);
  const { data: service, isLoading } = useService(draft?.serviceId ?? '');
  const saveStep = useSaveWizardStep(draft?.id ?? '');

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [statePickerVisible, setStatePickerVisible] = useState(false);
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);

  const handleStateSelect = (val: string) => {
    setFormData((prev) => {
      const updated: Record<string, string> = { ...prev, state: val };
      const associated = STATE_DISTRICTS[val] || [];
      if (associated.length > 0) {
        updated.district = associated[0];
      } else {
        delete updated.district;
      }
      return updated;
    });
  };

  useEffect(() => {
    if (draft) {
      const initial: Record<string, string> = {};
      // Load standard fields if available
      if (draft.applicantName) initial.fullName = draft.applicantName;
      if (draft.applicantDob) initial.dob = draft.applicantDob;
      if (draft.applicantGender) initial.gender = draft.applicantGender;
      
      const addr = draft.applicantAddress as any;
      if (addr) {
        if (addr.state) initial.state = addr.state;
        if (addr.city) initial.district = addr.city;
        if (addr.pincode) initial.pincode = addr.pincode;
      }

      // Merge dynamic form data
      if (draft.formData) {
        Object.assign(initial, draft.formData);
      }
      setFormData(initial);
    }
  }, [draft]);

  if (isLoading || !service) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563EB" size="large" />
      </View>
    );
  }

  // Group fields into Personal and Address details
  const fields = service.formFields || [];
  
  // Custom grouping based on field names or keys
  const personalFields = fields.filter(
    (f) => !['pincode', 'state', 'district', 'city', 'address', 'addressline1', 'addressline2'].includes(f.key.toLowerCase())
  );
  const addressFields = fields.filter(
    (f) => ['pincode', 'state', 'district', 'city', 'address', 'addressline1', 'addressline2'].includes(f.key.toLowerCase())
  );

  // If a service has no fields, populate standard defaults
  const displayPersonal = personalFields.length > 0 ? personalFields : [
    { key: 'fullName', label: 'Full Name', type: 'text' as const, placeholder: 'Rajesh Kumar', required: true, maxLength: undefined, options: undefined },
    { key: 'dob', label: 'DOB', type: 'text' as const, placeholder: '12/04/1995', required: true, maxLength: undefined, options: undefined },
    { key: 'gender', label: 'Gender', type: 'text' as const, placeholder: 'Male', required: true, maxLength: undefined, options: undefined },
    { key: 'fatherName', label: "Father's Name", type: 'text' as const, placeholder: 'Sunil Kumar', required: true, maxLength: undefined, options: undefined },
    { key: 'motherName', label: "Mother's Name", type: 'text' as const, placeholder: 'Anita Devi', required: true, maxLength: undefined, options: undefined },
    { key: 'placeOfBirth', label: 'Place of Birth', type: 'text' as const, placeholder: 'City Hospital, Delhi', required: true, maxLength: undefined, options: undefined },
  ];

  const displayAddress = addressFields.length > 0 ? addressFields : [
    { key: 'state', label: 'State', type: 'text' as const, placeholder: 'Delhi', required: true, maxLength: undefined, options: undefined },
    { key: 'district', label: 'District', type: 'text' as const, placeholder: 'New Delhi', required: true, maxLength: undefined, options: undefined },
    { key: 'pincode', label: 'PIN Code', type: 'number' as const, placeholder: '110001', required: true, maxLength: 6, options: undefined },
  ];

  const allFields = [...displayPersonal, ...displayAddress];
  const isValid = allFields.every((f) => {
    if (!f.required) return true;
    const val = (formData[f.key] ?? '').trim();
    if (f.type === 'aadhaar') return val.length === 12 && /^\d{12}$/.test(val);
    if (f.key === 'pincode' || f.key === 'pinCode') return val.length === 6;
    return val.length > 0;
  });

  const handleNext = async () => {
    const applicantName = formData.fullName || formData.childName || formData.studentName || formData.applicantName || draft?.applicantName || 'Applicant';
    const applicantDob = formData.dob || formData.dateOfBirth || draft?.applicantDob || '01/01/1990';
    const applicantGender = formData.gender || draft?.applicantGender || 'Male';
    const applicantPhone = draft?.applicantPhone || '9999999999';
    
    const applicantAddress = {
      line1: formData.addressLine1 || formData.address || 'N/A',
      line2: formData.addressLine2 || '',
      city: formData.district || formData.city || 'City',
      state: formData.state || 'State',
      pincode: formData.pincode || '110001',
    };

    const step1Payload = {
      applicantName,
      applicantPhone,
      applicantDob,
      applicantGender,
      applicantAddress,
    };

    try {
      await saveStep.mutateAsync({ step: 1, data: step1Payload });
      await saveStep.mutateAsync({ step: 2, data: { formData } });

      updateDraft({
        ...step1Payload,
        formData,
        currentStep: 3,
      });

      router.push('/(application)/step-3-documents');
    } catch (err) {
      console.warn('Failed to save details steps:', err);
    }
  };

  const renderFieldInput = (field: typeof displayPersonal[number]) => {
    const isState = field.key.toLowerCase() === 'state';
    const isDistrict = field.key.toLowerCase() === 'district' || field.key.toLowerCase() === 'city';

    if (isState) {
      return (
        <TouchableOpacity
          style={styles.input}
          onPress={() => setStatePickerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.inputText, !formData.state && styles.placeholderText]}>
            {formData.state || field.placeholder || 'Select State'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (isDistrict) {
      return (
        <TouchableOpacity
          style={styles.input}
          onPress={() => {
            if (!formData.state) {
              alert('Please select a State first.');
              return;
            }
            setDistrictPickerVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.inputText, !(formData.district || formData.city) && styles.placeholderText]}>
            {formData.district || formData.city || field.placeholder || 'Select District'}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <TextInput
        style={styles.input}
        value={formData[field.key] ?? ''}
        onChangeText={(val) => setFormData((prev) => ({ ...prev, [field.key]: val }))}
        placeholder={field.placeholder ?? `Enter ${field.label}`}
        placeholderTextColor="#94A3B8"
        keyboardType={field.type === 'number' || field.type === 'aadhaar' ? 'number-pad' : 'default'}
        maxLength={field.maxLength}
      />
    );
  };

  // Helper to group DOB/Gender and District/Pincode into rows
  const renderPersonalFields = () => {
    const rendered: React.ReactNode[] = [];
    let i = 0;
    while (i < displayPersonal.length) {
      const current = displayPersonal[i];
      const next = displayPersonal[i + 1];

      // If current is DOB and next is Gender, render side-by-side
      if (current.key.toLowerCase() === 'dob' && next && next.key.toLowerCase() === 'gender') {
        rendered.push(
          <View key={`${current.key}-${next.key}`} style={styles.rowContainer}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>
                {current.label}
                {current.required && <Text style={styles.req}> *</Text>}
              </Text>
              {renderFieldInput(current)}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>
                {next.label}
                {next.required && <Text style={styles.req}> *</Text>}
              </Text>
              {renderFieldInput(next)}
            </View>
          </View>
        );
        i += 2;
      } else {
        rendered.push(
          <View key={current.key} style={styles.field}>
            <Text style={styles.label}>
              {current.label}
              {current.required && <Text style={styles.req}> *</Text>}
            </Text>
            {renderFieldInput(current)}
          </View>
        );
        i += 1;
      }
    }
    return rendered;
  };

  const renderAddressFields = () => {
    const rendered: React.ReactNode[] = [];
    let i = 0;
    while (i < displayAddress.length) {
      const current = displayAddress[i];
      const next = displayAddress[i + 1];

      // If current is District and next is Pincode, render side-by-side
      if ((current.key.toLowerCase() === 'district' || current.key.toLowerCase() === 'city') && next && (next.key.toLowerCase() === 'pincode' || next.key.toLowerCase() === 'pincode')) {
        rendered.push(
          <View key={`${current.key}-${next.key}`} style={styles.rowContainer}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>
                {current.label}
                {current.required && <Text style={styles.req}> *</Text>}
              </Text>
              {renderFieldInput(current)}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>
                {next.label}
                {next.required && <Text style={styles.req}> *</Text>}
              </Text>
              {renderFieldInput(next)}
            </View>
          </View>
        );
        i += 2;
      } else {
        rendered.push(
          <View key={current.key} style={styles.field}>
            <Text style={styles.label}>
              {current.label}
              {current.required && <Text style={styles.req}> *</Text>}
            </Text>
            {renderFieldInput(current)}
          </View>
        );
        i += 1;
      }
    }
    return rendered;
  };

  return (
    <View style={styles.flex}>
      {/* Header Gradient */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Apply {service.name}</Text>
          <Text style={styles.headerStep}>Step 1/5</Text>
        </View>
        {/* Progress track */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: '20%' }]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Main Floating Container */}
        <View style={styles.whiteContainer}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Personal Details Section */}
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.fieldsGap}>
              {renderPersonalFields()}
            </View>

            {/* Address Details Section */}
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Address Details</Text>
            <View style={styles.fieldsGap}>
              {renderAddressFields()}
            </View>
          </ScrollView>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsBox}>
          <TouchableOpacity
            style={[styles.continueBtn, !isValid && styles.continueBtnDisabled]}
            onPress={handleNext}
            disabled={!isValid || saveStep.isPending}
            activeOpacity={0.8}
          >
            <Text style={styles.continueText}>
              {saveStep.isPending ? 'Saving Details...' : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.draftBtn} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.draftText}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Picker Modals */}
        <SearchableModalPicker
          visible={statePickerVisible}
          onClose={() => setStatePickerVisible(false)}
          title="Select State"
          options={Object.keys(STATE_DISTRICTS)}
          onSelect={handleStateSelect}
          value={formData.state || ''}
        />

        <SearchableModalPicker
          visible={districtPickerVisible}
          onClose={() => setDistrictPickerVisible(false)}
          title="Select District"
          options={formData.state ? (STATE_DISTRICTS[formData.state] || []) : []}
          onSelect={(val) => setFormData(prev => ({ ...prev, district: val }))}
          value={formData.district || ''}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerStep: {
    fontFamily: 'System',
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -12,
  },
  sectionTitle: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 25,
  },
  fieldsGap: { gap: 20 },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  field: { gap: 8 },
  label: {
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  req: { color: '#EF4444' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: 'System',
    fontSize: 15,
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  actionsBox: {
    gap: 14,
    marginTop: 16,
    marginHorizontal: 24,
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  continueText: {
    color: '#FFFFFF',
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  draftBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftText: {
    color: '#2563EB',
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
});

