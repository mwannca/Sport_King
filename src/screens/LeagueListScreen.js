import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLazyQuery } from '@apollo/client';
import { LEAGUES } from '../graph-operations';
import EventListSingle from '../components/EventListSingle';
import { useSelector } from 'react-redux';
import analytics from '@react-native-firebase/analytics';
import { moderateScale } from 'react-native-size-matters';

const LeagueListScreen = ({ route, navigation }) => {
  const [leaguesList, setLeaguesList] = useState([]);
  const { sport, liveScore } = route.params;
  const user = useSelector(state => state.user);

  const [getLeagues, { loading }] = useLazyQuery(LEAGUES, {
    fetchPolicy: 'no-cache',
    pollInterval: 200000,
    variables: {
      jsWebToken: user.jsWebToken, // Directly use the token from Redux store
      sport,
    },
    onCompleted(data) {
      setLeaguesList(data.leagues);
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      getLeagues();
    });

    return () => {
      unsubscribe();
    };
  }, [navigation, getLeagues]);

  if (loading || !user.jsWebToken) { // Use user.jsWebToken from Redux instead of a local variable
    return (
      <View style={{ backgroundColor: '#1C0C4F', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const handleOnPress = async (item) => {
    if (liveScore) {
      return navigation.navigate('LeagueLive', {});
    }

    await analytics().logEvent('click_on_league', {
      country: item.country,
      leagueName: item.leagueName,
      name: item.name,
    });

    navigation.navigate('GamesList', { matchIDs: item.matchIds, country: item.country, leagueName: item.leagueName, name: item.name, sport });
  };

  const renderLeague = ({ item }) => (
    <EventListSingle
      key={item.leagueId}
      request={false}
      onPress={() => handleOnPress(item)}
      text={`${item.name || item.leagueName}`}
      icon={item.logo ? item.logo.replace('http', 'https') : `https://countryflagsapi.com/png/${item.country}`}
      liveCount={item.scheduledGames}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={leaguesList}
        keyExtractor={(items) => items.leagueId}
        renderItem={renderLeague}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C0C4F',
    padding: moderateScale(5),
  },
});

export default LeagueListScreen;
