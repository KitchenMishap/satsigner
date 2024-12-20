import { Stack, useLocalSearchParams } from 'expo-router'

import SSBdkTransactionConsole from '@/components/SSBdkTransactionConsole'
import SSText from '@/components/SSText'
import SSMainLayout from '@/layouts/SSMainLayout'

export default function TransactionPage() {
  const { txid } = useLocalSearchParams()

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => <SSText uppercase>Transaction</SSText>,
          headerBackVisible: true,
          headerLeft: () => <></>,
          headerRight: undefined
        }}
      />
      <SSMainLayout>
        <SSText>Transaction id: {txid}</SSText>
        <SSBdkTransactionConsole txid={txid} />
      </SSMainLayout>
    </>
  )
}
