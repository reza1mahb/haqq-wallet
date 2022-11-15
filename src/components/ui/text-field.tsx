import React, {useEffect, useRef, useState} from 'react';

import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  IS_IOS,
  LIGHT_BG_5,
  LIGHT_BG_7,
  LIGHT_BG_8,
  LIGHT_TEXT_BASE_1,
  LIGHT_TEXT_BASE_2,
  LIGHT_TEXT_GREEN_1,
  LIGHT_TEXT_RED_1,
} from '../../variables';

type Props = React.ComponentProps<typeof TextInput> & {
  label: string;
  error?: boolean;
  errorText?: string | null;
  placeholder?: string;
  rightAction?: React.ReactNode;
  multiline?: boolean;
  size?: 'small' | 'large';
};

export const TextField: React.FC<Props> = ({
  size = 'small',
  label,
  error,
  errorText,
  value,
  style,
  onBlur,
  onFocus,
  placeholder,
  rightAction,
  multiline,
  ...restOfProps
}) => {
  const isLarge = size === 'large';
  const {width} = useWindowDimensions();

  const [isFocused, setIsFocused] = useState(false);
  const [height, setHeight] = useState(0);

  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused || !!value ? 1 : 0,
      duration: 150,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();
  }, [focusAnim, isFocused, value]);

  let color = LIGHT_TEXT_BASE_2;
  if (error) {
    color = LIGHT_TEXT_RED_1;
  }

  const top = -4;
  const getHeight = height + 30;

  return (
    <>
      <View
        style={[
          page.container,
          style,
          error && page.containerError,
          {height: getHeight},
        ]}>
        <TextInput
          selectionColor={LIGHT_TEXT_GREEN_1}
          allowFontScaling={false}
          style={[
            page.input,
            {
              borderColor: color,
              width: width - 100,
            },
          ]}
          ref={inputRef}
          placeholder={isFocused ? placeholder : ''}
          {...restOfProps}
          value={value}
          multiline={multiline}
          onContentSizeChange={event => {
            const inputH = Math.max(event.nativeEvent.contentSize.height, 28);
            setHeight(inputH);
          }}
          onBlur={event => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={event => {
            setIsFocused(true);
            onFocus?.(event);
          }}
        />
        <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
          <Animated.View
            style={[
              page.labelContainer,
              {
                transform: [
                  {
                    scale: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.75],
                    }),
                  },
                  {
                    translateY: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 9],
                    }),
                  },
                  {
                    translateX: focusAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [isLarge ? 5 : 0, isLarge ? -12 : -8],
                    }),
                  },
                ],
              },
            ]}>
            <Text
              allowFontScaling={false}
              style={[
                page.label,
                isLarge && page.labelMultiline,
                {
                  color,
                  top,
                },
              ]}>
              {label}
            </Text>
          </Animated.View>
        </TouchableWithoutFeedback>

        {rightAction && <View style={page.sub}>{rightAction}</View>}
      </View>
      {!!error && <Text style={page.error}>{errorText}</Text>}
    </>
  );
};

const page = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_BG_8,
  },
  containerError: {
    backgroundColor: LIGHT_BG_7,
  },
  input: {
    alignSelf: 'flex-start',
    fontFamily: 'SF Pro Display',
    fontWeight: '400',
    color: LIGHT_TEXT_BASE_1,
    top: IS_IOS ? 26 : 24,
    fontSize: 16,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
    right: IS_IOS ? 0 : 4.5,
  },
  labelContainer: {
    position: 'absolute',
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: 'SF Pro Display',
    fontSize: 18,
    left: 0,
  },
  labelMultiline: {
    left: -4.5,
  },
  error: {
    marginLeft: 35,
    bottom: 8,
    fontSize: 12,
    color: LIGHT_BG_5,
    fontFamily: 'SF Pro Display',
  },
  sub: {
    position: 'absolute',
    justifyContent: 'center',
    alignSelf: 'center',
    right: 0,
    width: 50,
  },
});
