import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import type { RootStackParamList } from "../../types";
import { useAuth } from "./useAuth";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      Alert.alert("Login failed", (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>🦎</Text>
        <Text style={styles.title}>CreatureDex</Text>
        <Text style={styles.subtitle}>Catch 'em in the real world</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title="Log In" onPress={handleLogin} loading={loading} />
        <Button
          title="Create Account"
          onPress={() => navigation.navigate("Signup")}
          variant="secondary"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0", padding: 24 },
  header: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: "800", color: "#1A1A1A" },
  subtitle: { fontSize: 16, color: "#666", marginTop: 4 },
  form: { paddingBottom: 40 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    color: "#1A1A1A",
  },
});