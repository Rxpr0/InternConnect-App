import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" />
      <Stack.Screen name="BrowseInternshipsScreen" />
      <Stack.Screen name="CompanyRegistrationScreen" />
      <Stack.Screen name="DashboardScreen" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="CompanyLoginScreen" />
      <Stack.Screen name="NotificationsScreen" />
      <Stack.Screen name="PostInternshipScreen" />
      <Stack.Screen name="ProfileInfoScreen" />
      <Stack.Screen name="ProfileViewScreen" />
      <Stack.Screen name="RegisterScreen" />
      <Stack.Screen name="ResetPasswordScreen" />
      <Stack.Screen name="RoleSelectionScreen" />
      <Stack.Screen name="ScheduleInterviewScreen" />
      <Stack.Screen name="SettingsScreen" />
      <Stack.Screen name="SubmitApplicationScreen" />
      <Stack.Screen name="TermsOfServiceScreen" />
      <Stack.Screen name="CompanyOverviewScreen" />
      <Stack.Screen name="CompanyApplicationsScreen" />
      <Stack.Screen name="CompanyInternshipsScreen" />
      <Stack.Screen name="CompanyInterviewsScreen" />
      <Stack.Screen name="InternshipDetailsScreen" />
      <Stack.Screen name="ViewSubmissionScreen" />
      <Stack.Screen name="EditProfileScreen" />
      <Stack.Screen name="CompanyProfileScreen" />
      <Stack.Screen name="CompanyProfileViewScreen" />
      <Stack.Screen name="EditCompanyProfileScreen" />
      <Stack.Screen name="ChangePasswordScreen" />
      <Stack.Screen name="AppliedInternshipDetailsScreen" />
      <Stack.Screen name="CompanySettingsScreen" />
      <Stack.Screen name="DeleteAccountScreen" />
      <Stack.Screen name="PrivacyPolicyScreen" />
    </Stack>
  );
}