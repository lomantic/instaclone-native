import React, { useRef } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import AuthButton from "../components/auth/AuthButton";
import AuthLayout from "../components/auth/AuthLayout";
import { TextInput } from "../components/auth/AuthShared";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { gql, useMutation } from "@apollo/client";

const CREATE_ACCOUNT_MUTATION = gql`
  mutation createAccount(
    $firstName: String!
    $lastName: String
    $username: String!
    $email: String!
    $password: String!
  ) {
    createAccount(
      firstName: $firstName
      lastName: $lastName
      username: $username
      email: $email
      password: $password
    ) {
      ok
      error
    }
  }
`;

export default function CreateAccount({ navigation }) {
  const { register, handleSubmit, setValue, getValues, watch } = useForm();
  const lastNameRef = useRef();
  const usernameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();

  const onCompleted = (data) => {
    const {
      createAccount: { ok },
    } = data;
    const { username, password } = getValues();
    if (ok) {
      navigation.navigate("Login", {
        username,
        password,
      });
    }
  };
  const [createAccountMutation, { loading }] = useMutation(
    CREATE_ACCOUNT_MUTATION,
    {
      onCompleted,
    }
  );

  const onNext = (nextOne) => {
    nextOne?.current?.focus();
  };
  const onValid = (data) => {
    //console.log(data);
    if (!loading) {
      createAccountMutation({
        variables: {
          ...data,
        },
      });
    }
  };

  useEffect(() => {
    register("firstName", { required: true });
    register("lastName", { required: true });
    register("username", { required: true });
    register("email", { required: true });
    register("password", { required: true });
  }, [register]);
  return (
    <AuthLayout>
      <KeyboardAvoidingView
        style={{
          width: "100%",
        }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 50 : 0}
      >
        <TextInput
          placeholder="First Name"
          returnKeyType="next"
          onSubmitEditing={() => onNext(lastNameRef)}
          placeholderTextColor={"rgba(255, 255, 255, 0.6)"}
          onChangeText={(text) => setValue("firstName", text)}
        />
        <TextInput
          ref={lastNameRef}
          placeholder="Last Name"
          returnKeyType="next"
          onSubmitEditing={() => onNext(usernameRef)}
          placeholderTextColor={"rgba(255, 255, 255, 0.6)"}
          onChangeText={(text) => setValue("lastName", text)}
        />
        <TextInput
          ref={usernameRef}
          placeholder="Username"
          returnKeyType="next"
          autoCapitalize="none"
          onSubmitEditing={() => onNext(emailRef)}
          placeholderTextColor={"rgba(255, 255, 255, 0.6)"}
          onChangeText={(text) => setValue("username", text)}
        />
        <TextInput
          ref={emailRef}
          placeholder="Email"
          keyboardType="email-address"
          returnKeyType="next"
          autoCapitalize="none"
          onSubmitEditing={() => onNext(passwordRef)}
          placeholderTextColor={"rgba(255, 255, 255, 0.6)"}
          onChangeText={(text) => setValue("email", text)}
        />
        <TextInput
          ref={passwordRef}
          placeholder="Password"
          secureTextEntry
          returnKeyType="done"
          onSubmitEditing={onValid}
          lastInput={true}
          placeholderTextColor={"rgba(255, 255, 255, 0.6)"}
          onChangeText={(text) => setValue("password", text)}
          onPress={handleSubmit(onValid)}
        />
        <AuthButton
          text="Create Account"
          loading={loading}
          disabled={
            !watch("username") ||
            !watch("password") ||
            !watch("firstName") ||
            !watch("lastName") ||
            !watch("email")
          }
          onPress={handleSubmit(onValid)}
        />
      </KeyboardAvoidingView>
    </AuthLayout>
  );
}
