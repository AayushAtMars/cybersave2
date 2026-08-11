import React from 'react';
import { Tabs } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../src/theme';

// ─── SVG Icon Components ───────────────────────────────────────────────────────
const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={24} height={22} viewBox="0 0 29 22" fill="none">
    <Path
      d="M17.5 21V13C17.5 12.7348 17.3946 12.4804 17.2071 12.2929C17.0196 12.1054 16.7652 12 16.5 12H12.5C12.2348 12 11.9804 12.1054 11.7929 12.2929C11.6054 12.4804 11.5 12.7348 11.5 13V21"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M5.5 9.99948C5.49993 9.70855 5.56333 9.4211 5.68579 9.1572C5.80824 8.89329 5.9868 8.65928 6.209 8.47148L13.209 2.47248C13.57 2.16739 14.0274 2 14.5 2C14.9726 2 15.43 2.16739 15.791 2.47248L22.791 8.47148C23.0132 8.65928 23.1918 8.89329 23.3142 9.1572C23.4367 9.4211 23.5001 9.70855 23.5 9.99948V18.9995C23.5 19.5299 23.2893 20.0386 22.9142 20.4137C22.5391 20.7888 22.0304 20.9995 21.5 20.9995H7.5C6.96957 20.9995 6.46086 20.7888 6.08579 20.4137C5.71071 20.0386 5.5 19.5299 5.5 18.9995V9.99948Z"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ServicesIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={20} viewBox="12 3 20 20" fill="none">
    <Path
      d="M28 3H14C12.8954 3 12 3.89543 12 5V19C12 20.1046 12.8954 21 14 21H28C29.1046 21 30 20.1046 30 19V5C30 3.89543 29.1046 3 28 3Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9H30" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M12 15H30" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M18 3V21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M24 3V21" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const AppsIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={22} viewBox="4 2 17 21" fill="none">
    <Path
      d="M15.5 2H6.5C5.96957 2 5.46086 2.21071 5.08579 2.58579C4.71071 2.96086 4.5 3.46957 4.5 4V20C4.5 20.5304 4.71071 21.0391 5.08579 21.4142C5.46086 21.7893 5.96957 22 6.5 22H18.5C19.0304 22 19.5391 21.7893 19.9142 21.4142C20.2893 21.0391 20.5 20.5304 20.5 20V7L15.5 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14.5 2V6C14.5 6.53043 14.7107 7.03914 15.0858 7.41421C15.4609 7.78929 15.9696 8 16.5 8H20.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M10.5 9H8.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.5 13H8.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M16.5 17H8.5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const WalletIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={20} viewBox="5 2 21 21" fill="none">
    <Path
      d="M22 7V4C22 3.73478 21.8946 3.48043 21.7071 3.29289C21.5196 3.10536 21.2652 3 21 3H8C7.46957 3 6.96086 3.21071 6.58579 3.58579C6.21071 3.96086 6 4.46957 6 5C6 5.53043 6.21071 6.03914 6.58579 6.41421C6.96086 6.78929 7.46957 7 8 7H23C23.2652 7 23.5196 7.10536 23.7071 7.29289C23.8946 7.48043 24 7.73478 24 8V12M24 12H21C20.4696 12 19.9609 12.2107 19.5858 12.5858C19.2107 12.9609 19 13.4696 19 14C19 14.5304 19.2107 15.0391 19.5858 15.4142C19.9609 15.7893 20.4696 16 21 16H24C24.2652 16 24.5196 15.8946 24.7071 15.7071C24.8946 15.5196 25 15.2652 25 15V13C25 12.7348 24.8946 12.4804 24.7071 12.2929C24.5196 12.1054 24.2652 12 24 12Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 5V19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H23C23.2652 21 23.5196 20.8946 23.7071 20.7071C23.8946 20.5196 24 20.2652 24 20V16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ProfileIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="7 2 18 21" fill="none">
    <Path
      d="M22.5 21V19C22.5 17.9391 22.0786 16.9217 21.3284 16.1716C20.5783 15.4214 19.5609 15 18.5 15H12.5C11.4391 15 10.4217 15.4214 9.67157 16.1716C8.92143 16.9217 8.5 17.9391 8.5 19V21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15.5 11C17.7091 11 19.5 9.20914 19.5 7C19.5 4.79086 17.7091 3 15.5 3C13.2909 3 11.5 4.79086 11.5 7C11.5 9.20914 13.2909 11 15.5 11Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ─── Tab Config ────────────────────────────────────────────────────────────────
const TAB_ITEMS = [
  { name: 'home',         label: 'Home',         Icon: HomeIcon },
  { name: 'services',     label: 'Services',     Icon: ServicesIcon },
  { name: 'applications', label: 'Applications', Icon: AppsIcon },
  { name: 'wallet',       label: 'Wallet',       Icon: WalletIcon },
  { name: 'profile',      label: 'Profile',      Icon: ProfileIcon },
] as const;

const ACTIVE_COLOR   = colors.tabActive;   // #2563EB
const INACTIVE_COLOR = '#90A1B9';

// ─── Custom Tab Bar ────────────────────────────────────────────────────────────
type TabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
};

function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isCenter  = index === 2; // Applications

          const tab = TAB_ITEMS[index];
          const Icon = tab.Icon;
          const iconColor = isCenter
            ? '#FFFFFF'
            : isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
          const labelColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (isCenter) {
            // ── Raised center FAB button ──────────────────────────────────────
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                activeOpacity={0.85}
                style={styles.centerTabWrapper}
              >
                <LinearGradient
                  colors={['#1E3A8A', '#2563EB']}
                  style={styles.centerCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                >
                  <Icon color={iconColor} />
                </LinearGradient>
                <Text style={[styles.tabLabel, { color: labelColor }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          // ── Regular tab ───────────────────────────────────────────────────
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              <Icon color={iconColor} />
              <Text style={[styles.tabLabel, { color: labelColor }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"         />
      <Tabs.Screen name="services"     />
      <Tabs.Screen name="applications" />
      <Tabs.Screen name="wallet"       />
      <Tabs.Screen name="profile"      />
    </Tabs>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    // Extremely light blue-tinted translucent glass background matching mock
    backgroundColor: 'rgba(235, 243, 255, 0.75)', 
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    // Premium soft shadow to lift it off the background content
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A8A',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBar: {
    flexDirection: 'row',
    height: 76,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  // ── Regular tab ─────────────────────────────────────────────────────────────
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ── Center (Applications) tab ────────────────────────────────────────────────
  centerTabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24, // Pull up to float above the bar
  },
  centerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACTIVE_COLOR, // Keep center circle always filled with active primary blue
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    // Pronounced shadow for the floating circle
    ...Platform.select({
      ios: {
        shadowColor: ACTIVE_COLOR,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
