import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Modal, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

// Firebase global reCAPTCHA site key for Phone Auth
const SITE_KEY = '6LcMzywaAAAAAFZ5tG5Q8t_V12aB7J8w3g5tB9M';

export interface FirebaseRecaptchaRef {
  verify: () => Promise<string>;
}

interface Props {
  onCancel?: () => void;
}

export const FirebaseRecaptcha = forwardRef<FirebaseRecaptchaRef, Props>(({ onCancel }, ref) => {
  const [visible, setVisible] = useState(false);
  const [resolver, setResolver] = useState<((token: string) => void) | null>(null);
  const [rejecter, setRejecter] = useState<((err: Error) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    verify: () => {
      return new Promise<string>((resolve, reject) => {
        setResolver(() => resolve);
        setRejecter(() => reject);
        setVisible(true);
      });
    },
  }));

  const handleMessage = (event: WebViewMessageEvent) => {
    const token = event.nativeEvent.data;
    if (token) {
      if (resolver) resolver(token);
      setVisible(false);
      // Reset state
      setResolver(null);
      setRejecter(null);
    }
  };

  const handleClose = () => {
    setVisible(false);
    if (rejecter) rejecter(new Error('User cancelled ReCAPTCHA verification'));
    setResolver(null);
    setRejecter(null);
    if (onCancel) onCancel();
  };

  // Local HTML rendering reCAPTCHA
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #0d1b2a;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          }
          .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            background-color: #1b263b;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          }
          .title {
            color: #ffffff;
            font-size: 16px;
            margin-bottom: 20px;
            text-align: center;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="title">Security Verification</div>
          <div class="g-recaptcha" 
               data-sitekey="${SITE_KEY}" 
               data-callback="onSubmit"
               data-theme="dark"></div>
        </div>

        <script>
          function onSubmit(token) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(token);
            }
          }
        </script>
      </body>
    </html>
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verify Identity</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://cybersave-625ad.firebaseapp.com' }}
          onMessage={handleMessage}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </SafeAreaView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1b263b',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#1b263b',
  },
  closeButtonText: {
    color: '#e0e1dd',
    fontSize: 14,
    fontWeight: '500',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0d1b2a',
  },
});
