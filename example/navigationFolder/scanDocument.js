import React, { Component } from 'react'
import { SafeAreaView, StyleSheet, View, Button, Text, Image, ScrollView, NativeEventEmitter, Platform, TouchableOpacity } from 'react-native'
import DocumentReader, { Enum, DocumentReaderCompletion, DocumentReaderScenario, RNRegulaDocumentReader } from '@regulaforensics/react-native-document-reader-api'
import * as RNFS from 'react-native-fs'
import RadioGroup from 'react-native-radio-buttons-group'
import ImagePicker from 'react-native-customized-image-picker'
import * as Progress from 'react-native-progress'
import CheckBox from 'react-native-check-box' 
//
import {  Divider, Layout, Icon,  TopNavigation, TopNavigationAction } from '@ui-kitten/components';

const eventManager = new NativeEventEmitter(RNRegulaDocumentReader)

var licPath = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/regula.license") : "regula.license"
var certDir = Platform.OS === 'ios' ? (RNFS.MainBundlePath + "/certificates") : "certificates"
var readDir = Platform.OS === 'ios' ? RNFS.readDir : RNFS.readDirAssets
var readFile = Platform.OS === 'ios' ? RNFS.readFile : RNFS.readFileAssets

async function addCertificates() {
  var certificates = []
  var items = await readDir(certDir, 'base64')

  for (var i in items) {
    var item = items[i]
    if (item.isFile()) {
      var findExt = item.name.split('.')
      var pkdResourceType = 0
      if (findExt.length > 0)
        pkdResourceType = Enum.PKDResourceType.getType(findExt[findExt.length - 1].toLowerCase())

      var file = await readFile(item.path, 'base64')
      certificates.push({
        'binaryData': file,
        'resourceType': pkdResourceType 
      })
    }
  }
  DocumentReader.addPKDCertificates(certificates, s => {
    console.log("certificates added")
  }, e => console.log(e))
} 



export default class Scanning extends Component {   
  constructor(props) { 
    super(props)   
    //
    const navigateBack = () => {
      props.navigation.goBack();
    };
    const BackIcon = (props) => (
      <Icon {...props} name='arrow-back'  /> 
    );
    
    //
    eventManager.addListener('prepareDatabaseProgressChangeEvent', e => this.setState({ fullName: "Downloading database: " + e["msg"] + "%" }))
    eventManager.addListener('completionEvent', e => this.handleCompletion(DocumentReaderCompletion.fromJson(JSON.parse(e["msg"]))))
    DocumentReader.prepareDatabase("Full", (respond) => {
      console.log(respond)
      readFile(licPath, 'base64').then((res) => {
        this.setState({ fullName: "Initializing..."})
        DocumentReader.initializeReader(res, (respond) => {
          console.log(respond)
          DocumentReader.isRFIDAvailableForUse((canRfid) => { 
            if (canRfid) {
              this.setState({ canRfid: true, rfidUIHeader: "Reading RFID", rfidDescription: "Place your phone on top of the NFC tag", rfidUIHeaderColor: "black" })
              this.setState({ canRfidTitle: '' })
            }
          }, error => console.log(error))
          DocumentReader.getAvailableScenarios((jstring) => {
            var scenariosTemp = JSON.parse(jstring)
            var scenariosL = []
            for (var i in scenariosTemp) {
              scenariosL.push({
                label: DocumentReaderScenario.fromJson(typeof scenariosTemp[i] === "string" ? JSON.parse(scenariosTemp[i]) : scenariosTemp[i]).name,
                value: i
              })
            } 
            this.setState({ scenarios: scenariosL })
            this.setState({ selectedScenario: this.state.scenarios[0]['label'] })
            this.setState({ radio: null })
            this.setState({
              radio: <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={this.state.scenarios} onPress={(data) => {
                var selectedItem
                for (var index in data)
                  if (data[index]['selected'])
                    selectedItem = data[index]['label']
                this.setState({ selectedScenario: selectedItem })
              }} />
            })
            DocumentReader.getDocumentReaderIsReady((isReady) => {
              if (isReady) {
                this.setState({ fullName: "Ready to Scan Passport" })
                //addCertificates()
               
              } else
                this.setState({ fullName: "Failed" })
            }, error => console.log(error))
          }, error => console.log(error))
        }, error => console.log(error))
      })
    }, error => console.log(error))

    this.state = { 
      BackAction: ()=> <TopNavigation icon={BackIcon}  onPress={navigateBack} />,
      navigateDetails: ()=> {props.navigation.navigate('Details', {fullName: this.state.name, pan: this.state.pan, dob: this.state.dob, nationality: this.state.nationality, issue_date: this.state.issue_date,
        expiry_date: this.state.expiry_date, dept: this.state.dept,                  
       });},
      fullName: "Please wait...",
      name: '',
      pan: '',
      dob: '',
      docType: '',
      nationality: '',
      dept: '',
      issue_date: '',
      expiry_date: '',
      doRfid: false,
      canRfid: true,
      canRfidTitle: '(available)',
      scenarios: [],
      selectedScenario: "",
      portrait: require('../images/portrait.png'),
      docFront: require('../images/id.png'),
      isReadingRfid: false,
      rfidUIHeaderColor: 'black',
      rfidUIHeader: 'Reading RFID',
      rfidDescription: "Place your phone on top of the NFC tag", 
      radio: <RadioGroup style={{ alignSelf: 'stretch' }} radioButtons={[{ label: 'Loading', value: 0 }]} onPress={null} />
    }
  }

  handleCompletion(completion) {
    if (this.state.isReadingRfid && (completion.action === Enum.DocReaderAction.CANCEL || completion.action === Enum.DocReaderAction.ERROR))
      this.hideRfidUI()
    if (this.state.isReadingRfid && completion.action === Enum.DocReaderAction.NOTIFICATION)
      this.updateRfidUI(completion.results.documentReaderNotification)
    if (completion.action === Enum.DocReaderAction.COMPLETE)
      if (this.state.isReadingRfid)
        if (completion.results.rfidResult !== 1)
          this.restartRfidUI()
        else {
          this.hideRfidUI()
          this.displayResults(completion.results)
        }
      else
        this.handleResults(completion.results)
  }

  showRfidUI() {
    // show animation
    this.setState({ isReadingRfid: true })
  }

  hideRfidUI() {
    // show animation
    this.restartRfidUI()
    this.setState({ isReadingRfid: false, rfidUIHeader: "Reading RFID", rfidUIHeaderColor: "black" })
  }

  restartRfidUI() {
    this.setState({ rfidUIHeaderColor: "red", rfidUIHeader: "Failed!", rfidDescription: "Place your phone on top of the NFC tag", rfidProgress: -1 })
  }

  updateRfidUI(results) {
    if (results.code === Enum.eRFID_NotificationAndErrorCodes.RFID_NOTIFICATION_PCSC_READING_DATAGROUP)
      this.setState({ rfidDescription: Enum.eRFID_DataFile_Type.getTranslation(results.number) })
    this.setState({ rfidUIHeader: "Reading RFID", rfidUIHeaderColor: "black", rfidProgress: results.value / 100 })
    if (Platform.OS === 'ios')
      DocumentReader.setRfidSessionStatus(this.state.rfidDescription + "\n" + results.value + "%", e => { }, e => { })
  }

  clearResults() {
    this.setState({ fullName: "Ready", docFront: require('../images/id.png'), portrait: require('../images/portrait.png') })
  }

  displayResults(results) {
    this.setState({ fullName: 'Passport Scanned',
                    name: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_SURNAME_AND_GIVEN_NAMES }), 
                    pan: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DOCUMENT_NUMBER }),
                    dob: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DATE_OF_BIRTH }),
                    docType: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DS_CERTIFICATE_ISSUER }),
                    nationality:  results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_ADDRESS_COUNTRY }), 
                    issue_date: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DATE_OF_ISSUE }),
                    expiry_date: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DATE_OF_EXPIRY }),
                    dept: results.getTextFieldValueByType({ fieldType: Enum.eVisualFieldType.FT_DEPARTMENT }),


           })
    if (results.getGraphicFieldImageByType({ fieldType: Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE }) != null)
      this.setState({ docFront: { uri: "data:image/png;base64," + results.getGraphicFieldImageByType({ fieldType: Enum.eGraphicFieldType.GF_DOCUMENT_IMAGE }) } })
    if (results.getGraphicFieldImageByType({ fieldType: Enum.eGraphicFieldType.GF_PORTRAIT }) != null)
      this.setState({ portrait: { uri: "data:image/png;base64," + results.getGraphicFieldImageByType({ fieldType: Enum.eGraphicFieldType.GF_PORTRAIT }) } })
  }

  customRFID() {
    this.showRfidUI()
    DocumentReader.readRFID(e => { }, e => { })
  }

  usualRFID() {
    this.setState({ doRfid: false })
    DocumentReader.startRFIDReader(e => { }, e => { })
  }

  handleResults(results) {
    if (this.state.doRfid && results != null && results.chipPage != 0) {
      accessKey = null
      accessKey = results.getTextFieldValueByType(Enum.eVisualFieldType.FT_MRZ_STRINGS)
      if (accessKey != null && accessKey != "") {
        accessKey = accessKey.replace(/^/g, '').replace(/\n/g, '')
        DocumentReader.setRfidScenario({
          mrz: accessKey,
          pacePasswordType: Enum.eRFID_Password_Type.PPT_MRZ,
        }, e => { }, error => console.log(error))
      } else {
        accessKey = null
        accessKey = results.getTextFieldValueByType(159)
        if (accessKey != null && accessKey != "") {
          DocumentReader.setRfidScenario({
            password: accessKey,
            pacePasswordType: Enum.eRFID_Password_Type.PPT_CAN,
          }, e => { }, error => console.log(error))
        }
      }
      // this.customRFID()
      this.usualRFID()
    } else
      this.displayResults(results)
  }


  // <TopNavigation title='Detail' alignment='center' accessoryLeft={this.state.BackAction} />
 
  render() {
    return ( 
      <SafeAreaView style={{ flex: 1 ,  }}> 
         <TopNavigation title='Document Scanner' alignment='center' />
        <Divider/> 
        <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <View style={styles.container}>
       
        {!this.state.isReadingRfid && <View style={styles.container}> 
          <View style={{  
           width: '100%',
           height: 50,
           justifyContent: 'center',
           alignItems: 'center', 
           backgroundColor: '#d2a679',
          }}> 

           <Text style={{ fontSize: 20,}}> {this.state.fullName} </Text>
           

          </View>
          <View style={{ flexDirection: "row", padding: 5 }}>
            <View style={{ flexDirection: "column", alignItems: "center" }}>
              <Text style={{
                top: 1,
                right: 1,
                padding: 5,
              }}>
                Portrait
        </Text>
              <Image
                style={{
                  height: 150,
                  width: 150,
                }}
                source={this.state.portrait}
                resizeMode="contain"
              />
            </View>
            <View style={{ flexDirection: "column", alignItems: "center", padding: 5 }}>
              <Text style={{
                top: 1,
                right: 1,
                padding: 5,
              }}>
                Document image
        </Text>
              <Image
                style={{
                  height: 150,
                  width: 200,
                }}
                source={this.state.docFront}
                resizeMode="contain"
              />
            </View>
          </View>
          
          
          <ScrollView >
            {this.state.radio}
          </ScrollView>
          
         

          <View style={{ flexDirection: 'row', marginVertical: 15,  }}>
            <Button color="#d2a679"
              onPress={() => {
                this.clearResults()
                DocumentReader.setConfig({
                  functionality: {
                    videoCaptureMotionControl: true,
                    showCaptureButton: true
                  },
                  customization: {
                    showResultStatusMessages: true,
                    showStatusMessages: true
                  },
                  processParams: {
                    scenario: this.state.selectedScenario,
                    doRfid: this.state.doRfid,
                  },
                }, e => { }, error => console.log(error))

                DocumentReader.showScanner(s => { }, e => console.log(e))
              }}
              title="Scan document"
            />
            <Text style={{ padding: 5 }}></Text>
            
            <Button color="#d2a679"
              onPress={() => {
                this.clearResults()
                this.setState({ fullName: "COPYING IMAGE..." })
                ImagePicker.openPicker({
                  multiple: true,
                  includeBase64: true
                }).then(response => {
                  DocumentReader.setConfig({
                    functionality: {
                      videoCaptureMotionControl: true,
                      showCaptureButton: true
                    },
                    customization: {
                      showResultStatusMessages: true,
                      showStatusMessages: true
                    },
                    processParams: {
                      scenario: this.state.selectedScenario,
                      doRfid: this.state.doRfid,
                    },
                  }, e => { }, error => console.log(error))

                  var images = []

                  for (var i = 0; i < response.length; i++) {
                    images.push(response[i].data)
                  }
                  this.setState({ fullName: "PROCESSING..." , pan: '', dob: '',  })
                  DocumentReader.recognizeImages(images, s => { }, e => console.log(e))
                }).catch(e => {
                  console.log("ImagePicker: " + e)
                })
              }}
              title="     Scan image     "
            />
          </View>
        </View>
        }
      </View>
      </Layout> 
      <Button onPress={this.state.navigateDetails} title="Scanned Document Details" color='#bf8040' />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  cancelButton: {
    position: 'absolute',
    bottom: 0,
    right: 20
  }
});