import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import React from 'react';

import { ListingListScreen } from '../screens/visitor/ListingListScreen';
import { ListingDetailScreen } from '../screens/visitor/ListingDetailScreen';
import { LoginScreen } from '../screens/consultant/LoginScreen';
import { MyListingsScreen } from '../screens/consultant/MyListingsScreen';
import { CreateListingScreen } from '../screens/consultant/CreateListingScreen';
import { EditListingScreen } from '../screens/consultant/EditListingScreen';
import { SubmitConfirmScreen } from '../screens/consultant/SubmitConfirmScreen';
import { useAuth } from '../auth/AuthContext';

// ─── Param Lists ──────────────────────────────────────────────────────────────

export type ListingsStackParamList = {
  ListingList: undefined;
  ListingDetail: { listingId: string };
};

export type ConsultantStackParamList = {
  Login: undefined;
  MyListings: undefined;
  CreateListing: undefined;
  EditListing: { listingId: string };
  SubmitConfirm: { listingId: string };
};

export type MainTabParamList = {
  ListingsTab: undefined;
  ConsultantTab: undefined;
};

// ─── Navigators ───────────────────────────────────────────────────────────────

const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();
const ConsultantStack = createNativeStackNavigator<ConsultantStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function ListingsNavigator() {
  return (
    <ListingsStack.Navigator>
      <ListingsStack.Screen
        name="ListingList"
        component={ListingListScreen}
        options={{ title: 'Properties' }}
      />
      <ListingsStack.Screen
        name="ListingDetail"
        component={ListingDetailScreen}
        options={{ title: 'Property Detail' }}
      />
    </ListingsStack.Navigator>
  );
}

function ConsultantNavigator() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <ConsultantStack.Navigator>
        <ConsultantStack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Consultant Login', headerShown: false }}
        />
      </ConsultantStack.Navigator>
    );
  }

  return (
    <ConsultantStack.Navigator>
      <ConsultantStack.Screen
        name="MyListings"
        component={MyListingsScreen}
        options={{ title: 'My Listings' }}
      />
      <ConsultantStack.Screen
        name="CreateListing"
        component={CreateListingScreen}
        options={{ title: 'New Listing' }}
      />
      <ConsultantStack.Screen
        name="EditListing"
        component={EditListingScreen}
        options={{ title: 'Edit Listing' }}
      />
      <ConsultantStack.Screen
        name="SubmitConfirm"
        component={SubmitConfirmScreen}
        options={{ title: 'Confirm & Submit' }}
      />
    </ConsultantStack.Navigator>
  );
}

export function RootNavigator() {
  return (
    <NavigationContainer>
      <MainTab.Navigator
        screenOptions={{ headerShown: false }}
      >
        <MainTab.Screen
          name="ListingsTab"
          component={ListingsNavigator}
          options={{
            tabBarLabel: 'Properties',
            tabBarIcon: () => <Text>🏠</Text>,
          }}
        />
        <MainTab.Screen
          name="ConsultantTab"
          component={ConsultantNavigator}
          options={{
            tabBarLabel: 'My Account',
            tabBarIcon: () => <Text>👤</Text>,
          }}
        />
      </MainTab.Navigator>
    </NavigationContainer>
  );
}
