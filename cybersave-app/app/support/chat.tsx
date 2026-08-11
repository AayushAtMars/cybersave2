import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { getTicket, replyToTicket, Ticket } from '../../src/api/support';
import { colors, typography, spacing, radius, shadows } from '../../src/theme';

export default function ChatScreen() {
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
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{ticket?.subject}</Text>
          <Text style={styles.subtitle}>Status: {ticket?.status.toUpperCase()}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          data={ticket?.messages ?? []}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => {
            const isMe = item.senderRole === 'citizen';
            const isBot = item.senderRole === 'system';
            return (
              <View style={[
                styles.messageContainer,
                isMe ? styles.myMessage : isBot ? styles.botMessage : styles.opMessage
              ]}>
                <Text style={styles.messageText}>{item.message}</Text>
                <Text style={styles.messageTime}>
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
              placeholder="Type message here..."
              value={message}
              onChangeText={setMessage}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.8}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.closedContainer}>
            <Text style={styles.closedText}>This support ticket has been closed by operator.</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    gap: spacing.base,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 24, color: colors.textPrimary },
  title: { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.textPrimary },
  subtitle: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  chatList: { padding: spacing.base, gap: spacing.md },
  messageContainer: {
    maxWidth: '75%',
    padding: spacing.base,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 2,
  },
  opMessage: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 2,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 2,
  },
  messageText: {
    fontSize: typography.size.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.base,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    fontSize: typography.size.sm,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radius.full,
  },
  sendText: { color: colors.textInverse, fontWeight: typography.weight.bold, fontSize: typography.size.sm },
  closedContainer: { padding: spacing.base, alignItems: 'center', backgroundColor: colors.surface },
  closedText: { color: colors.textMuted, fontSize: typography.size.sm },
});
