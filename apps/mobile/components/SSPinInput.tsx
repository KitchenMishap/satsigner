import { Dispatch, SetStateAction, useRef, useState } from 'react'
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData
} from 'react-native'

import { PIN_SIZE } from '@/config/auth'
import SSHStack from '@/layouts/SSHStack'
import { Colors, Sizes } from '@/styles'

type SSPinInputProps = {
  pin: string[]
  setPin: Dispatch<SetStateAction<string[]>>
  autoFocus?: boolean
  onFillEnded?(): void
}

export default function SSPinInput({
  pin,
  setPin,
  autoFocus,
  onFillEnded
}: SSPinInputProps) {
  const inputRefs = useRef<TextInput[]>([])
  const [isBackspace, setIsBackspace] = useState(false)

  function handleOnChangeText(text: string, index: number) {
    const newPin = [...pin]
    newPin[index] = text
    setPin(newPin)

    if (text === '') return

    if (index + 1 < PIN_SIZE) inputRefs.current[index + 1]?.focus()
  }

  function handleOnKeyPress(
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) {
    if (event.nativeEvent.key === 'Backspace') {
      setIsBackspace(true)
      if (index - 1 >= 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else {
      if (index + 1 === PIN_SIZE) {
        onFillEnded?.()
        Keyboard.dismiss()
      }
    }
  }

  function handleOnFocus() {
    const lastFilledIndex = pin.findIndex((text) => text === '')

    if (lastFilledIndex === 0) {
      inputRefs.current[0]?.focus()
      return
    }

    if (isBackspace) {
      setIsBackspace(false)
      return
    }

    const finalIndex = lastFilledIndex === -1 ? PIN_SIZE - 1 : lastFilledIndex
    inputRefs.current[finalIndex]?.focus()
  }

  return (
    <SSHStack gap="sm">
      {[...Array(PIN_SIZE)].map((_, index) => (
        <TextInput
          key={index}
          ref={(input) => inputRefs.current.push(input as TextInput)}
          style={styles.pinInputBase}
          autoFocus={autoFocus && index === 0}
          value={pin[index]}
          keyboardType="numeric"
          maxLength={1}
          secureTextEntry
          onChangeText={(text) => handleOnChangeText(text, index)}
          onKeyPress={(event) => handleOnKeyPress(event, index)}
          onFocus={() => handleOnFocus()}
        />
      ))}
    </SSHStack>
  )
}

const styles = StyleSheet.create({
  pinInputBase: {
    borderRadius: Sizes.pinInput.borderRadius,
    height: Sizes.pinInput.height,
    width: Sizes.pinInput.width,
    textAlign: 'center',
    backgroundColor: Colors.gray[850],
    color: Colors.white,
    fontSize: Sizes.textInput.fontSize.default
  }
})
