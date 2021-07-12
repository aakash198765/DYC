import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import   Scanning   from './scanDocument';
import { DocumentDetails } from './documentDetails';

const { Navigator, Screen } = createStackNavigator();

const HomeNavigator = () => (
  <Navigator headerMode='none' >
    <Screen name='Scan' component={Scanning}  /> 
    <Screen name='Details' component={DocumentDetails}  />
  </Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer>
    <HomeNavigator/>
  </NavigationContainer>
); 