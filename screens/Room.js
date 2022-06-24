import {
  gql,
  useApolloClient,
  useMutation,
  useQuery,
  useSubscription,
} from "@apollo/client";
import React, { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView } from "react-native";
import ScreenLayout from "../components/ScreenLayout";
import styled from "styled-components/native";
import { useForm } from "react-hook-form";
import useMe from "../hooks/useMe";
import { Ionicons } from "@expo/vector-icons";

const ROOM_UPDATES = gql`
  subscription roomUpdates($id: Int!) {
    roomUpdates(id: $id) {
      id
      payload
      user {
        username
        avatar
      }
      read
    }
  }
`;

const SEND_MESSAGE_MUTATION = gql`
  mutation sendMessage($payload: String!, $roomId: Int, $userId: Int) {
    sendMessage(payload: $payload, roomId: $roomId, userId: $userId) {
      ok
      id
    }
  }
`;

const ROOM_QUERY = gql`
  query seeRoom($id: Int!) {
    seeRoom(id: $id) {
      id
      messages {
        id
        payload
        user {
          username
          avatar
        }
        read
      }
    }
  }
`;

const MessageContainer = styled.View`
  padding: 5px 10px;
  flex-direction: ${(props) => (props.outGoing ? "row-reverse" : "row")};
  align-items: flex-end;
`;
const Author = styled.View``;
const Avatar = styled.Image`
  width: 20px;
  height: 20px;
  border-radius: 10px;
`;
const SendButton = styled.TouchableOpacity``;
const InputContainer = styled.View`
  width: 95%;
  margin-bottom: 50px;
  margin-top: 25px;
  flex-direction: row;
  align-items: center;
`;

const Message = styled.Text`
  color: white;
  background-color: rgba(255, 255, 255, 0.3);
  padding: 5px 10px;
  overflow: hidden;
  border-radius: 10px;
  font-size: 16px;
  margin: 0px 10px;
`;
const TextInput = styled.TextInput`
  width: 90%;
  margin-right: 10px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  padding: 10px 20px;
  border-radius: 1000px;
  color: white;
`;

export default function Room({ navigation, route }) {
  const { data: meData } = useMe();
  const { register, setValue, handleSubmit, getValues, watch } = useForm();
  const updateSendMessage = (cache, result) => {
    const {
      data: {
        sendMessage: { ok, id },
      },
    } = result;
    if (ok && meData) {
      const { message } = getValues();
      setValue("message", "");
      const messageObj = {
        id,
        payload: message,
        user: {
          username: meData.me.username,
          avatar: meData.me.avatar,
        },
        read: true,
        __typename: "Message",
      };
      //console.log(messageObj);
      const messageFragment = cache.writeFragment({
        fragment: gql`
          fragment NewMessage on Message {
            id
            payload
            user {
              username
              avatar
            }
            read
          }
        `,
        data: messageObj,
      });
      cache.modify({
        id: `Room:${route.params.id}`,
        fields: {
          messages(prev) {
            return [...prev, messageFragment];
          },
        },
      });
    }
  };
  const [sendMessageMutation, { loading: sendingMessage }] = useMutation(
    SEND_MESSAGE_MUTATION,
    {
      update: updateSendMessage,
    }
  );

  const { data, loading, subscribeToMore } = useQuery(ROOM_QUERY, {
    variables: {
      id: route?.params?.id,
    },
  });

  const client = useApolloClient();

  const updateQuery = (prevQuery, options) => {
    //console.log(options);
    const {
      subscriptionData: {
        data: { roomUpdates: message },
      },
    } = options;
    if (message.id) {
      const incomingMessage = client.cache.writeFragment({
        fragment: gql`
          fragment NewMessage on Message {
            id
            payload
            user {
              username
              avatar
            }
            read
          }
        `,
        data: message,
      });
      client.cache.modify({
        id: `Room:${route.params.id}`,
        fields: {
          messages(prev) {
            console.log(prev);
            console.log("~~~~~~~~~~~~~~~~~~~~~");
            console.log(incomingMessage);
            const existingMessage = prev.find(
              (aMessage) => aMessage.__ref === incomingMessage.__ref
            );
            console.log("result :" + existingMessage);
            if (existingMessage !== undefined) {
              return prev;
            } else {
              return [...prev, incomingMessage];
            }
          },
        },
      });
    }
  };

  const [subscribed, setSubscribed] = useState(false);
  useEffect(() => {
    if (data?.seeRoom) {
      subscribeToMore({
        document: ROOM_UPDATES,
        variables: {
          id: route?.params?.id,
        },
        updateQuery,
      });
      setSubscribed(true);
    }
  }, [data]);

  const onValid = ({ message }) => {
    if (!sendingMessage) {
      sendMessageMutation({
        variables: {
          payload: message,
          roomId: route?.params?.id,
        },
      });
    }
  };
  useEffect(() => {
    register("message", { required: true });
  }, [register]);

  useEffect(() => {
    navigation.setOptions({
      title: `${route?.params?.talkingTo?.username}`,
    });
  }, []);
  const renderItem = ({ item: message }) => (
    <MessageContainer
      outGoing={message.user.username !== route?.params?.talkingTo?.username}
    >
      <Author>
        <Avatar source={{ uri: message.user.avatar }} />
      </Author>
      <Message>{message.payload}</Message>
    </MessageContainer>
  );
  const messages = [...(data?.seeRoom?.messages ?? [])];
  messages.reverse();
  return (
    // <KeyboardAvoidingView
    //   style={{ flex: 1, backgroundColor: "black" }}
    //   behavior="padding"
    //   keyboardVerticalOffset={50}
    // >
    <ScreenLayout loading={loading}>
      <FlatList
        style={{ width: "100%", marginVertical: 10 }}
        inverted
        data={messages}
        showsVerticalScrollIndicator={false}
        keyExtractor={(message) => "" + message.id}
        renderItem={renderItem}
      />
      <InputContainer>
        <TextInput
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          placeholder="Write a message..."
          returnKeyLabel="Send Message"
          returnKeyType="send"
          onChangeText={(text) => setValue("message", text)}
          onSubmitEditing={handleSubmit(onValid)}
          value={watch("message")}
        />
        <SendButton
          onPress={handleSubmit(onValid)}
          disabled={!Boolean(watch("message"))}
        >
          <Ionicons
            name="send"
            color={
              !Boolean(watch("message")) ? "rgba(255, 255, 255, 0.5)" : "white"
            }
            size={22}
          />
        </SendButton>
      </InputContainer>
    </ScreenLayout>
    // </KeyboardAvoidingView>
  );
}
