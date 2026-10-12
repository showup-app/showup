import type { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/** Bottom tabs shown when logged in. */
export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Create: undefined;
  Profile: undefined;
};

/** Logged-in stack: the tabs plus screens that push on top of them. */
export type AppStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: NavigatorScreenParams<MainTabParamList>;
  Search: undefined;
  CreatePost: undefined;
  ConfirmPost: { draftId: string };
  GameDetails: { gameId: number };
};

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>;

/** Tab screens can also open the stack screens (Search, GameDetails, ...). */
export type TabScreenProps<T extends keyof MainTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;