import React from 'react';

import {observer} from 'mobx-react';
import {I18nManager, View} from 'react-native';

import {Color} from '@app/colors';
import {createTheme} from '@app/helpers';
import {Token} from '@app/models/tokens';
import {AddressCosmosHaqq} from '@app/types';
import {STRINGS} from '@app/variables/common';

import {ImageWrapper} from '../image-wrapper';
import {Text, TextVariant} from '../ui';

export enum SwapRoutePathIconsType {
  route,
  path,
}

export type SwapRoutePathIconsProps =
  | {
      type: SwapRoutePathIconsType;
      route: AddressCosmosHaqq[];
    }
  | {
      type: SwapRoutePathIconsType;
      hexPath: string;
    };

function decodeSwapPath(encodedPath: string) {
  // Ensure the path starts with '0x' and remove it
  let path = encodedPath.startsWith('0x') ? encodedPath.slice(2) : encodedPath;

  const addresses = [];

  // The first token address (20 bytes = 40 hex chars)
  addresses.push(`0x${path.slice(0, 40)}`);
  path = path.slice(40);

  // Loop through the path in chunks of 46 characters (6 for fee, 40 for token address)
  while (path.length >= 46) {
    const tokenAddress = `0x${path.slice(6, 46)}`; // Ignore the first 6 chars (fee), take next 40
    addresses.push(tokenAddress);
    path = path.slice(46); // Move to the next chunk
  }

  return addresses;
}

export const SwapRoutePathIcons = observer(
  // @ts-ignore
  ({route, hexPath, type}: SwapRoutePathIconsProps) => {
    const adresses =
      type === SwapRoutePathIconsType.path
        ? decodeSwapPath(hexPath)
        : (route as string[]);

    return (
      <View style={styles.route}>
        {adresses.map((address, i, arr) => {
          const contract = Token.getById(address);
          const isLast = arr.length - 1 === i;

          if (!contract) {
            return null;
          }

          return (
            <React.Fragment key={`swap-route-path-item-${contract.id}`}>
              <ImageWrapper style={styles.routeIcon} source={contract.image} />
              {!isLast && (
                <Text variant={TextVariant.t14} color={Color.graphicSecond3}>
                  {STRINGS.NBSP}
                  {I18nManager.isRTL ? '←' : '→'}
                  {STRINGS.NBSP}
                </Text>
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  },
);

const styles = createTheme({
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIcon: {width: 16, height: 16},
});
