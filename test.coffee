#!/usr/bin/env coffee

import scsu from './scsu.js'
import * as zipack from './zipack.js'
import * as zspack from './zspack.js'
import test from 'tape'



test 'str', (t)=>
  run = (str)=>
    msg = zspack.dump(str)
    console.log "zspack length" , msg.length
    t.deepEqual str, zspack.load(msg)
    console.log str+"\n"

  for i in [
    "english"
    "english long string : English is a West Germanic language that was first spoken in early medieval England and eventually became a global lingua franca."
    "短字符串"
    """互联网主权化可能会是大势所趋。最近欧盟出台三个关于数字互联网的文件后，德国法兰克福市长打算邀请tiktok将总部落户德国，欧盟为了推广自己的数字主权，可能会将tiktok打造为推广自己规则的样板，借此强迫美国互联网公司遵守同样的规则。"""
  ]
    msg = scsu.encode(i)
    console.log("scsu length", msg.length)
    console.log("utf8 length", Buffer.from(i,'utf8').length)
    run(i)

  run {"您好":"不错","我":{"也":"不错"}}
  t.end()

import tjson from './t.json'
test 't.json', (t)=>
  for i,pi in zspack.load(zspack.dump(tjson))
    for j,pj in i
      t.deepEqual tjson[pi][pj], j
  t.end()
