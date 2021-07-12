import React, {useState} from 'react';
import { SafeAreaView, View, StyleSheet } from 'react-native';
import { Divider, Icon, Layout, Text, TopNavigation, TopNavigationAction, List , ListItem } from '@ui-kitten/components';

const BackIcon = (props) => (
  <Icon {...props} name='arrow-back' />
);

export const DocumentDetails = ( {route, navigation}) => {

  //extract params
  const {fullName, pan, dob, nationality, issue_date, expiry_date, dept } = route.params;

  const details = [
    {id: 1, field: 'Name', value: fullName },
    {id: 2, field: 'Passport No.   ', value: pan  },
    {id: 3, field: 'DOB   ',  value: dob },
    {id: 4, field: 'Nationality  ',  value: nationality },
    {id: 5, field: 'Department   ',  value: dept }, 
    {id: 6, field: 'Issue Date  ',  value: issue_date},
    {id: 7, field: 'Expiry Date   ',  value: expiry_date }, 
  ]; 



  const navigateBack = () => {
    navigation.goBack();
  };
  const BackAction = () => (
    <TopNavigationAction icon={BackIcon} onPress={navigateBack}/>
  );

  const renderItem = ({ item, index }) => (
    <ListItem title={`${item.field}        ${item.value}`}  />
    
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <TopNavigation title='Scanned Documents Details' alignment='center' accessoryLeft={BackAction} style={{fontWeight: 'bold', }} />
      <Divider/>
      <Layout style={{ flex: 1, padding: 20 , backgroundColor: '#d2a679' }}>  

        <List
         style={styles.container}
         data={details}
         renderItem={renderItem}  
       /> 

      </Layout>
    </SafeAreaView> 
  );
}; 

const styles = StyleSheet.create({

content: {
  flexDirection: 'column',
},
text1: {
  

},
container: {
    fontSize: 30,
    fontFamily: 'bold', 
}

});