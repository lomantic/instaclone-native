import {
  ApolloClient,
  createHttpLink,
  split,
  InMemoryCache,
  makeVar,
} from "@apollo/client";
import {
  getMainDefinition,
  offsetLimitPagination,
} from "@apollo/client/utilities";
import { setContext } from "@apollo/client/link/context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onError } from "@apollo/client/link/error";
import { createUploadLink } from "apollo-upload-client";
import { WebSocketLink } from "@apollo/client/link/ws";

export const isLoggedInVar = makeVar(false);
export const tokenVar = makeVar("");
const TOKEN = "token";

export const logUserIn = async (token) => {
  await AsyncStorage.setItem(TOKEN, token);
  isLoggedInVar(true);
  tokenVar(token);
};
export const logUserOut = async () => {
  await AsyncStorage.removeItem(TOKEN);
  isLoggedInVar(false);
  tokenVar(null);
};

const uploadHttpLink = createUploadLink({
  uri: "https://fcd4-211-197-51-108.jp.ngrok.io/graphql",
});

const wsLink = new WebSocketLink({
  uri: "ws://fcd4-211-197-51-108.jp.ngrok.io/graphql",
  options: {
    //reconnect: true,
    connectionParams: () => ({
      authorization: tokenVar(),
    }),
  },
});

const authLink = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      authorization: tokenVar(),
    },
  };
});
const onErrorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    console.log(`GraphQL Error`, graphQLErrors);
  }
  if (networkError) {
    console.log("Network Error", networkError);
  }
});

export const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        seeFeed: offsetLimitPagination(),
      },
    },
  },
});

const httpLinks = authLink.concat(onErrorLink).concat(uploadHttpLink);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLinks
);

const client = new ApolloClient({
  link: splitLink,
  cache,
});

export default client;
