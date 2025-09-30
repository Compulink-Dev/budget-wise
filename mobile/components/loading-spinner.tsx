import React, { useEffect, useRef } from "react";
import { Animated, View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const LoadingSpinner = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000, // 1 second per rotation
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <MaterialCommunityIcons name="loading" size={40} color="black" />
      </Animated.View>
      <Text>Loading</Text>
    </View>
  );
};

export default LoadingSpinner;
