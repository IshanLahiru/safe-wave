import { Text, View, StyleSheet } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Wave</Text>
      <Text style={styles.subtitle}>Welcome to Safe Wave App!</Text>
      <Text style={styles.text}>The app is working correctly.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
  },
});
