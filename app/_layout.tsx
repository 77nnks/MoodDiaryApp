import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initFirebase, signInAsGuest, subscribeToAuthState } from '../lib/firebase';
import { User } from 'firebase/auth';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Firebaseを初期化
    initFirebase();

    // 認証状態を監視
    const unsubscribe = subscribeToAuthState(async (authUser) => {
      if (authUser) {
        setUser(authUser);
        setIsLoading(false);
      } else {
        // 未ログインの場合は匿名認証
        try {
          await signInAsGuest();
        } catch (error) {
          console.error('ゲストログインに失敗しました:', error);
          setIsLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
});
