import React, {useEffect} from 'react';

import {ProviderMnemonicReactNative} from '@haqq/provider-mnemonic-react-native';
import {ProviderMpcReactNative} from '@haqq/provider-mpc-react-native';
import {mnemonicToEntropy} from 'ethers/lib/utils';

import {app} from '@app/contexts';
import {captureException, showModal} from '@app/helpers';
import {getProviderStorage} from '@app/helpers/get-provider-storage';
import {useTypedNavigation, useTypedRoute} from '@app/hooks';
import {I18N, getText} from '@app/i18n';
import {Wallet} from '@app/models/wallet';
import {
  serviceProviderOptions,
  storageLayerOptions,
} from '@app/services/provider-mpc';
import {WalletType} from '@app/types';

export const MpcMigrateStoreScreen = () => {
  const route = useTypedRoute<'mpcMigrateStore'>();
  const navigation = useTypedNavigation();

  useEffect(() => {
    showModal('loading', {text: getText(I18N.mpcStoreWalletSaving)});
  }, []);

  useEffect(() => {
    setTimeout(async () => {
      try {
        const storage = await getProviderStorage();

        const getPassword = app.getPassword.bind(app);

        const mnemonicProvider = new ProviderMnemonicReactNative({
          account: route.params.accountId,
          getPassword,
        });

        const mnemonic = await mnemonicProvider.getMnemonicPhrase();
        let entropy = mnemonicToEntropy(mnemonic);

        if (entropy.startsWith('0x')) {
          entropy = entropy.slice(2);
        }

        entropy = entropy.padStart(64, '0');

        const provider = await ProviderMpcReactNative.initialize(
          route.params.privateKey,
          null,
          null,
          entropy,
          app.getPassword.bind(app),
          storage,
          serviceProviderOptions as any,
          storageLayerOptions,
          {},
        );

        const wallets = Wallet.getAll();

        for (const wallet of wallets) {
          if (
            wallet.accountId === route.params.accountId &&
            wallet.type === WalletType.mnemonic
          ) {
            wallet.update({
              type: WalletType.mpc,
              accountId: provider.getIdentifier(),
            });
          }
        }

        navigation.navigate('mpcMigrateFinish');
      } catch (e) {
        if (e instanceof Error) {
          showModal('error-create-account');
          captureException(e, 'mpcStore');
          navigation.getParent()?.goBack();
        }
      }
    }, 350);
  }, [navigation, route.params.accountId, route.params.privateKey]);

  return <></>;
};