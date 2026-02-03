import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

// Root tab navigator param list
export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  MenuTab: NavigatorScreenParams<MenuStackParamList>;
  RewardsTab: NavigatorScreenParams<RewardsStackParamList>;
  LocationsTab: NavigatorScreenParams<LocationsStackParamList>;
  AccountTab: NavigatorScreenParams<AccountStackParamList>;
};

// Auth stack (shown when not logged in)
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Home stack
export type HomeStackParamList = {
  Home: undefined;
  OrderDetail: { orderId: string };
};

// Menu stack
export type MenuStackParamList = {
  Menu: { categoryId?: string };
  MenuItemDetail: { itemId: string };
  Cart: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
};

// Rewards stack
export type RewardsStackParamList = {
  Rewards: undefined;
  RewardDetail: { rewardId: string };
  MyRewards: undefined;
};

// Locations stack
export type LocationsStackParamList = {
  Locations: undefined;
  LocationDetail: { locationId: string };
};

// Account stack
export type AccountStackParamList = {
  Account: undefined;
  Profile: undefined;
  PaymentMethods: undefined;
  AddPaymentMethod: undefined;
  SavedAddresses: undefined;
  AddAddress: undefined;
  GiftCards: undefined;
  AddGiftCard: undefined;
  Notifications: undefined;
  Preferences: undefined;
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
  HelpSupport: undefined;
  Admin: undefined;
};

// Screen props types
export type AuthScreenProps<T extends keyof AuthStackParamList> = 
  NativeStackScreenProps<AuthStackParamList, T>;

export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;
export type HomeOrderDetailScreenProps = NativeStackScreenProps<HomeStackParamList, 'OrderDetail'>;

export type MenuScreenProps = NativeStackScreenProps<MenuStackParamList, 'Menu'>;
export type MenuItemDetailScreenProps = NativeStackScreenProps<MenuStackParamList, 'MenuItemDetail'>;
export type CartScreenProps = NativeStackScreenProps<MenuStackParamList, 'Cart'>;
export type CheckoutScreenProps = NativeStackScreenProps<MenuStackParamList, 'Checkout'>;
export type OrderConfirmationScreenProps = NativeStackScreenProps<MenuStackParamList, 'OrderConfirmation'>;

export type RewardsScreenProps = NativeStackScreenProps<RewardsStackParamList, 'Rewards'>;
export type RewardDetailScreenProps = NativeStackScreenProps<RewardsStackParamList, 'RewardDetail'>;
export type MyRewardsScreenProps = NativeStackScreenProps<RewardsStackParamList, 'MyRewards'>;

export type LocationsScreenProps = NativeStackScreenProps<LocationsStackParamList, 'Locations'>;
export type LocationDetailScreenProps = NativeStackScreenProps<LocationsStackParamList, 'LocationDetail'>;

export type AccountScreenProps = NativeStackScreenProps<AccountStackParamList, 'Account'>;
export type ProfileScreenProps = NativeStackScreenProps<AccountStackParamList, 'Profile'>;
export type PaymentMethodsScreenProps = NativeStackScreenProps<AccountStackParamList, 'PaymentMethods'>;
export type SavedAddressesScreenProps = NativeStackScreenProps<AccountStackParamList, 'SavedAddresses'>;
export type GiftCardsScreenProps = NativeStackScreenProps<AccountStackParamList, 'GiftCards'>;
export type NotificationsScreenProps = NativeStackScreenProps<AccountStackParamList, 'Notifications'>;
export type PreferencesScreenProps = NativeStackScreenProps<AccountStackParamList, 'Preferences'>;
export type OrderHistoryScreenProps = NativeStackScreenProps<AccountStackParamList, 'OrderHistory'>;
export type OrderDetailScreenProps = NativeStackScreenProps<AccountStackParamList, 'OrderDetail'>;
export type HelpSupportScreenProps = NativeStackScreenProps<AccountStackParamList, 'HelpSupport'>;
export type AdminScreenProps = NativeStackScreenProps<AccountStackParamList, 'Admin'>;

// Composite types for tab + stack navigation
export type HomeTabProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'HomeTab'>,
  NativeStackScreenProps<HomeStackParamList>
>;

export type MenuTabProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'MenuTab'>,
  NativeStackScreenProps<MenuStackParamList>
>;

export type RewardsTabProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'RewardsTab'>,
  NativeStackScreenProps<RewardsStackParamList>
>;

export type LocationsTabProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'LocationsTab'>,
  NativeStackScreenProps<LocationsStackParamList>
>;

export type AccountTabProps = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, 'AccountTab'>,
  NativeStackScreenProps<AccountStackParamList>
>;

// Declare global navigation types for useNavigation hook
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootTabParamList {}
  }
}
