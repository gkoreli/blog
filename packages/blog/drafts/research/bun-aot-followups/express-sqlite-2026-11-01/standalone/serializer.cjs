
  'use strict'

  const Serializer = require('fast-json-stringify/lib/serializer')
  const serializerState = {"mode":"standalone"}
  const serializer = Serializer.restoreFromState(serializerState)

  const validator = null


  module.exports = function anonymous(validator,serializer
) {

    
const {
  asString,
  asNumber,
  asBoolean,
  asDateTime,
  asDate,
  asTime,
  asUnsafeString,
  asPlainStringArray
} = serializer

const asInteger = serializer.asInteger.bind(serializer)


    const JSON_STR_BEGIN_OBJECT = '{'
    const JSON_STR_END_OBJECT = '}'
    const JSON_STR_BEGIN_ARRAY = '['
    const JSON_STR_END_ARRAY = ']'
    const JSON_STR_COMMA = ','
    const JSON_STR_COLONS = ':'
    const JSON_STR_QUOTE = '"'
    const JSON_STR_EMPTY_OBJECT = JSON_STR_BEGIN_OBJECT + JSON_STR_END_OBJECT
    const JSON_STR_EMPTY_ARRAY = JSON_STR_BEGIN_ARRAY + JSON_STR_END_ARRAY
    const JSON_STR_EMPTY_STRING = JSON_STR_QUOTE + JSON_STR_QUOTE
    const JSON_STR_NULL = 'null'
  
    
      // "#/properties/user"
      function anonymous1 (input) {
        const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
        if (obj === null) return JSON_STR_EMPTY_OBJECT
        let json = ''

        
      const value_id_3 = obj["id"]
      if (value_id_3 !== undefined) {
        json += "{\"id\":"
        json += asInteger(value_id_3)
      } else {
        throw new Error('"id" is required!')
      }
      
      const value_name_4 = obj["name"]
      if (value_name_4 !== undefined) {
        json += ",\"name\":"
        
        if (typeof value_name_4 !== 'string') {
          if (value_name_4 === null) {
            json += JSON_STR_EMPTY_STRING
          } else if (value_name_4 instanceof Date) {
            json += JSON_STR_QUOTE + value_name_4.toISOString() + JSON_STR_QUOTE
          } else if (value_name_4 instanceof RegExp) {
            json += asString(value_name_4.source)
          } else {
            json += asString(value_name_4.toString())
          }
        } else {
          json += asString(value_name_4)
        }
        
      } else {
        throw new Error('"name" is required!')
      }
      
      const value_bio_5 = obj["bio"]
      if (value_bio_5 !== undefined) {
        json += ",\"bio\":"
        
        if (typeof value_bio_5 !== 'string') {
          if (value_bio_5 === null) {
            json += JSON_STR_EMPTY_STRING
          } else if (value_bio_5 instanceof Date) {
            json += JSON_STR_QUOTE + value_bio_5.toISOString() + JSON_STR_QUOTE
          } else if (value_bio_5 instanceof RegExp) {
            json += asString(value_bio_5.source)
          } else {
            json += asString(value_bio_5.toString())
          }
        } else {
          json += asString(value_bio_5)
        }
        
      } else {
        throw new Error('"bio" is required!')
      }
      
return json + JSON_STR_END_OBJECT

      }
    

      // "#/properties/orders/items"
      function anonymous3 (input) {
        const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
        if (obj === null) return JSON_STR_EMPTY_OBJECT
        let json = ''

        
      const value_id_8 = obj["id"]
      if (value_id_8 !== undefined) {
        json += "{\"id\":"
        json += asInteger(value_id_8)
      } else {
        throw new Error('"id" is required!')
      }
      
      const value_cents_9 = obj["cents"]
      if (value_cents_9 !== undefined) {
        json += ",\"cents\":"
        json += asInteger(value_cents_9)
      } else {
        throw new Error('"cents" is required!')
      }
      
return json + JSON_STR_END_OBJECT

      }
    

    function anonymous2 (obj) {
      // "#/properties/orders"
      let json = ''
  
    if (obj === null) return JSON_STR_EMPTY_ARRAY
    if (!Array.isArray(obj)) {
      throw new TypeError("The value of '#/properties/orders' does not match schema definition.")
    }
    const arrayLength = obj.length
  
    json += JSON_STR_BEGIN_ARRAY
  
      if (arrayLength > 0) {
        const value = obj[0]
        json += anonymous3(value)
        for (let i = 1; i < arrayLength; i++) {
          json += JSON_STR_COMMA
          const value = obj[i]
          json += anonymous3(value)
        }
      }
      return json + JSON_STR_END_ARRAY
    }

      // "#/properties/summary"
      function anonymous4 (input) {
        const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
        if (obj === null) return JSON_STR_EMPTY_OBJECT
        let json = ''

        
      const value_count_12 = obj["count"]
      if (value_count_12 !== undefined) {
        json += "{\"count\":"
        json += asInteger(value_count_12)
      } else {
        throw new Error('"count" is required!')
      }
      
      const value_cents_13 = obj["cents"]
      if (value_cents_13 !== undefined) {
        json += ",\"cents\":"
        json += asInteger(value_cents_13)
      } else {
        throw new Error('"cents" is required!')
      }
      
return json + JSON_STR_END_OBJECT

      }
    

      // "#/properties/settings"
      function anonymous5 (input) {
        const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
        if (obj === null) return JSON_STR_EMPTY_OBJECT
        let json = ''

        
      const value_theme_16 = obj["theme"]
      if (value_theme_16 !== undefined) {
        json += "{\"theme\":"
        
        if (typeof value_theme_16 !== 'string') {
          if (value_theme_16 === null) {
            json += JSON_STR_EMPTY_STRING
          } else if (value_theme_16 instanceof Date) {
            json += JSON_STR_QUOTE + value_theme_16.toISOString() + JSON_STR_QUOTE
          } else if (value_theme_16 instanceof RegExp) {
            json += asString(value_theme_16.source)
          } else {
            json += asString(value_theme_16.toString())
          }
        } else {
          json += asString(value_theme_16)
        }
        
      } else {
        throw new Error('"theme" is required!')
      }
      
return json + JSON_STR_END_OBJECT

      }
    

      // "#"
      function anonymous0 (input) {
        const obj = (input && typeof input.toJSON === 'function')
    ? input.toJSON()
    : input
  
        if (obj === null) return JSON_STR_EMPTY_OBJECT
        let json = ''

        
      const value_user_1 = obj["user"]
      if (value_user_1 !== undefined) {
        json += "{\"user\":"
        json += anonymous1(value_user_1)
      } else {
        throw new Error('"user" is required!')
      }
      
      const value_orders_6 = obj["orders"]
      if (value_orders_6 !== undefined) {
        json += ",\"orders\":"
        json += anonymous2(value_orders_6)
      } else {
        throw new Error('"orders" is required!')
      }
      
      const value_summary_10 = obj["summary"]
      if (value_summary_10 !== undefined) {
        json += ",\"summary\":"
        json += anonymous4(value_summary_10)
      } else {
        throw new Error('"summary" is required!')
      }
      
      const value_settings_14 = obj["settings"]
      if (value_settings_14 !== undefined) {
        json += ",\"settings\":"
        json += anonymous5(value_settings_14)
      } else {
        throw new Error('"settings" is required!')
      }
      
      const value_padding_17 = obj["padding"]
      if (value_padding_17 !== undefined) {
        json += ",\"padding\":"
        
        if (typeof value_padding_17 !== 'string') {
          if (value_padding_17 === null) {
            json += JSON_STR_EMPTY_STRING
          } else if (value_padding_17 instanceof Date) {
            json += JSON_STR_QUOTE + value_padding_17.toISOString() + JSON_STR_QUOTE
          } else if (value_padding_17 instanceof RegExp) {
            json += asString(value_padding_17.source)
          } else {
            json += asString(value_padding_17.toString())
          }
        } else {
          json += asString(value_padding_17)
        }
        
      } else {
        throw new Error('"padding" is required!')
      }
      
return json + JSON_STR_END_OBJECT

      }
    
    const main = anonymous0
    return main
    
}(validator, serializer)