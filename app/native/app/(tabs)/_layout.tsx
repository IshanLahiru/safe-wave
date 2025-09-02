import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.dark.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='house.fill' color={color} />,
        }}
      />
      <Tabs.Screen
        name='checkin'
        options={{
          title: 'Check In',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='mic.fill' color={color} />,
        }}
      />
      <Tabs.Screen
        name='analytics'
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name='chart.line.uptrend.xyaxis' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='profile'
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name='person.fill' color={color} />,
        }}
      />
    </Tabs>
  );
}
