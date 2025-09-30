import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View, Alert } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { styles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { Image } from "expo-image";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) {
      setError("System not ready. Please try again.");
      return;
    }

    // Basic validation
    if (!emailAddress || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Attempting to create user...");

      // Create the user with email and password
      const result = await signUp.create({
        emailAddress,
        password,
        username: username || undefined, // Include username if provided
      });

      console.log("Sign up result status:", result.status);
      console.log("Missing fields:", result.missingFields);
      console.log("Required fields:", result.requiredFields);

      // Check if email verification is required
      if (result.status === "missing_requirements") {
        if (result.unverifiedFields?.includes("email_address")) {
          console.log("Preparing email verification...");
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          setPendingVerification(true);
        } else if (result.missingFields?.includes("username")) {
          // If username is required but not provided, proceed to verification first
          console.log("Username will be required after verification");
          await signUp.prepareEmailAddressVerification({
            strategy: "email_code",
          });
          setPendingVerification(true);
        }
      } else if (result.status === "complete") {
        // If no verification needed, sign in directly
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        console.log("Unexpected status:", result.status);
        setError("Please check your email for verification instructions");
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      let errorMessage = "An error occurred during sign up";

      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];

        // Handle specific Clerk error codes
        if (clerkError.code === "form_identifier_exists") {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (clerkError.code === "form_password_length_too_short") {
          errorMessage = "Password must be at least 8 characters long.";
        } else if (clerkError.code === "form_password_pwned") {
          errorMessage =
            "This password is too common. Please choose a more secure password.";
        } else if (clerkError.code === "form_username_invalid_length") {
          errorMessage = "Username must be between 3 and 50 characters long.";
        } else if (clerkError.code === "form_username_invalid_characters") {
          errorMessage =
            "Username contains invalid characters. Use only letters, numbers, and underscores.";
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!code) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Attempting verification with code:", code);

      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      console.log("Verification result:", signUpAttempt.status);
      console.log(
        "Missing fields after verification:",
        signUpAttempt.missingFields
      );

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else if (signUpAttempt.status === "missing_requirements") {
        // Check what's still missing after verification
        if (signUpAttempt.missingFields?.includes("username")) {
          setNeedsUsername(true);
          setPendingVerification(false); // Switch to username input screen
        } else {
          setError(
            "Additional information required. Please complete all steps."
          );
          console.error(
            "Verification incomplete - missing fields:",
            signUpAttempt.missingFields
          );
        }
      } else {
        setError("Verification failed. Please try again.");
        console.error("Verification incomplete:", signUpAttempt);
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      let errorMessage = "Verification failed";

      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];

        if (clerkError.code === "form_code_incorrect") {
          errorMessage =
            "The verification code is incorrect. Please check and try again.";
        } else if (clerkError.code === "form_code_expired") {
          errorMessage =
            "The verification code has expired. Please request a new one.";
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle username submission after verification
  const onUsernameSubmit = async () => {
    if (!isLoaded || !username) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Setting username:", username);

      // Update the sign-up with the username
      const result = await signUp.update({
        username: username.trim(),
      });

      console.log("Update result status:", result.status);

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/");
      } else {
        setError("Failed to set username. Please try again.");
        console.error("Update incomplete:", result);
      }
    } catch (err: any) {
      console.error("Username update error:", err);
      let errorMessage = "Failed to set username";

      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];

        if (clerkError.code === "form_username_invalid_length") {
          errorMessage = "Username must be between 3 and 50 characters long.";
        } else if (clerkError.code === "form_username_invalid_characters") {
          errorMessage =
            "Username contains invalid characters. Use only letters, numbers, and underscores.";
        } else if (clerkError.code === "form_identifier_exists") {
          errorMessage =
            "This username is already taken. Please choose another one.";
        } else if (clerkError.message) {
          errorMessage = clerkError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend verification code
  const onResendPress = async () => {
    if (!isLoaded) return;

    setLoading(true);
    setError("");

    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      Alert.alert("Success", "Verification code sent to your email");
    } catch (err: any) {
      console.error("Resend error:", err);
      setError("Failed to resend code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Username input screen after verification
  if (needsUsername) {
    return (
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
      >
        <View style={styles.verificationContainer}>
          <View style={styles.imagebox}>
            <Image
              source={require("../../assets/images/revenue-i2.png")}
              style={styles.illustration}
            />
          </View>

          <Text style={styles.verificationTitle}>Choose a Username</Text>
          <Text style={styles.subtitle}>
            Your email has been verified! Now choose a username to complete your
            account.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <Ionicons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          ) : null}

          <TextInput
            style={[styles.verificationInput, error && styles.errorInput]}
            value={username}
            placeholder="Enter your username"
            placeholderTextColor="#9A8478"
            onChangeText={(username) => setUsername(username)}
            autoCapitalize="none"
            autoFocus
          />

          <TouchableOpacity
            onPress={onUsernameSubmit}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Completing..." : "Complete Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // Verification screen
  if (pendingVerification) {
    return (
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
      >
        <View style={styles.verificationContainer}>
          <Image
            source={require("../../assets/images/revenue-i2.png")}
            style={styles.illustration}
          />

          <Text style={styles.verificationTitle}>Verify your email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to {emailAddress}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => setError("")}>
                <Ionicons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          ) : null}

          <TextInput
            style={[styles.verificationInput, error && styles.errorInput]}
            value={code}
            placeholder="Enter your verification code"
            placeholderTextColor="#9A8478"
            onChangeText={(code) => setCode(code)}
            keyboardType="number-pad"
            autoCapitalize="none"
            maxLength={6}
            autoFocus
          />

          <TouchableOpacity
            onPress={onVerifyPress}
            style={[styles.button, loading && styles.buttonDisabled]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Verifying..." : "Verify Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onResendPress}
            style={styles.secondaryButton}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>
              Resend verification code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPendingVerification(false)}
            style={styles.backButton}
          >
            <Text style={styles.linkText}>Back to sign up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  // Initial sign-up screen
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
    >
      <View style={styles.container}>
        <View style={styles.imagebox}>
          <Image
            source={require("../../assets/images/revenue-i2.png")}
            style={[styles.illustration]}
          />
        </View>

        <Text style={styles.title}>Create Account</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          value={emailAddress}
          placeholderTextColor="#9A8478"
          placeholder="Enter email"
          onChangeText={(email) => setEmailAddress(email)}
          keyboardType="email-address"
        />

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={password}
          placeholder="Enter password (min. 8 characters)"
          placeholderTextColor="#9A8478"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          value={username}
          placeholderTextColor="#9A8478"
          placeholder="Username (optional)"
          onChangeText={(username) => setUsername(username)}
        />

        <Text style={styles.passwordHint}>
          Password must be at least 8 characters long
        </Text>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onSignUpPress}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating Account..." : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
