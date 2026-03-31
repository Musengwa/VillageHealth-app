import { Redirect } from 'expo-router';

export default function HelloDoctorRedirect() {
  return <Redirect href="/doctor/diagnosis" />;
}
