import React, { useContext } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from './src/screens/LoginScreen';
import OfficerDashboard from './src/screens/OfficerDashboard';
import AddAccidentScreen from './src/screens/AddAccidentScreen';
import AddViolationScreen from './src/screens/AddViolationScreen';
// ✅ IMPORTANT: use YOUR real screens (NOT duplicate functions)
import AccidentsScreen from './src/screens/AccidentsScreen';
import ViolationsScreen from './src/screens/ViolationsScreen';
import DutyScreen from './src/screens/DutyScreen';

import { LanguageProvider, LanguageContext } from './src/context/LanguageContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();




// 🔷 BOTTOM TAB NAVIGATION
function MainTabs() {
  const { language } = useContext(LanguageContext);

  const translations = {
    EN: {
      dashboard: "Dashboard",
      accidents: "Accidents",
      violations: "Violations",
      duty: "Duty Roster",
    },
    SI: {
      dashboard: "ඩෑෂ්බෝඩ්",
      accidents: "අනතුරු",
      violations: "වරදි",
      duty: "රාජකාරි",
    }
  };

  const t = translations[language];

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = 'grid';
          } else if (route.name === 'Accidents') {
            iconName = 'car';
          } else if (route.name === 'Violations') {
            iconName = 'alert-circle';
          } else if (route.name === 'Duty') {
            iconName = 'calendar';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },

        tabBarActiveTintColor: '#1e3a8a',
        tabBarInactiveTintColor: 'gray',
      })}
    >

      <Tab.Screen 
        name="Dashboard" 
        component={OfficerDashboard} 
        options={{ tabBarLabel: t.dashboard }}
      />

      <Tab.Screen 
        name="Accidents" 
        component={AccidentsScreen}
        options={{ tabBarLabel: t.accidents }}
      />

      <Tab.Screen 
        name="Violations" 
        component={ViolationsScreen}
        options={{ tabBarLabel: t.violations }}
      />

      <Tab.Screen 
        name="Duty" 
        component={DutyScreen}
        options={{ tabBarLabel: t.duty }}
      />

    </Tab.Navigator>
  );
}


// 🔷 MAIN APP
export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator>
          {/* LOGIN */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }} 
          />

          {/* MAIN TABS */}
          <Stack.Screen 
            name="Main" 
            component={MainTabs} 
            options={{ headerShown: false }} 
          />

          {/* EXTRA SCREENS */}
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="AddAccident" component={AddAccidentScreen} />
          <Stack.Screen name="AddViolation" component={AddViolationScreen} />

        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}


// 🔷 STYLES
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});