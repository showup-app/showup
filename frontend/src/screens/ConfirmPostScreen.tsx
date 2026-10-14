import React from 'react';
import { PlaceholderScreen, NavButton } from '../components/ui/PlaceholderScreen';
import { AppScreenProps } from '../navigation/types';

export function ConfirmPostScreen({ navigation, route }: AppScreenProps<'ConfirmPost'>) {
  return (
    <PlaceholderScreen title={`Confirm post (${route.params.draft.sport} at ${route.params.draft.venue})`}>
      <NavButton label="Post game" onPress={() => navigation.popTo('Tabs', { screen: 'Home' })} />
    </PlaceholderScreen>
  );
}