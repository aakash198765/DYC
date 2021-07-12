/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the UI Kitten navigation
 * https://github.com/akveo/react-native-ui-kitten
 *
 * Documentation: https://akveo.github.io/react-native-ui-kitten/docs
 *
 * @format
 */

 import React from 'react';
 import { ApplicationProvider , IconRegistry } from '@ui-kitten/components';
 import { EvaIconsPack } from '@ui-kitten/eva-icons';
 
 import * as eva from '@eva-design/eva';
 import { AppNavigator} from './navigationFolder/navigation';
 /**
  * Use any valid `name` property from eva icons (e.g `github`, or `heart-outline`)
  * https://akveo.github.io/eva-icons
  */
 
 
 export default () => {
 
   return (
     <React.Fragment>
         <IconRegistry icons={EvaIconsPack}/> 
         <ApplicationProvider {...eva} theme={eva.light} > 
           <AppNavigator/> 
         </ApplicationProvider>
     </React.Fragment>
   );
 };