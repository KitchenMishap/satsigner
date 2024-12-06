import { Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView } from 'react-native'
import { useShallow } from 'zustand/react/shallow'

import { validateMnemonic } from '@/api/bdk'
import { getWordList } from '@/api/bip39'
import SSButton from '@/components/SSButton'
import SSChecksumStatus from '@/components/SSChecksumStatus'
import SSEllipsisAnimation from '@/components/SSEllipsisAnimation'
import SSFingerprint from '@/components/SSFingerprint'
import SSGradientModal from '@/components/SSGradientModal'
import SSKeyboardWordSelector from '@/components/SSKeyboardWordSelector'
import SSSeparator from '@/components/SSSeparator'
import SSText from '@/components/SSText'
import SSTextInput from '@/components/SSTextInput'
import SSWordInput from '@/components/SSWordInput'
import SSFormLayout from '@/layouts/SSFormLayout'
import SSHStack from '@/layouts/SSHStack'
import SSMainLayout from '@/layouts/SSMainLayout'
import SSSeedLayout from '@/layouts/SSSeedLayout'
import SSVStack from '@/layouts/SSVStack'
import { i18n } from '@/locales'
import { useAccountBuilderStore } from '@/store/accountBuilder'
import { useAccountsStore } from '@/store/accounts'
import { Colors } from '@/styles'
import { type SeedWordInfo } from '@/types/logic/seedWord'
import { type Account } from '@/types/models/Account'

const MIN_LETTERS_TO_SHOW_WORD_SELECTOR = 2
const wordList = getWordList()

export default function ImportSeed() {
  const router = useRouter()
  const [syncWallet, addAccount] = useAccountsStore(
    useShallow((state) => [state.syncWallet, state.addAccount])
  )
  const [
    name,
    scriptVersion,
    seedWordCount,
    fingerprint,
    derivationPath,
    clearAccount,
    getAccount,
    setSeedWords,
    setPassphrase,
    updateFingerprint,
    loadWallet
  ] = useAccountBuilderStore(
    useShallow((state) => [
      state.name,
      state.scriptVersion,
      state.seedWordCount,
      state.fingerprint,
      state.derivationPath,
      state.clearAccount,
      state.getAccount,
      state.setSeedWords,
      state.setPassphrase,
      state.updateFingerprint,
      state.loadWallet
    ])
  )

  const [seedWordsInfo, setSeedWordsInfo] = useState<SeedWordInfo[]>(
    [...Array(seedWordCount)].map((_, index) => ({
      value: '',
      index,
      dirty: false,
      valid: false
    }))
  )
  const [checksumValid, setChecksumValid] = useState(false)
  const [currentWordText, setCurrentWordText] = useState('')
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [keyboardWordSelectorVisible, setKeyboardWordSelectorVisible] =
    useState(false)

  const [accountAddedModalVisible, setAccountAddedModalVisible] =
    useState(false)

  const [loadingAccount, setLoadingAccount] = useState(false)
  const [syncedAccount, setSyncedAccount] = useState<Account>()

  async function handleOnChangeTextWord(word: string, index: number) {
    const seedWords = [...seedWordsInfo]
    const seedWord = seedWords[index]

    seedWord.value = word.trim()

    if (wordList.includes(word)) seedWord.valid = true
    else {
      seedWord.valid = false
      setKeyboardWordSelectorVisible(
        word.length >= MIN_LETTERS_TO_SHOW_WORD_SELECTOR
      )
    }

    setCurrentWordText(word)
    setSeedWordsInfo(seedWords)

    const mnemonicSeedWords = seedWordsInfo.map((seedWord) => seedWord.value)

    const checksumValid = await validateMnemonic(mnemonicSeedWords)
    setChecksumValid(checksumValid)

    if (checksumValid) {
      setSeedWords(mnemonicSeedWords)
      await updateFingerprint()
    }
  }

  function handleOnEndEditingWord(word: string, index: number) {
    const seedWords = [...seedWordsInfo]
    const seedWord = seedWords[index]

    seedWord.value = word
    seedWord.valid = wordList.includes(word)
    seedWord.dirty ||= word.length > 0

    setSeedWordsInfo(seedWords)
    setCurrentWordText(word)

    // TODO: Set focus to next?
  }

  function handleOnFocusWord(word: string | undefined, index: number) {
    const seedWords = [...seedWordsInfo]
    const seedWord = seedWords[index]

    setCurrentWordText(word || '')
    setCurrentWordIndex(index)
    setKeyboardWordSelectorVisible(
      !seedWord.valid &&
        (word?.length || 0) >= MIN_LETTERS_TO_SHOW_WORD_SELECTOR
    )
  }

  async function handleOnWordSelected(word: string) {
    const seedWords = [...seedWordsInfo]
    seedWords[currentWordIndex].value = word

    if (wordList.includes(word)) {
      seedWords[currentWordIndex].valid = true
      setKeyboardWordSelectorVisible(false)
    }

    setSeedWordsInfo(seedWords)

    const mnemonicSeedWords = seedWords.map((seedWord) => seedWord.value)

    const checksumValid = await validateMnemonic(mnemonicSeedWords)
    setChecksumValid(checksumValid)

    if (checksumValid) {
      setSeedWords(mnemonicSeedWords)
      await updateFingerprint()
    }
  }

  async function handleUpdatePassphrase(passphrase: string) {
    setPassphrase(passphrase)

    const mnemonicSeedWords = seedWordsInfo.map((seedWord) => seedWord.value)

    const checksumValid = await validateMnemonic(mnemonicSeedWords)
    setChecksumValid(checksumValid)

    if (checksumValid) {
      setSeedWords(mnemonicSeedWords)
      await updateFingerprint()
    }
  }

  async function handleOnPressImportSeed() {
    const seedWords = seedWordsInfo.map((seedWord) => seedWord.value)
    setSeedWords(seedWords)

    setLoadingAccount(true)

    const wallet = await loadWallet()

    setAccountAddedModalVisible(true)

    const syncedAccount = await syncWallet(wallet, getAccount())
    setSyncedAccount(syncedAccount)
    await addAccount(syncedAccount)

    setLoadingAccount(false)
  }

  async function handleOnCloseAccountAddedModal() {
    setAccountAddedModalVisible(false)
    clearAccount()
    router.navigate('/')
  }

  return (
    <SSMainLayout>
      <Stack.Screen
        options={{
          headerTitle: () => <SSText uppercase>{name}</SSText>
        }}
      />
      <SSKeyboardWordSelector
        visible={keyboardWordSelectorVisible}
        wordStart={currentWordText}
        onWordSelected={handleOnWordSelected}
        style={{ height: 60 }}
      />
      <ScrollView>
        <SSVStack justifyBetween>
          <SSFormLayout>
            <SSFormLayout.Item>
              <SSFormLayout.Label
                label={i18n.t('addMasterKey.accountOptions.mnemonic')}
              />
              {seedWordCount && (
                <SSSeedLayout count={seedWordCount}>
                  {[...Array(seedWordsInfo.length)].map((_, index) => (
                    <SSWordInput
                      value={seedWordsInfo[index].value}
                      invalid={
                        !seedWordsInfo[index].valid &&
                        seedWordsInfo[index].dirty
                      }
                      key={index}
                      position={index + 1}
                      onChangeText={(text) =>
                        handleOnChangeTextWord(text, index)
                      }
                      onEndEditing={(event) =>
                        handleOnEndEditingWord(event.nativeEvent.text, index)
                      }
                      onFocus={(event) =>
                        handleOnFocusWord(event.nativeEvent.text, index)
                      }
                    />
                  ))}
                </SSSeedLayout>
              )}
            </SSFormLayout.Item>
            <SSFormLayout.Item>
              <SSFormLayout.Label
                label={`${i18n.t('bitcoin.passphrase')} (${i18n.t('common.optional')})`}
              />
              <SSTextInput
                onChangeText={(text) => handleUpdatePassphrase(text)}
              />
            </SSFormLayout.Item>
            <SSFormLayout.Item>
              <SSHStack justifyBetween>
                <SSChecksumStatus valid={checksumValid} />
                {checksumValid && fingerprint && (
                  <SSFingerprint value={fingerprint} />
                )}
              </SSHStack>
            </SSFormLayout.Item>
          </SSFormLayout>
          <SSVStack>
            <SSButton
              label={i18n.t('addMasterKey.importExistingSeed.action')}
              variant="secondary"
              loading={loadingAccount}
              disabled={!checksumValid}
              onPress={() => handleOnPressImportSeed()}
            />
            <SSButton
              label={i18n.t('common.cancel')}
              variant="ghost"
              onPress={() => router.replace('/')}
            />
          </SSVStack>
        </SSVStack>
      </ScrollView>
      <SSGradientModal
        visible={accountAddedModalVisible}
        onClose={() => handleOnCloseAccountAddedModal()}
      >
        <SSVStack style={{ marginVertical: 32, width: '100%' }}>
          <SSVStack itemsCenter gap="xs">
            <SSText color="white" size="2xl">
              {name}
            </SSText>
            <SSText color="muted" size="lg">
              {i18n.t('addMasterKey.importExistingSeed.accountAdded')}
            </SSText>
          </SSVStack>
          <SSSeparator />
          <SSHStack justifyEvenly style={{ alignItems: 'flex-start' }}>
            <SSVStack itemsCenter>
              <SSText style={{ color: Colors.gray[500] }}>
                {i18n.t('bitcoin.script')}
              </SSText>
              <SSText size="md" color="muted" center>
                {i18n.t(
                  `addMasterKey.accountOptions.scriptVersions.names.${scriptVersion.toLowerCase()}`
                )}
                {'\n'}
                {`(${scriptVersion})`}
              </SSText>
            </SSVStack>
            <SSVStack itemsCenter>
              <SSText style={{ color: Colors.gray[500] }}>
                {i18n.t('bitcoin.fingerprint')}
              </SSText>
              <SSText size="md" color="muted">
                {fingerprint}
              </SSText>
            </SSVStack>
          </SSHStack>
          <SSSeparator />
          <SSVStack>
            <SSVStack itemsCenter>
              <SSText style={{ color: Colors.gray[500] }}>
                {i18n.t(
                  'addMasterKey.importExistingSeed.accountAddedModal.derivationPath'
                )}
              </SSText>
              <SSText size="md" color="muted">
                {derivationPath}
              </SSText>
            </SSVStack>
            <SSHStack justifyEvenly>
              <SSVStack itemsCenter>
                <SSText style={{ color: Colors.gray[500] }}>
                  {i18n.t(
                    'addMasterKey.importExistingSeed.accountAddedModal.utxos'
                  )}
                </SSText>
                {loadingAccount || !syncedAccount ? (
                  <SSEllipsisAnimation />
                ) : (
                  <SSText size="md" color="muted">
                    {syncedAccount.summary.numberOfUtxos}
                  </SSText>
                )}
              </SSVStack>
              <SSVStack itemsCenter>
                <SSText style={{ color: Colors.gray[500] }}>
                  {i18n.t(
                    'addMasterKey.importExistingSeed.accountAddedModal.sats'
                  )}
                </SSText>
                {loadingAccount || !syncedAccount ? (
                  <SSEllipsisAnimation />
                ) : (
                  <SSText size="md" color="muted">
                    {syncedAccount.summary.balance}
                  </SSText>
                )}
              </SSVStack>
            </SSHStack>
          </SSVStack>
        </SSVStack>
      </SSGradientModal>
    </SSMainLayout>
  )
}