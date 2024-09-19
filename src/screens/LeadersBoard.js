import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TopTierLeaderBoards from '../components/TopTierLeaderBoard';
import LeadersBoardsSingle from '../components/LeadersBoardSingle';
import { moderateScale } from 'react-native-size-matters';
import { useSelector } from 'react-redux';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_STANDING, SAVE_LOCATION, SAVE_CONTACTS } from '../graph-operations';
import numeral from 'numeral';
import Geolocation from 'react-native-geolocation-service';
import Contacts from 'react-native-contacts';

const Tab = createMaterialTopTabNavigator();

// Define WeeklyBoards, MonthlyBoards, and AllTimeBoards components
const WeeklyBoards = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [standingData, setStandingData] = useState('');
  const [topStandingData, setTopStandingData] = useState('');

  const [getStanding, { loading }] = useLazyQuery(GET_STANDING, {
    fetchPolicy: 'no-cache',
    pollInterval: 60000,
    variables: {
      jsWebToken: user.jsWebToken,
      orderBy: {
        weekly_count: 'desc',
      },
      take: 500,
    },
    onCompleted(data) {
      setStandingData(data.standing.splice(3));
      setTopStandingData(data.standing.slice(0, 4));
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getStanding();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, getStanding]);

  const renderItems = ({ item, index }) => (
    <LeadersBoardsSingle
      position={index + 4}
      name={item.user_name}
      coins={numeral(item.weekly_count).format('0,0[.]00')}
    />
  );

  if (loading || topStandingData.length <= 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopTierLeaderBoards weekly topData={topStandingData} />
      <FlatList
        data={standingData}
        keyExtractor={(items) => items.id.toString()}
        renderItem={renderItems}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// MonthlyBoards Component
const MonthlyBoards = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [standingData, setStandingData] = useState('');
  const [topStandingData, setTopStandingData] = useState('');

  const [getStanding, { loading }] = useLazyQuery(GET_STANDING, {
    fetchPolicy: 'no-cache',
    pollInterval: 60000,
    variables: {
      jsWebToken: user.jsWebToken,
      orderBy: {
        monthly_count: 'desc',
      },
      take: 500,
    },
    onCompleted(data) {
      setStandingData(data.standing.splice(3));
      setTopStandingData(data.standing.slice(0, 4));
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getStanding();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, getStanding]);

  const renderItems = ({ item, index }) => (
    <LeadersBoardsSingle
      position={index + 4}
      name={item.user_name}
      coins={numeral(item.monthly_count).format('0,0[.]00')}
    />
  );

  if (loading || topStandingData.length <= 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopTierLeaderBoards monthly topData={topStandingData} />
      <FlatList
        data={standingData}
        keyExtractor={(items) => items.id.toString()}
        renderItem={renderItems}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// AllTimeBoards Component
const AllTimeBoards = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [standingData, setStandingData] = useState('');
  const [topStandingData, setTopStandingData] = useState('');

  const [getStanding, { loading }] = useLazyQuery(GET_STANDING, {
    fetchPolicy: 'no-cache',
    pollInterval: 60000,
    variables: {
      jsWebToken: user.jsWebToken,
      orderBy: {
        alltime_count: 'desc',
      },
      take: 500,
    },
    onCompleted(data) {
      setStandingData(data.standing.splice(3));
      setTopStandingData(data.standing.slice(0, 4));
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getStanding();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, getStanding]);

  const renderItems = ({ item, index }) => (
    <LeadersBoardsSingle
      position={index + 4}
      name={item.user_name}
      coins={numeral(item.alltime_count).format('0,0[.]00')}
    />
  );

  if (loading || topStandingData.length <= 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopTierLeaderBoards alltime topData={topStandingData} />
      <FlatList
        data={standingData}
        keyExtractor={(items) => items.id.toString()}
        renderItem={renderItems}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const LeadersBoards = () => {
  const user = useSelector(state => state.user);

  const [saveLocation] = useMutation(SAVE_LOCATION);
  const [saveContacts] = useMutation(SAVE_CONTACTS);

  const getLocation = useCallback(async () => {
    let perm = false;

    if (Platform.OS === 'ios') {
      await Geolocation.requestAuthorization('whenInUse');
      perm = true;
    } else {
      const hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (hasPermission) perm = true;
    }

    if (perm) {
      Geolocation.watchPosition(
        (position) => {
          saveLocation({
            variables: {
              jsWebToken: user.jsWebToken,
              accuracy: position.coords.accuracy.toString(),
              altitude: position.coords.altitude.toString(),
              heading: position.coords.heading.toString(),
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              speed: position.coords.speed.toString(),
            },
          });
        },
        (error) => {
          console.log(error, error.code, error.message);
        },
        { enableHighAccuracy: true, forceRequestLocation: true, showLocationDialog: false }
      );
    }
  }, [user.jsWebToken, saveLocation]);

  const getAllContacts = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Contacts.checkPermission();
        await Contacts.getAll().then((contacts) => {
          saveContacts({
            variables: {
              jsWebToken: user.jsWebToken,
              data: contacts,
            },
          });
        });
      } else {
        const userResponse = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS
        );
        if (PermissionsAndroid.RESULTS.GRANTED === userResponse) {
          await Contacts.getAll().then((contacts) => {
            saveContacts({
              variables: {
                jsWebToken: user.jsWebToken,
                data: contacts,
              },
            });
          });
        }
      }
    } catch (err) {
      console.log(err);
    }
  }, [user.jsWebToken, saveContacts]);

  useEffect(() => {
    getLocation();
    getAllContacts();
  }, [getLocation, getAllContacts]);

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#140A35' },
        tabBarLabelStyle: { fontSize: moderateScale(11) },
      }}
    >
      <Tab.Screen name="Weekly" component={WeeklyBoards} />
      <Tab.Screen name="Monthly" component={MonthlyBoards} />
      <Tab.Screen name="All-Time" component={AllTimeBoards} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C0C4F',
  },
  loadingContainer: {
    backgroundColor: '#1C0C4F',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: moderateScale(0.5),
    backgroundColor: '#A9B8CC',
    width: '100%',
  },
});

export default LeadersBoards;
