import React, { useState, useEffect } from 'react'
import { View, Image, Text } from 'remax/wechat'

import style from './index.module.sass'
import MiaoJpg from './gua.jpg'

function IndexPage () {
  const [state, setState] = useState()
  useEffect(() => {
    setState('test')
    console.log(MiaoJpg)
  }, [])
  // return state
  return <View className={style.Test}>
    {state}
    <Image src={MiaoJpg} />
  </View>
}

export default IndexPage
