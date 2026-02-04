import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { colors, borderRadius, fontSize, fontWeight, shadows, spacing } from '../../lib/theme';
import { ja } from '../../i18n/ja';

// Duolingo風のカスタムタブアイコン
interface TabIconProps {
  type: 'home' | 'calendar' | 'surf';
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ type, focused }) => {
  const color = focused ? colors.primary : colors.text.secondary;
  const size = 28;

  const renderIcon = () => {
    switch (type) {
      case 'home':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24">
            {/* ホームアイコン */}
            <Path
              d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z"
              fill={focused ? color : 'none'}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'calendar':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24">
            {/* カレンダーアイコン */}
            <Rect
              x={3}
              y={4}
              width={18}
              height={18}
              rx={3}
              fill={focused ? color : 'none'}
              stroke={color}
              strokeWidth={2}
            />
            <Path d="M3 9h18" stroke={focused ? '#FFF' : color} strokeWidth={2} />
            <Path d="M8 2v4M16 2v4" stroke={color} strokeWidth={2} strokeLinecap="round" />
            {/* 日付のドット */}
            {focused && (
              <G>
                <Circle cx={8} cy={14} r={1.5} fill="#FFF" />
                <Circle cx={12} cy={14} r={1.5} fill="#FFF" />
                <Circle cx={16} cy={14} r={1.5} fill="#FFF" />
                <Circle cx={8} cy={18} r={1.5} fill="#FFF" />
                <Circle cx={12} cy={18} r={1.5} fill="#FFF" />
              </G>
            )}
          </Svg>
        );
      case 'surf':
        return (
          <Svg width={size} height={size} viewBox="0 0 24 24">
            {/* 波アイコン */}
            <Path
              d="M2 12c2-2 4-3 6-3s4 2 6 2 4-2 6-2c2 0 2 1 2 1"
              fill="none"
              stroke={color}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <Path
              d="M2 17c2-2 4-3 6-3s4 2 6 2 4-2 6-2c2 0 2 1 2 1"
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeOpacity={focused ? 1 : 0.5}
            />
            {/* サーフボード */}
            <Path
              d="M9 6c0-2 1-4 3-4s3 2 3 4c0 1-1.5 2-3 2s-3-1-3-2z"
              fill={focused ? color : 'none'}
              stroke={color}
              strokeWidth={2}
            />
          </Svg>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.iconContainer}>
      {renderIcon()}
      {focused && <View style={styles.indicator} />}
    </View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: colors.text.white,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ja.tabs.home,
          headerTitle: '',
          headerTransparent: true,
          tabBarIcon: ({ focused }) => <TabIcon type="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: ja.tabs.calendar,
          headerTitle: ja.calendar.title,
          headerStyle: styles.headerColored,
          tabBarIcon: ({ focused }) => <TabIcon type="calendar" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="surf"
        options={{
          title: ja.tabs.surf,
          headerTitle: ja.surf.title,
          headerStyle: styles.headerColored,
          tabBarIcon: ({ focused }) => <TabIcon type="surf" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 90 : 70,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    ...shadows.lg,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 36,
  },
  indicator: {
    position: 'absolute',
    bottom: -4,
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  header: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  headerColored: {
    backgroundColor: colors.background,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.white,
  },
});
