import React, { useState, useEffect } from 'react'
import { View, Text } from 'remax/wechat'

import MiaoJpg from './Index/gua.jpg'

function MiaoPage () {
  const [state, setState] = useState()
  useEffect(() => {
    setState('🐱')
    console.log(MiaoJpg)
  }, [])
  // return state
  return <View>
    <Text>{state}</Text>
  </View>
}

export default MiaoPage
