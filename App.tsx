import React, { useState, useRef, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Animated, Easing, Platform, Alert, PermissionsAndroid, Linking, Dimensions } from 'react-native';
import styled from 'styled-components/native';
import Sound from 'react-native-sound';
import Images from './assets';
import ViewShot from 'react-native-view-shot';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import RNFS from 'react-native-fs';
import BootSplash from "react-native-bootsplash";

const { width, height } = Dimensions.get('window');
const scale = width / 375; // 375 is a base width for scaling
const scaledSize = (size) => Math.round(size * scale);

const unitID =
  Platform.select({
    ios: 'ca-app-pub-6970795657186211/4183167171',
    android: 'ca-app-pub-6970795657186211/1251781884',
  }) || '';

const adUnitId = __DEV__ ? TestIds.BANNER : unitID;

const ViewCustom = styled.View`
  flexDirection: row;
  position: absolute;
  top: ${(props) => scaledSize(props.topValue)}px;
  left: ${scaledSize(162)}px;
`;

const checkSound = new Sound('paper.mp3', Sound.MAIN_BUNDLE, error => {
  if (error) {
    console.log('Error loading sound: ' + error);
    return;
  }
});

const App = () => {

  useEffect(() => {
    const init = async () => {
      // …do multiple sync or async tasks
    };

    init().finally(async () => {
      await BootSplash.hide({ fade: true });
      console.log("BootSplash has been hidden successfully");
    });
  }, []);

  const [filledRectangles, setFilledRectangles] = useState(Array(45).fill(false));
  const [lottoNumbers, setLottoNumbers] = useState([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const viewShotRef = useRef(null);

  const handleGenerateNumbers = () => {
    const newLottoNumbers = generateLottoNumbers();
    setLottoNumbers(newLottoNumbers);
    fillRectangles(newLottoNumbers);
    checkSound.play();
    startAnimation();
  };

  const generateLottoNumbers = () => {
    const totalNumbers = 45;
    const numbersToPick = 6;
    let numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
    let selectedNumbers = [];

    for (let i = 0; i < numbersToPick; i++) {
      const randomIndex = Math.floor(Math.random() * numbers.length);
      selectedNumbers.push(numbers[randomIndex]);
      numbers.splice(randomIndex, 1);
    }
    console.log("selected numbers : " + selectedNumbers);
    return selectedNumbers.sort((a, b) => a - b);
  };

  const fillRectangles = (resultNumbers) => {
    const updatedRectangles = Array(45).fill(false);

    resultNumbers.forEach(number => {
      updatedRectangles[number - 1] = true;
    });

    setFilledRectangles(updatedRectangles);
  };

  const startAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });
  };

  const requestStoragePermission = async () => {
    if (Platform.OS === 'android') {
      const readPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: "Storage Permission",
          message: "App needs access to storage to save photos",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
  
      if (readPermission === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else if (readPermission === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
          'Storage Permission',
          'Storage permission is needed to save photos. Please enable it in the app settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
          { cancelable: false }
        );
      }
      return false;
    } else {
      const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result === RESULTS.GRANTED) return true;
      const requestResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
      return requestResult === RESULTS.GRANTED;
    }
  };

  const handleCapture = async () => {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Storage permission is required to save the image.');
      return;
    }

    viewShotRef.current.capture().then(uri => {
      console.log("Image saved to", uri);
      if (Platform.OS === 'ios') {
        CameraRoll.save(uri, { type: 'photo' })
          .then(() => {
            Alert.alert('Success', 'Image saved to camera roll');
          })
          .catch(error => {
            console.error(error);
            Alert.alert('Error', 'Failed to save image to camera roll');
          });
      } else {
        const destPath = `${RNFS.ExternalStorageDirectoryPath}/DCIM/Screenshots/Screenshot_${Date.now()}.jpg`;
        RNFS.moveFile(uri, destPath)
          .then(() => Alert.alert('캡쳐 성공', `${destPath} 위치에 저장했습니다.`))
          .then(() => RNFS.scanFile(destPath))
          .catch(error => console.log(error));
      }
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={{ flex: 1 }}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <Image
            source={Images.bgImg}
            style={styles.bgImage}
            resizeMode="cover"
          />

          {[...Array(6)].map((_, rowIndex) => (
            <ViewCustom key={rowIndex} topValue={65 + (44 * rowIndex)}>
              {[...Array(7)].map((_, colIndex) => {
                const index = rowIndex * 7 + colIndex;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.rectangle,
                      { backgroundColor: filledRectangles[index] ? 'black' : 'transparent' },
                    ]}
                  />
                );
              })}
            </ViewCustom>
          ))}

          <ViewCustom key={6} topValue={65 + (44 * 6)}>
            {[...Array(3)].map((_, colIndex) => {
              const index = 6 * 7 + colIndex;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.rectangle,
                    { backgroundColor: filledRectangles[index] ? 'black' : 'transparent' },
                  ]}
                />
              );
            })}
          </ViewCustom>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.customButton}
              onPress={() => {
                handleGenerateNumbers();
                handleCapture();
              }}
            >
              <Text style={styles.buttonText}>로또번호생성</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.admob}>
            <BannerAd
              unitId={adUnitId}
              size={BannerAdSize.FULL_BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: true,
              }}
            />
          </View>

        </Animated.View>
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  bgImage: {
    width: scaledSize(295), // Set the desired width
    height: scaledSize(600), // Set the desired height
    borderWidth: 1,
    borderColor: 'red',
    borderRadius: 5,
  },
  rectangle: {
    width: scaledSize(18),
    height: scaledSize(27),
    marginHorizontal: scaledSize(2),
    marginVertical: scaledSize(10),
    borderWidth: 0,
    borderColor: 'red',
    borderRadius: scaledSize(5), // Add this line to make the corners rounded
  },
  buttonContainer: {
    position: 'absolute',
    bottom: scaledSize(60), // Adjust this value to move the button above the ad
    width: '100%',
    padding: 0,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  customButton: {
    backgroundColor: '#ff5a61',
    width: '100%',
    padding: scaledSize(10),
    borderRadius: scaledSize(0),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: scaledSize(16),
  },
  admob: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: scaledSize(60),
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
