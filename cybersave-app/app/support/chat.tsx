import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getTicket, replyToTicket, Ticket } from '../../src/api/support';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';
import { useTranslation } from "react-i18next";

export default function ChatScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTicketDetails = async () => {
    try {
      const details = await getTicket(id);
      setTicket(details);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(fetchTicketDetails, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [id]);

  const handleSend = async () => {
    if (!message.trim()) return;
    try {
      const msg = message;
      setMessage('');
      await replyToTicket(id, msg);
      fetchTicketDetails();
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  if (loading && !ticket) {
    return (
      <View style={[styles.flex, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

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
            <Ionicons name="arrow-back-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {ticket?.subject}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: ticket?.status === 'closed' ? '#EF4444' : '#10B981' }
              ]} />
              <Text style={styles.statusText}>
                {ticket?.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.whiteContainer}>
          {/* Messages */}
          <FlatList
            data={ticket?.messages ?? []}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isMe = item.senderRole === 'citizen';
              const isBot = item.senderRole === 'system';
              return (
                <View style={[
                  styles.messageContainer,
                  isMe ? styles.myMessage : isBot ? styles.botMessage : styles.opMessage
                ]}>
                  <Text style={[styles.messageText, isMe && styles.myMessageText]}>
                    {item.message}
                  </Text>
                  <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              );
            }}
          />

          {/* Input bar */}
          {ticket?.status !== 'closed' ? (
            <View style={styles.inputBar}>
              <TextInput
                style={styles.textInput}
                placeholder={t('chat.type_message_here', 'Type message here...')}
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                multiline
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]} 
                onPress={handleSend} 
                activeOpacity={0.8}
                disabled={!message.trim()}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.closedContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" />
              <Text style={styles.closedText}>{t('chat.this_support_ticket_has_been_c')}</Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontFamily: 'Manrope',
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whiteContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    overflow: 'hidden',
  },
  chatList: { 
    padding: 24, 
    paddingTop: 32,
    gap: 16 
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  opMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#0F172A',
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 24,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: 'Inter',
    color: '#0F172A',
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  closedContainer: { 
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  closedText: { 
    fontFamily: 'Inter',
    color: '#64748B', 
    fontSize: 14,
    fontWeight: '500',
  },
});
