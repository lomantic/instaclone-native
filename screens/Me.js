import React, { useEffect } from "react";
import { Text, View } from "react-native";
import AuthButton from "../components/auth/AuthButton";
import { logUserOut } from "../apollo";
import useMe from "../hooks/useMe";

export default function Me({ navigation }) {
  const { data } = useMe();
  //console.log(data?.me?.username);
  useEffect(() => {
    navigation.setOptions({
      title: data?.me?.username,
    });
  }, [data]);
  return (
    <View
      style={{
        backgroundColor: "black",
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AuthButton text="Logout" onPress={() => logUserOut()} />
    </View>
  );
}
