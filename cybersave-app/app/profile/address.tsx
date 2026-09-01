import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { useUpdateAddress } from '../../src/api/auth';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

interface AddressItem {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export default function MyAddressScreen() {
    const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const updateAddress = useUpdateAddress();

  // Multi-address list state
  const addresses: AddressItem[] = user?.addresses ?? (user?.address ? [{
    id: 'default-legacy',
    label: 'Home',
    line1: user.address.line1,
    line2: user.address.line2,
    city: user.address.city,
    state: user.address.state,
    pincode: user.address.pincode,
    isDefault: true,
  }] : []);

  // Form Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  
  // Form fields
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Status Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const openAddModal = () => {
    setEditingAddress(null);
    setLabel('');
    setLine1('');
    setLine2('');
    setCity('');
    setState('');
    setPincode('');
    setIsDefault(addresses.length === 0); // Default if first address
    setShowFormModal(true);
  };

  const openEditModal = (item: AddressItem) => {
    setEditingAddress(item);
    setLabel(item.label);
    setLine1(item.line1);
    setLine2(item.line2 ?? '');
    setCity(item.city);
    setState(item.state);
    setPincode(item.pincode);
    setIsDefault(item.isDefault);
    setShowFormModal(true);
  };

  const handleSave = async () => {
    if (!label.trim() || !line1.trim() || !city.trim() || !state.trim() || pincode.length !== 6) {
      Alert.alert('Validation Error', 'Please fill all mandatory fields and enter a valid 6-digit pin code.');
      return;
    }

    let updatedAddresses: AddressItem[] = [];

    if (editingAddress) {
      // Update existing address
      updatedAddresses = addresses.map((addr) => {
        if (addr.id === editingAddress.id) {
          return {
            ...addr,
            label: label.trim(),
            line1: line1.trim(),
            line2: line2.trim() || undefined,
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
            isDefault: isDefault,
          };
        }
        // If the edited one is default, unset default on others
        return isDefault ? { ...addr, isDefault: false } : addr;
      });
    } else {
      // Add new address
      const newAddress: AddressItem = {
        id: Math.random().toString(36).substring(2, 9),
        label: label.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        isDefault: isDefault || addresses.length === 0,
      };

      if (newAddress.isDefault) {
        updatedAddresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
      } else {
        updatedAddresses = [...addresses];
      }
      updatedAddresses.push(newAddress);
    }

    // Ensure there is at least one default address if list is not empty
    const hasDefault = updatedAddresses.some(a => a.isDefault);
    if (!hasDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true;
    }

    try {
      await updateAddress.mutateAsync({ addresses: updatedAddresses });
      setShowFormModal(false);
      setSuccessMessage(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 350);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save address');
    }
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to delete your "${label}" address?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            let updatedAddresses = addresses.filter((addr) => addr.id !== id);
            
            // If we deleted the default, set default to the first remaining one
            const deletedWasDefault = addresses.find(a => a.id === id)?.isDefault;
            if (deletedWasDefault && updatedAddresses.length > 0) {
              updatedAddresses[0].isDefault = true;
            }

            try {
              await updateAddress.mutateAsync({ addresses: updatedAddresses });
              setShowDeleteSuccessModal(true);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.error ?? 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: AddressItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.labelRow}>
          <Ionicons name="location" size={18} color="#2563EB" />
          <Text style={styles.cardLabel}>{item.label}</Text>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>{t('address.default')}</Text>
            </View>
          )}
        </View>
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => openEditModal(item)}>
            <Ionicons name="create-outline" size={18} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn} onPress={() => handleDelete(item.id, item.label)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.cardAddress}>
        {item.line1}
        {item.line2 ? `, ${item.line2}` : ''}
        {'\n'}{item.city}, {item.state}
      </Text>

      <Text style={styles.cardPincode}>{t('address.pincode')} {item.pincode}</Text>
    </View>
  );

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
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('address.my_addresses')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Main Body */}
      <View style={styles.whiteContainer}>
        <View style={styles.cardContainer}>
          {/* Add New Address Button */}
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>{t('address.add_new_address')}</Text>
          </TouchableOpacity>

          {/* Addresses List */}
          {addresses.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>{t('address.no_saved_addresses')}</Text>
              <Text style={styles.emptySub}>
                
                                              {t('address.add_an_address_to_automaticall')}
                                            </Text>
            </View>
          ) : (
            <FlatList
              data={addresses}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* Add / Edit Address Form Modal */}
      <Modal
        visible={showFormModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFormModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBgDismiss} 
            activeOpacity={1} 
            onPress={() => setShowFormModal(false)} 
          />
          <KeyboardAvoidingView 
            style={styles.bottomSheetContainer} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.bottomSheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.dragIndicator} />
                <View style={styles.sheetTitleRow}>
                  <Text style={styles.sheetTitle}>
                    {editingAddress ? 'Edit Address' : 'Add New Address'}
                  </Text>
                  <TouchableOpacity style={styles.sheetCloseBtn} onPress={() => setShowFormModal(false)}>
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={styles.formContainer}
              >
                <View style={styles.field}>
                  <Text style={styles.label}>{t('address.tag_label')}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={label} 
                    onChangeText={setLabel} 
                    placeholder="e.g. Home, Office, Parents House" 
                    placeholderTextColor="#94A3B8" 
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('address.address_line_1')}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={line1} 
                    onChangeText={setLine1} 
                    placeholder="Flat/House No., Building, Street" 
                    placeholderTextColor="#94A3B8" 
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('address.address_line_2')}</Text>
                  <TextInput 
                    style={styles.input} 
                    value={line2} 
                    onChangeText={setLine2} 
                    placeholder="Landmark, Area (optional)" 
                    placeholderTextColor="#94A3B8" 
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.flex1]}>
                    <Text style={styles.label}>{t('address.city')}</Text>
                    <TextInput 
                      style={styles.input} 
                      value={city} 
                      onChangeText={setCity} 
                      placeholder="City" 
                      placeholderTextColor="#94A3B8" 
                    />
                  </View>
                  <View style={[styles.field, styles.flex1]}>
                    <Text style={styles.label}>{t('address.state')}</Text>
                    <TextInput 
                      style={styles.input} 
                      value={state} 
                      onChangeText={setState} 
                      placeholder="State" 
                      placeholderTextColor="#94A3B8" 
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('address.pin_code')}</Text>
                  <TextInput 
                    style={[styles.input, { width: 140 }]} 
                    value={pincode} 
                    onChangeText={setPincode} 
                    placeholder="6-digit PIN" 
                    placeholderTextColor="#94A3B8" 
                    keyboardType="number-pad" 
                    maxLength={6} 
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.switchLabel}>{t('address.set_as_default_address')}</Text>
                    <Text style={styles.switchSub}>{t('address.use_this_address_as_pre_filled')}</Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: '#CBD5E1', true: '#BFDBFE' }}
                    thumbColor={isDefault ? '#2563EB' : '#F1F5F9'}
                  />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                  <Text style={styles.saveText}>{t('address.save_address')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Premium Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <View style={styles.successIconOuter}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.successIconInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.statusTitle}>{t('address.success')}</Text>
            <Text style={styles.statusSub}>{successMessage}</Text>
            <TouchableOpacity 
              style={styles.statusDoneBtn} 
              onPress={() => setShowSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.statusDoneBtnText}>{t('address.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Premium Delete Success Modal */}
      <Modal
        visible={showDeleteSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteSuccessModal(false)}
      >
        <View style={styles.statusOverlay}>
          <View style={styles.statusCard}>
            <View style={styles.deleteIconOuter}>
              <View style={styles.deleteIconInner}>
                <Ionicons name="trash-outline" size={32} color="#EF4444" />
              </View>
            </View>
            <Text style={styles.statusTitle}>{t('address.address_deleted')}</Text>
            <Text style={styles.statusSub}>{t('address.the_address_has_been_permanent')}</Text>
            <TouchableOpacity 
              style={styles.deleteDoneBtn} 
              onPress={() => setShowDeleteSuccessModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteDoneBtnText}>{t('address.dismiss')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingBottom: 48,
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
    marginTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    marginHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 20,
    gap: 16,
    flex: 1,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '700',
  },
  list: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardLabel: {
    fontFamily: 'Manrope',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  defaultBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  defaultBadgeText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 2,
  },
  cardAddress: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    fontWeight: '400',
  },
  cardPincode: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  // Modal styling (Bottom Sheet Form)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalBgDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    width: '100%',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '90%',
    ...shadows.lg,
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    marginBottom: 8,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetCloseBtn: {
    padding: 4,
  },
  formContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: radius.xl,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: radius.xl,
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    marginTop: spacing.xs,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // Status Alerts styling
  statusOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.xl,
    padding: 24,
    alignItems: 'center',
    gap: 16,
    ...shadows.lg,
  },
  successIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  statusDoneBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  statusDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  deleteIconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteIconInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  deleteDoneBtn: {
    backgroundColor: '#EF4444',
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteDoneBtnText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
