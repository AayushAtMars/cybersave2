import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadows } from '../src/theme';
import { useServices } from '../src/api/applications';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionButton?: {
    label: string;
    route: string;
    params?: Record<string, string>;
  };
}

const QUICK_SUGGESTIONS = [
  { label: '🏠 Update Address', text: 'How do I update my address on my Aadhaar card?' },
  { label: '🔗 Link PAN Card', text: 'How do I link or apply for a PAN card?' },
  { label: '📄 Pay Bills', text: 'How do I pay my electricity bill?' },
  { label: '🏛️ View Schemes', text: 'Tell me about Government Schemes.' },
];

export default function BotScreen() {
  const user = useAuthStore((s) => s.user);
  const userName = user?.name?.split(' ')[0] ?? 'there';

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste ${userName}! I am CyberBot, your digital assistant for National Government Services. How can I help you today?`,
      timestamp: formatTime(new Date()),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch real services to resolve routes dynamically
  const { data: servicesData } = useServices();

  function formatTime(date: Date): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const minStr = minutes < 10 ? '0' + minutes : minutes;
    const hrStr = hours < 10 ? '0' + hours : hours;
    return `${hrStr}:${minStr} ${ampm}`;
  }

  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages, isTyping]);

  const getFallbackResponse = (userText: string): { text: string; actionButton?: Message['actionButton'] } => {
    const text = userText.toLowerCase();

    // Aadhaar Address Update
    if (text.includes('aadhaar') || text.includes('address') || text.includes('update')) {
      const service = servicesData?.items?.find(s => s.name.includes('Aadhaar'));
      return {
        text: 'You can easily update your Aadhaar address online. Please have a valid address proof (like a utility bill or rent agreement) ready. Shall I assist you with starting the application?',
        actionButton: service
          ? { label: 'Update Address Now', route: '/(application)/start', params: { serviceId: service._id } }
          : undefined,
      };
    }

    // PAN Card
    if (text.includes('pan') || text.includes('link') || text.includes('pancard')) {
      const service = servicesData?.items?.find(s => s.name.includes('PAN'));
      return {
        text: 'To apply for a new PAN card or update your existing PAN details, you can use our dynamic wizard. Would you like to start the application now?',
        actionButton: service
          ? { label: 'Start PAN Application', route: '/(application)/start', params: { serviceId: service._id } }
          : undefined,
      };
    }

    // Bills
    if (text.includes('bill') || text.includes('electricity') || text.includes('pay')) {
      const service = servicesData?.items?.find(s => s.name.includes('Electricity'));
      return {
        text: 'You can pay central & state utility bills like Electricity instantly. Would you like to enter your consumer details and pay your bill?',
        actionButton: service
          ? { label: 'Pay Electricity Bill', route: '/(application)/start', params: { serviceId: service._id } }
          : undefined,
      };
    }

    // Schemes
    if (text.includes('scheme') || text.includes('svanidhi') || text.includes('ayushman') || text.includes('awas') || text.includes('kisan')) {
      return {
        text: 'We have several government welfare schemes available, including PM SVANidhi (loans for street vendors), Ayushman Bharat (health cover), and PM-Kisan (income support for farmers). Click below to view all schemes.',
        actionButton: { label: 'View Government Schemes', route: '/schemes' },
      };
    }

    // General fallback
    return {
      text: 'I can assist you with various public services like updating Aadhaar address, applying for a PAN card, paying electricity bills, or checking government welfare schemes. What would you like to do?',
    };
  };

  const queryGeminiAPI = async (message: string): Promise<{ text: string; actionButton?: Message['actionButton'] }> => {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      // Simulate delay for realism
      await new Promise((res) => setTimeout(res, 1200));
      return getFallbackResponse(message);
    }

    try {
      const systemPrompt = `You are CyberBot, a friendly and official digital assistant for National Government Services in the CyberSave app.
Address the user as ${user?.name?.split(' ')[0] ?? 'there'}. Keep your response very concise, friendly, and helpful (maximum 3 sentences).
If the user asks about Aadhaar, PAN, paying electricity bills, or schemes, explain briefly and direct them to apply. Do not output markdown code blocks.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }],
              },
            ],
          }),
        }
      );

      const data = await response.json();
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!botText) throw new Error('Empty API response');

      // Attempt to attach action buttons based on keywords in Gemini output
      const textLower = message.toLowerCase() + " " + botText.toLowerCase();
      let actionButton: Message['actionButton'] | undefined;

      if (textLower.includes('aadhaar') || textLower.includes('address')) {
        const svc = servicesData?.items?.find(s => s.name.includes('Aadhaar'));
        if (svc) actionButton = { label: 'Update Aadhaar Address', route: '/(application)/start', params: { serviceId: svc._id } };
      } else if (textLower.includes('pan')) {
        const svc = servicesData?.items?.find(s => s.name.includes('PAN'));
        if (svc) actionButton = { label: 'Apply for PAN Card', route: '/(application)/start', params: { serviceId: svc._id } };
      } else if (textLower.includes('bill') || textLower.includes('electricity')) {
        const svc = servicesData?.items?.find(s => s.name.includes('Electricity'));
        if (svc) actionButton = { label: 'Pay Electricity Bill', route: '/(application)/start', params: { serviceId: svc._id } };
      } else if (textLower.includes('scheme') || textLower.includes('svanidhi') || textLower.includes('ayushman') || textLower.includes('awas') || textLower.includes('welfare')) {
        actionButton = { label: 'View Government Schemes', route: '/schemes' };
      }

      return { text: botText, actionButton };
    } catch (e) {
      console.error('Gemini API error, falling back:', e);
      return getFallbackResponse(message);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text,
      timestamp: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const response = await queryGeminiAPI(text);
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: response.text,
        timestamp: formatTime(new Date()),
        actionButton: response.actionButton,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleActionButton = (action: Exclude<Message['actionButton'], undefined>) => {
    if (action.params) {
      router.push({ pathname: action.route as any, params: action.params });
    } else {
      router.push(action.route as any);
    }
  };

  return (
    <View style={styles.flex}>
      {/* Header */}
      <LinearGradient
        colors={['#1E3A8A', '#2563EB']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back-outline" size={20} color="#1E3A8A" />
          </TouchableOpacity>

          <View style={styles.botProfile}>
            <View style={styles.avatarContainer}>
              <Ionicons name="shield-checkmark" size={20} color="#2563EB" />
            </View>
            <View style={styles.botMeta}>
              <Text style={styles.botName}>cyberbot</Text>
              <Text style={styles.botStatus}>● Official Assistant • Online</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.optionsBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Body */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Messages list */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dateStampContainer}>
            <View style={styles.dateStamp}>
              <Text style={styles.dateStampText}>TODAY</Text>
            </View>
          </View>

          {messages.map((item) => {
            const isUser = item.sender === 'user';
            return (
              <View key={item.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
                <Text style={styles.senderLabel}>{isUser ? 'You' : 'cyberbot'}</Text>
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
                  <Text style={[styles.msgText, isUser ? styles.msgTextUser : styles.msgTextBot]}>
                    {item.text}
                  </Text>

                  {/* Dynamic helper link buttons */}
                  {item.actionButton && (
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleActionButton(item.actionButton!)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardActionBtnText}>{item.actionButton.label}</Text>
                      <Ionicons name="chevron-forward-outline" size={14} color="#2563EB" />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.msgRow, styles.msgRowBot]}>
              <Text style={styles.senderLabel}>cyberbot</Text>
              <View style={[styles.bubble, styles.bubbleBot, styles.bubbleTyping]}>
                <ActivityIndicator size="small" color="#64748B" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestion Chips */}
        <View style={styles.chipsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {QUICK_SUGGESTIONS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.suggestionChip}
                onPress={() => handleSend(item.text)}
              >
                <Text style={styles.suggestionChipLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="attach-outline" size={24} color="#94A3B8" />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Ask me about Aadhaar, PAN..."
            placeholderTextColor="#94A3B8"
            value={inputVal}
            onChangeText={setInputVal}
            onSubmitEditing={() => handleSend(inputVal)}
          />

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="mic-outline" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sendButton}
            onPress={() => handleSend(inputVal)}
            disabled={!inputVal.trim()}
          >
            <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#1E3A8A' },
  header: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.base,
  },
  headerSafeArea: {
    flex: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  botProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
    gap: spacing.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botMeta: {
    gap: 1,
  },
  botName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  botStatus: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  optionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.base,
    gap: spacing.lg,
    paddingBottom: 24,
  },
  dateStampContainer: {
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dateStamp: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.md,
  },
  dateStampText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  msgRow: {
    maxWidth: '80%',
    gap: 4,
  },
  msgRowBot: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  msgRowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...shadows.sm,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: '#EFF6FF',
    borderTopRightRadius: 4,
  },
  bubbleTyping: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgText: {
    fontSize: 15,
    lineHeight: 22,
  },
  msgTextBot: {
    color: '#0F172A',
  },
  msgTextUser: {
    color: '#1E3A8A',
  },
  timestamp: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    paddingHorizontal: 4,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    marginTop: 10,
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cardActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  chipsSection: {
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  chipsScroll: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  suggestionChipLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: '#0F172A',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
});
