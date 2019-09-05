import React, { useState, useEffect } from 'react'
import { View } from 'remax/wechat'

import style from './index.module.sass'

function IndexPage () {
  const [state, setState] = useState()
  useEffect(() => {
    setState('test')
    console.log('23333')
  }, [])
  // return state
  return <View className={style.Test}>{state}</View>
}

export default IndexPage
