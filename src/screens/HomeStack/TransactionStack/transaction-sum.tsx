import React, {useCallback, useEffect, useMemo, useState} from 'react';

import {observer} from 'mobx-react';

import {TransactionSum} from '@app/components/transaction-sum';
import {app} from '@app/contexts';
import {showModal} from '@app/helpers';
import {AddressUtils} from '@app/helpers/address-utils';
import {awaitForProvider} from '@app/helpers/await-for-provider';
import {useTypedNavigation, useTypedRoute} from '@app/hooks';
import {useAndroidBackHandler} from '@app/hooks/use-android-back-handler';
import {useEffectAsync} from '@app/hooks/use-effect-async';
import {I18N, getText} from '@app/i18n';
import {Contact} from '@app/models/contact';
import {EstimationVariant} from '@app/models/fee';
import {Provider} from '@app/models/provider';
import {Wallet} from '@app/models/wallet';
import {
  TransactionStackParamList,
  TransactionStackRoutes,
} from '@app/route-types';
import {EthNetwork} from '@app/services';
import {Balance} from '@app/services/balance';
import {HapticEffects, vibrate} from '@app/services/haptic';
import {ModalType} from '@app/types';
import {generateUUID} from '@app/utils';

export const TransactionSumScreen = observer(() => {
  const navigation = useTypedNavigation<TransactionStackParamList>();
  useAndroidBackHandler(() => {
    navigation.goBack();
    return true;
  }, [navigation]);
  const route = useTypedRoute<
    TransactionStackParamList,
    TransactionStackRoutes.TransactionSum
  >();
  const event = useMemo(() => generateUUID(), []);
  const [to, setTo] = useState(route.params.to);
  const wallet = Wallet.getById(route.params.from);
  const balances = Wallet.getBalancesByAddressList([wallet!]);
  const currentBalance = useMemo(
    () => balances[AddressUtils.toEth(route.params.from)],
    [balances, route],
  );
  const [fee, setFee] = useState<Balance | null>(null);
  const contact = useMemo(() => Contact.getById(to), [to]);
  const [isLoading, setLoading] = useState(false);
  const onAddress = useCallback((address: string) => {
    setTo(address);
  }, []);

  const getFee = useCallback(
    async (amount: Balance) => {
      try {
        const token = route.params.token;
        if (token.is_erc20) {
          return await EthNetwork.estimateERC20Transfer(
            {
              from: wallet?.address!,
              to: route.params.to,
              amount,
              contractAddress: AddressUtils.toEth(token.id),
            },
            EstimationVariant.average,
            Provider.getByEthChainId(route.params.token.chain_id),
          );
        } else {
          return await EthNetwork.estimate(
            {
              from: route.params.from,
              to: route.params.to,
              value: amount,
            },
            EstimationVariant.average,
            Provider.getByEthChainId(route.params.token.chain_id),
          );
        }
      } catch (err) {
        Logger.log('tx sum err getFee', err);
        return null;
      }
    },
    [route.params],
  );

  useEffect(() => {
    //@ts-ignore
    navigation.setOptions({titleIcon: route.params.token.image});

    app.on(event, onAddress);

    return () => {
      app.off(event, onAddress);
    };
  }, [event, onAddress]);

  const onPressPreview = useCallback(
    async (amount: Balance, repeated = false) => {
      setLoading(true);
      const estimate = await getFee(amount);

      let successCondition = false;

      if (Provider.getByEthChainId(route.params.token.chain_id)?.isTron) {
        // fee can be zero for TRON if user has enough bandwidth (freezed TRX)
        successCondition = !!estimate?.expectedFee ?? false;
      } else {
        successCondition = estimate?.expectedFee.isPositive() ?? false;
      }

      if (successCondition) {
        navigation.navigate(TransactionStackRoutes.TransactionConfirmation, {
          // @ts-ignore
          calculatedFees: estimate,
          from: route.params.from,
          to,
          amount,
          token: route.params.token,
        });
      } else {
        showModal(ModalType.error, {
          title: getText(I18N.feeCalculatingRpcErrorTitle),
          description: getText(I18N.feeCalculatingRpcErrorDescription),
          close: getText(
            repeated ? I18N.cancel : I18N.feeCalculatingRpcErrorClose,
          ),
          onClose: () => {
            if (!repeated) {
              onPressPreview(amount, true);
            }
          },
        });
      }
      setLoading(false);
    },
    [fee, navigation, route.params.from, to],
  );

  const onContact = useCallback(() => {
    vibrate(HapticEffects.impactLight);
    navigation.navigate(TransactionStackRoutes.TransactionSumAddress, {
      to,
      from: route.params.from,
      event,
    });
  }, [event, navigation, to]);

  const onToken = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const onNetworkPress = useCallback(async () => {
    const providerId = await awaitForProvider({
      initialProviderChainId: route.params.token.chain_id,
      title: I18N.networks,
    });
    Provider.setSelectedProviderId(providerId);
    navigation.goBack();
  }, [navigation]);

  useEffectAsync(async () => {
    const b = Wallet.getBalance(route.params.from, 'available');
    const {expectedFee} = await EthNetwork.estimate(
      {
        from: route.params.from,
        to,
        value: b,
      },
      EstimationVariant.average,
      Provider.getByEthChainId(route.params.token.chain_id),
    );

    setFee(expectedFee);
  }, [to]);

  return (
    <TransactionSum
      contact={contact}
      balance={currentBalance.available}
      fee={fee}
      to={to}
      from={route.params.from}
      onPressPreview={onPressPreview}
      onContact={onContact}
      onToken={onToken}
      onNetworkPress={onNetworkPress}
      testID="transaction_sum"
      token={route.params.token}
      isLoading={isLoading}
    />
  );
});
