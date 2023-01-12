import {ProviderLedgerReactNative} from '@haqq/provider-ledger-react-native';

import {Wallet} from '@app/models/wallet';
import {TransportHot} from '@app/services/transport-hot';
import {WalletType} from '@app/types';

const cache = new Map();

export function hasProviderInstanceForWallet(wallet: Wallet) {
  return cache.has(wallet.address);
}

export function getProviderInstanceForWallet(wallet: Wallet) {
  if (!hasProviderInstanceForWallet(wallet)) {
    switch (wallet.type) {
      case WalletType.mnemonic:
      case WalletType.hot:
        cache.set(
          wallet.address,
          new TransportHot(wallet.getAccountData(), {
            cosmosPrefix: 'haqq',
          }),
        );
        break;
      case WalletType.ledgerBt:
        cache.set(
          wallet.address,
          new ProviderLedgerReactNative(wallet.getAccountData(), {
            cosmosPrefix: 'haqq',
            deviceId: wallet.deviceId!,
            hdPath: wallet.path ?? '',
          }),
        );
        break;
      default:
        throw new Error('transport_not_implemented');
    }
  }

  return cache.get(wallet.address);
}
