import React from 'react';
import { PlaceholderScreen, NavButton } from '../components/ui/PlaceholderScreen';
import { AppScreenProps } from '../navigation/types';

export function SearchScreen({ navigation }: AppScreenProps<'Search'>) {
  return (
    <PlaceholderScreen title="Search">
      <NavButton label="Open a result" onPress={() => navigation.navigate('GameDetails', { gameId: 10 })} />
    </PlaceholderScreen>
  );
}