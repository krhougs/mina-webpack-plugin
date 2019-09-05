import React, { useState, useEffect } from 'react'
import { View, Text } from 'remax/wechat'

function MiaoPage () {
  const [state, setState] = useState()
  useEffect(() => {
    setState('🐱')
  }, [])
  // return state
  return <View>
    <Text>{state}</Text>
  </View>
}

export default MiaoPage
