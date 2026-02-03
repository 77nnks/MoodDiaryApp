import React from 'react';
import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { ja } from '../../i18n/ja';

interface TabIconProps {
  emoji: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, focused }) => (
  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{emoji}</Text>
);

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#999',
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#333',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: ja.tabs.home,
          headerTitle: ja.app.name,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: ja.tabs.calendar,
          headerTitle: ja.calendar.title,
          tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="surf"
        options={{
          title: ja.tabs.surf,
          headerTitle: ja.surf.title,
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏄" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.6,
  },
  tabIconFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  header: {
    backgroundColor: '#FFF',
    shadowColor: 'transparent',
    elevation: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
});
