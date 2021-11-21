import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import React, { useEffect } from 'react'
import * as RN from 'react-native'
import { StyleSheet, ViewProps } from 'react-native'

//
// Pass-through exports
///////////////////////

export type { PropsWithChildren } from 'react'
export { Pressable, ScrollView } from 'react-native'

export let TextView = RN.Text
export let View = RN.View
export type TextStyles = RN.TextStyle

export let makeReactiveView = observer
export function makeStoreReactive<T extends {}>(store: T) {
  makeAutoObservable(store, undefined, { deep: undefined })
}


//
// Default layout views
///////////////////////

export function makeLayoutViews<Theme extends Themes<ColorsI, SpacesI>>(theme: Theme) {
  return {
    Box: makeBoxView(theme, View),

    Row: makeBoxView(theme, View, {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'nowrap',
      flexGrow: 1,
      flexShrink: 1,
    }),

    Col: makeBoxView(theme, View, {
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'nowrap',
      flexGrow: 1,
      flexShrink: 1,
    }),

    Grid: makeBoxView(theme, View, {
      // I'm not entirely sure about this one...
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: 'auto',
      justifyContent: 'space-around',
      // alignItems: 'baseline',
    }),
  }
}


//
// ListView
//
// Our ListView takes two arguments in renderItem, as opposed to a single one.
// This allows for naming the item variable, resulting in much more ergonomic code, e.g
//   `<Text>card.title</Text>` vs `<Text>item.data.title</Text>`
////////////////////////////////////////////////////////////////

type OurRenderItem<ItemT> = (item: ItemT, info: OurRenderInfo) => React.ReactElement | null
type OurRenderInfo = { index: number; isFirst: boolean; isLast: boolean }
type ListViewProps<ItemT> = { renderItem: OurRenderItem<ItemT> } & Omit<RN.FlatListProps<ItemT>, 'renderItem'>
export let List = function <ItemT = any>(props: ListViewProps<ItemT>) {
  props = makeWritableCopy(props)
  if (!props.keyExtractor) {
    props.keyExtractor = (_, index) => index.toString()
  }
  let flatListProps = Object.assign({}, props, {
    renderItem: (info: RN.ListRenderItemInfo<ItemT>) => {
      let ourRenderInfo = {
        index: info.index,
        isFirst: info.index === 0,
        isLast: info.index === props.data!.length - 1,
      }
      return props.renderItem(info.item, ourRenderInfo)
    },
  }) as RN.FlatListProps<ItemT>
  return <RN.FlatList {...flatListProps} />
}

//
// Box & flex views
///////////////////

type BoxViewFn<Theme extends Themes<ColorsI, SpacesI>> = (props: ThemedBoxProps<Theme>) => React.ReactElement
export function makeBoxView<ViewTypeProps extends ViewProps, Theme extends Themes<ColorsI, SpacesI>>(
  theme: Theme,
  ViewType: React.ComponentClass<ViewTypeProps>,
  defaultStyles?: RN.ViewStyle
): BoxViewFn<Theme> {
  let stylesheetVal = defaultStyles ? StyleSheet.create({ styles: defaultStyles }).styles : undefined
  return function (props: ThemedBoxProps<Theme>) {
    props = makeWritableCopy(props)
    if (stylesheetVal && props.style) {
      props.style = [stylesheetVal, props.style]
    } else if (stylesheetVal) {
      props.style = stylesheetVal
    }

    props = processBoxProps(theme, props)

    let viewProps = props as unknown as ViewTypeProps
    return React.createElement(ViewType, viewProps, props.children)
  }
}

type TextViewFn<Theme extends Themes<ColorsI, SpacesI>> = (props: RN.TextProps & ColorProps<Theme>) => React.ReactElement
export function makeTextView<
  Theme extends Themes<ColorsI, SpacesI>
>(
  theme: Theme,
  textStyles: RN.TextStyle
): TextViewFn<Theme> {
  let stylesheetVal = RN.StyleSheet.create({ styles: textStyles }).styles
  return (props: RN.TextProps & ColorProps<Theme>) => {
    props = makeWritableCopy(props)
    props.style = [stylesheetVal, props.style]

    for (let key of Object.keys(props)) {
      let color = (theme.colors as any)[key]
      if (color) {
        props.style = [props.style, { color: color }]
        break
      }
    }

    return <RN.Text {...props}>{props.children}</RN.Text>
  }
}

// Themed property types
////////////////////////

type ThemedBoxProps<Theme extends Themes<ColorsI, SpacesI>>
  = ViewProps
  & ColorProps<Theme>
  & SpaceProps<Theme>
  & BoxStyleAddonProps

type ColorsI = {}
type SpacesI = {}

export type Themes<Colors extends ColorsI, Spaces extends SpacesI> = {
  colors: Colors
  spaces: Spaces
}

export type UncheckedThemeBoxProps = ThemedBoxProps<UncheckedTheme>
type UncheckedTheme = Themes<{}, {}>

type ColorsOfTheme<Theme extends Themes<{}, {}>> = Theme['colors']
type ColorKeysOfTheme<Theme extends Themes<{}, {}>> = keyof ColorsOfTheme<Theme>

type SpacesOfTheme<Theme extends Themes<{}, {}>> = Theme['spaces']
type SpaceKeysOfTheme<Theme extends Themes<{}, {}>> = keyof SpacesOfTheme<Theme>

type ColorProps<Theme extends Themes<{}, {}>> = {
  [key in ColorKeysOfTheme<Theme>]?: boolean
}

type Dimension4<T> = T | [T, T] | [T, T, T] | [T, T, T, T]

type SpaceProps<Theme extends Themes<{}, SpacesI>> = {
  p?: Dimension4<SpaceKeysOfTheme<Theme> | number>
  m?: Dimension4<SpaceKeysOfTheme<Theme> | number>
}

// BoxView style addon props
////////////////////////////

type BoxSize = number | string

// TODO: Infer these from `const transformers` below
interface BoxStyleAddonProps {
  background?: string
  h?: BoxSize
  w?: BoxSize
  maxW?: BoxSize
  minW?: BoxSize
  maxH?: BoxSize
  minH?: BoxSize
  gap?: BoxSize
  radius?: number | [number, number, number, number]
  alignItems?: RN.FlexStyle['alignItems']
  alignSelf?: RN.FlexStyle['alignSelf']
  alignContent?: RN.FlexStyle['alignContent']
  justifyContent?: RN.FlexStyle['justifyContent']
  grow?: RN.FlexStyle['flexGrow']
  shrink?: RN.FlexStyle['flexShrink']
  basis?: RN.FlexStyle['flexBasis']
}


// Fonts
////////

export function importGoogleFont(fontName: string, variations: string[]) {
  let fontFamily = encodeURIComponent(`${fontName}:${variations.join(',')}`)
  return importFont(`https://fonts.googleapis.com/css?family=${fontFamily}`)
}

export function importFont(url: string) {
  var link = document.createElement('link')
  link.setAttribute('rel', 'stylesheet')
  link.setAttribute('type', 'text/css')
  link.setAttribute('href', url)
  document.head.appendChild(link)
}


// Box property processing
//////////////////////////

function processBoxProps<
  BoxProps extends ThemedBoxProps<Theme>,
  Theme extends Themes<ColorsI, SpacesI>,
  >(theme: Theme, props: BoxProps): BoxProps {

  let boxPropStyles = getStylesForBoxProps(theme, props)

  if (boxPropStyles) {
    props = makeWritableCopy(props)
    props.style = [boxPropStyles, props.style]
  }

  return props
}

export function getStylesForBoxProps<
  BoxProps extends ThemedBoxProps<Theme>,
  Theme extends Themes<ColorsI, SpacesI>,
  >(theme: Theme, props: BoxProps) {
  let boxPropStyles: RN.StyleProp<RN.ViewStyle> = {}
  let didSetStyle = false

  for (let [key, val] of Object.entries(props)) {
    if (key === 'children') {
      continue
    }

    let color = (theme.colors as any)[key]
    if (color) {
      boxPropStyles.backgroundColor = color
      didSetStyle = true
      continue
    }

    let transformer = transformers[key]
    if (transformer) {
      Object.assign(boxPropStyles, transformer(theme, val))
      didSetStyle = true
      continue
    }
  }

  return didSetStyle ? boxPropStyles : null
}

// Box property transformers
////////////////////////////

const transformers: Record<string, Transformer> = {
  'p': makeTransformer_Space1_4('padding'),
  'm': makeTransformer_Space1_4('margin'),

  'h': makeTransformer_default('height'),
  'w': makeTransformer_default('width'),
  'maxW': makeTransformer_default('maxWidth'),
  'minW': makeTransformer_default('minWidth'),
  'maxH': makeTransformer_default('maxHeight'),
  'minH': makeTransformer_default('minHeight'),

  'grow': makeTransformer_default('flexGrow'),
  'shrink': makeTransformer_default('flexShrink'),
  'basis': makeTransformer_default('flexBasis'),

  'alignItems': makeTransformer_default('alignItems'),
  'alignSelf': makeTransformer_default('alignSelf'),
  'alignContent': makeTransformer_default('alignContent'),
  'justifyContent': makeTransformer_default('justifyContent'),

  'radius': makeTransformer_Radius(),

  'background': makeTransformer_default('backgroundColor'),
}

function makeTransformer_default(prop: keyof BoxPropsStyle): Transformer {
  return function (_: UncheckedTheme, val: any): BoxPropsStyle {
    return { [prop]: val }
  }
}

function makeTransformer_Radius(): Transformer {
  return function (_: UncheckedTheme, radius: any): BoxPropsStyle {
    if (typeof radius === 'number') {
      return { borderRadius: radius }
    } else {
      return {
        borderTopStartRadius: radius[0],
        borderTopEndRadius: radius[1],
        borderBottomEndRadius: radius[2],
        borderBottomStartRadius: radius[3],
      }
    }
  }
}

// Box spacing
//////////////

type BoxPropsStyle = RN.ViewStyle

type Transformer = (theme: UncheckedTheme, val: any) => BoxPropsStyle

type BoxSpace = number
type BoxSpace_1_4 = BoxSpace | BoxSpaceArr
type BoxSpaceArr =
  | [BoxSpace, BoxSpace]
  | [BoxSpace, BoxSpace, BoxSpace]
  | [BoxSpace, BoxSpace, BoxSpace, BoxSpace]

// Space arguments can be numbers or named theme-given values; and, it can be
// an array of top/right/bottom/left values. Assign the appropriate style names
// and values, e.g `p={['10v', '20h']}` to `{ paddingVertical: 10, paddingHorizontal: 20 }`
function makeTransformer_Space1_4(prop: keyof BoxPropsStyle): Transformer {
  return function (theme: UncheckedTheme, val: BoxSpace_1_4): BoxPropsStyle {
    if (typeof val === 'number') {
      return { [prop]: val }
    }
    if (!Array.isArray(val)) {
      throw new Error(`Unexpected makeTransformer_Space1_4 value: ${val}`)
    }

    val = val.map(val => transformBoxSpaceValue(theme, val)) as BoxSpaceArr
    switch (val.length) {
      case 2: return { [prop + 'Vertical']: val[0], [prop + 'Horizontal']: val[1] }
      case 3: return { [prop + 'Top']: val[0], [prop + 'Horizontal']: val[1], [prop + 'Bottom']: val[2] }
      case 4: return { [prop + 'Top']: val[0], [prop + 'Right']: val[1], [prop + 'Bottom']: val[2], [prop + 'Left']: val[3] }
      default:
        throw new Error(`Unexpected makeTransformer_Space1_4 value length: ${val}`)
    }
  }
}

// transformBoxSpaceValue takes Space values, and checks them against the given view theme.
// If the value corresponds to a theme-named value, then replace it with its given theme value.
function transformBoxSpaceValue(theme: UncheckedTheme, spaceValue: BoxSpace) {
  if (typeof spaceValue === 'number') {
    return spaceValue
  }
  let spaceKey = spaceValue as keyof typeof theme.spaces
  return spaceKey in theme.spaces ? theme.spaces[spaceKey] : spaceValue
}

//
// Helper functions & types
///////////////////////////

// For browser apps, if there is a location hash on load then
// the element with corresponding ID will not yet exist in the
// DOM. Force-reset the location in order to scroll.
export function scrollToHashIDOnLoad() {
  useEffect(() => {
    if (typeof window != 'undefined' && window.location.hash) {
      window.location = window.location
    }
  })
}

type RequireExactlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>> }[Keys]
type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys]
// TODO: Figure out how to do AtMostOne, and use it for colors

// function useForceUpdate() {
//   let [_, forceUpdate] = useState({})
//   return () => forceUpdate({})
// }

export function makeWritableCopy<T extends {} | null>(obj: T): NonNullable<T> {
  return { ...obj } as NonNullable<T>
}
