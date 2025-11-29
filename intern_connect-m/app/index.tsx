import { Redirect } from 'expo-router';
import RoleSelectionScreen from "../app/screens/RoleSelectionScreen"
import SettingsScreen from "../app/screens/SettingsScreen"
import SubmitApplicationScreen from "../app/screens/SubmitApplicationScreen"

export default function Index() {
  return <Redirect href="/screens/HomePage" />;
} 