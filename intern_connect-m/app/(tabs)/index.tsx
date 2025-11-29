import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";

// ✅ Import screens directly from app/screens/
import BrowseInternshipsScreen from "../../app/screens/BrowseInternshipsScreen";
import CompanyRegistrationScreen from "../../app/screens/CompanyRegistrationScreen";
import DashboardScreen from "../../app/screens/DashboardScreen";
import HomePage from "../../app/screens/HomePage"; // Default landing screen
import LoginScreen from "../../app/screens/LoginScreen";
import NotificationsScreen from "../../app/screens/NotificationsScreen";
import PostInternshipScreen from "../../app/screens/PostInternshipScreen";
import ProfileInfoScreen from "../../app/screens/ProfileInfoScreen";
import ProfileViewScreen from "../../app/screens/ProfileViewScreen";
import RegisterScreen from "../../app/screens/RegisterScreen";
import ResetPasswordScreen from "../../app/screens/ResetPasswordScreen";
import RoleSelectionScreen from "../../app/screens/RoleSelectionScreen";
import ScheduleInterviewScreen from "../../app/screens/ScheduleInterviewScreen";
import SettingsScreen from "../../app/screens/SettingsScreen";
import SubmitApplicationScreen from "../../app/screens/SubmitApplicationScreen";

// ✅ Ensure StackNavigator is created properly
const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{ headerShown: false }} // Ensures no header is shown
      >
        <Stack.Screen name="Home" component={HomePage} options={{ headerShown: false }} />
        <Stack.Screen name="BrowseInternships" component={BrowseInternshipsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompanyRegistration" component={CompanyRegistrationScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PostInternship" component={PostInternshipScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileInfo" component={ProfileInfoScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ headerShown: false }} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ScheduleInterview" component={ScheduleInterviewScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SubmitApplication" component={SubmitApplicationScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}