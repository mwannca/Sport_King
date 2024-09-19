import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import BetSlipSingle from '../components/BetSlipSingle';
import { moderateScale } from 'react-native-size-matters';
import { useLazyQuery } from '@apollo/client';
import { GET_BET } from '../graph-operations';
import { useSelector, useDispatch } from 'react-redux';
import { NavigationContext } from '../context';
import NetInfo from '@react-native-community/netinfo';
import InAppReview from 'react-native-in-app-review';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistAppReviewLastTime } from '../redux/features/userSlice';
import moment from 'moment';

const Tab = createMaterialTopTabNavigator();

const ActiveBet = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [betData, setBetData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const dispatch = useDispatch();

  const [getBet, { loading }] = useLazyQuery(GET_BET, {
    fetchPolicy: 'no-cache',
    variables: {
      jsWebToken: user.jsWebToken,
      pending: true,
    },
    onCompleted(data) {
      setBetData(data.getBet);
    },
  });

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      getBet();

      const showInAppReview = async () => {
        const totalBetCount = await AsyncStorage.getItem('totalBetCount');
        const appReviewLastTime = await AsyncStorage.getItem('appReviewLastTime');

        if (totalBetCount > 5) {
          if (!appReviewLastTime) {
            InAppReview.RequestInAppReview()
              .then((hasFlowFinishedSuccessfully) => {
                if (hasFlowFinishedSuccessfully) {
                  dispatch(persistAppReviewLastTime({ appReviewLastTime: moment().toString() }));
                }
              })
              .catch((error) => console.log(error));
          } else {
            if (moment().diff(moment(appReviewLastTime), 'days') >= 10) {
              InAppReview.RequestInAppReview()
                .then((hasFlowFinishedSuccessfully) => {
                  if (hasFlowFinishedSuccessfully) {
                    dispatch(persistAppReviewLastTime({ appReviewLastTime: moment().toString() }));
                  }
                })
                .catch((error) => console.log(error));
            }
          }
        }
      };

      showInAppReview();
    }, [dispatch, getBet])
  );

  const renderCards = ({ item }) => (
    <BetSlipSingle item={item} />
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (betData.length <= 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noDataText}>No pending games.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={betData}
        keyExtractor={(items) => items.id.toString()}
        renderItem={renderCards}
      />
    </View>
  );
};

const EndedBet = ({ navigation }) => {
  const user = useSelector(state => state.user);
  const [betData, setBetData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const [getBet, { loading }] = useLazyQuery(GET_BET, {
    fetchPolicy: 'no-cache',
    variables: {
      jsWebToken: user.jsWebToken,
      pending: false,
    },
    onCompleted(data) {
      setBetData(data.getBet);
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getBet();
    });

    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
      unsubscribeNetInfo();
    };
  }, [navigation, getBet]);

  const renderCards = ({ item }) => (
    <BetSlipSingle eventIsOver item={item} />
  );

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (betData.length <= 0) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.noDataText}>No Games.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={betData}
        keyExtractor={(items) => items.id.toString()}
        renderItem={renderCards}
      />
    </View>
  );
};

const BetScreen = ({ navigation }) => {
  return (
    <View style={styles.backgroundColor}>
      <NavigationContext.Provider value={navigation}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: '#fff',
            tabBarStyle: { backgroundColor: '#140A35' },
          }}
        >
          <Tab.Screen name="Pending" component={ActiveBet} />
          <Tab.Screen name="Completed" component={EndedBet} />
        </Tab.Navigator>
      </NavigationContext.Provider>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C0C4F',
    padding: moderateScale(10),
  },
  backgroundColor: {
    flex: 1,
    backgroundColor: '#1C0C4F',
  },
  centeredContainer: {
    backgroundColor: '#1C0C4F',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#fff',
    fontSize: moderateScale(16),
    textAlign: 'center',
  },
});

export default BetScreen;
